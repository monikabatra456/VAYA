import os
import cv2
from PIL import Image

def inspect_media(path):
    print(f"\n--- Inspecting {path} ---")
    if not os.path.exists(path):
        print("Does not exist!")
        return
    size = os.path.getsize(path)
    print(f"Size: {size:,} bytes")
    if path.endswith(('.mp4', '.webm')):
        cap = cv2.VideoCapture(path)
        w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        print(f"Video: {w}x{h}, fps={fps}, frames={count}")
        ret, frame = cap.read()
        if ret:
            # check corners
            print(f"Corner (0,0) BGR: {frame[0,0]}")
            print(f"Corner (0,-1) BGR: {frame[0,-1]}")
            cv2.imwrite(r"C:\Users\lenovo\.gemini\antigravity\brain\0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d\frame0_" + os.path.basename(path) + ".png", frame)
        cap.release()
    elif path.endswith('.webp'):
        im = Image.open(path)
        print(f"Image mode: {im.mode}, size: {im.size}, is_animated: {getattr(im, 'is_animated', False)}")
        if getattr(im, 'is_animated', False):
            print(f"Number of frames: {im.n_frames}")
        # check corners
        rgba = im.convert("RGBA")
        print("Corner (0,0) RGBA:", rgba.getpixel((0,0)))
        print("Corner (10,10) RGBA:", rgba.getpixel((10,10)))
        print("Center RGBA:", rgba.getpixel((im.width//2, im.height//2)))
        rgba.save(r"C:\Users\lenovo\.gemini\antigravity\brain\0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d\frame0_" + os.path.basename(path) + ".png")

inspect_media(r"c:\Users\lenovo\Downloads\vaya 3.0\public\videos\overcrowding.mp4")
inspect_media(r"c:\Users\lenovo\Downloads\vaya 3.0\public\videos\overcrowding.webp")
inspect_media(r"c:\Users\lenovo\Downloads\vaya 3.0\public\assets\challenges\overcrowding.webp")
inspect_media(r"c:\Users\lenovo\Downloads\vaya 3.0\public\videos\local-guide.mp4")
inspect_media(r"c:\Users\lenovo\Downloads\vaya 3.0\public\videos\local-guide.webm")

