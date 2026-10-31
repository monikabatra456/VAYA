# scratch/preview_new_landscape.py
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True)
        viewports = [
            (1920, 1080, "1920x1080"),
            (1440, 900, "1440x900"),
            (1366, 768, "1366x768"),
            (390, 844, "390x844_mobile")
        ]
        
        for w, h, name in viewports:
            page = await b.new_page(viewport={"width": w, "height": h})
            await page.goto("http://localhost:3000", wait_until="networkidle")
            await page.wait_for_timeout(1000)
            
            # Scroll to section 3 (#wonder)
            await page.evaluate("document.getElementById('wonder').scrollIntoView({ behavior: 'instant' })")
            await page.wait_for_timeout(1500)
            
            shot_path = f"C:/Users/lenovo/.gemini/antigravity/brain/0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d/wonder_alpine_{name}.png"
            await page.screenshot(path=shot_path)
            print(f"Saved screenshot: {shot_path}")
            
            # Measure landscape img bounding box and position relative to section
            metrics = await page.evaluate('''() => {
                const img = document.querySelector('.ww-bg-landscape');
                const sec = document.getElementById('wonder');
                if (!img || !sec) return null;
                const rImg = img.getBoundingClientRect();
                const rSec = sec.getBoundingClientRect();
                return {
                    imgWidth: rImg.width,
                    imgHeight: rImg.height,
                    imgBottom: rImg.bottom,
                    secBottom: rSec.bottom,
                    imgTop: rImg.top - rSec.top,
                    secHeight: rSec.height
                };
            }''')
            print(f"[{name}] Metrics:", metrics)
            await page.close()
            
        await b.close()

if __name__ == '__main__':
    asyncio.run(main())

