# scratch/find_img_good.py
import glob
import os
from PIL import Image

art_dir = r'C:/Users/lenovo/.gemini/antigravity/brain/0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d'
pngs = glob.glob(os.path.join(art_dir, '*.png'))
for p in sorted(pngs, key=os.path.getmtime):
    fname = os.path.basename(p)
    if any(k in fname for k in ['wonder', 'idle', 'globe', 'acceptance']):
        print(f"{fname}: mtime={os.path.getmtime(p)}")

