import os
import sys

sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from agent.elastic_client import es

def check_states():
    for idx in ["dementia_kb", "patient_log"]:
        if es.indices.exists(index=idx):
            count = es.count(index=idx)['count']
            print(f"Index {idx} exists. Document count: {count}")
            # Also get mapping to print for Step 2
            mapping = es.indices.get_mapping(index=idx)
            print(f"--- MAPPING FOR {idx} ---")
            print(mapping)
        else:
            print(f"Index {idx} does not exist.")

if __name__ == "__main__":
    check_states()
