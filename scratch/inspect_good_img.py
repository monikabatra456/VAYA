# scratch/inspect_good_img.py
from PIL import Image
import numpy as np

good_path = r'C:/Users/lenovo/.gemini/antigravity/brain/0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d/wonder_world_1920x1080_idle.png'
now_path = r'C:/Users/lenovo/.gemini/antigravity/brain/0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d/acceptance_1920x1080.png'

im_good = Image.open(good_path)
im_now = Image.open(now_path)

arr_good = np.array(im_good)
arr_now = np.array(im_now)

# Let's crop around the globe in both:
# Center of 1920x1080 is around (x=960, y=578)
crop_good = arr_good[400:800, 760:1160]
crop_now = arr_now[400:800, 760:1160]

print("Good crop mean RGB:", crop_good.mean(axis=(0,1)))
print("Now crop mean RGB:", crop_now.mean(axis=(0,1)))

# India color in good vs now: (y ~ 578, x ~ 960)
print("Good India area:", arr_good[575:585, 955:965].mean(axis=(0,1)))
print("Now India area:", arr_now[575:585, 955:965].mean(axis=(0,1)))

