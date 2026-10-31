import numpy as np
from PIL import Image, ImageFilter, ImageDraw
import os

# 1. Load original image
img_orig = Image.open('public/meet/hand-phone.png').convert('RGBA')
orig_arr = np.array(img_orig)
h, w, _ = orig_arr.shape

# 2. Polygon for thumb
# Fingertip at (513, 281).
# Inner cut line follows x=488 from y=291 down to y=640 in palm.
# Outer boundary encompasses thumb and extends out into transparent air.
mask_img = Image.new('L', (w, h), 0)
draw = ImageDraw.Draw(mask_img)

poly = [
    # Top tip
    (513, 280),
    (535, 280),
    # Outer side (transparent air)
    (560, 300),
    (600, 350),
    (650, 420),
    (680, 500),
    (720, 600),
    (720, 640),
    # Base in palm at y=640
    (488, 640),
    # Inner edge along bezel seam
    (488, 600),
    (488, 560),
    (488, 450),
    (488, 350),
    (488, 292),
    # Tip left curve
    (491, 290),
    (495, 287),
    (500, 284),
    (506, 282),
    (510, 280.5)
]

draw.polygon(poly, fill=255)

# Feather mask 2px
mask_feathered = mask_img.filter(ImageFilter.GaussianBlur(radius=0.9))
mask_f = np.array(mask_feathered, dtype=np.float32) / 255.0

orig_alpha = orig_arr[:, :, 3].astype(np.float32) / 255.0

# 3. Create thumb.png
thumb_arr = orig_arr.copy()
thumb_a = (orig_alpha * mask_f * 255.0).clip(0, 255).astype(np.uint8)
thumb_arr[:, :, 3] = thumb_a
thumb_arr[thumb_a == 0] = [0, 0, 0, 0]

Image.fromarray(thumb_arr).save('public/meet/thumb.png')
print("Created public/meet/thumb.png")

# 4. Create hand-back.png
hand_back_arr = orig_arr.copy()

y_indices = np.arange(h)[:, None]
# For y < 600, remove thumb
# At y >= 600, keep palm overlap area completely
palm_ramp = np.clip((600 - y_indices) / 2.0, 0.0, 1.0)
remove_weight = mask_f * palm_ramp

hb_alpha = (orig_alpha * (1.0 - remove_weight) * 255.0).clip(0, 255).astype(np.uint8)
hand_back_arr[:, :, 3] = hb_alpha

# 5. REPAIR THE RIGHT BEZEL in hand-back.png (y 290-596)
# Clean bezel strip from y=268..289, x=483..492
clean_rim = orig_arr[268:289, 483:493].copy()
strip_len = clean_rim.shape[0]

for y in range(290, 597):
    src_idx = (y - 290) % strip_len
    # Blend 2px at top seam (y=290..292)
    if y <= 292:
        t = (y - 289) / 4.0
        rim_pix = (1 - t) * orig_arr[y, 483:493] + t * clean_rim[src_idx]
    # Blend 2px at bottom seam (y=594..596)
    elif y >= 594:
        t = (597 - y) / 4.0
        rim_pix = t * clean_rim[src_idx] + (1 - t) * hand_back_arr[y, 483:493]
    else:
        rim_pix = clean_rim[src_idx]
    
    hand_back_arr[y, 483:493] = rim_pix.astype(np.uint8)

# Pixels outside phone rim (x >= 493) are transparent for y=281..600
hand_back_arr[281:600, 493:, 3] = 0
hand_back_arr[hand_back_arr[:, :, 3] == 0] = [0, 0, 0, 0]

Image.fromarray(hand_back_arr).save('public/meet/hand-back.png')
print("Created public/meet/hand-back.png")

# 6. Composite at rest verification
thumb_f = thumb_arr.astype(np.float32) / 255.0
hand_f = hand_back_arr.astype(np.float32) / 255.0

t_a = thumb_f[:, :, 3:4]
h_a = hand_f[:, :, 3:4]
out_a = t_a + h_a * (1.0 - t_a)

mask_v = (out_a > 1e-4)[:, :, 0]
out_rgb = np.zeros_like(thumb_f[:, :, :3])
out_rgb[mask_v] = (thumb_f[:, :, :3][mask_v] * t_a[mask_v] + hand_f[:, :, :3][mask_v] * h_a[mask_v] * (1.0 - t_a[mask_v])) / out_a[mask_v]

comp = np.zeros_like(orig_arr)
comp[:, :, :3] = (out_rgb * 255.0).clip(0, 255).astype(np.uint8)
comp[:, :, 3] = (out_a[:, :, 0] * 255.0).clip(0, 255).astype(np.uint8)

Image.fromarray(comp).save('scratch/composite_rest.png')

visible = orig_arr[:, :, 3] > 10
diff = np.abs(comp[visible].astype(int) - orig_arr[visible].astype(int))
print(f"Visible pixels max diff: {diff.max()}, mean diff: {diff.mean():.4f}")
pts_diff = np.where((np.abs(comp.astype(int) - orig_arr.astype(int)).max(axis=2) > 5) & visible)
print(f"Pixels with diff > 5: {len(pts_diff[0])}")
