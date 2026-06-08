import os
import sys
from dotenv import load_dotenv

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

load_dotenv()

from agent.agent import run_caregiver_agent

def run_debug():
    print("Starting trace...")
    print("Testing benign query...")
    res = run_caregiver_agent("Dad has a routine doctor appointment next Monday at 10 AM. I need to make sure we have his files.", "en")
    print("\n--- DONE ---")
    print(f"Safety Level: {res['safety_level']}")
    print(f"Sources:      {res['sources']}")
    print(f"Action:       {res['action_taken']}")
    print(f"Answer:       {res['answer'][:200]}...")

if __name__ == "__main__":
    run_debug()
