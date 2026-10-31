# scratch/verify_target_match.py
import asyncio
import numpy as np
from PIL import Image
from playwright.async_api import async_playwright

def get_disc_metrics(arr, cx, cy, radius):
    h, w, _ = arr.shape
    y_idx, x_idx = np.ogrid[:h, :w]
    dist = np.sqrt((x_idx - cx)**2 + (y_idx - cy)**2)
    mask = dist <= (radius * 0.90)
    
    disc_pixels = arr[mask].astype(np.float32) / 255.0
    mean_rgb = np.mean(arr[mask], axis=0)
    
    r, g, b = disc_pixels[:, 0], disc_pixels[:, 1], disc_pixels[:, 2]
    cmax = np.maximum(np.maximum(r, g), b)
    cmin = np.minimum(np.minimum(r, g), b)
    delta = cmax - cmin
    
    v = cmax
    s = np.zeros_like(v)
    nz = cmax > 1e-6
    s[nz] = delta[nz] / cmax[nz]
    
    return {
        'mean_rgb': mean_rgb,
        'mean_brightness': np.mean(v) * 100.0,
        'mean_sat': np.mean(s) * 100.0
    }

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True)
        page = await b.new_page(viewport={"width": 1920, "height": 1080})
        await page.goto("http://localhost:3000", wait_until="networkidle")
        await page.wait_for_timeout(1500)
        
        # Scroll to #wonder
        await page.evaluate("document.getElementById('wonder').scrollIntoView({ behavior: 'instant' })")
        await page.wait_for_timeout(1500)
        
        # Click hub pin to reveal cards & center India
        hub_btn = page.locator('.ww-hub-pin').first
        if await hub_btn.count() > 0:
            await hub_btn.click(force=True)
            print("Clicked hub pin to reveal cards & center India...")
            await page.wait_for_timeout(2500)
            
        shot_path = "C:/Users/lenovo/.gemini/antigravity/brain/0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d/globe_target_restored_1920x1080.png"
        await page.screenshot(path=shot_path)
        print(f"Saved screenshot: {shot_path}")
        await page.close()
        await b.close()

    # Compare with IMG-TARGET
    img_target = Image.open('Screenshot 2026-10-30 231005.png').convert('RGB')
    arr_target = np.array(img_target)
    
    img_now = Image.open(shot_path).convert('RGB')
    arr_now = np.array(img_now)
    
    # Target disc
    h_t, w_t, _ = arr_target.shape
    metrics_target = get_disc_metrics(arr_target, w_t // 2, 455, 250)
    
    # Restored disc
    h_n, w_n, _ = arr_now.shape
    metrics_now = get_disc_metrics(arr_now, w_n // 2, 480, 255)
    
    print("\n" + "="*50)
    print("=== QUANTITATIVE ACCEPTANCE COMPARISON ===")
    print("="*50)
    print(f"IMG-TARGET: Mean RGB = {metrics_target['mean_rgb'].round(1)}, Brightness = {metrics_target['mean_brightness']:.2f}%, Saturation = {metrics_target['mean_sat']:.2f}%")
    print(f"RESTORED:   Mean RGB = {metrics_now['mean_rgb'].round(1)}, Brightness = {metrics_now['mean_brightness']:.2f}%, Saturation = {metrics_now['mean_sat']:.2f}%")
    
    bright_diff = abs(metrics_now['mean_brightness'] - metrics_target['mean_brightness'])
    sat_diff = abs(metrics_now['mean_sat'] - metrics_target['mean_sat'])
    
    print(f"\nBrightness Diff: {bright_diff:.2f}% (Target: <= 3%) -> {'PASS' if bright_diff <= 3.0 else 'FAIL'}")
    print(f"Saturation Diff: {sat_diff:.2f}% (Target: <= 3%) -> {'PASS' if sat_diff <= 3.0 else 'FAIL'}")

if __name__ == '__main__':
    asyncio.run(main())

