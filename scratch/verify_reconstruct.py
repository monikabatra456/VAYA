# Check syntax of MeetVaya_reconstructed.tsx and MeetPhoneScreen_reconstructed.tsx
with open("scratch/MeetVaya_reconstructed.tsx", "r", encoding="utf-8") as f:
    mv_txt = f.read()

with open("scratch/MeetPhoneScreen_reconstructed.tsx", "r", encoding="utf-8") as f:
    ps_txt = f.read()

print("MeetVaya lines:", len(mv_txt.split("\n")))
print("MeetPhoneScreen lines:", len(ps_txt.split("\n")))

# Check if any references to thumb-swipe or line-mask exist in either
for name, txt in [("MeetVaya", mv_txt), ("MeetPhoneScreen", ps_txt)]:
    for needle in ["thumb-swipe", "line-mask", "More destinations coming soon", "content0Ref"]:
        if needle in txt:
            print(f"WARNING: {needle} found in {name}")
        else:
            print(f"OK: {needle} NOT in {name}")

