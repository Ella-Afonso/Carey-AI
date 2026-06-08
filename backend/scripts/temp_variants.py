import asyncio
import os
import sys

sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from agent.agent import run_agent

async def run_variant_test():
    msg = "My mum gets distressed before dinner, but today she suddenly became much more confused."
    for i in range(8):
        res = await run_agent(msg, "demo-patient-001", use_fallback=False)
        print(f"Run {i+1}: Escalation: {res.get('escalation', {}).get('escalation_level')}")
        for t in res.get('trace', []):
            if t['tool_name'] == 'log_new_observation':
                print(f"   Tags: {t['input'].get('behaviour_tags')}")

if __name__ == "__main__":
    asyncio.run(run_variant_test())
