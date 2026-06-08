import os
import argparse
from dotenv import load_dotenv
from elasticsearch import Elasticsearch

def setup_indices(recreate=False):
    load_dotenv()
    es_url = os.getenv("ELASTICSEARCH_URL")
    es_key = os.getenv("ELASTIC_API_KEY")

    if not es_url or not es_key:
        print("[ERROR] ELASTICSEARCH_URL or ELASTIC_API_KEY missing.")
        return

    es = Elasticsearch(es_url, api_key=es_key)

    indices = {
        "dementia_kb": {
            "mappings": {
                "properties": {
                    "doc_id": {"type": "keyword"},
                    "title": {"type": "text"},
                    "content": {"type": "text", "copy_to": "content_semantic"},
                    "content_semantic": {"type": "semantic_text", "inference_id": ".elser-2-elasticsearch"},
                    "source": {"type": "keyword"},
                    "url": {"type": "keyword"},
                    "licence": {"type": "keyword"},
                    "topic_tags": {"type": "keyword"}
                }
            }
        },
        "patient_log": {
            "mappings": {
                "properties": {
                    "patient_id": {"type": "keyword"},
                    "timestamp": {"type": "date"},
                    "time_of_day": {"type": "keyword"},
                    "raw_note": {"type": "text", "copy_to": "note_semantic"},
                    "search_text": {"type": "text"},
                    "note_semantic": {"type": "semantic_text", "inference_id": ".elser-2-elasticsearch"},
                    "behaviour_tags": {"type": "keyword"},
                    "severity": {"type": "integer"},
                    "synthetic": {"type": "boolean"},
                    "source": {"type": "keyword"}
                }
            }
        }
    }

    for index_name, body in indices.items():
        if es.indices.exists(index=index_name):
            if recreate:
                es.indices.delete(index=index_name)
                print(f"Deleted existing index: {index_name}")
            else:
                print(f"Index '{index_name}' exists. Use --recreate to overwrite.")
                continue
        
        es.indices.create(index=index_name, body=body)
        print(f"[SUCCESS] Created index mapping for: {index_name} (using ELSER endpoint)")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--recreate", action="store_true", help="Delete and recreate indices if they exist")
    args = parser.parse_args()
    setup_indices(args.recreate)
