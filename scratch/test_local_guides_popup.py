import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1440, "height": 900})

        errors = []
        page.on("console", lambda msg: errors.append(f"Console {msg.type}: {msg.text}") if msg.type == "error" else None)
        page.on("pageerror", lambda err: errors.append(f"PageError: {err}"))

        await page.goto("http://localhost:3000", wait_until="networkidle")
        await page.locator("#challenges").scroll_into_view_if_needed()
        await page.wait_for_timeout(800)

        # Click local guides card
        card = page.locator("button[aria-label*='Local guides']").first
        await card.click(force=True)
        await page.wait_for_timeout(1000)

        # Verify webp img src
        img = page.locator("div[role='dialog'] img")
        src = await img.get_attribute("src")
        print("Popup image src:", src)

        screenshot_path = "C:/Users/lenovo/.gemini/antigravity/brain/0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d/popup_local_guides_verified.png"
        await page.screenshot(path=screenshot_path)
        print("Captured:", screenshot_path)
        print("Errors:", errors)

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
