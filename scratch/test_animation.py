import numpy as np
from PIL import Image
import os

# Load thumb and hand-back
thumb_img = Image.open('public/meet/thumb.png').convert('RGBA')
hand_back_img = Image.open('public/meet/hand-back.png').convert('RGBA')

# Pivot point: (505, 590) in image coordinates
pivot_x, pivot_y = 505, 590

def get_frame(rotate_deg=0.0, trans_x=0.0, trans_y=0.0, scale=1.0):
    # PIL affine transform or rotate around center:
    # To rotate around (pivot_x, pivot_y), scale by 'scale', and translate by (trans_x, trans_y):
    # Transformation matrix for PIL:
    # [a, b, c]
    # [d, e, f]
    # maps output (x, y) to input (x_in, y_in):
    # Forward:
    # 1. translate pivot to origin: (x - pivot_x, y - pivot_y)
    # 2. scale: ( (x - pivot_x)*scale, (y - pivot_y)*scale )
    # 3. rotate by theta:
    # 4. translate back and add translation: + (pivot_x + trans_x, pivot_y + trans_y)
    # Inverse for PIL:
    rad = np.radians(rotate_deg)
    cos_a = np.cos(rad)
    sin_a = np.sin(rad)
    
    # Forward 2D affine matrix:
    # [ cos*s  -sin*s   tx ]
    # [ sin*s   cos*s   ty ]
    # where tx = pivot_x + trans_x - (cos*s * pivot_x - sin*s * pivot_y)
    #       ty = pivot_y + trans_y - (sin*s * pivot_x + cos*s * pivot_y)
    a = cos_a * scale
    b = -sin_a * scale
    tx = pivot_x + trans_x - (a * pivot_x + b * pivot_y)
    
    d = sin_a * scale
    e = cos_a * scale
    ty = pivot_y + trans_y - (d * pivot_x + e * pivot_y)
    
    # Invert matrix for PIL:
    det = a * e - b * d
    inv_a = e / det
    inv_b = -b / det
    inv_c = (b * ty - e * tx) / det
    inv_d = -d / det
    inv_e = a / det
    inv_f = (d * tx - a * ty) / det
    
    transformed_thumb = thumb_img.transform(
        thumb_img.size,
        Image.AFFINE,
        (inv_a, inv_b, inv_c, inv_d, inv_e, inv_f),
        resample=Image.BICUBIC
    )
    
    # Composite over hand_back
    frame = hand_back_img.copy()
    frame.alpha_composite(transformed_thumb)
    return frame, transformed_thumb

# Generate test frames:
# Frame 1: At rest (0 deg)
frame_rest, _ = get_frame(0.0, 0.0, 0.0, 1.0)
frame_rest.save('scratch/verify_rest.png')

# Frame 2: Mid-reach (-17 deg, -3px, -2px, 1.02)
frame_mid, _ = get_frame(-17.0, -3.0, -2.0, 1.02)
frame_mid.save('scratch/verify_mid_reach.png')

# Frame 3: Contact / press (-34 deg, -6px, -2px, 0.97)
frame_contact, _ = get_frame(-34.0, -6.0, -2.0, 0.97)
frame_contact.save('scratch/verify_contact.png')

# Frame 4: Return (-10 deg, -2px, -1px, 1.0)
frame_return, _ = get_frame(-10.0, -2.0, -1.0, 1.0)
frame_return.save('scratch/verify_return.png')

print("Saved scratch/verify_rest.png, scratch/verify_mid_reach.png, scratch/verify_contact.png, scratch/verify_return.png")

# Also generate 3x zoom crops:
# 1. 3x zoom of thumb joint at rest and contact
# Joint is around (505, 590), crop (450, 540, 560, 650)
joint_crop_rest = frame_rest.crop((450, 540, 560, 650)).resize(((560-450)*3, (650-540)*3), Image.NEAREST)
joint_crop_rest.save('scratch/zoom3x_joint_rest.png')

joint_crop_contact = frame_contact.crop((450, 540, 560, 650)).resize(((560-450)*3, (650-540)*3), Image.NEAREST)
joint_crop_contact.save('scratch/zoom3x_joint_contact.png')

# 2. 3x zoom of right bezel at rest and contact
# Bezel is at x=470..500, y=280..450
bezel_crop_rest = frame_rest.crop((465, 275, 515, 380)).resize(((515-465)*3, (380-275)*3), Image.NEAREST)
bezel_crop_rest.save('scratch/zoom3x_bezel_rest.png')

bezel_crop_contact = frame_contact.crop((465, 275, 515, 380)).resize(((515-465)*3, (380-275)*3), Image.NEAREST)
bezel_crop_contact.save('scratch/zoom3x_bezel_contact.png')

# 3. 3x zoom of hand_back alone at the repaired bezel:
hb_bezel_zoom = hand_back_img.crop((465, 275, 515, 380)).resize(((515-465)*3, (380-275)*3), Image.NEAREST)
hb_bezel_zoom.save('scratch/zoom3x_hand_back_bezel.png')

print("Saved all 3x zoom verification crops!")
