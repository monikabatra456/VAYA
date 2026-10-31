# scratch/list_earth_images.py
import os
import glob
from PIL import Image

for pattern in ['*earth*', '*globe*', '*wonder*', 'public/wonder/*']:
    for f in glob.glob(pattern):
        if f.lower().endswith(('.jpg', '.png', '.webp')):
            try:
                im = Image.open(f)
                print(f"{f}: size={im.size}, mode={im.mode}")
            except Exception as e:
                print(f"{f}: {e}")
