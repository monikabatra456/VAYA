# scratch/inspect_alpine_image.py
import os
import glob
from PIL import Image

uploaded = r'C:/Users/lenovo/.gemini/antigravity/brain/0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d/.user_uploaded/media_1793380837565_9ea1fea0.png'
print("Uploaded image exists:", os.path.exists(uploaded))
if os.path.exists(uploaded):
    im = Image.open(uploaded)
    print("Uploaded image size:", im.size, "mode:", im.mode)

# Also check for any files with "Alpine" in workspace
matches = glob.glob('**/*alpine*', recursive=True)
print("Matches for alpine:", matches)

# Check public/wonder
wonder_files = glob.glob('public/wonder/*')
print("public/wonder files:", wonder_files)

