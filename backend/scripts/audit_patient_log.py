import os
import sys

sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from agent.elastic_client import es

def audit_patient_log():
    index = "patient_log"
    
    # 1. Verify Total Count
    total_count = es.count(index=index)['count']
    print(f"Total document count in '{index}': {total_count}")
    
    # 2. Isolate Stray Entries
    # Based on our previous logs, they usually have source 'caregiver_demo_input' or synthetic: False?
    # Actually wait, our check_states output showed mapping has 'source'. 
    # Let's just find everything not in the canonical 99. The canonical 99 has patient_id: demo-patient-001 or similar? 
    # Actually, we know the source for canonical logs is usually "generated" or similar.
    # Let's get all 107 and find the ones that are stray. Let's look for source "caregiver_demo_input"
    stray_query = {
        "query": {
            "term": {
                "source": "caregiver_demo_input"
            }
        },
        "size": 100
    }
    
    stray_res = es.search(index=index, body=stray_query)
    stray_hits = stray_res['hits']['hits']
    
    print(f"\nFound {len(stray_hits)} stray entries with source 'caregiver_demo_input':")
    for hit in stray_hits:
        src = hit['_source']
        print(f" - ID: {hit['_id']} | Time: {src.get('timestamp')} | Note: {src.get('raw_note', '')[:50]}...")
        
    # Let's also check if there are other sources besides the canonical.
    # The canonical generation script usually uses "caregiver_log" or "sensor" or "synthetic".
    # Let's group by source.
    aggs = {
        "aggs": {
            "sources": {
                "terms": {"field": "source"}
            }
        },
        "size": 0
    }
    agg_res = es.search(index=index, body=aggs)
    print("\nSource breakdown:")
    for b in agg_res['aggregations']['sources']['buckets']:
        print(f" - {b['key']}: {b['doc_count']} docs")
        
    # 3. Verify Integrity of Canonical Data
    acute_query = {
        "query": {
            "term": {
                "behaviour_tags": "possible_delirium_or_infection"
            }
        },
        "size": 10
    }
    acute_res = es.search(index=index, body=acute_query)
    print(f"\nFound {len(acute_res['hits']['hits'])} acute cluster entries.")
    for hit in acute_res['hits']['hits']:
        src = hit['_source']
        print(f" - ID: {hit['_id']} | Time: {src.get('timestamp')} | Tags: {src.get('behaviour_tags')} | Severity: {src.get('severity')}")

if __name__ == "__main__":
    audit_patient_log()
