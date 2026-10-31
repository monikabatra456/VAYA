import subprocess, os

OUT = r"C:\Users\lenovo\.gemini\antigravity\brain\0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d"

def extract_ffmpeg(src, prefix, times_sec):
    """Extract frames at specific timestamps using ffmpeg"""
    for t in times_sec:
        out_path = os.path.join(OUT, f"{prefix}_t{t}s.png")
        cmd = [
            "ffmpeg", "-y", "-ss", str(t), "-i", src,
            "-vframes", "1", "-q:v", "2", out_path
        ]
        r = subprocess.run(cmd, capture_output=True, text=True)
        if os.path.exists(out_path):
            print(f"  OK: {prefix} @{t}s -> {out_path}")
        else:
            print(f"  FAIL: {prefix} @{t}s: {r.stderr[-200:]}")

r37 = r"C:\Users\lenovo\Downloads\screen-capture (37).webm"
r35 = r"C:\Users\lenovo\Downloads\screen-capture (35).webm"

if os.path.exists(r37):
    print("Extracting rec37...")
    extract_ffmpeg(r37, "ref37", [0, 3, 6, 9, 12, 15, 18, 22])

if os.path.exists(r35):
    print("Extracting rec35...")
    extract_ffmpeg(r35, "ref35", [0, 3, 6, 9, 12, 15, 18, 22])

print("Done")

