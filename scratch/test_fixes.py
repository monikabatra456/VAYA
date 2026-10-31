import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()

        errors = []
        page.on("console", lambda msg: errors.append(f"Console {msg.type}: {msg.text}") if msg.type == "error" else None)
        page.on("pageerror", lambda err: errors.append(f"PageError: {err}"))

        print("1. Loading http://localhost:3000...")
        await page.goto("http://localhost:3000", wait_until="networkidle")

        print("2. Scrolling to #challenges...")
        await page.locator("#challenges").scroll_into_view_if_needed()
        await page.wait_for_timeout(1000)

        # Screenshot idle
        await page.screenshot(path=r"C:\Users\lenovo\.gemini\antigravity\brain\0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d\s2_idle_white_cards.png")
        print("3. Captured idle cards screenshot")

        # Hover over overcrowding card
        card_overcrowding = page.locator("button[aria-label*='Overcrowding']").first
        await card_overcrowding.hover(force=True)
        await page.wait_for_timeout(600)
        await page.screenshot(path=r"C:\Users\lenovo\.gemini\antigravity\brain\0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d\s2_hover_overcrowding_glow.png")
        print("4. Captured hover glow screenshot")

        # Click Overcrowding to open popup
        print("5. Clicking Overcrowding card to open popup...")
        await card_overcrowding.click(force=True)
        await page.wait_for_timeout(800)

        # Verify popup webp
        popup = page.locator("[role='dialog']")
        popup_visible = await popup.is_visible()
        print(f"Popup visible: {popup_visible}")

        img = popup.locator("img")
        img_src = await img.get_attribute("src")
        print(f"Popup WebP src: {img_src}")

        await page.screenshot(path=r"C:\Users\lenovo\.gemini\antigravity\brain\0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d\popup_overcrowding_transparent.png")
        print("6. Captured popup transparent webp screenshot")

        # Close popup
        close_btn = popup.locator("button[aria-label='Close popup']")
        await close_btn.click()
        await page.wait_for_timeout(600)

        # Test another card: Changing plans
        card_changing = page.locator("button[aria-label*='Changing plans']").first
        await card_changing.click(force=True)
        await page.wait_for_timeout(800)
        img_changing = page.locator("[role='dialog'] img")
        src_changing = await img_changing.get_attribute("src")
        print(f"Changing plans WebP src: {src_changing}")
        await page.screenshot(path=r"C:\Users\lenovo\.gemini\antigravity\brain\0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d\popup_changing_plans_transparent.png")

        await page.locator("[role='dialog'] button[aria-label='Close popup']").click()
        await page.wait_for_timeout(500)

        print("\n--- ERRORS CHECK ---")
        if errors:
            print("Errors encountered:", errors)
        else:
            print("ZERO errors encountered!")

        await browser.close()

asyncio.run(run())

