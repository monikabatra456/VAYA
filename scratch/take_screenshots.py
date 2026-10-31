import asyncio
from playwright.async_api import async_playwright

OUT = r"C:\Users\lenovo\.gemini\antigravity\brain\0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await ctx.new_page()
        await page.goto("http://localhost:3000", wait_until="networkidle", timeout=25000)
        await page.evaluate("window.scrollTo(0, window.innerHeight)")
        await asyncio.sleep(2.0)
        # Screenshot section 2 default state
        await page.screenshot(path=OUT + r"\fix_cards_s2.png")
        print("Saved fix_cards_s2.png")

        # Hover overcrowding card
        cards = page.locator("button").all()
        cards_list = await page.locator(".s2-card button").all()
        print(f"Found {len(cards_list)} s2-card buttons")
        if cards_list:
            await cards_list[0].hover(force=True)
            await asyncio.sleep(0.6)
            await page.screenshot(path=OUT + r"\fix_cards_active.png")
            print("Saved fix_cards_active.png")
            
            # Click to open popup
            await cards_list[0].click(force=True)
            await asyncio.sleep(1.0)
            await page.screenshot(path=OUT + r"\fix_popup_open.png")
            print("Saved fix_popup_open.png")

        await browser.close()
        print("DONE")

asyncio.run(main())

