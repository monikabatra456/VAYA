import difflib

with open(r"src/components/meet/meet.css", "r", encoding="utf-8") as f1, \
     open(r"scratch/meet_css_518.css", "r", encoding="utf-8") as f2:
    cur = f1.readlines()
    prev = f2.readlines()

diff = difflib.unified_diff(cur, prev, fromfile="current", tofile="line_518")
with open("scratch/css_diff.patch", "w", encoding="utf-8") as out:
    out.writelines(diff)

print("Saved scratch/css_diff.patch")
