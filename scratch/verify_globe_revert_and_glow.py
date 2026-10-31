# scratch/verify_globe_revert_and_glow.py
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True)
        viewports = [
            (1920, 1080, "acceptance_1920x1080"),
            (1440, 900, "acceptance_1440x900")
        ]
        
        for w, h, name in viewports:
            page = await b.new_page(viewport={"width": w, "height": h})
            await page.goto("http://localhost:3000", wait_until="networkidle")
            await page.wait_for_timeout(1000)
            
            # Scroll to Section III (#wonder)
            await page.evaluate("document.getElementById('wonder').scrollIntoView({ behavior: 'instant' })")
            await page.wait_for_timeout(2000)
            
            shot_path = f"C:/Users/lenovo/.gemini/antigravity/brain/0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d/{name}.png"
            await page.screenshot(path=shot_path)
            print(f"Saved: {shot_path}")
            
            # Check background color difference: left sky vs right sky
            glow_data = await page.evaluate('''() => {
                const glow = document.querySelector('.ww-right-glow');
                const wm = document.querySelector('.ww-watermark-wrapper');
                const canvas = document.querySelector('.ww-canvas');
                return {
                    hasGlow: !!glow,
                    glowZ: glow ? window.getComputedStyle(glow).zIndex : null,
                    glowOpacity: glow ? window.getComputedStyle(glow).opacity : null,
                    wmZ: wm ? window.getComputedStyle(wm).zIndex : null,
                    canvasZ: canvas ? window.getComputedStyle(canvas).zIndex : null,
                };
            }''')
            print(f"[{name}] Glow layer data:", glow_data)
            
            # Reveal cards with force=True (since globe rotates, pin position moves continuously)
            hub_btn = page.locator('.ww-hub-pin').first
            if await hub_btn.count() > 0:
                await hub_btn.click(force=True)
                await page.wait_for_timeout(2000)
                revealed_path = f"C:/Users/lenovo/.gemini/antigravity/brain/0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d/{name}_revealed.png"
                await page.screenshot(path=revealed_path)
                print(f"Saved revealed: {revealed_path}")

            await page.close()
            
        await b.close()
        print("All screenshots captured successfully!")

if __name__ == '__main__':
    asyncio.run(main())
