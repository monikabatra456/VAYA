import asyncio
import os
from playwright.async_api import async_playwright

OUT = r"C:\Users\lenovo\Downloads\vaya 3.0\scratch\verification"

async def test_plane_window():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await ctx.new_page()

        await page.goto("http://localhost:3000", wait_until="networkidle")
        await asyncio.sleep(1.0)

        # Scroll to Section 2
        s2 = page.locator("#challenges")
        await s2.scroll_into_view_if_needed()
        await asyncio.sleep(0.8)

        # Click the planning card or first card
        card_btn = page.locator(".s2-card button").first
        await card_btn.click(force=True)
        await asyncio.sleep(2.0)

        # In the phone sequence bottom tabs, click 'Plan'
        plan_tab = page.locator("button:has-text('Plan')")
        if await plan_tab.count() > 0:
            print("Clicking 'Plan' bottom tab...")
            await plan_tab.first.click(force=True)
            await asyncio.sleep(2.5)

            shot1 = os.path.join(OUT, "plane_window_jaipur.png")
            await page.screenshot(path=shot1)
            print(f"Captured Jaipur Plane Window: {shot1}")

            # Click 'Agra' destination pill
            agra_btn = page.locator("button:has-text('Agra')")
            if await agra_btn.count() > 0:
                print("Clicking 'Agra' switcher...")
                await agra_btn.first.click(force=True)
                await asyncio.sleep(2.0)

                shot2 = os.path.join(OUT, "plane_window_agra.png")
                await page.screenshot(path=shot2)
                print(f"Captured Agra Plane Window: {shot2}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(test_plane_window())

