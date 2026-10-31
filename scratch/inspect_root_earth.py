# scratch/inspect_root_earth.py
from PIL import Image
import numpy as np

im = Image.open('earth.jpg')
print("Root earth.jpg size:", im.size, "format:", im.format)
# Let's see if there are clouds in it
arr = np.array(im)
# Pacific ocean area with clouds: look at white pixels (R > 200, G > 200, B > 200)
clouds = (arr[:, :, 0] > 200) & (arr[:, :, 1] > 200) & (arr[:, :, 2] > 200)
print("Percentage of cloud-like pixels (RGB > 200):", clouds.mean() * 100, "%")
