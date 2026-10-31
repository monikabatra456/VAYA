# scratch/restore_approved_textures.py
import shutil
from PIL import Image

# 1. Root earth.jpg is the approved 4096x2048 texture from Oct 30 16:00
# 2. Root earth-2k.jpg is the approved 2048x1024 texture from Oct 30 15:59

print("Copying approved earth.jpg to public/wonder/earth.jpg...")
shutil.copyfile('earth.jpg', 'public/wonder/earth.jpg')

print("Copying approved earth-2k.jpg to public/wonder/earth-2k.jpg...")
shutil.copyfile('earth-2k.jpg', 'public/wonder/earth-2k.jpg')

print("Generating approved WebP versions...")
im_4k = Image.open('earth.jpg')
im_4k.save('public/wonder/earth-4k.webp', quality=95)

im_2k = Image.open('earth-2k.jpg')
im_2k.save('public/wonder/earth-2k.webp', quality=92)

print("SUCCESS: Approved textures restored!")
