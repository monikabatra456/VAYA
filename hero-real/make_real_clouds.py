"""Extract REAL cloud layers (far/mid/near) from a plane-less scene image by keying
bright, low-saturation pixels. Usage: python make_real_clouds.py scene.webp outdir [width]"""
import sys, os, cv2, numpy as np
src, out = sys.argv[1], sys.argv[2]; width = int(sys.argv[3]) if len(sys.argv) > 3 else 0
os.makedirs(out, exist_ok=True)
img = cv2.imread(src)
if width: img = cv2.resize(img, (width, int(img.shape[0]*width/img.shape[1])), interpolation=cv2.INTER_AREA)
H, W = img.shape[:2]
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV).astype(np.float32)
lum = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32); sat = hsv[..., 1]/255.; hue = hsv[..., 0]
ss = lambda x, a, b: (lambda t: t*t*(3-2*t))(np.clip((x-a)/(b-a), 0, 1))
sig = lambda v: max(1, int(v*W/2400))
key = ss(lum, 165, 232)*(1-ss(sat, 0.14, 0.34))
lake = cv2.GaussianBlur(((hue > 88)&(hue < 125)&(sat > 0.12)).astype(np.float32), (0, 0), sig(6))
key *= (1-np.clip(lake*1.6, 0, 1))
yy = np.arange(H)[:, None]/H
band = lambda y0, y1, f=0.04: (ss(yy, y0-f, y0+f)*(1-ss(yy, y1-f, y1+f)))*np.ones((1, W), np.float32)
sky = ss(yy, 0.40, 0.52)*np.ones((1, W), np.float32)
snow = np.zeros((H, W), np.uint8)   # keep snow caps (top-left) out of the key
cv2.fillPoly(snow, [np.array([(.02*W,.29*H),(.39*W,.29*H),(.52*W,.45*H),(.23*W,.45*H),(.02*W,.42*H)], np.int32)], 255)
snow = 1-cv2.GaussianBlur(snow, (0, 0), sig(18)).astype(np.float32)/255.
for n, b in {'cloud-far': band(.40,.56), 'cloud-mid': band(.50,.74), 'cloud-near': band(.66,1.01)}.items():
    a = cv2.GaussianBlur(np.clip(key*b*sky*snow*1.1, 0, 1), (0, 0), 2.2*W/2400)
    cv2.imwrite(f'{out}/{n}.webp', np.dstack([img, (a*255).astype(np.uint8)]), [cv2.IMWRITE_WEBP_QUALITY, 88])
cv2.imwrite(f'{out}/base.webp', img, [cv2.IMWRITE_WEBP_QUALITY, 88])
