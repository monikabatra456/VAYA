import json

log_path = r"C:\Users\lenovo\.gemini\antigravity\brain\a9693cba-ed1f-4605-8c52-8f741f2aa703\.system_generated\logs\transcript_full.jsonl"

with open(log_path, "r", encoding="utf-8") as f:
    for i, line in enumerate(f, 1):
        if i >= 731 and i < 913 and "edit_file" in line:
            obj = json.loads(line)
            tool_calls = obj.get("tool_calls", [])
            for tc in tool_calls:
                p = tc.get("args", {}).get("Path", "")
                if "Meet" in p or "meet" in p:
                    print(f"Line {i}: edit_file on {p}")

