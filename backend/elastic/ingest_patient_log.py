import os
import json
import argparse
from dotenv import load_dotenv
from elasticsearch import Elasticsearch
from elasticsearch.helpers import streaming_bulk

def ingest_logs(limit=None, chunk_size=10, timeout=600):
    load_dotenv()
    es = Elasticsearch(
        os.getenv("ELASTICSEARCH_URL"), 
        api_key=os.getenv("ELASTIC_API_KEY"),
        request_timeout=timeout,
        max_retries=3,
        retry_on_timeout=True
    )
    
    file_path = os.path.join(os.path.dirname(__file__), "..", "data", "patient_log.jsonl")

    def generate_actions():
        with open(file_path, "r", encoding="utf-8") as f:
            for i, line in enumerate(f):
                if limit and i >= limit:
                    break
                if not line.strip():
                    continue
                doc = json.loads(line)
                
                # Create a stable ID based on patient and timestamp
                stable_id = f"{doc['patient_id']}_{doc['timestamp']}"
                
                yield {
                    "_index": "patient_log",
                    "_id": stable_id, 
                    "_source": doc
                }

    successes, failures = 0, 0
    try:
        for ok, _ in streaming_bulk(client=es, actions=generate_actions(), chunk_size=chunk_size, raise_on_error=False):
            if ok:
                successes += 1
            else:
                failures += 1
    except Exception as e:
         print(f"[ERROR] {str(e)}")

    print("\n--- PATIENT LOG INGESTION SUMMARY ---")
    print(f"Successfully indexed: {successes}")
    print(f"Failed to index:      {failures}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int)
    parser.add_argument("--chunk-size", type=int, default=10)
    args = parser.parse_args()
    ingest_logs(limit=args.limit, chunk_size=args.chunk_size)
