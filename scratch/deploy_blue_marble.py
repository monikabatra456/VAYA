# scratch/deploy_blue_marble.py
from PIL import Image

print("Loading earth-blue-marble.jpg...")
bm = Image.open('earth-blue-marble.jpg')

# 4K JPG & WebP
print("Saving 4K textures...")
bm.save('public/wonder/earth.jpg', quality=95)
bm.save('public/wonder/earth-4k.webp', quality=95)

# 2K JPG & WebP
print("Saving 2K textures...")
bm_2k = bm.resize((2048, 1024), Image.Resampling.LANCZOS)
bm_2k.save('public/wonder/earth-2k.jpg', quality=92)
bm_2k.save('public/wonder/earth-2k.webp', quality=92)

print("SUCCESS: authentic earth daymap textures deployed!")

