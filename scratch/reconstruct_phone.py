import json

log_path = r"C:\Users\lenovo\.gemini\antigravity\brain\a9693cba-ed1f-4605-8c52-8f741f2aa703\.system_generated\logs\transcript_full.jsonl"

lines_dict = {}

with open(log_path, "r", encoding="utf-8") as f:
    for i, line in enumerate(f, 1):
        if i in [510, 902, 904, 906, 908]:
            obj = json.loads(line)
            content = obj.get("content", "")
            for l in content.split("\n"):
                if ": " in l:
                    parts = l.split(": ", 1)
                    if parts[0].strip().isdigit():
                        line_num = int(parts[0].strip())
                        lines_dict[line_num] = parts[1]

print("Total lines collected:", len(lines_dict))
print("Min line:", min(lines_dict.keys()), "Max line:", max(lines_dict.keys()))

sorted_lines = [lines_dict[k] for k in sorted(lines_dict.keys())]
with open("scratch/MeetPhoneScreen_reconstructed.tsx", "w", encoding="utf-8") as out:
    out.write("\n".join(sorted_lines))

print("Saved scratch/MeetPhoneScreen_reconstructed.tsx")
