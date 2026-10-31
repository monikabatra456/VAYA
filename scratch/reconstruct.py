import json

log_path = r"C:\Users\lenovo\.gemini\antigravity\brain\a9693cba-ed1f-4605-8c52-8f741f2aa703\.system_generated\logs\transcript_full.jsonl"

# 1. Reconstruct MeetVaya.tsx from steps 403, 405, 407, 409, 411
meet_vaya_chunks = []
with open(log_path, "r", encoding="utf-8") as f:
    for i, line in enumerate(f, 1):
        if i in [917, 919, 921, 923, 925]:
            obj = json.loads(line)
            content = obj.get("content", "")
            # Content starts with header like "Created At: ... Showing lines X-Y of 693\n1: ..."
            lines = content.split("\n")
            code_lines = []
            for l in lines:
                if ": " in l and l.split(": ")[0].strip().isdigit():
                    code_lines.append(l.split(": ", 1)[1])
            meet_vaya_chunks.append("\n".join(code_lines))

full_meet_vaya = "\n".join(meet_vaya_chunks)
with open("scratch/MeetVaya_reconstructed.tsx", "w", encoding="utf-8") as out:
    out.write(full_meet_vaya)
print("MeetVaya reconstructed, line count:", len(full_meet_vaya.split("\n")))

# 2. Check MeetPhoneScreen.tsx from steps 388, 390, 392, 394
phone_chunks = []
with open(log_path, "r", encoding="utf-8") as f:
    for i, line in enumerate(f, 1):
        if i in [901, 903, 907, 909]:
            obj = json.loads(line)
            content = obj.get("content", "")
            lines = content.split("\n")
            code_lines = []
            for l in lines:
                if ": " in l and l.split(": ")[0].strip().isdigit():
                    code_lines.append(l.split(": ", 1)[1])
            phone_chunks.append("\n".join(code_lines))

print("Phone screen chunks found:", len(phone_chunks))

