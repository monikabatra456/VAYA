import asyncio, os
from playwright.async_api import async_playwright

OUT = r"C:\Users\lenovo\.gemini\antigravity\brain\0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d"

async def main():
    async with async_playwright() as p:
        # Desktop
        browser = await p.chromium.launch(headless=True, channel="chrome")
        ctx = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await ctx.new_page()
        await page.goto("http://localhost:3000", wait_until="networkidle", timeout=30000)
        await page.evaluate("window.scrollTo(0, window.innerHeight)")
        await asyncio.sleep(1.5)

        card = page.locator("button").filter(has_text="Overcrowding").first
        await card.click(force=True)
        await asyncio.sleep(1.2)

        shot = os.path.join(OUT, "modal_exact_tab_large_video_desktop.png")
        await page.screenshot(path=shot)
        print("Saved desktop:", shot)

        sizes = await page.evaluate("""() => {
            const panel = document.querySelector('[role="dialog"]');
            const video = panel ? panel.querySelector('video') : null;
            const phone = video ? video.parentElement.parentElement : null;
            return {
                panel: panel ? { w: panel.offsetWidth, h: panel.offsetHeight } : null,
                phone: phone ? { w: phone.offsetWidth, h: phone.offsetHeight } : null
            };
        }""")
        print("Measured sizes:", sizes)
        await browser.close()

        # Mobile
        browser_m = await p.chromium.launch(headless=True, channel="chrome")
        ctx_m = await browser_m.new_context(viewport={"width": 390, "height": 844}, is_mobile=True)
        page_m = await ctx_m.new_page()
        await page_m.goto("http://localhost:3000", wait_until="networkidle", timeout=30000)
        await page_m.evaluate("window.scrollTo(0, window.innerHeight)")
        await asyncio.sleep(1.5)

        card_m = page_m.locator("button").filter(has_text="Overcrowding").first
        await card_m.click(force=True)
        await asyncio.sleep(1.2)

        shot_m = os.path.join(OUT, "modal_exact_tab_large_video_mobile.png")
        await page_m.screenshot(path=shot_m)
        print("Saved mobile:", shot_m)
        await browser_m.close()

asyncio.run(main())

