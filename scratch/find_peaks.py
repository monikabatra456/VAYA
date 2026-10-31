# scratch/find_peaks.py
from PIL import Image
import numpy as np

im = Image.open('Alpine Lake Sunset Overlook.png')
arr = np.array(im)
alpha = arr[:, :, 3]

# Find non-transparent pixels
ys, xs = np.where(alpha > 10)
print(f"Min y with alpha > 10: {ys.min()}")
print(f"Row with min y: y={ys.min()}, x={xs[ys == ys.min()]}")
print(f"Height from peak to bottom: {765 - ys.min()}px")

