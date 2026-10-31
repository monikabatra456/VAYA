# scratch/check_dates.py
import os, time

for f in ['earth.jpg', 'earth-2k.jpg', 'earth-4k-raw.jpg', 'public/wonder/earth.jpg', 'public/wonder/earth-4k.webp']:
    if os.path.exists(f):
        mtime = time.ctime(os.path.getmtime(f))
        print(f"{f}: modified {mtime}, size={os.path.getsize(f)}")
