import os
from dotenv import load_dotenv
from elasticsearch import Elasticsearch

def verify_pristine_state():
    print("=== EXECUTING STRICT IDEMPOTENCY VERIFICATION ===")
    load_dotenv()
    es = Elasticsearch(os.getenv("ELASTICSEARCH_URL"), api_key=os.getenv("ELASTIC_API_KEY"))

    # Check 1: Is the demo patient exactly 99 entries?
    demo_count = es.count(index="patient_log", query={"term": {"patient_id": "demo-patient-001"}})['count']
    print(f"1. demo-patient-001 Total Count: {demo_count} (Expected: 99)")

    # Check 2: Are there ANY test junk entries currently bleeding into the live index?
    polluted_count = es.count(index="patient_log", query={"term": {"source": "caregiver_demo_input"}})['count']
    print(f"2. Polluting test entries found: {polluted_count} (Expected: 0)")

    # Check 3: Did the search_text backfill actually work?
    backfill_check = es.search(index="patient_log", query={"exists": {"field": "search_text"}}, size=1)
    backfill_hits = backfill_check.get("hits", {}).get("total", {}).get("value", 0)
    print(f"3. Documents containing 'search_text': {backfill_hits} (Expected: {demo_count})")

    if demo_count == 99 and polluted_count == 0 and backfill_hits == 99:
        print("\n[VERDICT: PASS] The database is completely pristine and ready for demo.")
    else:
        print("\n[VERDICT: FAIL] Data drift detected. Re-run your 'verify_search.py' cleanup logic and re-ingest.")

if __name__ == "__main__":
    verify_pristine_state()
