import os
import sys

sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from agent.elastic_client import es

def check_dementia_kb():
    index_name = "dementia_kb"
    
    # 1. Check if index exists
    exists = es.indices.exists(index=index_name)
    print(f"Index '{index_name}' reachable/exists: {exists}")
    
    if not exists:
        print("Index does not exist.")
        return
        
    # 2. Direct count
    count_res = es.count(index=index_name)
    print(f"Total document count: {count_res['count']}")
    
    # 3. Plain match query (match_all to just get a sample document)
    match_res = es.search(index=index_name, body={"query": {"match_all": {}}}, size=1)
    
    if match_res['hits']['hits']:
        print("Sample document retrieved successfully:")
        print(match_res['hits']['hits'][0]['_source'].keys())
    else:
        print("No documents found in match query.")

if __name__ == "__main__":
    check_dementia_kb()
