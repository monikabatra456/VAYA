# scratch/inspect_approved_earth.py
from PIL import Image
import numpy as np

im = Image.open('earth.jpg')
arr = np.array(im)
print("Approved earth.jpg size:", im.size)

# India: lat 20, lon 77 -> y ~ 796, x ~ 2924
# (lon + 180)/360 * 4096 = 257/360 * 4096 = 2924
# (90 - lat)/180 * 2048 = 70/180 * 2048 = 796
india = arr[796, 2924]
print("India (lat 20, lon 77):", india)

# Europe (lat 50, lon 10): (40/180)*2048 = 455, (190/360)*4096 = 2162
europe = arr[455, 2162]
print("Europe (lat 50, lon 10):", europe)

# Sahara (lat 25, lon 15): (65/180)*2048 = 739, (195/360)*4096 = 2218
sahara = arr[739, 2218]
print("Sahara (lat 25, lon 15):", sahara)

# Amazon (lat -3, lon -60): (93/180)*2048 = 1058, (120/360)*4096 = 1365
amazon = arr[1058, 1365]
print("Amazon:", amazon)

# Indian Ocean (lat -10, lon 80): (100/180)*2048 = 1138, (260/360)*4096 = 2958
ocean = arr[1138, 2958]
print("Indian Ocean:", ocean)
