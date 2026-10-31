# scratch/deploy_alpine.py
import shutil
from PIL import Image

src = 'Alpine Lake Sunset Overlook.png'
dest_png = 'public/wonder/Alpine Lake Sunset Overlook.png'
dest_webp = 'public/wonder/bg-landscape.webp'

# 1. Copy full resolution PNG
shutil.copyfile(src, dest_png)
print("Copied to", dest_png)

# 2. Also save as optimized WebP to bg-landscape.webp
im = Image.open(src)
im.save(dest_webp, quality=92, method=6)
print("Saved to", dest_webp)

