import numpy as np
from PIL import Image

# Load IMG-GOOD
img_good = Image.open(r"C:\Users\lenovo\.gemini\antigravity\brain\0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d\wonder_world_1920x1080_idle.png")
arr = np.array(img_good.convert("RGB"))
h, w, _ = arr.shape
print(f"IMG-GOOD size: {w}x{h}")

# The globe is centered horizontally ~ w/2, and in the middle-ish
# Let's find the approximate globe center & radius:
# In 1920x1080, center is roughly (960, 480) or let's measure bounding box
# Let's inspect center and surrounding area:
cx, cy = w // 2, 490 # estimate
# We can find the circle of the globe by scanning along horizontal line y = cy
row = arr[cy, :, :]
# Find where row deviates from cream background (~246, 241, 231)
diff = np.sqrt(np.sum((row - [246, 241, 231])**2, axis=-1))
globe_x = np.where(diff > 35)[0]
if len(globe_x) > 0:
    min_x, max_x = globe_x[0], globe_x[-1]
    cx = (min_x + max_x) // 2
    radius = (max_x - min_x) // 2
    print(f"Detected globe center: ({cx}, {cy}), radius: {radius}")

# Crop circle mask
y_idx, x_idx = np.ogrid[:h, :w]
dist_from_center = np.sqrt((x_idx - cx)**2 + (y_idx - cy)**2)
mask = dist_from_center <= (radius * 0.95) # 95% to avoid rim/antialiasing edge

disc_pixels = arr[mask]
# Convert to HSV
from matplotlib import colors
hsv = colors.rgb_to_hsv(disc_pixels / 255.0)
mean_rgb = np.mean(disc_pixels, axis=0)
mean_val = np.mean(hsv[:, 2]) * 100 # brightness %
mean_sat = np.mean(hsv[:, 1]) * 100 # saturation %

print(f"IMG-GOOD Disc: Mean RGB = {mean_rgb.round(1)}, Mean Brightness(V) = {mean_val:.2f}%, Mean Saturation = {mean_sat:.2f}%")

