import asyncio
import os
import sys
from playwright.async_api import async_playwright

sys.stdout.reconfigure(encoding='utf-8')
OUT = r"C:\Users\lenovo\.gemini\antigravity\brain\549f2924-08bd-42ed-93cc-37be66802241"

async def check():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1000, "height": 900})
        await page.goto("http://localhost:3000/phone-preview", wait_until="networkidle")

        # Now let's wait until the loop restarts (cycle resets), or reload the page to catch from t=0
        print("Reloading to sync at t=0...")
        await page.reload(wait_until="domcontentloaded")

        # Snapshot 1: Logo intro (t = 0.5s)
        await asyncio.sleep(0.5)
        await page.screenshot(path=os.path.join(OUT, "step1_logo.png"))
        print("Captured step1_logo.png")

        # Snapshot 2: Typing Jaipur (t = 2.1s from reload -> sleep 1.6s)
        await asyncio.sleep(1.6)
        await page.screenshot(path=os.path.join(OUT, "step2_typing.png"))
        print("Captured step2_typing.png")

        # Snapshot 3: Results appear (t = 3.0s -> sleep 0.9s)
        await asyncio.sleep(0.9)
        await page.screenshot(path=os.path.join(OUT, "step3_results.png"))
        print("Captured step3_results.png")

        # Snapshot 4: Crowd forecast bars animate up (t = 4.0s -> sleep 1.0s)
        await asyncio.sleep(1.0)
        await page.screenshot(path=os.path.join(OUT, "step4_bars.png"))
        print("Captured step4_bars.png")

        # Snapshot 5: Crowd alert card slides in (t = 5.2s -> sleep 1.2s)
        await asyncio.sleep(1.2)
        await page.screenshot(path=os.path.join(OUT, "step5_alert.png"))
        print("Captured step5_alert.png")

        # Also get inner text
        text = await page.evaluate("() => document.querySelector('#screen-container').innerText")
        print("\nScreen Text:\n", text)

        await browser.close()

if __name__ == "__main__":
    asyncio.run(check())

