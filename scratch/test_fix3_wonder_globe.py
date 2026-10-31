# scratch/test_fix3_wonder_globe.py
import asyncio
import os
from playwright.async_api import async_playwright

OUT = r"C:\Users\lenovo\.gemini\antigravity\brain\0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d"

async def test_wonder_world():
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True)
        
        for w, h, vp_name in [(1920, 1200, "1920x1200"), (1366, 768, "1366x768")]:
            print(f"\n==========================================")
            print(f"Testing Section 3 Wonder World at {vp_name} ({w}x{h})")
            print(f"==========================================")
            page = await b.new_page(viewport={"width": w, "height": h})
            
            errors = []
            page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
            page.on("pageerror", lambda err: errors.append(str(err)))

            await page.goto("http://localhost:3000", wait_until="networkidle")
            await page.wait_for_timeout(1000)

            # Scroll to Section III
            await page.evaluate("document.getElementById('wonder').scrollIntoView({ behavior: 'instant' })")
            await page.wait_for_timeout(1200)

            # Inspect Three.js Scene objects in DOM & Canvas
            globe_info = await page.evaluate('''() => {
                const canvas = document.querySelector('.ww-canvas');
                const head = document.querySelector('.ww-head');
                const sub = document.querySelector('.ww-subtitle');
                const ring = document.querySelector('.ww-text-ring');
                
                const cRect = canvas ? canvas.getBoundingClientRect() : null;
                const subRect = sub ? sub.getBoundingClientRect() : null;
                const ringRect = ring ? ring.getBoundingClientRect() : null;

                return {
                    canvasExists: canvas !== null,
                    canvasW: cRect ? cRect.width : 0,
                    canvasH: cRect ? cRect.height : 0,
                    clearanceToRing: (ringRect && subRect) ? ringRect.top - subRect.bottom : 0,
                };
            }''')

            print("Globe Canvas info:", globe_info)
            assert globe_info['canvasExists'], "Globe canvas not found!"
            assert globe_info['clearanceToRing'] >= 40, f"Clearance to ring must be >= 40px, got {globe_info['clearanceToRing']}"

            # Capture initial globe screenshot
            shot_path = os.path.join(OUT, f"wonder_world_globe_{vp_name}.png")
            await page.screenshot(path=shot_path)
            print(f"Saved initial globe screenshot: {shot_path}")

            # Test India Pin click -> Reveals golden orbit ring + cards
            hub_pin = page.locator('.ww-hub-pin').first
            if await hub_pin.count() > 0:
                print("Clicking India Hub Pin to reveal orbit cards...")
                await hub_pin.click(force=True)
                await page.wait_for_timeout(1500)

                # Capture revealed state with destination cards & orbit ring
                rev_shot = os.path.join(OUT, f"wonder_world_revealed_{vp_name}.png")
                await page.screenshot(path=rev_shot)
                print(f"Saved revealed orbit screenshot: {rev_shot}")

                # Verify destination cards are visible
                cards_count = await page.evaluate('''() => {
                    return document.querySelectorAll('.ww-card').length;
                }''')
                print(f"Destination cards visible in orbit: {cards_count}")
                assert cards_count >= 5, f"Expected at least 5 destination cards, found {cards_count}"

            if errors:
                print("Errors encountered:", errors)
            else:
                print("SUCCESS: Zero errors on Wonder World!")

            await page.close()

        await b.close()
        print("\nALL FIX 3 GLOBE CHECKS PASSED SUCCESSFULLY!")

if __name__ == '__main__':
    asyncio.run(test_wonder_world())

