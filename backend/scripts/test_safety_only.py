import os
import sys
from dotenv import load_dotenv

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

load_dotenv()

from agent.safety import evaluate_safety

def run_test():
    print("Testing safety classification only...")
    query = "She woke up completely confused this morning, didn't recognize me, and she feels hot."
    logs = [
        {"timestamp": "2026-06-03T10:00:00Z", "raw_note": "Slept fine but woke up restless.", "severity": 2, "behaviour_tags": ["restless"]}
    ]
    
    print("Evaluating safety...")
    res = evaluate_safety(query, logs)
    print("\nSafety Assessment result:")
    print(f"Level:  {res.escalation_level}")
    print(f"Tags:   {res.safety_tags}")
    print(f"Reason: {res.reason}")

if __name__ == "__main__":
    run_test()
