import json

log_path = r"C:\Users\lenovo\.gemini\antigravity\brain\a9693cba-ed1f-4605-8c52-8f741f2aa703\.system_generated\logs\transcript_full.jsonl"

with open(log_path, "r", encoding="utf-8") as f:
    for i, line in enumerate(f, 1):
        if i in [901, 903, 905, 907]:
            obj = json.loads(line)
            # Check what keys are in obj
            print(f"Line {i}: type={obj.get('type')}, content starts with: {repr(obj.get('content')[:50])}")

