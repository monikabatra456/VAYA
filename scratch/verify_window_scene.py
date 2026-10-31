import asyncio
import os
from playwright.async_api import async_playwright

OUT = r"C:\Users\lenovo\Downloads\vaya 3.0\scratch\verification"
ARTIFACTS = r"C:\Users\lenovo\.gemini\antigravity\brain\0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d"
os.makedirs(OUT, exist_ok=True)

async def run_verification():
    async with async_playwright() as p:
        # 1. Test at 1440x900
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await ctx.new_page()

        # Listen to console
        page.on("console", lambda msg: print(f"[Browser Console] {msg.type}: {msg.text}"))

        print("Navigating to http://localhost:3000...")
        await page.goto("http://localhost:3000", wait_until="networkidle")
        await asyncio.sleep(1.0)

        # Scroll to #meet-vaya section
        meet_sec = page.locator("#meet-vaya")
        print("Scrolling to #meet-vaya...")
        await meet_sec.scroll_into_view_if_needed()
        await asyncio.sleep(2.0)

        # Capture 1440px Jaipur state
        jaipur_shot_1440 = os.path.join(OUT, "meet_vaya_jaipur_1440.png")
        await page.screenshot(path=jaipur_shot_1440)
        print("Captured 1440px Jaipur:", jaipur_shot_1440)

        # Click 'Agra' destination pill
        print("Switching to Agra...")
        agra_pill = page.locator(".mv-dest-pill:has-text('Agra')")
        if await agra_pill.count() > 0:
            await agra_pill.first.click(force=True)
            # Wait for cloud dissolve to finish
            await asyncio.sleep(2.2)

            agra_shot_1440 = os.path.join(OUT, "meet_vaya_agra_1440.png")
            await page.screenshot(path=agra_shot_1440)
            print("Captured 1440px Agra:", agra_shot_1440)

        # Also test 1024x768 desktop viewport
        ctx_1024 = await browser.new_context(viewport={"width": 1024, "height": 768})
        page_1024 = await ctx_1024.new_page()
        await page_1024.goto("http://localhost:3000", wait_until="networkidle")
        await asyncio.sleep(1.0)

        meet_1024 = page_1024.locator("#meet-vaya")
        await meet_1024.scroll_into_view_if_needed()
        await asyncio.sleep(2.0)

        shot_1024 = os.path.join(OUT, "meet_vaya_jaipur_1024.png")
        await page_1024.screenshot(path=shot_1024)
        print("Captured 1024px Jaipur:", shot_1024)

        # Switch to Agra at 1024
        agra_1024 = page_1024.locator(".mv-dest-pill:has-text('Agra')")
        if await agra_1024.count() > 0:
            await agra_1024.first.click(force=True)
            await asyncio.sleep(2.2)
            shot_agra_1024 = os.path.join(OUT, "meet_vaya_agra_1024.png")
            await page_1024.screenshot(path=shot_agra_1024)
            print("Captured 1024px Agra:", shot_agra_1024)

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run_verification())

