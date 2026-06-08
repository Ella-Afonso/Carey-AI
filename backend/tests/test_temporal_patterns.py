import pytest
import uuid
from datetime import datetime, timezone, timedelta
from agent.elastic_client import es, log_new_observation, detect_temporal_pattern

@pytest.fixture
def test_patient_id():
    patient_id = f"test-patient-{uuid.uuid4().hex[:6]}"
    yield patient_id
    # Cleanup after test finishes
    try:
        es.delete_by_query(
            index="patient_log",
            body={"query": {"term": {"patient_id": patient_id}}},
            conflicts="proceed"
        )
        es.indices.refresh(index="patient_log")
    except Exception:
        pass

def test_temporal_pattern_positive_sundowning(test_patient_id):
    # Seed 15 evening events (UTC hour 18 -> evening)
    base_time = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0)
    for i in range(15):
        log_new_observation(test_patient_id, "Agitated and pacing", ["agitation"], 2, (base_time + timedelta(hours=18, days=-i)).isoformat().replace("+00:00", "Z"), timezone_offset_hours=0)
        
    # Seed 5 morning events (UTC hour 9 -> morning)
    for i in range(5):
        log_new_observation(test_patient_id, "Slight confusion at breakfast", ["confusion"], 2, (base_time + timedelta(hours=9, days=-i)).isoformat().replace("+00:00", "Z"), timezone_offset_hours=0)
        
    es.indices.refresh(index="patient_log")
    res1 = detect_temporal_pattern(test_patient_id, timezone_offset_hours=0)
    
    assert res1["pattern_detected"] is True
    assert res1["dominant_window"] == "evening"
    assert res1["chronic_events_count"] == 20

def test_temporal_pattern_acute_isolation(test_patient_id):
    base_time = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0)
    # Seed 15 chronic evening events
    for i in range(15):
        log_new_observation(test_patient_id, "Restless", ["restlessness"], 2, (base_time + timedelta(hours=18, days=-i)).isoformat().replace("+00:00", "Z"), timezone_offset_hours=0)
        
    # Seed 5 ACUTE morning events (Severity 5)
    for i in range(5):
        log_new_observation(test_patient_id, "Severe delirium, falling", ["delirium"], 5, (base_time + timedelta(hours=9, days=-i)).isoformat().replace("+00:00", "Z"), timezone_offset_hours=0)
        
    es.indices.refresh(index="patient_log")
    res2 = detect_temporal_pattern(test_patient_id, timezone_offset_hours=0)
    
    assert res2["pattern_detected"] is True
    assert res2["dominant_window"] == "evening"
    assert res2["chronic_events_count"] == 15
    assert res2["acute_events_count"] == 5

def test_temporal_pattern_insufficient_data(test_patient_id):
    base_time = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0)
    # Only 3 events total
    for i in range(3):
        log_new_observation(test_patient_id, "Wandering", ["wandering"], 2, (base_time + timedelta(hours=18, days=-i)).isoformat().replace("+00:00", "Z"), timezone_offset_hours=0)
        
    es.indices.refresh(index="patient_log")
    res3 = detect_temporal_pattern(test_patient_id, timezone_offset_hours=0)
    
    assert res3["pattern_detected"] is False
    assert res3["chronic_events_count"] == 3
