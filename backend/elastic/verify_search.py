import os
from dotenv import load_dotenv
from elasticsearch import Elasticsearch

def verify_searches():
    load_dotenv()
    es = Elasticsearch(os.getenv("ELASTICSEARCH_URL"), api_key=os.getenv("ELASTIC_API_KEY"))
    
    # Check 1: Ensure exactly 99 patient logs exist
    log_count = es.count(index="patient_log")['count']
    print(f"\n[DIAGNOSTIC] Total patient_log entries: {log_count} (Expected: 99)")
    
    # Check 2: Confirm acute cluster survived the ingest
    acute_count = es.count(index="patient_log", query={"term": {"behaviour_tags": "possible_delirium_or_infection"}})['count']
    print(f"[DIAGNOSTIC] Acute delirium entries found: {acute_count} (If 0, the demo will fail!)\n")

    queries = [
        {"index": "dementia_kb", "q": "mum gets distressed before dinner", "text_field": "content", "semantic_field": "content_semantic"},
        {"index": "dementia_kb", "q": "sudden confusion possible infection", "text_field": "content", "semantic_field": "content_semantic"},
        {"index": "patient_log", "q": "agitation afternoon", "text_field": "raw_note", "semantic_field": "note_semantic"},
        {"index": "patient_log", "q": "sudden severe confusion", "text_field": "raw_note", "semantic_field": "note_semantic"}
    ]

    for config in queries:
        print(f"--- INDEX: {config['index']} | QUERY: '{config['q']}' ---")
        
        # Proper Elastic Serverless RRF Hybrid Query
        query_body = {
            "retriever": {
                "rrf": {
                    "retrievers": [
                        {"standard": {"query": {"match": {config['text_field']: config['q']}}}},
                        {"standard": {"query": {"semantic": {"field": config['semantic_field'], "query": config['q']}}}}
                    ],
                    "rank_constant": 1,
                    "rank_window_size": 10
                }
            },
            "fields": [config['semantic_field']],
            "size": 3
        }

        try:
            res = es.search(index=config['index'], body=query_body)
            hits = res.get("hits", {}).get("hits", [])
            
            if not hits:
                print(" -> No results found.\n")
                continue
                
            for i, hit in enumerate(hits):
                score = hit.get("_score", "N/A")
                source = hit.get("_source", {})
                
                # Check if semantic embedding actually ran (Trap check)
                fields = hit.get("fields", {})
                semantic_data = fields.get(config['semantic_field'])
                embedding_status = "OK" if semantic_data else "EMPTY (Inference Failed!)"

                if config['index'] == "dementia_kb":
                    print(f" {i+1}. [Score: {score}] ID: {source.get('doc_id')} | Tags: {source.get('topic_tags')}")
                    print(f"    Text: {source.get('content')[:100]}... [Embedding: {embedding_status}]")
                else:
                    print(f" {i+1}. [Score: {score}] Date: {source.get('timestamp')} | Tags: {source.get('behaviour_tags')}")
                    print(f"    Note: {source.get('raw_note')} [Embedding: {embedding_status}]")
            print()
            
        except Exception as e:
            print(f" -> [ERROR] Hybrid search failed. {str(e)}")
            print(" -> FALLING BACK TO LEXICAL ONLY...")
            fallback = es.search(index=config['index'], query={"match": {config['text_field']: config['q']}}, size=3)
            for i, hit in enumerate(fallback["hits"]["hits"]):
                print(f" {i+1}. [Score: {hit['_score']}] Text: {hit['_source'].get(config['text_field'])[:100]}...")
            print()

if __name__ == "__main__":
    verify_searches()
