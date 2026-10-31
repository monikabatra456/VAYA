import cv2, os

OUT = r"C:\Users\lenovo\.gemini\antigravity\brain\0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d"

def extract(path, prefix, frame_nums):
    cap = cv2.VideoCapture(path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    print(f"{prefix}: fps={fps:.1f}, total_frames={total}, duration={total/fps:.1f}s")
    count = 0
    saved = {}
    while True:
        ret, frame = cap.read()
        if not ret: break
        if count in frame_nums:
            out_path = os.path.join(OUT, f"{prefix}_f{count}.png")
            cv2.imwrite(out_path, frame)
            saved[count] = out_path
            print(f"  Saved frame {count} -> {out_path}")
        count += 1
    cap.release()
    return saved

# Recording 37 - target look  
r37 = r"C:\Users\lenovo\Downloads\screen-capture (37).webm"
if os.path.exists(r37):
    cap = cv2.VideoCapture(r37)
    fps = cap.get(cv2.CAP_PROP_FPS)
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    cap.release()
    print(f"Rec37: fps={fps}, frames={total}, dur={total/max(fps,1):.1f}s")
    # extract every ~3 seconds
    step = max(1, int(fps * 3))
    frames_37 = list(range(0, min(total, int(fps*30)), step))[:8]
    extract(r37, "ref37", frames_37)
else:
    print(f"NOT FOUND: {r37}")

# Recording 35 - Shopify reference
r35 = r"C:\Users\lenovo\Downloads\screen-capture (35).webm"
if os.path.exists(r35):
    cap = cv2.VideoCapture(r35)
    fps = cap.get(cv2.CAP_PROP_FPS)
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    cap.release()
    print(f"Rec35: fps={fps}, frames={total}, dur={total/max(fps,1):.1f}s")
    step = max(1, int(fps * 3))
    frames_35 = list(range(0, min(total, int(fps*30)), step))[:8]
    extract(r35, "ref35", frames_35)
else:
    print(f"NOT FOUND: {r35}")

