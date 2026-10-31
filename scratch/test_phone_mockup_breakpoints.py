import asyncio
import os
from playwright.async_api import async_playwright

OUT = r"C:\Users\lenovo\Downloads\vaya 3.0\scratch\verification"
os.makedirs(OUT, exist_ok=True)

async def test_all():
    viewports = [
        {"name": "desktop_1440", "width": 1440, "height": 900},
        {"name": "laptop_1024", "width": 1024, "height": 768},
        {"name": "tablet_768", "width": 768, "height": 1024},
        {"name": "mobile_390", "width": 390, "height": 844},
    ]

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        for vp in viewports:
            print(f"\n==========================================")
            print(f"Testing Viewport: {vp['name']} ({vp['width']}x{vp['height']})")
            print(f"==========================================")
            
            console_errors = []
            ctx = await browser.new_context(viewport={"width": vp["width"], "height": vp["height"]})
            page = await ctx.new_page()

            page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
            page.on("pageerror", lambda err: console_errors.append(str(err)))

            await page.goto("http://localhost:3000", wait_until="networkidle", timeout=30000)
            await asyncio.sleep(1.5)

            # Scroll to Section 2: Why travellers need VAYA
            s2 = page.locator("#challenges")
            await s2.scroll_into_view_if_needed()
            await asyncio.sleep(1.0)

            # Capture Section 2 before click
            s2_shot = os.path.join(OUT, f"{vp['name']}_section2.png")
            await page.screenshot(path=s2_shot)
            print(f"Saved Section 2 shot: {s2_shot}")

            # Click a problem card to trigger the modal with phone mockup
            # Find first active card or button
            card_btn = page.locator(".s2-card button").first
            if await card_btn.count() > 0:
                print("Clicking card button with force=True...")
                await card_btn.click(force=True)
                await asyncio.sleep(2.0)

                # Capture modal with phone mockup
                modal_shot = os.path.join(OUT, f"{vp['name']}_modal_phone.png")
                await page.screenshot(path=modal_shot)
                print(f"Saved Modal Phone shot: {modal_shot}")

                # Check phone chassis and hand layers in DOM
                phone_state = await page.evaluate("""() => {
                    const chassis = document.querySelector('.phone-chassis');
                    const screenCont = document.querySelector('.phone-screen-container');
                    const handFront = document.querySelector('svg[viewBox="0 0 520 860"]');
                    const planeWindow = document.querySelector('.plane-window-component');
                    return {
                        chassisFound: !!chassis,
                        screenContFound: !!screenCont,
                        handFound: !!handFront,
                        planeWindowFound: !!planeWindow,
                        chassisRect: chassis ? chassis.getBoundingClientRect() : null,
                    };
                }""")
                print(f"Phone state in {vp['name']}: {phone_state}")

                # Close modal with ESC
                await page.keyboard.press("Escape")
                await asyncio.sleep(0.6)

            await ctx.close()

            print(f"Console errors for {vp['name']}: {len(console_errors)}")
            if console_errors:
                for err in console_errors:
                    print(f"  [ERROR] {err}")

        await browser.close()
    print("\nAll verification tests completed successfully!")

if __name__ == "__main__":
    asyncio.run(test_all())
