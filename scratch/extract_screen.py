import json

log_path = r"C:\Users\lenovo\.gemini\antigravity\brain\a9693cba-ed1f-4605-8c52-8f741f2aa703\.system_generated\logs\transcript_full.jsonl"

with open(log_path, "r", encoding="utf-8") as f:
    for i, line in enumerate(f, 1):
        if "write_file" in line:
            obj = json.loads(line)
            tool_calls = obj.get("tool_calls", [])
            for tc in tool_calls:
                p = tc.get("args", {}).get("Path", "")
                if "MeetVaya.tsx" in p or "MeetPhoneScreen.tsx" in p or "meet.css" in p:
                    print(f"Line {i}: write_file for {p}")
                    # Save a copy with line number
                    fname = p.split("\\")[-1]
                    with open(f"scratch/{i}_{fname}", "w", encoding="utf-8") as out:
                        out.write(tc["args"]["Content"])
