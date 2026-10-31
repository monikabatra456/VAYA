import json

log_path = r"C:\Users\lenovo\.gemini\antigravity\brain\a9693cba-ed1f-4605-8c52-8f741f2aa703\.system_generated\logs\transcript_full.jsonl"

with open(log_path, "r", encoding="utf-8") as f:
    for i, line in enumerate(f, 1):
        if i == 510:
            obj = json.loads(line)
            content = obj.get("content", "")
            print("Line 510 content length:", len(content))
            lines = content.split("\n")
            code_lines = []
            for l in lines:
                if ": " in l and l.split(": ")[0].strip().isdigit():
                    code_lines.append(l.split(": ", 1)[1])
            with open("scratch/MeetPhoneScreen_510.tsx", "w", encoding="utf-8") as out:
                out.write("\n".join(code_lines))
            print("Saved scratch/MeetPhoneScreen_510.tsx, lines:", len(code_lines))

