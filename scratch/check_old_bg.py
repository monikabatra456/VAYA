# scratch/check_old_bg.py
import numpy as np
from PIL import Image

im = Image.open('public/wonder/bg-landscape.webp')
arr = np.array(im)
print("Old bg size:", im.size)
alpha = arr[:, :, 3]
row_alpha = alpha.mean(axis=1)
for y in range(0, im.height, 30):
    print(f"y={y}: mean alpha = {row_alpha[y]:.1f}")

