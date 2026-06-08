import os
import sys

sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from agent.elastic_client import es

def cleanup():
    # Delete by query for source "caregiver_demo_input"
    res = es.delete_by_query(
        index="patient_log", 
        body={
            "query": {
                "term": {
                    "source": "caregiver_demo_input"
                }
            }
        }
    )
    print(f"Cleanup executed. Deleted {res.get('deleted', 0)} documents.")
    
    # Verify final count
    count = es.count(index="patient_log")['count']
    print(f"Final patient_log document count: {count} (Expected: 99)")

if __name__ == "__main__":
    cleanup()
