import json

log_path = r"C:\Users\lenovo\.gemini\antigravity\brain\a9693cba-ed1f-4605-8c52-8f741f2aa703\.system_generated\logs\transcript_full.jsonl"

with open(log_path, "r", encoding="utf-8") as f:
    for i, line in enumerate(f, 1):
        if i >= 650 and i <= 730:
            obj = json.loads(line)
            if obj.get("type") == "USER_INPUT":
                print(f"Line {i} USER_INPUT:")
                print(obj.get("content")[:300])

