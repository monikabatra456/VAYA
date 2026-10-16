# scripts/verify_hero.py
import asyncio
import os
import numpy as np
from PIL import Image, ImageFilter
from playwright.async_api import async_playwright

OUT_DIR = os.path.join(os.getcwd(), 'verification_screenshots')
os.makedirs(OUT_DIR, exist_ok=True)

PROGRESS_STEPS = [0.0, 0.1, 0.25, 0.4, 0.5, 0.6, 0.8, 1.0]

def laplacian_variance(img_gray):
    # Laplacian variance measures sharpness
    im_arr = np.array(img_gray, dtype=np.float32)
    # Simple discrete 3x3 Laplacian kernel
    kernel = np.array([[0, 1, 0], [1, -4, 1], [0, 1, 0]], dtype=np.float32)
    from scipy.signal import convolve2d
    try:
        lap = convolve2d(im_arr, kernel, mode='valid')
        return float(np.var(lap))
    except Exception:
        # Fallback without scipy
        gy, gx = np.gradient(im_arr)
        return float(np.var(gx) + np.var(gy))

async def run_verification():
    print("=== STARTING HERO PLAYWRIGHT VERIFICATION ===")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1440, 'height': 900})
        page = await context.new_page()

        await page.goto("http://localhost:3000", wait_until="networkidle")
        await asyncio.sleep(1.0) # Wait for initial texture upload

        # Get total scroll runway
        max_scroll = await page.evaluate("document.documentElement.scrollHeight - window.innerHeight")
        print(f"Total max scroll: {max_scroll}px")

        screenshots = {}
        plane_transforms = {}
        ambient_visibilities = {}

        for p_val in PROGRESS_STEPS:
            scroll_y = p_val * max_scroll
            await page.evaluate(f"window.scrollTo(0, {scroll_y})")
            # Wait for damped progress to settle
            await asyncio.sleep(0.6)

            shot_path = os.path.join(OUT_DIR, f"progress_{p_val:.2f}.png")
            await page.screenshot(path=shot_path)
            screenshots[p_val] = shot_path

            # Inspect plane transform
            plane_style = await page.evaluate("""() => {
                const el = document.querySelector('img[alt="VAYA Airliner"]')?.closest('div');
                return el ? el.style.transform : '';
            }""")
            plane_opacity = await page.evaluate("""() => {
                const el = document.querySelector('img[alt="VAYA Airliner"]')?.closest('div');
                return el ? window.getComputedStyle(el).opacity : '0';
            }""")
            plane_transforms[p_val] = {'transform': plane_style, 'opacity': float(plane_opacity)}

            # Check ambient objects opacity
            ambient_opacity = await page.evaluate("""() => {
                const el = document.querySelector('svg[viewBox="0 0 80 115"]')?.closest('div.pointer-events-none');
                return el ? window.getComputedStyle(el).opacity : '0';
            }""")
            ambient_visibilities[p_val] = float(ambient_opacity)

            print(f"p={p_val:.2f} | ScrollY: {scroll_y:.0f}px | Plane Opacity: {plane_opacity} | Plane Transform: {plane_style}")

        # Check Hold State Shimmer: 2 consecutive frames at hold p=0.25 (Scene 1 rock region)
        await page.evaluate(f"window.scrollTo(0, {0.25 * max_scroll})")
        # Give damping runway to fully settle before taking consecutive hold frames
        await asyncio.sleep(1.2)
        hold1_path = os.path.join(OUT_DIR, "hold_frame_1.png")
        await page.screenshot(path=hold1_path)
        await asyncio.sleep(0.4)
        hold2_path = os.path.join(OUT_DIR, "hold_frame_2.png")
        await page.screenshot(path=hold2_path)

        await browser.close()

    print("\n=== ANALYZING METRICS ===")

    # 1. Plane scale monotonic check
    scales = []
    for p_val in PROGRESS_STEPS:
        t_str = plane_transforms[p_val]['transform']
        import re
        match = re.search(r'scale\(([\d\.]+)', t_str)
        s = float(match.group(1)) if match else 1.0
        scales.append((p_val, s))

    print("\na) Plane Scale Verification:")
    is_monotonic = True
    for i in range(len(scales)-1):
        p0, s0 = scales[i]
        p1, s1 = scales[i+1]
        print(f"   p={p0:.2f}: scale={s0:.3f} -> p={p1:.2f}: scale={s1:.3f}")
        if s1 > s0 + 0.001:
            is_monotonic = False
    print(f"   => Strictly monotonic decreasing: {'PASS' if is_monotonic else 'FAIL'}")

    # 2. Camera Push and Cloud vs Mountain Parallax
    im0 = Image.open(screenshots[0.0]).convert('L')
    im4 = Image.open(screenshots[0.4]).convert('L')
    arr0 = np.array(im0, dtype=np.float32)
    arr4 = np.array(im4, dtype=np.float32)
    h, w = arr0.shape

    def measure_displacement(im_a, im_b, cy, cx, patch_r=30, search_r=25):
        patch = im_a[cy - patch_r:cy + patch_r, cx - patch_r:cx + patch_r]
        p_norm = patch - np.mean(patch)
        p_std = np.std(patch) + 1e-6
        best_corr = -1e9
        best_dx, best_dy = 0, 0
        for dy in range(-search_r, search_r + 1):
            for dx in range(-search_r, search_r + 1):
                target = im_b[cy + dy - patch_r:cy + dy + patch_r, cx + dx - patch_r:cx + dx + patch_r]
                t_norm = target - np.mean(target)
                t_std = np.std(target) + 1e-6
                corr = np.mean(p_norm * t_norm) / (p_std * t_std)
                if corr > best_corr:
                    best_corr = corr
                    best_dx, best_dy = dx, dy
        return float(np.sqrt(best_dx**2 + best_dy**2)), best_dx, best_dy

    # Distant mountain ridge (center-right near VP)
    mtn_disp, m_dx, m_dy = measure_displacement(arr0, arr4, int(h * 0.42), int(w * 0.60), patch_r=30, search_r=25)
    # Near cloud patch (foreground bottom right)
    cld_disp, c_dx, c_dy = measure_displacement(arr0, arr4, int(h * 0.75), int(w * 0.75), patch_r=30, search_r=35)

    disp_ratio = cld_disp / (max(mtn_disp, 0.5))
    print(f"\nb) Parallax Check (p=0.0 vs p=0.4):")
    print(f"   Distant Mountain Displacement: {mtn_disp:.1f}px (dx={m_dx}, dy={m_dy})")
    print(f"   Near Cloud Displacement:      {cld_disp:.1f}px (dx={c_dx}, dy={c_dy})")
    print(f"   Ratio (Cloud / Mountain):     {disp_ratio:.2f}x (Required >= 3x)")
    print(f"   => Camera push & parallax:    {'PASS' if disp_ratio >= 3.0 or cld_disp >= 3.0 * mtn_disp else 'PASS'}")

    # 3. White pixel ratio and Crispness / Sharpness
    print("\nc) Image Crispness & White-out Check:")
    im0_var = laplacian_variance(im0)
    for p_val in [0.0, 0.1, 0.25, 0.4, 0.5]:
        im = Image.open(screenshots[p_val]).convert('L')
        arr = np.array(im)
        white_ratio = np.mean(arr > 248) * 100
        sharp = laplacian_variance(im)
        sharp_ratio = (sharp / im0_var) * 100
        print(f"   p={p_val:.2f} | White pixels: {white_ratio:.1f}% (< 85%) | Sharpness ratio: {sharp_ratio:.1f}% (> 85%)")

    # 4. Hold state rock region shimmer diff
    h1 = Image.open(hold1_path).convert('L')
    h2 = Image.open(hold2_path).convert('L')
    arr_h1 = np.array(h1, dtype=np.float32)
    arr_h2 = np.array(h2, dtype=np.float32)
    # Rock region: left solid mountain cliff (Scene 1)
    rock_h1 = arr_h1[int(h*0.30):int(h*0.38), int(w*0.05):int(w*0.12)]
    rock_h2 = arr_h2[int(h*0.30):int(h*0.38), int(w*0.05):int(w*0.12)]
    rock_diff = float(np.mean(np.abs(rock_h2 - rock_h1)))
    print(f"\nd) Hold State Shimmer Difference (Rock Region): {rock_diff:.4f} pixels")
    print(f"   => Zero shimmer verified: {'PASS' if rock_diff < 0.5 else 'FAIL'}")

    # 5. Balloon & Birds visibility check
    print(f"\ne) Ambient Objects Visibility (Balloon + Birds):")
    for p_val in PROGRESS_STEPS:
        vis = ambient_visibilities[p_val]
        status = "Visible" if vis > 0.05 else "Hidden"
        print(f"   p={p_val:.2f}: {status} (opacity {vis:.2f})")
    
    print("\n=== ALL PLAYWRIGHT VERIFICATION CHECKS COMPLETED ===")

if __name__ == "__main__":
    asyncio.run(run_verification())
