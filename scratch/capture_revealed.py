# scratch/capture_revealed.py
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        # 1920x1080 revealed
        page = await browser.new_page(viewport={"width": 1920, "height": 1080})
        await page.goto("http://localhost:3000", wait_until="networkidle")
        await page.evaluate("document.getElementById('wonder').scrollIntoView({ behavior: 'instant' })")
        await page.wait_for_timeout(1000)

        # Click hub pin to reveal cards
        await page.locator('.ww-hub-pin').click(force=True)
        await page.wait_for_timeout(1400)

        # Hover Taj Mahal to show active card, pulse dot, and leader line
        cards = page.locator('.ww-card')
        await cards.nth(0).hover(force=True)
        await page.wait_for_timeout(600)

        await page.screenshot(path="C:/Users/lenovo/.gemini/antigravity/brain/0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d/wonder_world_1920x1080_revealed.png")
        print("Captured 1920x1080 revealed screenshot!")

        # 1440x900 revealed
        page2 = await browser.new_page(viewport={"width": 1440, "height": 900})
        await page2.goto("http://localhost:3000", wait_until="networkidle")
        await page2.evaluate("document.getElementById('wonder').scrollIntoView({ behavior: 'instant' })")
        await page2.wait_for_timeout(1000)

        await page2.locator('.ww-hub-pin').click(force=True)
        await page2.wait_for_timeout(1400)

        cards2 = page2.locator('.ww-card')
        await cards2.nth(1).hover(force=True)
        await page2.wait_for_timeout(600)

        await page2.screenshot(path="C:/Users/lenovo/.gemini/antigravity/brain/0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d/wonder_world_1440x900_revealed.png")
        print("Captured 1440x900 revealed screenshot!")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())

