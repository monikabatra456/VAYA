import json

log_path = r"C:\Users\lenovo\.gemini\antigravity\brain\a9693cba-ed1f-4605-8c52-8f741f2aa703\.system_generated\logs\transcript_full.jsonl"

with open(log_path, "r", encoding="utf-8") as f:
    for i, line in enumerate(f, 1):
        if "MeetPhoneScreen.tsx" in line and ("write_file" in line or "edit_file" in line):
            obj = json.loads(line)
            tool_calls = obj.get("tool_calls", [])
            for tc in tool_calls:
                p = tc.get("args", {}).get("Path", "")
                if "MeetPhoneScreen.tsx" in p:
                    print(f"Line {i}: {tc.get('name')}")
                    if tc.get('name') == 'write_file':
                        print("  length:", len(tc['args']['Content']))
                        with open(f"scratch/write_{i}_MeetPhoneScreen.tsx", "w", encoding="utf-8") as out:
                            out.write(tc['args']['Content'])
                    elif tc.get('name') == 'edit_file':
                        print("  edit target:", tc['args']['Target'][:40])

