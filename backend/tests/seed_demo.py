import sys
import os
from datetime import datetime, timezone, timedelta

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from agent.elastic_client import es, log_new_observation

def seed_demo_patient():
    patient_id = "demo-patient-001"
    print(f"Seeding realistic sundowning pattern for {patient_id}...")
    
    # Clean previous data to ensure a clean chart
    es.delete_by_query(
        index="patient_log",
        body={"query": {"term": {"patient_id": patient_id}}},
        conflicts="proceed"
    )
    es.indices.refresh(index="patient_log")
    
    base_time = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0)
    
    # 18 evening events (sundowning)
    for i in range(18):
        log_new_observation(
            patient_id, 
            "Agitation, pacing, and distress during dinner transition.", 
            ["agitation", "distress"], 
            3, 
            (base_time + timedelta(hours=19, days=-i)).isoformat().replace("+00:00", "Z")
        )
        
    # 4 morning events
    for i in range(4):
        log_new_observation(
            patient_id, 
            "Slight confusion finding the kitchen.", 
            ["confusion"], 
            2, 
            (base_time + timedelta(hours=9, days=-(i*2))).isoformat().replace("+00:00", "Z")
        )
        
    es.indices.refresh(index="patient_log")
    print("Seed complete! You can now test the UI.")

if __name__ == "__main__":
    seed_demo_patient()
