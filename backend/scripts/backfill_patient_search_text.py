import os
from dotenv import load_dotenv
from elasticsearch import Elasticsearch
from elasticsearch.helpers import scan, streaming_bulk

def backfill_search_text():
    print("=== STARTING LIVE INDEX BACKFILL ===")
    load_dotenv()
    
    es_url = os.getenv("ELASTICSEARCH_URL")
    es_key = os.getenv("ELASTIC_API_KEY")

    if not es_url or not es_key:
        print("[ERROR] ELASTICSEARCH_URL or ELASTIC_API_KEY missing.")
        return

    es = Elasticsearch(es_url, api_key=es_key, request_timeout=120)

    # 1. Scroll through all existing documents
    query = {"query": {"match_all": {}}}
    
    def generate_updates():
        for doc in scan(client=es, index="patient_log", query=query):
            source = doc["_source"]
            
            # Skip if already backfilled
            if "search_text" in source:
                continue
                
            raw_note = source.get("raw_note", "")
            tags = " ".join(source.get("behaviour_tags", []))
            time_of_day = source.get("time_of_day", "")
            severity = source.get("severity", "")
            
            search_text = f"{raw_note} {tags} {time_of_day} severity_{severity}"
            
            yield {
                "_op_type": "update",
                "_index": "patient_log",
                "_id": doc["_id"],
                "doc": {
                    "search_text": search_text
                }
            }

    successes = 0
    failures = 0

    try:
        for ok, action in streaming_bulk(client=es, actions=generate_updates(), raise_on_error=False):
            if ok: successes += 1
            else: failures += 1
    except Exception as e:
        print(f"[ERROR] Backfill failed: {str(e)}")

    print(f" -> Backfill Complete. Updated {successes} documents. Failed: {failures}")

if __name__ == "__main__":
    backfill_search_text()
