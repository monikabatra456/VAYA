# scratch/compare_revealed.py
import numpy as np
from PIL import Image

t = Image.open(r"C:\Users\lenovo\.gemini\antigravity\brain\0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d\.user_uploaded\media_1793390201017_95c130b2.jpg")
r = Image.open(r"C:\Users\lenovo\.gemini\antigravity\brain\0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d\globe_realism_revealed.png")

print(f"Target size: {t.size}")
print(f"globe_realism_revealed size: {r.size}")

# resize r to t.size and compute diff
r_res = r.resize(t.size)
diff = np.mean(np.abs(np.array(t.convert('RGB')).astype(float) - np.array(r_res.convert('RGB')).astype(float)))
print(f"Diff with globe_realism_revealed: {diff:.2f}")

