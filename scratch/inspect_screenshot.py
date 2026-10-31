# scratch/inspect_screenshot.py
import os, time
from PIL import Image

p = r"c:\Users\lenovo\Downloads\vaya 3.0\Screenshot 2026-10-30 231005.png"
st = os.stat(p)
print(f"File size: {st.st_size} bytes")
print(f"Modified: {time.ctime(st.st_mtime)}")

im = Image.open(p)
print(f"Dimensions: {im.size}, Mode: {im.mode}")

