import asyncio
import os
from playwright.async_api import async_playwright

OUT = r"C:\Users\lenovo\.gemini\antigravity\brain\549f2924-08bd-42ed-93cc-37be66802241"

async def test_screen():
    print("Launching browser...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1000, "height": 900})

        print("Navigating to http://localhost:3000/phone-preview ...")
        await page.goto("http://localhost:3000/phone-preview", wait_until="networkidle", timeout=30000)
        
        # Capture sequence states:
        # 1. Logo intro
        await asyncio.sleep(0.5)
        path1 = os.path.join(OUT, "seq_1_logo.png")
        await page.screenshot(path=path1)
        print(f"Captured: {path1}")

        # 2. Typing Jaipur into 'Where to next?'
        await asyncio.sleep(1.8)
        path2 = os.path.join(OUT, "seq_2_typing.png")
        await page.screenshot(path=path2)
        print(f"Captured: {path2}")

        # 3. Results appear
        await asyncio.sleep(1.0)
        path3 = os.path.join(OUT, "seq_3_results.png")
        await page.screenshot(path=path3)
        print(f"Captured: {path3}")

        # 4. Crowd bars animate up
        await asyncio.sleep(1.0)
        path4 = os.path.join(OUT, "seq_4_bars.png")
        await page.screenshot(path=path4)
        print(f"Captured: {path4}")

        # 5. Crowd alert card slides in
        await asyncio.sleep(1.2)
        path5 = os.path.join(OUT, "seq_5_alert.png")
        await page.screenshot(path=path5)
        print(f"Captured: {path5}")

        await browser.close()
    print("Done all captures!")

if __name__ == "__main__":
    asyncio.run(test_screen())
