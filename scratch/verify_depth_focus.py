import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        for w, h in [(1440, 900), (1920, 1080), (1280, 800)]:
            print(f"\n================ VIEWPORT {w}x{h} ================")
            context = await browser.new_context(viewport={"width": w, "height": h})
            page = await context.new_page()

            errors = []
            page.on("console", lambda msg: errors.append(f"Console {msg.type}: {msg.text}") if msg.type == "error" else None)
            page.on("pageerror", lambda err: errors.append(f"PageError: {err}"))

            await page.goto("http://localhost:3000", wait_until="networkidle")
            await page.locator("#challenges").scroll_into_view_if_needed()
            await page.wait_for_timeout(1000)

            # 1. Capture initial active card (overcrowding) + blurred inactive cards
            shot1 = f"C:/Users/lenovo/.gemini/antigravity/brain/0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d/depth_active_overcrowding_{w}x{h}.png"
            await page.screenshot(path=shot1)
            print(f"Captured initial active card state: {shot1}")

            # 2. Wait for auto-cycle (~3.5s) to verify plane flight and next card focus
            await page.wait_for_timeout(3600)
            shot2 = f"C:/Users/lenovo/.gemini/antigravity/brain/0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d/depth_autocycle_next_{w}x{h}.png"
            await page.screenshot(path=shot2)
            print(f"Captured auto-cycle state: {shot2}")

            # 3. Hover over 'Safety concerns' to test instant hover focus & pause
            safety_card = page.locator("button[aria-label*='Safety concerns']").first
            await safety_card.hover(force=True)
            await page.wait_for_timeout(800)
            shot3 = f"C:/Users/lenovo/.gemini/antigravity/brain/0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d/depth_hover_safety_{w}x{h}.png"
            await page.screenshot(path=shot3)
            print(f"Captured hover focus on Safety: {shot3}")

            # 4. Click 'Safety concerns' to open popup
            await safety_card.click(force=True)
            await page.wait_for_timeout(700)
            shot4 = f"C:/Users/lenovo/.gemini/antigravity/brain/0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d/depth_popup_safety_{w}x{h}.png"
            await page.screenshot(path=shot4)
            print(f"Captured popup state: {shot4}")

            # Check popup centered position
            popup_dialog = page.locator("div[role='dialog']")
            box = await popup_dialog.bounding_box()
            assert box is not None, "Popup dialog not found"
            print(f"Popup frame: x={box['x']:.1f}, y={box['y']:.1f}, w={box['width']:.1f}, h={box['height']:.1f}")

            # 5. Close popup
            close_btn = page.locator("button[aria-label='Close popup']")
            await close_btn.click(force=True)
            await page.wait_for_timeout(600)

            print(f"Console errors for {w}x{h}: {len(errors)}")
            for e in errors:
                print("  ERROR:", e)

            await context.close()

        await browser.close()
        print("\nAll tests completed successfully!")

if __name__ == "__main__":
    asyncio.run(run())
