# scratch/check_exact_diff.py
from PIL import Image
import numpy as np

im_full = Image.open('Alpine Lake Sunset Overlook.png')
im_up = Image.open(r'C:/Users/lenovo/.gemini/antigravity/brain/0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d/.user_uploaded/media_1793380837565_9ea1fea0.png')

print("im_full size:", im_full.size, "im_up size:", im_up.size)
# Resize im_full to im_up size and compare
im_full_resized = im_full.resize(im_up.size, Image.Resampling.LANCZOS)
diff = np.abs(np.array(im_full_resized, dtype=np.float32) - np.array(im_up, dtype=np.float32))
print("Max diff:", diff.max(), "Mean diff:", diff.mean())

