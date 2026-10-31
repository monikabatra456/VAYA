# scratch/check_alpha.py
import numpy as np
from PIL import Image

im = Image.open('Alpine Lake Sunset Overlook.png')
arr = np.array(im)
alpha = arr[:, :, 3]
print("Alpha min:", alpha.min(), "max:", alpha.max())
print("Top row alpha (y=0):", alpha[0, :].mean())
print("Bottom row alpha (y=-1):", alpha[-1, :].mean())
# Non-zero alpha bounding box
bbox = im.getbbox()
print("Bounding box:", bbox)

