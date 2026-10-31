# scratch/search_all_images.py
import os
import numpy as np
from PIL import Image

t = Image.open(r"C:\Users\lenovo\.gemini\antigravity\brain\0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d\.user_uploaded\media_1793390201017_95c130b2.jpg").convert('RGB')
t_arr = np.array(t)

folders = [
    r"C:\Users\lenovo\.gemini\antigravity\brain\0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d",
    r"c:\Users\lenovo\Downloads\vaya 3.0",
    r"c:\Users\lenovo\Downloads\vaya 3.0\scratch"
]

all_diffs = []

for folder in folders:
    for f in os.listdir(folder):
        if f.lower().endswith(('.png', '.jpg', '.webp')):
            fp = os.path.join(folder, f)
            if not os.path.isfile(fp): continue
            try:
                im = Image.open(fp).convert('RGB')
                im_res = im.resize(t.size)
                arr = np.array(im_res)
                d = np.mean(np.abs(t_arr.astype(float) - arr.astype(float)))
                all_diffs.append((d, f, fp))
            except:
                pass

all_diffs.sort()
print("Top 10 closest matches:")
for d, name, path in all_diffs[:10]:
    print(f"{d:.2f} -> {name} ({path})")

