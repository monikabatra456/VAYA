import json

log_path = r"C:\Users\lenovo\.gemini\antigravity\brain\a9693cba-ed1f-4605-8c52-8f741f2aa703\.system_generated\logs\transcript_full.jsonl"

with open(log_path, "r", encoding="utf-8") as f:
    for i, line in enumerate(f, 1):
        if i in [518, 729]:
            obj = json.loads(line)
            content = obj.get("tool_calls", [])[0]["args"]["Content"]
            # Look for .mv-seam in content
            idx = content.find(".mv-seam")
            print(f"Line {i} .mv-seam:")
            print(content[idx:idx+250])
            with open(f"scratch/meet_css_{i}.css", "w", encoding="utf-8") as out:
                out.write(content)

