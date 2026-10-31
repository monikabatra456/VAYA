# scratch/verify_cta_distance.py
import asyncio
from playwright.async_api import async_playwright

ARTIFACT_DIR = "C:/Users/lenovo/.gemini/antigravity/brain/0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d"

async def test():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        # Test 1920x1080
        page = await browser.new_page(viewport={"width": 1920, "height": 1080})
        await page.goto("http://localhost:3000", wait_until="networkidle")
        await page.wait_for_timeout(1000)
        await page.evaluate("document.getElementById('wonder').scrollIntoView({ behavior: 'instant' })")
        await page.wait_for_timeout(1500)

        metrics = await page.evaluate('''() => {
            const sub = document.querySelector('.ww-subtitle');
            const ring = document.querySelector('.ww-text-ring');
            const shadow = document.querySelector('.ww-globe-shadow');
            const ctaPill = document.querySelector('.ww-cta-pill');
            
            const subRect = sub.getBoundingClientRect();
            const ringRect = ring.getBoundingClientRect();
            const shadowRect = shadow.getBoundingClientRect();
            const ctaRect = ctaPill.getBoundingClientRect();
            
            return {
                topClearance: ringRect.top - subRect.bottom,
                gapShadowToCta: ctaRect.top - shadowRect.bottom,
                gapRingToCta: ctaRect.top - ringRect.bottom,
                ctaBottomOffset: window.innerHeight - ctaRect.bottom
            };
        }''')
        print("1920x1080 Metrics:")
        print(f"  Top Subtitle Clearance: {metrics['topClearance']:.1f}px (MUST be >= 40px)")
        print(f"  Gap from Globe Shadow to CTA Pill: {metrics['gapShadowToCta']:.1f}px")
        print(f"  Gap from Text Ring to CTA Pill: {metrics['gapRingToCta']:.1f}px")
        print(f"  CTA bottom offset from section bottom: {metrics['ctaBottomOffset']:.1f}px")
        assert metrics['topClearance'] >= 40, f"Top clearance must be >= 40px, got {metrics['topClearance']}"
        assert metrics['gapShadowToCta'] >= 115, f"Expected gap >= 115px, got {metrics['gapShadowToCta']}"

        await page.screenshot(path=f"{ARTIFACT_DIR}/wonder_world_cta_lower_1920.png", timeout=15000)
        print(f"Saved: {ARTIFACT_DIR}/wonder_world_cta_lower_1920.png")

        # Test 1440x900
        page2 = await browser.new_page(viewport={"width": 1440, "height": 900})
        await page2.goto("http://localhost:3000", wait_until="networkidle")
        await page2.evaluate("document.getElementById('wonder').scrollIntoView({ behavior: 'instant' })")
        await page2.wait_for_timeout(1200)

        metrics2 = await page2.evaluate('''() => {
            const sub = document.querySelector('.ww-subtitle');
            const ring = document.querySelector('.ww-text-ring');
            const shadow = document.querySelector('.ww-globe-shadow');
            const ctaPill = document.querySelector('.ww-cta-pill');
            
            const subRect = sub.getBoundingClientRect();
            const ringRect = ring.getBoundingClientRect();
            const shadowRect = shadow.getBoundingClientRect();
            const ctaRect = ctaPill.getBoundingClientRect();
            
            return {
                topClearance: ringRect.top - subRect.bottom,
                gapShadowToCta: ctaRect.top - shadowRect.bottom,
                gapRingToCta: ctaRect.top - ringRect.bottom
            };
        }''')
        print("\n1440x900 Metrics:")
        print(f"  Top Subtitle Clearance: {metrics2['topClearance']:.1f}px")
        print(f"  Gap from Globe Shadow to CTA Pill: {metrics2['gapShadowToCta']:.1f}px")
        print(f"  Gap from Text Ring to CTA Pill: {metrics2['gapRingToCta']:.1f}px")
        assert metrics2['topClearance'] >= 40, f"Top clearance must be >= 40px, got {metrics2['topClearance']}"

        await page2.screenshot(path=f"{ARTIFACT_DIR}/wonder_world_cta_lower_1440.png", timeout=15000)
        print(f"Saved: {ARTIFACT_DIR}/wonder_world_cta_lower_1440.png")

        await browser.close()
        print("\nALL DISTANCE TESTS PASSED!")

if __name__ == "__main__":
    asyncio.run(test())

