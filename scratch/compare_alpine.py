# scratch/compare_alpine.py
from PIL import Image

p1 = 'Alpine Lake Sunset Overlook.png'
im1 = Image.open(p1)
print(f"Alpine Lake Sunset Overlook.png: size={im1.size}, mode={im1.mode}")

uploaded = r'C:/Users/lenovo/.gemini/antigravity/brain/0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d/.user_uploaded/media_1793380837565_9ea1fea0.png'
im_up = Image.open(uploaded)
print(f"Uploaded: size={im_up.size}, mode={im_up.mode}")

old_bg = 'public/wonder/bg-landscape.webp'
im_old = Image.open(old_bg)
print(f"Old bg-landscape.webp: size={im_old.size}, mode={im_old.mode}")

