# scratch/compare_root_textures.py
import numpy as np
from PIL import Image

for name in ['earth.jpg', 'earth-blue-marble.jpg', 'earth-4k-raw.jpg']:
    img = Image.open(name).convert('RGB')
    arr = np.array(img)
    print(f"{name}: shape={arr.shape}, mean RGB={np.mean(arr, axis=(0,1)).round(1)}")

