# scratch/check_sky.py
import numpy as np
from PIL import Image

im = Image.open('Alpine Lake Sunset Overlook.png')
arr = np.array(im)
alpha = arr[:, :, 3]
# For each row, calculate mean alpha
row_alpha = alpha.mean(axis=1)
for y in range(0, 765, 50):
    print(f"y={y}: mean alpha = {row_alpha[y]:.1f}")

