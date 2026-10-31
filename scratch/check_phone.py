import json

# Check scratch/MeetPhoneScreen_prev.tsx that we generated from line 725 + 771
with open("scratch/MeetPhoneScreen_prev.tsx", "r", encoding="utf-8") as f:
    prev_txt = f.read()

print("scratch/MeetPhoneScreen_prev.tsx lines:", len(prev_txt.split("\n")))
# Look at the first 30 lines
print("\n".join(prev_txt.split("\n")[:30]))

