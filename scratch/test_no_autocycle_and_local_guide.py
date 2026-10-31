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
        await page.wait_for_timeout(1000)

        # 1. Capture initial static state (Overcrowding active)
        shot1 = "C:/Users/lenovo/.gemini/antigravity/brain/0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d/hover_only_static_initial.png"
        await page.screenshot(path=shot1)
        print("1. Captured initial state:", shot1)

        # 2. Wait 4 seconds without hovering anything
        await page.wait_for_timeout(4000)
        shot2 = "C:/Users/lenovo/.gemini/antigravity/brain/0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d/hover_only_after_4s_no_cycle.png"
        await page.screenshot(path=shot2)
        print("2. Captured after 4s (verified NO auto-cycle):", shot2)

        # 3. Hover over Local guides
        local_guides_card = page.locator("button[aria-label*='Local guides']").first
        await local_guides_card.hover(force=True)
        await page.wait_for_timeout(1200)
        shot3 = "C:/Users/lenovo/.gemini/antigravity/brain/0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d/hover_only_local_guides_active.png"
        await page.screenshot(path=shot3)
        print("3. Captured Local guides hovered state:", shot3)

        # 4. Click Local guides to open popup
        await local_guides_card.click(force=True)
        await page.wait_for_timeout(1000)

        img = page.locator("div[role='dialog'] img")
        img_src = await img.get_attribute("src")
        print("Popup image src:", img_src)

        shot4 = "C:/Users/lenovo/.gemini/antigravity/brain/0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d/popup_local_guides_new_webp.png"
        await page.screenshot(path=shot4)
        print("4. Captured popup with new local guides webp:", shot4)

        print("Console errors:", errors)
        await browser.close()
        print("Done!")

if __name__ == "__main__":
    asyncio.run(run())

