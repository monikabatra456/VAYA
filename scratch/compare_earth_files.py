# scratch/compare_earth_files.py
from PIL import Image
import numpy as np

files = [
    'earth.jpg',
    'earth-4k-raw.jpg',
    'earth-blue-marble.jpg',
    'public/wonder/earth.jpg',
    'public/wonder/earth-4k.webp'
]

for f in files:
    im = Image.open(f)
    arr = np.array(im)
    # Check Africa/Sahara desert (y=750, x=2200), India (y=850, x=2800), Pacific ocean (y=1000, x=500)
    sahara = arr[750, 2200][:3]
    india = arr[850, 2800][:3]
    ocean = arr[1000, 500][:3]
    mean_rgb = arr.mean(axis=(0,1))[:3]
    print(f"[{f}]:\n  Mean: {mean_rgb}\n  Sahara: {sahara}\n  India: {india}\n  Ocean: {ocean}")
