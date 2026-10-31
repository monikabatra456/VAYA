import json

log_path = r"C:\Users\lenovo\.gemini\antigravity\brain\a9693cba-ed1f-4605-8c52-8f741f2aa703\.system_generated\logs\transcript_full.jsonl"

with open(log_path, "r", encoding="utf-8") as f:
    for i, line in enumerate(f, 1):
        if "interface MeetPhoneScreenProps" in line:
            print("Found interface at line", i)
            # print surrounding 500 chars
            idx = line.find("interface MeetPhoneScreenProps")
            print(line[idx:idx+400])

