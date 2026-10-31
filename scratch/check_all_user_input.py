import json

log_path = r"C:\Users\lenovo\.gemini\antigravity\brain\a9693cba-ed1f-4605-8c52-8f741f2aa703\.system_generated\logs\transcript_full.jsonl"

with open(log_path, "r", encoding="utf-8") as f:
    for i, line in enumerate(f, 1):
        if '"type":"USER_INPUT"' in line:
            obj = json.loads(line)
            print(f"Line {i} step_index {obj.get('step_index')}: {obj.get('content', '')[:120]}")

