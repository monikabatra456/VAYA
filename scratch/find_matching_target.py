# scratch/find_matching_target.py
import os
import numpy as np
from PIL import Image

target_path = r"C:\Users\lenovo\.gemini\antigravity\brain\0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d\.user_uploaded\media_1793390201017_95c130b2.jpg"
img_target = Image.open(target_path).convert('RGB')
arr_target = np.array(img_target)
print("Target shape:", arr_target.shape)

# Let's inspect the artifacts directory for all png files
art_dir = r"C:\Users\lenovo\.gemini\antigravity\brain\0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d"
files = [f for f in os.listdir(art_dir) if f.endswith('.png') and ('revealed' in f or 'round' in f or 'globe' in f or 'wonder' in f)]

target_crop = arr_target[arr_target.shape[0]//3:arr_target.shape[0]*2//3, arr_target.shape[1]//3:arr_target.shape[1]*2//3]

best_match = None
min_diff = float('inf')

for f in files:
    fp = os.path.join(art_dir, f)
    try:
        im = Image.open(fp).convert('RGB')
        im_res = im.resize((arr_target.shape[1], arr_target.shape[0]))
        arr_f = np.array(im_res)
        f_crop = arr_f[arr_f.shape[0]//3:arr_f.shape[0]*2//3, arr_f.shape[1]//3:arr_f.shape[1]*2//3]
        diff = np.mean(np.abs(target_crop.astype(float) - f_crop.astype(float)))
        if diff < min_diff:
            min_diff = diff
            best_match = f
        if diff < 25:
            print(f"Candidate match: {f} with diff {diff:.2f}")
    except Exception as e:
        pass

print(f"Best match: {best_match} with diff {min_diff:.2f}")
