# scratch/inspect_blue_marble.py
from PIL import Image
import numpy as np

for name in ['earth-blue-marble.jpg', 'earth-4k-raw.jpg']:
    im = Image.open(name)
    arr = np.array(im)
    print(f"=== {name} ===")
    print("Size:", im.size)
    print("Mean RGB:", arr.mean(axis=(0,1)))
    # Sample Pacific (y=1024, x=1000)
    print("Pacific (1024, 1000):", arr[1024, 1000])
    # Sample Atlantic (y=1024, x=3000)
    print("Atlantic (1024, 3000):", arr[1024, 3000])
    # Sample India (y=800, x=2900)
    print("India (800, 2900):", arr[800, 2900])
    # Sample Sahara (y=750, x=2200)
    print("Sahara (750, 2200):", arr[750, 2200])

