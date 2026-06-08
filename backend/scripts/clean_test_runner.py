import subprocess

tests = [
    ["python", "backend/scripts/test_agent.py"],
    ["python", "backend/scripts/test_escalation_consistency.py", "8"],
    ["python", "backend/scripts/test_escalation_specificity.py", "2"]
]

for cmd in tests:
    print(f"Running {' '.join(cmd)}")
    res = subprocess.run(cmd, capture_output=True, text=True)
    out = res.stdout
    # find the pass lines
    lines = out.split('\n')
    for line in lines[-20:]:
        if "PASS" in line or "FAIL" in line or "Rate" in line or "Pass" in line:
            print(line.strip())
    print("-" * 40)
