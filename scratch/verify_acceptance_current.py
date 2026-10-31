import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        for w, h in [(1440, 900), (1920, 1080)]:
            print(f"\n================ VIEWPORT {w}x{h} ================")
            context = await browser.new_context(viewport={"width": w, "height": h})
            page = await context.new_page()

            errors = []
            page.on("console", lambda msg: errors.append(f"Console {msg.type}: {msg.text}") if msg.type == "error" else None)
            page.on("pageerror", lambda err: errors.append(f"PageError: {err}"))

            await page.goto("http://localhost:3000", wait_until="networkidle")
            await page.locator("#challenges").scroll_into_view_if_needed()
            await page.wait_for_timeout(1000)

            # 1. Idle state check
            idle_path = f"C:/Users/lenovo/.gemini/antigravity/brain/0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d/scattered_idle_{w}x{h}.png"
            await page.screenshot(path=idle_path)
            print(f"Captured idle screenshot: {idle_path}")

            # Check all 6 cards bounding boxes for overlap and screen clipping
            card_names = [
                "Overcrowding", "Local guides", "Changing plans",
                "Unreasonable prices", "Safety concerns", "Too much planning"
            ]
            boxes = {}
            for name in card_names:
                card = page.locator(f"button[aria-label*='{name}']").first
                box = await card.bounding_box()
                assert box is not None, f"Card {name} not found"
                boxes[name] = box
                print(f"Card '{name}': x={box['x']:.1f}, y={box['y']:.1f}, w={box['width']:.1f}, h={box['height']:.1f}")

                # Verify not clipped on right edge
                assert box['x'] + box['width'] <= w - 10, f"Card {name} clipped on right edge: {box['x'] + box['width']} > {w - 10}"
                # Verify not clipped on left
                assert box['x'] >= 200, f"Card {name} overlapping left navigation/heading: x={box['x']}"

            # Check overlap between any two cards
            for i in range(len(card_names)):
                for j in range(i + 1, len(card_names)):
                    n1, n2 = card_names[i], card_names[j]
                    b1, b2 = boxes[n1], boxes[n2]
                    overlap_x = max(0, min(b1['x'] + b1['width'], b2['x'] + b2['width']) - max(b1['x'], b2['x']))
                    overlap_y = max(0, min(b1['y'] + b1['height'], b2['y'] + b2['height']) - max(b1['y'], b2['y']))
                    if overlap_x > 0 and overlap_y > 0:
                        print(f"WARNING: Potential overlap between {n1} and {n2}: {overlap_x}x{overlap_y}")
                        assert False, f"Cards overlap between {n1} and {n2}"
            print("ZERO card overlaps verified!")

            # 2. Hover check (Local guides)
            card_local = page.locator("button[aria-label*='Local guides']").first
            await card_local.hover(force=True)
            await page.wait_for_timeout(1200) # plane flies
            hover_path = f"C:/Users/lenovo/.gemini/antigravity/brain/0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d/scattered_hover_{w}x{h}.png"
            await page.screenshot(path=hover_path)
            print(f"Captured hover screenshot: {hover_path}")

            # 3. Click to open popup (Changing plans)
            card_changing = page.locator("button[aria-label*='Changing plans']").first
            await card_changing.click(force=True)
            await page.wait_for_timeout(900)
            popup_path = f"C:/Users/lenovo/.gemini/antigravity/brain/0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d/popup_frosted_{w}x{h}.png"
            await page.screenshot(path=popup_path)
            print(f"Captured popup screenshot: {popup_path}")

            popup = page.locator("[role='dialog']")
            p_box = await popup.bounding_box()
            print(f"Popup frame: x={p_box['x']:.1f}, y={p_box['y']:.1f}, w={p_box['width']:.1f}, h={p_box['height']:.1f}")

            # Verify WebP inside popup
            img = popup.locator("img")
            img_src = await img.get_attribute("src")
            print(f"Popup WebP src: {img_src}")
            assert "changing-plans.webp" in img_src

            # Close popup
            await popup.locator("button[aria-label='Close popup']").click()
            await page.wait_for_timeout(400)

            print(f"ERRORS for {w}x{h}:", errors if errors else "ZERO errors!")
            await context.close()

        await browser.close()

asyncio.run(run())

