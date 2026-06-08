import json
import os
import random
from datetime import datetime, timedelta

def generate_log():
    random.seed(42)
    PATIENT_ID = "demo-patient-001"
    output_path = os.path.join(os.path.dirname(__file__), "patient_log.jsonl")
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=75)
    acute_start_day = 50
    entries = []
    
    days_pool = list(range(76))
    random.shuffle(days_pool)
    missing_days = set(days_pool[:11])
    active_days = [d for d in range(76) if d not in missing_days]
    
    entry_counts = {d: 1 for d in active_days}
    remaining_entries = 99 - len(active_days)
    
    while remaining_entries > 0:
        target_day = random.choice(active_days)
        if entry_counts[target_day] < 3:
            entry_counts[target_day] += 1
            remaining_entries -= 1

    sundowning_notes = [
        "She became restless before dinner and needed repeated reassurance.",
        "Pacing around the living room repeatedly this afternoon. Very unsettled.",
        "Seemed agitated as the sun went down, asking when we were going home.",
        "Refused to sit down for evening tea, highly distressed about a lost item.",
        "Afternoon confusion set in earlier today. It took a while to calm her with familiar music.",
        "Anxious and pacing late in the day. Kept checking the locks on the doors.",
        "Became very tearful before dinner, saying she didn't recognize the kitchen."
    ]
    
    calm_notes = [
        "She had a calmer afternoon today and settled well with a cup of tea.",
        "Good day today. Sat quietly and watched television without any pacing.",
        "Very peaceful morning. She enjoyed looking through old photo albums.",
        "Slept well last night and was in a cheerful mood all morning.",
        "A quiet, settled afternoon following a visit from a neighbor.",
        "Ate a full lunch and seemed very relaxed for the rest of the day."
    ]

    acute_notes = [
        "She suddenly seemed much more confused than usual and could not follow simple instructions.",
        "Very alarming change today. Severe drowsiness and couldn't stay awake during lunch.",
        "Completely disoriented this morning. Didn't know who I was, which is completely new.",
        "Sudden, extreme confusion. She is talking to people who aren't in the room. Very out of character.",
        "She is physically hot, highly distressed, and the confusion is far worse than her usual afternoon baseline."
    ]
    
    for day_offset in range(76):
        if day_offset not in entry_counts:
            continue
            
        current_date = start_date + timedelta(days=day_offset)
        is_acute_window = (day_offset == acute_start_day or day_offset == acute_start_day + 1)
        
        for _ in range(entry_counts[day_offset]):
            hour = random.choice([8, 10, 14, 16, 18, 20])
            minute = random.randint(0, 59)
            entry_time = current_date.replace(hour=hour, minute=minute)
            
            if 6 <= hour < 12: time_of_day = "morning"
            elif 12 <= hour < 17: time_of_day = "afternoon"
            elif 17 <= hour < 21: time_of_day = "evening"
            else: time_of_day = "night"
                
            if is_acute_window:
                raw_note = random.choice(acute_notes)
                tags = ["sudden_confusion", "acute_change", "severe_confusion", "possible_delirium_or_infection", "escalation"]
                severity = 5
            else:
                is_agitated = (random.random() < 0.70) if time_of_day in ["afternoon", "evening"] else (random.random() < 0.20)
                if is_agitated:
                    raw_note = random.choice(sundowning_notes)
                    tags = ["agitation", "anxiety", "sundowning_pattern"]
                    severity = random.randint(3, 4)
                else:
                    raw_note = random.choice(calm_notes)
                    tags = ["calm", "routine", "stable"]
                    severity = random.randint(1, 2)

            # NEW: Construct the dense search payload
            search_text = f"{raw_note} {' '.join(tags)} {time_of_day} severity_{severity}"

            entries.append({
                "patient_id": PATIENT_ID,
                "timestamp": entry_time.isoformat(),
                "time_of_day": time_of_day,
                "raw_note": raw_note,
                "search_text": search_text,
                "behaviour_tags": tags,
                "severity": severity,
                "synthetic": True,
                "source": "synthetic_demo_generator"
            })
            
    entries.sort(key=lambda x: x["timestamp"])

    with open(output_path, "w", encoding="utf-8") as f:
        for entry in entries:
            f.write(json.dumps(entry) + "\n")
            
    print("\n--- SYNTHETIC PATIENT LOG GENERATED (with search_text) ---")
    print(f"Total Entries: {len(entries)}")
    print(f"Output Path:   {output_path}")

if __name__ == "__main__":
    generate_log()
