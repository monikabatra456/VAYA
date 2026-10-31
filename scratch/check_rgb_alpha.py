# scratch/check_rgb_alpha.py
from PIL import Image
import numpy as np

im = Image.open('Alpine Lake Sunset Overlook.png')
arr = np.array(im)
print("Top row pixel (y=0, x=500):", arr[0, 500])
print("Middle sky pixel (y=200, x=500):", arr[200, 500])
print("Mountain peak pixel (y=450, x=500):", arr[450, 500])
print("Lake pixel (y=600, x=500):", arr[600, 500])

# Also check uploaded image
im_up = Image.open(r'C:/Users/lenovo/.gemini/antigravity/brain/0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d/.user_uploaded/media_1793380837565_9ea1fea0.png')
arr_up = np.array(im_up)
print("Uploaded top row pixel (y=0, x=250):", arr_up[0, 250])

