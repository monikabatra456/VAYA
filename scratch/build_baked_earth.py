# scratch/build_baked_earth.py
import os
import numpy as np
from PIL import Image, ImageFilter, ImageEnhance

def process():
    print("Loading 8K daymap and cloud maps...")
    daymap_img = Image.open('scratch/downloads/daymap_8k.jpg')
    clouds_img = Image.open('scratch/downloads/clouds_8k.jpg')
    
    # Target 4K resolution (4096 x 2048)
    W, H = 4096, 2048
    print(f"Resizing to {W}x{H}...")
    daymap = daymap_img.resize((W, H), Image.Resampling.LANCZOS)
    clouds = clouds_img.resize((W, H), Image.Resampling.LANCZOS).convert('L')
    
    # ── 1. Color Grade Earth Surface to match IMG-REF ─────────────────────────
    # Convert daymap to float array [0, 1]
    earth_arr = np.array(daymap, dtype=np.float32) / 255.0
    r, g, b = earth_arr[:, :, 0], earth_arr[:, :, 1], earth_arr[:, :, 2]
    
    # Detect water vs land:
    # Ocean in NASA daymap is dark and has b > r and b > g * 0.95
    # Let's also load water mask if available to refine
    water_mask_img = Image.open('public/wonder/earth-water.png').resize((W, H), Image.Resampling.BILINEAR).convert('L')
    water_arr = np.array(water_mask_img, dtype=np.float32) / 255.0
    # In earth-water.png, water is white (1.0) and land is black (0.0)
    is_water = water_arr > 0.4
    
    # Calculate coastal distance for shallows / turquoise shelf:
    # Find coastline by blurring water mask and detecting gradients
    water_blur = water_mask_img.filter(ImageFilter.GaussianBlur(radius=7))
    water_blur_arr = np.array(water_blur, dtype=np.float32) / 255.0
    shallow_factor = np.clip((1.0 - np.abs(water_blur_arr - 0.5) * 2.2), 0.0, 1.0) * is_water
    
    # Vivid ocean grading:
    # Target deep ocean: vivid deep blue [0.06, 0.22, 0.44] -> [0.08, 0.28, 0.52]
    # Target shallow coastal turquoise: [0.12, 0.52, 0.62]
    deep_ocean_r = r * 0.45 + 0.04
    deep_ocean_g = g * 0.85 + 0.12
    deep_ocean_b = np.clip(b * 1.55 + 0.22, 0.0, 0.95)
    
    coastal_turq_r = 0.10
    coastal_turq_g = 0.46
    coastal_turq_b = 0.56
    
    ocean_r = deep_ocean_r * (1.0 - shallow_factor * 0.65) + coastal_turq_r * (shallow_factor * 0.65)
    ocean_g = deep_ocean_g * (1.0 - shallow_factor * 0.75) + coastal_turq_g * (shallow_factor * 0.75)
    ocean_b = deep_ocean_b * (1.0 - shallow_factor * 0.55) + coastal_turq_b * (shallow_factor * 0.55)
    
    # Land grading:
    # Enhance warm tan deserts (Sahara, Arabia, Australia) and rich greens
    land_brightness = 1.22
    land_r = np.clip(r * land_brightness * 1.15, 0.0, 1.0)
    land_g = np.clip(g * land_brightness * 1.08, 0.0, 1.0)
    land_b = np.clip(b * land_brightness * 0.92, 0.0, 1.0)
    
    # Desert boost (where r > 0.35 and r > g):
    is_desert = (r > 0.32) & (r >= g * 0.9) & (~is_water)
    land_r[is_desert] = np.clip(land_r[is_desert] * 1.14 + 0.04, 0.0, 1.0)
    land_g[is_desert] = np.clip(land_g[is_desert] * 1.04 + 0.02, 0.0, 1.0)
    land_b[is_desert] = np.clip(land_b[is_desert] * 0.88, 0.0, 1.0)
    
    # Vegetation boost (where g > r * 0.95 and not desert and not water):
    is_vegetation = (g > r * 0.9) & (~is_desert) & (~is_water)
    land_g[is_vegetation] = np.clip(land_g[is_vegetation] * 1.18, 0.0, 1.0)
    
    # Combine water and land
    graded_earth = np.zeros_like(earth_arr)
    for c, (o_c, l_c) in enumerate([(ocean_r, land_r), (ocean_g, land_g), (ocean_b, land_b)]):
        graded_earth[:, :, c] = np.where(is_water, o_c, l_c)
        
    # Global vibrance and brightness boost for vivid, non-dull appearance
    graded_earth = np.clip(graded_earth * 1.08, 0.0, 1.0)
    
    # ── 2. Cloud Alpha & Soft Shading ─────────────────────────────────────────
    cloud_gray = np.array(clouds, dtype=np.float32) / 255.0
    # Real variation: thin wisps ~0.35-0.6, dense ~0.9
    cloud_alpha = np.power(cloud_gray, 0.92) * 1.05
    cloud_alpha = np.clip(cloud_alpha, 0.0, 0.95)
    
    # ── 3. Bake Cloud Shadow ──────────────────────────────────────────────────
    # Sun light comes from upper-right, so shadow is cast to lower-left:
    # Offset: ~8px left (-8px X) and ~8px down (+8px Y)
    cloud_alpha_img = Image.fromarray((cloud_alpha * 255).astype(np.uint8), mode='L')
    
    # Shift array by -8 in X (roll with wrap around equirectangular 360) and +8 in Y
    shadow_raw = np.roll(cloud_alpha, shift=(-8, 8), axis=(1, 0))
    # Clip poles so shadow doesn't wrap over poles
    shadow_raw[:10, :] = 0
    shadow_raw[-10:, :] = 0
    shadow_img = Image.fromarray((shadow_raw * 255).astype(np.uint8), mode='L')
    shadow_blurred = shadow_img.filter(ImageFilter.GaussianBlur(radius=5))
    shadow_arr = np.array(shadow_blurred, dtype=np.float32) / 255.0
    
    # Multiply earth by (1 - 0.28 * shadow)
    # The shadow sits on ocean and land beneath the clouds
    shadow_factor = 1.0 - (0.30 * shadow_arr[:, :, np.newaxis])
    earth_with_shadow = graded_earth * shadow_factor
    
    # ── 4. Cloud Color Tinting ────────────────────────────────────────────────
    # Warm white top (#F4F7FA = [0.957, 0.969, 0.980]) with soft grey-blue underside
    # Cloud underside shading: where cloud density is medium, tint slightly cooler
    cloud_top_r, cloud_top_g, cloud_top_b = 0.96, 0.97, 0.985
    cloud_shade_r, cloud_shade_g, cloud_shade_b = 0.85, 0.89, 0.94
    
    # Density-based shading: thick centers are brightest, edges and underside soft
    cloud_color = np.zeros((H, W, 3), dtype=np.float32)
    cloud_color[:, :, 0] = cloud_top_r * cloud_gray + cloud_shade_r * (1.0 - cloud_gray)
    cloud_color[:, :, 1] = cloud_top_g * cloud_gray + cloud_shade_g * (1.0 - cloud_gray)
    cloud_color[:, :, 2] = cloud_top_b * cloud_gray + cloud_shade_b * (1.0 - cloud_gray)
    
    # ── 5. Composite Clouds onto Earth ────────────────────────────────────────
    alpha_3d = cloud_alpha[:, :, np.newaxis]
    final_arr = earth_with_shadow * (1.0 - alpha_3d) + cloud_color * alpha_3d
    final_arr = np.clip(final_arr * 255.0, 0, 255).astype(np.uint8)
    
    final_img = Image.fromarray(final_arr, mode='RGB')
    
    # ── 6. Save 4K and 2K Versions ────────────────────────────────────────────
    print("Saving 4K textures...")
    final_img.save('public/wonder/earth.jpg', quality=95, optimize=True)
    final_img.save('public/wonder/earth-4k.webp', quality=92)
    
    print("Generating 2K textures (2048x1024)...")
    img_2k = final_img.resize((2048, 1024), Image.Resampling.LANCZOS)
    img_2k.save('public/wonder/earth-2k.jpg', quality=92, optimize=True)
    img_2k.save('public/wonder/earth-2k.webp', quality=90)
    
    print("SUCCESS: Baked textures generated successfully!")

if __name__ == '__main__':
    process()
