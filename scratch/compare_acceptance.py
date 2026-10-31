# scratch/compare_acceptance.py
import numpy as np
from PIL import Image

def get_hsv_metrics(arr, cx, cy, radius):
    h, w, _ = arr.shape
    y_idx, x_idx = np.ogrid[:h, :w]
    dist = np.sqrt((x_idx - cx)**2 + (y_idx - cy)**2)
    # Sample inner 90% of globe disc to avoid rim shader and antialiasing
    mask = dist <= (radius * 0.90)
    
    disc_pixels = arr[mask].astype(np.float32) / 255.0
    
    # Calculate RGB mean
    mean_rgb = np.mean(arr[mask], axis=0)
    
    # Calculate HSV manually without matplotlib
    r, g, b = disc_pixels[:, 0], disc_pixels[:, 1], disc_pixels[:, 2]
    cmax = np.maximum(np.maximum(r, g), b)
    cmin = np.minimum(np.minimum(r, g), b)
    delta = cmax - cmin
    
    # Value (Brightness)
    v = cmax
    
    # Saturation
    s = np.zeros_like(v)
    nonzero = cmax > 1e-6
    s[nonzero] = delta[nonzero] / cmax[nonzero]
    
    return {
        'mean_rgb': mean_rgb,
        'mean_brightness': np.mean(v) * 100.0,
        'mean_sat': np.mean(s) * 100.0
    }

# 1. IMG-GOOD
img_good = Image.open(r"C:\Users\lenovo\.gemini\antigravity\brain\0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d\wonder_world_1920x1080_idle.png").convert("RGB")
arr_good = np.array(img_good)

# 2. Acceptance Now
img_now = Image.open(r"C:\Users\lenovo\.gemini\antigravity\brain\0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d\acceptance_1920x1080.png").convert("RGB")
arr_now = np.array(img_now)

# In 1920x1080: Canvas is at center (960, 480), globe radius is approximately 255px
cx, cy, r = 960, 480, 255

metrics_good = get_hsv_metrics(arr_good, cx, cy, r)
metrics_now = get_hsv_metrics(arr_now, cx, cy, r)

print("=== GLOBE DISC METRICS (1920x1080) ===")
print(f"IMG-GOOD:  Mean RGB = {metrics_good['mean_rgb'].round(1)}, Brightness = {metrics_good['mean_brightness']:.2f}%, Saturation = {metrics_good['mean_sat']:.2f}%")
print(f"IMG-NOW:   Mean RGB = {metrics_now['mean_rgb'].round(1)}, Brightness = {metrics_now['mean_brightness']:.2f}%, Saturation = {metrics_now['mean_sat']:.2f}%")

bright_diff = abs(metrics_now['mean_brightness'] - metrics_good['mean_brightness'])
sat_diff = abs(metrics_now['mean_sat'] - metrics_good['mean_sat'])
print(f"Brightness difference: {bright_diff:.2f}% (Target: <= 5%) -> {'PASS' if bright_diff <= 5.0 else 'FAIL'}")
print(f"Saturation difference: {sat_diff:.2f}% (Target: <= 5%) -> {'PASS' if sat_diff <= 5.0 else 'FAIL'}")

# 3. BACKGROUND SKY COMPARISON (Left vs Right)
# Sample top-left sky (e.g. x=100..300, y=100..250) vs top-right sky (x=1620..1820, y=100..250)
sky_left = np.mean(arr_now[100:250, 100:300], axis=(0, 1))
sky_right = np.mean(arr_now[100:250, 1620:1820], axis=(0, 1))
print("\n=== BACKGROUND SKY LIGHT METRICS ===")
print(f"Top-Left Sky RGB:  {sky_left.round(1)}")
print(f"Top-Right Sky RGB: {sky_right.round(1)}")

left_lum = 0.299*sky_left[0] + 0.587*sky_left[1] + 0.114*sky_left[2]
right_lum = 0.299*sky_right[0] + 0.587*sky_right[1] + 0.114*sky_right[2]
diff_lum_pct = ((right_lum - left_lum) / left_lum) * 100.0
print(f"Luminance: Left={left_lum:.1f}, Right={right_lum:.1f}, Difference={diff_lum_pct:+.2f}% (Target: ~4-6% lighter/warmer)")

