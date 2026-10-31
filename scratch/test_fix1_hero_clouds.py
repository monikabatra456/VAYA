# scratch/test_fix1_hero_clouds.py
import asyncio
import os
from playwright.async_api import async_playwright

OUT = r"C:\Users\lenovo\.gemini\antigravity\brain\0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d"

async def test_hero():
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True)
        page = await b.new_page(viewport={"width": 1920, "height": 1080})
        
        errors = []
        page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
        page.on("pageerror", lambda err: errors.append(str(err)))

        await page.goto("http://localhost:3000", wait_until="networkidle")
        await page.wait_for_timeout(1000)

        # Check canvases in DOM
        canvases = await page.evaluate('''() => {
            const els = Array.from(document.querySelectorAll('#hero canvas'));
            return els.map(c => ({
                width: c.width,
                height: c.height,
                zIndex: window.getComputedStyle(c).zIndex
            }));
        }''')
        print("Hero Canvases found:", canvases)
        assert len(canvases) == 2, f"Expected 2 procedural cloud canvases, found {len(canvases)}"

        # Scroll positions: 0, 0.15, 0.30, 0.50, 0.70
        scroll_len = await page.evaluate("document.getElementById('hero').offsetHeight - window.innerHeight")
        print(f"Scroll length: {scroll_len}px")

        for prog in [0.0, 0.15, 0.30, 0.50, 0.70]:
            y = int(scroll_len * prog)
            await page.evaluate(f"window.scrollTo(0, {y})")
            await page.wait_for_timeout(700)
            shot_path = os.path.join(OUT, f"hero_cloud_scroll_{int(prog*100)}.png")
            await page.screenshot(path=shot_path)
            print(f"Captured scroll {prog:.2f} -> {shot_path}")

        if errors:
            print("Console errors encountered:", errors)
        else:
            print("SUCCESS: Zero console errors on Hero!")

        await b.close()

if __name__ == '__main__':
    asyncio.run(test_hero())
