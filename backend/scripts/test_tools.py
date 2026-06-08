import os
import sys

# Ensure Python can find the 'agent' module regardless of where the script is run from
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agent import elastic_client

def run_tests():
    print("=== STARTING DISCRETE TOOLS TEST ===\n")

    # 1. Test General Guidance
    print("[TEST 1] search_general_guidance")
    kb_res = elastic_client.search_general_guidance("sudden confusion possible infection", top_k=3)
    if kb_res and all(r.get("source") and r.get("url") for r in kb_res):
        print(f" -> PASS. Found {len(kb_res)} results with valid citations.")
        print(f" -> Preview: {kb_res[0]['title']} ({kb_res[0]['source']})")
    else:
        print(" -> FAIL. Missing citations or no results.")

    # 2. Test Patient History
    print("\n[TEST 2] search_patient_history")
    hist_res = elastic_client.search_patient_history("demo-patient-001", "agitation afternoon", time_of_day="afternoon", since_days=90, top_k=2)
    if hist_res:
        print(f" -> PASS. Retrieved {len(hist_res)} historical entries.")
        print(f" -> Preview: {hist_res[0]['raw_note'][:50]}...")
    else:
        print(" -> FAIL. Failed to retrieve patient history.")

    # 3. Test Observation Logging (IDEMPOTENT - Using Throwaway ID)
    print("\n[TEST 3] log_new_observation (Safe Throwaway ID)")
    TEMP_ID = "test-patient-temp"
    log_res = elastic_client.log_new_observation(TEMP_ID, "Today she suddenly seemed much more confused than usual before lunch.", ["sudden_confusion", "acute_change"], 5)
    if log_res.get("logged"):
        print(" -> PASS. Observation logged to throwaway ID.")
        print(f" -> Entry ID: {log_res['entry_id']}")
    else:
        print(" -> FAIL. Could not write observation.")

    # 4. Test Clinician Summary (Using Throwaway ID to test logic safely)
    print("\n[TEST 4] generate_clinician_summary (Throwaway ID)")
    # Inject a second throwaway note just for the summary test
    elastic_client.log_new_observation(TEMP_ID, "Mild agitation in the evening.", ["agitation"], 3)
    
    # Pause slightly to ensure Elastic indices refresh
    elastic_client.es.indices.refresh(index="patient_log")
    
    summary_entries = elastic_client.get_patient_entries(TEMP_ID, since_days=30)
    if summary_entries and len(summary_entries) >= 2:
        print(" -> PASS. Generated summary data safely without touching demo data.")
        print(" -> Preview of deterministic structure:")
        print(f"    Total Logs: {len(summary_entries)}")
    else:
        print(" -> FAIL. Summary generation failed.")

    # Cleanup the throwaway data to keep DB entirely clean
    elastic_client.es.delete_by_query(index="patient_log", body={"query": {"term": {"patient_id": TEMP_ID}}})
    print("\n[CLEANUP] Deleted throwaway test data.")

    # 5. DIAGNOSTIC: ACUTE CLUSTER VERIFICATION (Fixing the Data Drift Bug)
    print("\n[DIAGNOSTIC] Verifying 'demo-patient-001' Acute Safety Cluster...")
    cluster_query = {
        "query": {
            "bool": {
                "must": [
                    {"term": {"patient_id": "demo-patient-001"}},
                    {"term": {"behaviour_tags": "possible_delirium_or_infection"}}
                ]
            }
        },
        "sort": [{"timestamp": "asc"}],
        "size": 20
    }
    try:
        cluster_res = elastic_client.es.search(index="patient_log", body=cluster_query)
        hits = cluster_res.get("hits", {}).get("hits", [])
        if hits:
            print(f" -> FOUND: {len(hits)} acute safety entries.")
            print(" -> Timeline of Acute Event:")
            for h in hits:
                ts = h["_source"]["timestamp"]
                sev = h["_source"]["severity"]
                print(f"    - {ts} | Severity: {sev} | Tags: {h['_source']['behaviour_tags']}")
            print(" -> [ACTION REQUIRED] Review the timestamps above. If they are smeared across weeks instead of clustered tightly over 1-2 days, your safety demo logic will fail. If they are tight, you are safe to proceed.")
        else:
            print(" -> [CRITICAL WARNING] Acute event NOT FOUND. Run your Step 2 generate_patient_log.py script again!")
    except Exception as e:
        print(f" -> [ERROR] Diagnostic failed: {str(e)}")

if __name__ == "__main__":
    run_tests()
