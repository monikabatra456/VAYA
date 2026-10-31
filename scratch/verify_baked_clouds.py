# scratch/verify_baked_clouds.py
import asyncio
from playwright.async_api import async_playwright

ARTIFACT_DIR = "C:/Users/lenovo/.gemini/antigravity/brain/0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d"

async def test():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        # 1. Desktop 1920x1080
        print("=== Testing 1920x1080: Single-Sphere Baked Clouds ===")
        page = await browser.new_page(viewport={"width": 1920, "height": 1080})
        await page.goto("http://localhost:3000", wait_until="networkidle")
        await page.wait_for_timeout(1000)
        await page.evaluate("document.getElementById('wonder').scrollIntoView({ behavior: 'instant' })")
        await page.wait_for_timeout(1500)

        # Inspect Three.js scene structure
        scene_info = await page.evaluate('''() => {
            const canvas = document.querySelector('.ww-canvas');
            const ctaPill = document.querySelector('.ww-cta-pill');
            const shadow = document.querySelector('.ww-globe-shadow');
            const ring = document.querySelector('.ww-text-ring');
            
            const ctaRect = ctaPill.getBoundingClientRect();
            const shadowRect = shadow.getBoundingClientRect();
            const ringRect = ring.getBoundingClientRect();
            
            return {
                ctaBottomOffset: window.innerHeight - ctaRect.bottom,
                ctaTop: ctaRect.top,
                shadowBottom: shadowRect.bottom,
                ringBottom: ringRect.bottom,
                clearanceShadowToCta: ctaRect.top - shadowRect.bottom,
                clearanceRingToCta: ctaRect.top - ringRect.bottom
            };
        }''')
        print("CTA Pill metrics:", scene_info)
        print(f"Distance from globe shadow bottom to 'Your wonder is waiting' pill: {scene_info['clearanceShadowToCta']:.1f}px")
        print(f"Distance from ring bottom to CTA pill: {scene_info['clearanceRingToCta']:.1f}px")
        assert scene_info['clearanceShadowToCta'] > 90, f"Expected clearance > 90px, got {scene_info['clearanceShadowToCta']}px"

        # Capture 100% screenshot
        await page.screenshot(path=f"{ARTIFACT_DIR}/wonder_world_baked_clouds_100.png", timeout=15000)
        print(f"Saved: {ARTIFACT_DIR}/wonder_world_baked_clouds_100.png")

        # Zoom in 200% on the globe
        print("\n=== Testing 200% Zoom: Cloud Texture Sharpness & Zero Layering ===")
        zoom_in_btn = page.locator('.ww-ctrl-btn[aria-label="Zoom in"]')
        # Click zoom in 4 times
        for _ in range(4):
            await zoom_in_btn.click()
            await page.wait_for_timeout(300)
        await page.wait_for_timeout(600)

        # Capture 200% zoomed screenshot
        await page.screenshot(path=f"{ARTIFACT_DIR}/wonder_world_baked_clouds_200.png", timeout=15000)
        print(f"Saved: {ARTIFACT_DIR}/wonder_world_baked_clouds_200.png")

        # Reset zoom
        await page.locator('.ww-ctrl-btn--reset').click()
        await page.wait_for_timeout(700)

        # 2. Desktop 1440x900
        print("\n=== Testing 1440x900 ===")
        page_1440 = await browser.new_page(viewport={"width": 1440, "height": 900})
        await page_1440.goto("http://localhost:3000", wait_until="networkidle")
        await page_1440.evaluate("document.getElementById('wonder').scrollIntoView({ behavior: 'instant' })")
        await page_1440.wait_for_timeout(1200)
        await page_1440.screenshot(path=f"{ARTIFACT_DIR}/wonder_world_baked_1440.png", timeout=15000)
        print(f"Saved: {ARTIFACT_DIR}/wonder_world_baked_1440.png")

        # 3. Mobile 390x844
        print("\n=== Testing Mobile 390x844 ===")
        page_mob = await browser.new_page(viewport={"width": 390, "height": 844})
        await page_mob.goto("http://localhost:3000", wait_until="networkidle")
        await page_mob.evaluate("document.getElementById('wonder').scrollIntoView({ behavior: 'instant' })")
        await page_mob.wait_for_timeout(1200)
        await page_mob.screenshot(path=f"{ARTIFACT_DIR}/wonder_world_baked_mobile.png", timeout=15000)
        print(f"Saved: {ARTIFACT_DIR}/wonder_world_baked_mobile.png")

        await browser.close()
        print("\nALL VERIFICATIONS COMPLETED SUCCESSFULLY!")

if __name__ == "__main__":
    asyncio.run(test())

