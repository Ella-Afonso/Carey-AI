import os
import uuid
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from elasticsearch import Elasticsearch

load_dotenv()

es_url = os.getenv("ELASTICSEARCH_URL")
es_key = os.getenv("ELASTIC_API_KEY")

es = Elasticsearch(
    es_url, 
    api_key=es_key,
    request_timeout=120,
    max_retries=3,
    retry_on_timeout=True
)

def search_general_guidance(query: str, top_k: int = 3) -> list[dict]:
    """Search dementia_kb for clinical guidance with mandatory citations."""
    query_body = {
        "retriever": {
            "rrf": {
                "retrievers": [
                    {"standard": {"query": {"multi_match": {"query": query, "fields": ["title", "content", "topic_tags"]}}}},
                    {"standard": {"query": {"semantic": {"field": "content_semantic", "query": query}}}}
                ],
                "rank_constant": 1,
                "rank_window_size": 10
            }
        },
        "size": top_k
    }

    try:
        res = es.search(index="dementia_kb", body=query_body)
    except Exception as e:
        print(f"[WARNING] Hybrid search failed ({str(e)}). Falling back to lexical search.")
        fallback_query = {"query": {"multi_match": {"query": query, "fields": ["title", "content", "topic_tags"]}}}
        res = es.search(index="dementia_kb", body=fallback_query, size=top_k)

    results = []
    for hit in res.get("hits", {}).get("hits", []):
        src = hit["_source"]
        results.append({
            "doc_id": src.get("doc_id"),
            "title": src.get("title"),
            "content": src.get("content"),
            "source": src.get("source", "Unknown Source"), # Mandatory
            "url": src.get("url", "#"),                    # Mandatory
            "licence": src.get("licence"),
            "topic_tags": src.get("topic_tags", []),
            "score": hit.get("_score")
        })
    return results

def get_patient_latest_timestamp(patient_id: str) -> datetime:
    """Retrieve the timestamp of the patient's most recent log entry."""
    query_body = {
        "query": {"term": {"patient_id": patient_id}},
        "size": 1,
        "sort": [{"timestamp": {"order": "desc"}}]
    }
    try:
        res = es.search(index="patient_log", body=query_body)
        hits = res.get("hits", {}).get("hits", [])
        if hits:
            ts_str = hits[0]["_source"].get("timestamp")
            if ts_str:
                return datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
    except Exception:
        pass
    return datetime.now(timezone.utc)

def search_patient_history(patient_id: str, query: str, time_of_day: str = None, since_days: int = None, top_k: int = 5) -> list[dict]:
    """Search patient_log using patient ID, time filters, and text query."""
    filters = [{"term": {"patient_id": patient_id}}]
    
    if time_of_day:
        filters.append({"term": {"time_of_day": time_of_day}})
        
    if since_days:
        latest_ts = get_patient_latest_timestamp(patient_id)
        cutoff = (latest_ts - timedelta(days=since_days)).isoformat().replace("+00:00", "Z")
        filters.append({"range": {"timestamp": {"gte": cutoff}}})

    query_body = {
        "retriever": {
            "rrf": {
                "retrievers": [
                    {"standard": {"query": {"bool": {
                        "must": [{"multi_match": {"query": query, "fields": ["raw_note", "behaviour_tags"]}}],
                        "filter": filters
                    }}}},
                    {"standard": {"query": {"bool": {
                        "must": [{"semantic": {"field": "note_semantic", "query": query}}],
                        "filter": filters
                    }}}}
                ],
                "rank_constant": 1,
                "rank_window_size": 10
            }
        },
        "size": top_k
    }

    try:
        res = es.search(index="patient_log", body=query_body)
    except Exception:
        fallback_query = {"query": {"bool": {"must": [{"multi_match": {"query": query, "fields": ["raw_note", "behaviour_tags"]}}], "filter": filters}}}
        res = es.search(index="patient_log", body=fallback_query, size=top_k)

    results = []
    for hit in res.get("hits", {}).get("hits", []):
        src = hit["_source"]
        results.append({
            "entry_id": hit.get("_id"),
            "patient_id": src.get("patient_id"),
            "timestamp": src.get("timestamp"),
            "time_of_day": src.get("time_of_day"),
            "raw_note": src.get("raw_note"),
            "behaviour_tags": src.get("behaviour_tags", []),
            "severity": src.get("severity"),
            "source": src.get("source"),
            "score": hit.get("_score")
        })
    return results

def log_new_observation(patient_id: str, raw_note: str, behaviour_tags: list[str], severity: int, timestamp: str = None, timezone_offset_hours: int = 0) -> dict:
    """Action Tool: Write a new observation to the synthetic patient log."""
    severity = max(1, min(5, severity)) # Enforce 1-5 boundary
    
    if not timestamp:
        timestamp = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        
    entry_id = f"{patient_id}-observation-{uuid.uuid4().hex[:8]}"
    
    # Determine time of day roughly based on local time
    utc_dt = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
    local_dt = utc_dt + timedelta(hours=timezone_offset_hours)
    hour = local_dt.hour
    if 6 <= hour < 12: time_of_day = "morning"
    elif 12 <= hour < 17: time_of_day = "afternoon"
    elif 17 <= hour < 21: time_of_day = "evening"
    else: time_of_day = "night"

    doc = {
        "patient_id": patient_id,
        "timestamp": timestamp,
        "time_of_day": time_of_day,
        "raw_note": raw_note,
        "behaviour_tags": behaviour_tags,
        "severity": severity,
        "synthetic": True,
        "source": "caregiver_demo_input"
    }

    es.index(index="patient_log", id=entry_id, body=doc)
    return {
        "logged": True,
        "entry_id": entry_id,
        "timestamp": timestamp,
        "time_of_day": time_of_day,
        "raw_note": raw_note,
        "behaviour_tags": behaviour_tags,
        "severity": severity,
        "synthetic": True,
        "source": "caregiver_demo_input"
    }

