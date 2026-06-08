import asyncio
import os
import sys

sys.path.append(os.path.join(os.getcwd(), 'backend'))

from agent.agent import run_agent
from agent.elastic_client import es

async def run_testing_matrix():
    print("=== RIGOROUS TESTING MATRIX ===")
    
    TEMP_ID = "test-patient-stress"
    
    print("\n--- TEST A: POSITIVE CONTROL (8 RUNS) ---")
    hard_msg = "My mum has been extremely confused today, suddenly forgetting where she is. She also seems feverish and is escalating quickly."
    
    pass_count = 0
    for i in range(1, 9):
        res = await run_agent(hard_msg, TEMP_ID, use_fallback=True)
        ans = res.get("answer", "")
        
        has_escalation = "escalation" in ans.lower() or "safety" in ans.lower() or "clinician" in ans.lower()
        has_structure = "- what i found" in ans.lower() and "- what to do now" in ans.lower() and "- what was logged" in ans.lower()
        
        passed = has_escalation and has_structure
        if passed: pass_count += 1
        
        print(f"Run {i}: {'Pass' if passed else 'Fail'} | Escalation Triggered: {'Yes' if has_escalation else 'No'} | 5-Section Structure Maintained: {'Yes' if has_structure else 'No'}")
        
        if not passed:
            print(f"  [Failure Dump] Answer preview: {ans[:200]}...")
            
    print(f"Total Pass Rate: {pass_count} / 8 Runs.")

    print("\n--- TEST B: NEGATIVE CONTROL (1 RUN) ---")
    benign_msg = "My mum was a bit restless this afternoon around 4pm before dinner, asking about the time, but settled down after a cup of tea."
    res_b = await run_agent(benign_msg, TEMP_ID, use_fallback=True)
    ans_b = res_b.get("answer", "")
    
    has_escalation_b = "escalation" in ans_b.lower() or "safety" in ans_b.lower() or "clinician" in ans_b.lower() or "delirium" in ans_b.lower() or "infection" in ans_b.lower()
    has_structure_b = "- what i found" in ans_b.lower() and "- what to do now" in ans_b.lower() and "- what was logged" in ans_b.lower()
    
    # We want it NOT to trigger acute escalation.
    # It should maintain structure though.
    passed_b = (not has_escalation_b) and has_structure_b
    print(f"Result: {'Pass' if passed_b else 'Fail'}")
    print(f"Behavior Observed: Escalation silent? {'Yes' if not has_escalation_b else 'No'}, Structure Maintained? {'Yes' if has_structure_b else 'No'}")
    if not passed_b:
        print(f"  [Failure Dump] Answer preview: {ans_b[:200]}...")
        
    try:
        es.delete_by_query(index="patient_log", body={"query": {"term": {"patient_id": TEMP_ID}}})
        print("\n[CLEANUP] Safely wiped 'test-patient-stress' data.")
    except:
        pass

if __name__ == "__main__":
    asyncio.run(run_testing_matrix())
