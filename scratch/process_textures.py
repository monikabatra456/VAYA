# scratch/process_textures.py
import urllib.request
import os
from PIL import Image, ImageEnhance
import numpy as np

os.makedirs('scratch/downloads', exist_ok=True)
os.makedirs('public/wonder', exist_ok=True)

def download(url, dest):
    if not os.path.exists(dest) or os.path.getsize(dest) < 100000:
        print(f"Downloading {url} to {dest}...")
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        with urllib.request.urlopen(req) as resp, open(dest, 'wb') as out:
            out.write(resp.read())
        print(f"Downloaded {dest} ({os.path.getsize(dest)} bytes)")
    else:
        print(f"Already downloaded {dest}")

# 1. Download SolarSystemScope 8k Clouds
clouds_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Solarsystemscope_texture_8k_earth_clouds.jpg'
clouds_raw = 'scratch/downloads/clouds_8k.jpg'
download(clouds_url, clouds_raw)

# 2. Download SolarSystemScope 8k Daymap
daymap_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Solarsystemscope_texture_8k_earth_daymap.jpg'
daymap_raw = 'scratch/downloads/daymap_8k.jpg'
download(daymap_url, daymap_raw)

print("Processing textures...")

# Process Clouds:
# Input is 8192x4096 greyscale image where white = clouds, black = sky.
img_c = Image.open(clouds_raw).convert('L')
print("Clouds raw size:", img_c.size)

# 4K Cloud Texture: 4096x2048
img_c_4k = img_c.resize((4096, 2048), Image.Resampling.LANCZOS)
arr_c_4k = np.array(img_c_4k)

# Create RGBA where RGB is 255, 255, 255 and Alpha is cloud density
rgba_4k = np.zeros((2048, 4096, 4), dtype=np.uint8)
rgba_4k[:, :, 0] = 255
rgba_4k[:, :, 1] = 255
rgba_4k[:, :, 2] = 255
rgba_4k[:, :, 3] = arr_c_4k

img_cloud_rgba = Image.fromarray(rgba_4k, 'RGBA')
img_cloud_rgba.save('public/wonder/earth-clouds.webp', 'WEBP', quality=90, method=6)
print("Saved public/wonder/earth-clouds.webp:", os.path.getsize('public/wonder/earth-clouds.webp'), "bytes")

# Also save standalone greyscale alpha map for standard material alphaMap
img_c_4k.save('public/wonder/earth-clouds-alpha.webp', 'WEBP', quality=85)
print("Saved public/wonder/earth-clouds-alpha.webp:", os.path.getsize('public/wonder/earth-clouds-alpha.webp'), "bytes")

# Create low-res placeholder 1024x512
img_c_low = img_c.resize((1024, 512), Image.Resampling.BILINEAR)
img_c_low.save('public/wonder/earth-clouds-low.webp', 'WEBP', quality=80)
print("Saved low-res placeholder public/wonder/earth-clouds-low.webp")

# Create soft cloud shadow map for earth surface (dark translucent cloud shadow)
shadow_4k = np.zeros((2048, 4096, 4), dtype=np.uint8)
shadow_4k[:, :, 0] = 10
shadow_4k[:, :, 1] = 15
shadow_4k[:, :, 2] = 25
shadow_4k[:, :, 3] = (arr_c_4k * 0.22).astype(np.uint8)
img_shadow_rgba = Image.fromarray(shadow_4k, 'RGBA')
img_shadow_rgba.save('public/wonder/earth-clouds-shadow.webp', 'WEBP', quality=85)
print("Saved cloud shadow map public/wonder/earth-clouds-shadow.webp")

# Process Earth Daymap:
# Create 4K Earth map (4096x2048) with realistic vibrant NASA Blue Marble style
img_d = Image.open(daymap_raw).convert('RGB')
print("Daymap raw size:", img_d.size)
img_d_4k = img_d.resize((4096, 2048), Image.Resampling.LANCZOS)

# Enhance slight contrast and saturation for realistic vivid earth
enhancer_s = ImageEnhance.Color(img_d_4k)
img_d_4k_enhanced = enhancer_s.enhance(1.08)
enhancer_c = ImageEnhance.Contrast(img_d_4k_enhanced)
img_d_4k_final = enhancer_c.enhance(1.04)

img_d_4k_final.save('public/wonder/earth-4k.webp', 'WEBP', quality=92, method=6)
img_d_4k_final.save('public/wonder/earth.jpg', 'JPEG', quality=92)
print("Saved public/wonder/earth-4k.webp:", os.path.getsize('public/wonder/earth-4k.webp'), "bytes")
print("Saved public/wonder/earth.jpg:", os.path.getsize('public/wonder/earth.jpg'), "bytes")

print("All textures processed successfully!")

