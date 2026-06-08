import os
import json
import argparse
from dotenv import load_dotenv
from elasticsearch import Elasticsearch
from elasticsearch.helpers import streaming_bulk

def ingest_kb(limit=None, chunk_size=5, timeout=600):
    load_dotenv()
    es = Elasticsearch(
        os.getenv("ELASTICSEARCH_URL"), 
        api_key=os.getenv("ELASTIC_API_KEY"),
        request_timeout=timeout,
        max_retries=3,
        retry_on_timeout=True
    )
    
    file_path = os.path.join(os.path.dirname(__file__), "..", "data", "knowledge_base", "sample_dementia_docs.jsonl")
    
    if not os.path.exists(file_path):
        print(f"[ERROR] File not found: {file_path}")
        return

    def generate_actions():
        with open(file_path, "r", encoding="utf-8") as f:
            for i, line in enumerate(f):
                if limit and i >= limit:
                    break
                if not line.strip():
                    continue
                
                doc = json.loads(line)
                
                if "text" in doc and "content" not in doc:
                    raise ValueError(f"ERROR: Document {doc.get('doc_id', 'Unknown')} uses 'text' instead of 'content'. Schema violation.")
                
                yield {
                    "_index": "dementia_kb",
                    "_id": doc["doc_id"],  # Prevents duplicates on re-run
                    "_source": doc
                }

    print(f"\nStarting ingestion from: {file_path}")
    print(f"Settings: chunk_size={chunk_size}, timeout={timeout}s, limit={limit}")
    
    successes = 0
    failures = 0
    failed_docs = []

    try:
        for ok, action in streaming_bulk(client=es, actions=generate_actions(), chunk_size=chunk_size, raise_on_error=False):
            if ok:
                successes += 1
            else:
                failures += 1
                failed_docs.append(action)
    except Exception as e:
        print(f"\n[CRITICAL ERROR] Bulk indexing failed: {str(e)}")

    print("\n--- INGESTION SUMMARY ---")
    print(f"Successfully indexed: {successes}")
    print(f"Failed to index:      {failures}")
    if failures > 0:
        print("First failure reason:")
        print(failed_docs[0])

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, help="Limit number of docs to ingest")
    parser.add_argument("--chunk-size", type=int, default=5, help="Bulk chunk size")
    parser.add_argument("--timeout", type=int, default=600, help="Request timeout in seconds")
    args = parser.parse_args()
    
    ingest_kb(limit=args.limit, chunk_size=args.chunk_size, timeout=args.timeout)