def get_patient_entries(patient_id: str, since_days: int = 30) -> list[dict]:
    """Retrieve raw entries strictly for the deterministic clinician summary."""
    latest_ts = get_patient_latest_timestamp(patient_id)
    cutoff = (latest_ts - timedelta(days=since_days)).isoformat().replace("+00:00", "Z")
    query_body = {
        "query": {
            "bool": {
                "must": [{"term": {"patient_id": patient_id}}],
                "filter": [{"range": {"timestamp": {"gte": cutoff}}}]
            }
        },
        "size": 100,
        "sort": [{"timestamp": {"order": "asc"}}]
    }
    
    res = es.search(index="patient_log", body=query_body)
    return [hit["_source"] for hit in res.get("hits", {}).get("hits", [])]

def generate_clinician_summary(patient_id: str, since_days: int = 30) -> dict:
    """Generate a structured, deterministic clinician summary from patient history logs."""
    entries = get_patient_entries(patient_id, since_days)
    
    if not entries:
        return {
            "summary_text": "No recent entries found to summarize.",
            "source_entries_count": 0,
            "generated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        }

    # Deterministic generation logic
    concerns = [e['raw_note'] for e in entries if e.get('severity', 1) >= 3]
    escalations = [e['raw_note'] for e in entries if e.get('severity', 1) >= 4]
    
    summary_text = (
        f"--- CLINICIAN OBSERVATION SUMMARY ---\n"
        f"Patient ID: {patient_id}\n"
        f"Period: Last {since_days} days\n"
        f"Total Logged Observations: {len(entries)}\n\n"
        f"Notable Concerns (Severity 3+):\n- " + "\n- ".join(concerns[:3]) + "\n\n"
        f"Escalation/Acute Signals (Severity 4+):\n- " + ("\n- ".join(escalations) if escalations else "None logged.") + "\n\n"
        f"Safety Note: This summary is not a diagnosis. It is intended to help a caregiver communicate observations to a clinician."
    )
    
    return {
        "summary_text": summary_text,
        "source_entries_count": len(entries),
        "generated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    }

def detect_temporal_pattern(patient_id: str, timezone_offset_hours: int = 0) -> dict:
    """Detect temporal clustering in chronic behaviors while isolating acute events."""
    script_source = """
    if (doc['timestamp'].size() == 0) {
        emit('unknown');
        return;
    }
    def dt = doc['timestamp'].value;
    def localDt = dt.plusHours((long)params.offset);
    def hour = localDt.getHour();
    if (hour >= 6 && hour < 12) emit('morning');
    else if (hour >= 12 && hour < 17) emit('afternoon');
    else if (hour >= 17 && hour < 21) emit('evening');
    else emit('night');
    """
    
    query_body = {
        "runtime_mappings": {
            "local_time_window": {
                "type": "keyword",
                "script": {
                    "source": script_source,
                    "params": {"offset": timezone_offset_hours}
                }
            }
        },
        "query": {
            "bool": {
                "must": [{"term": {"patient_id": patient_id}}],
                "filter": [
                    {"exists": {"field": "behaviour_tags"}}
                ]
            }
        },
        "aggs": {
            "chronic_vs_acute": {
                "filters": {
                    "filters": {
                        "chronic": {"range": {"severity": {"lte": 3}}},
                        "acute": {"range": {"severity": {"gte": 4}}}
                    }
                },
                "aggs": {
                    "by_window": {
                        "terms": {"field": "local_time_window", "size": 10},
                        "aggs": {
                            "avg_severity": {"avg": {"field": "severity"}}
                        }
                    }
                }
            }
        },
        "size": 100,
        "sort": [{"timestamp": {"order": "desc"}}]
    }
    
    try:
        res = es.search(index="patient_log", body=query_body)
    except Exception as e:
        return {"pattern_detected": False, "error": str(e)}
    
    aggs = res.get("aggregations", {}).get("chronic_vs_acute", {}).get("buckets", {})
    chronic_buckets = aggs.get("chronic", {}).get("by_window", {}).get("buckets", [])
    
    total_chronic = sum(b["doc_count"] for b in chronic_buckets)
    
    breakdown = []
    for b in chronic_buckets:
        breakdown.append({
            "window": b["key"],
            "count": b["doc_count"],
            "avg_severity": round(b["avg_severity"]["value"], 1) if b.get("avg_severity", {}).get("value") else 0.0
        })
        
    pattern_detected = False
    dominant_window = None
    
    if total_chronic >= 5 and len(chronic_buckets) > 0:
        top_bucket = chronic_buckets[0]
        if top_bucket["doc_count"] / total_chronic > 0.5:
            pattern_detected = True
            dominant_window = top_bucket["key"]
            
    hits = res.get("hits", {}).get("hits", [])
    grounded_in = [h["_id"] for h in hits[:5]]
    
    return {
        "pattern_detected": pattern_detected,
        "dominant_window": dominant_window,
        "breakdown": breakdown,
        "total_entries_analysed": total_chronic + aggs.get("acute", {}).get("doc_count", 0),
        "chronic_events_count": total_chronic,
        "acute_events_count": aggs.get("acute", {}).get("doc_count", 0),
        "grounded_in": grounded_in
    }

