# scratch/compare_alpine_and_target.py
from PIL import Image
import numpy as np

img_target = Image.open('Screenshot 2026-10-30 231005.png')
img_alpine = Image.open(r"C:\Users\lenovo\.gemini\antigravity\brain\0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d\wonder_alpine_1920x1080.png")

print("Target size:", img_target.size)
print("Alpine size:", img_alpine.size)

# Crop the globe from Screenshot 2026-10-30 231005.png and measure its mean RGB and HSV
arr_target = np.array(img_target.convert('RGB'))
arr_alpine = np.array(img_alpine.convert('RGB'))

# Target center and radius
# In 1892x987, let's find the globe circle
h_t, w_t, _ = arr_target.shape
cx_t, cy_t, r_t = w_t // 2, 455, 250

y_idx, x_idx = np.ogrid[:h_t, :w_t]
dist_t = np.sqrt((x_idx - cx_t)**2 + (y_idx - cy_t)**2)
mask_t = dist_t <= (r_t * 0.90)

disc_target = arr_target[mask_t].astype(np.float32) / 255.0
mean_rgb_target = np.mean(arr_target[mask_t], axis=0)

r, g, b = disc_target[:, 0], disc_target[:, 1], disc_target[:, 2]
cmax = np.maximum(np.maximum(r, g), b)
cmin = np.minimum(np.minimum(r, g), b)
delta = cmax - cmin
v_t = cmax
s_t = np.zeros_like(v_t)
nz = cmax > 1e-6
s_t[nz] = delta[nz] / cmax[nz]

print(f"Target Globe: Mean RGB = {mean_rgb_target.round(1)}, Brightness = {np.mean(v_t)*100:.2f}%, Saturation = {np.mean(s_t)*100:.2f}%")

# Now let's measure wonder_alpine_1920x1080.png
h_a, w_a, _ = arr_alpine.shape
cx_a, cy_a, r_a = w_a // 2, 480, 255
y_a, x_a = np.ogrid[:h_a, :w_a]
dist_a = np.sqrt((x_a - cx_a)**2 + (y_a - cy_a)**2)
mask_a = dist_a <= (r_a * 0.90)

disc_alpine = arr_alpine[mask_a].astype(np.float32) / 255.0
mean_rgb_alpine = np.mean(arr_alpine[mask_a], axis=0)
r, g, b = disc_alpine[:, 0], disc_alpine[:, 1], disc_alpine[:, 2]
cmax = np.maximum(np.maximum(r, g), b)
cmin = np.minimum(np.minimum(r, g), b)
delta = cmax - cmin
v_a = cmax
s_a = np.zeros_like(v_a)
nz = cmax > 1e-6
s_a[nz] = delta[nz] / cmax[nz]

print(f"Alpine Globe: Mean RGB = {mean_rgb_alpine.round(1)}, Brightness = {np.mean(v_a)*100:.2f}%, Saturation = {np.mean(s_a)*100:.2f}%")

