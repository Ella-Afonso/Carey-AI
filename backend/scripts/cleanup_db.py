import os
from dotenv import load_dotenv
from elasticsearch import Elasticsearch

def cleanup_and_reingest():
    print("=== EXECUTING DATABASE CLEANUP ===")
    load_dotenv()
    
    es_url = os.getenv("ELASTICSEARCH_URL")
    es_key = os.getenv("ELASTIC_API_KEY")
    
    if not es_url or not es_key:
        print("[ERROR] Missing ELASTICSEARCH_URL or ELASTIC_API_KEY in .env")
        return
        
    es = Elasticsearch(es_url, api_key=es_key)
    
    print("1. Deleting all records in 'patient_log' index...")
    try:
        res = es.delete_by_query(index='patient_log', body={'query': {'match_all': {}}})
        print(f"   -> Deleted documents: {res.get('deleted', 0)}")
    except Exception as e:
        print(f"   -> [ERROR] Failed to delete: {e}")
        return
        
    print("\n2. Re-ingesting pristine patient data...")
    # Execute the ingest script
    os.system("python backend/elastic/ingest_patient_log.py")
    
    print("\n=== CLEANUP COMPLETE ===")
    print("Run `python backend/scripts/verify_pristine_log.py` to confirm.")

if __name__ == "__main__":
    cleanup_and_reingest()
