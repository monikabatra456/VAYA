import asyncio
import os
from playwright.async_api import async_playwright

OUT = r"C:\Users\lenovo\.gemini\antigravity\brain\0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d"

async def test_viewport(width, height):
    print(f"\n--- Testing viewport {width}x{height} ---")
    console_errors = []
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport={"width": width, "height": height})
        page = await ctx.new_page()

        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
        page.on("pageerror", lambda err: console_errors.append(str(err)))

        await page.goto("http://localhost:3000", wait_until="networkidle", timeout=30000)
        await asyncio.sleep(2.0)

        # Find position of #meet-vaya
        pos = await page.evaluate("""() => {
            const el = document.getElementById('meet-vaya');
            if (!el) return null;
            const rect = el.getBoundingClientRect();
            return {
                top: rect.top + window.scrollY,
                height: el.offsetHeight
            };
        }""")
        print(f"Meet VAYA section pos: {pos}")

        if not pos:
            print("ERROR: #meet-vaya not found in DOM!")
            await browser.close()
            return

        meet_top = pos["top"]

        # Scroll to top of meet-vaya (progress 0)
        # ScrollTrigger pins meet-vaya for +=320% of viewport height (3.2 * height)
        pin_distance = 3.2 * height

        progress_points = [0.0, 0.2, 0.5, 0.75, 0.9]

        for p_val in progress_points:
            target_y = meet_top + (p_val * pin_distance)
            await page.evaluate(f"window.scrollTo(0, {target_y})")
            await asyncio.sleep(0.8)

            # Check state at this progress
            state = await page.evaluate("""() => {
                const stage = document.querySelector('.mv-phone-stage');
                const thumb = document.querySelector('.mv-thumb-img');
                const inner = document.querySelector('.mv-inner');
                const cs = document.querySelector('.mv-coming-soon');
                const activeFeature = document.querySelector('.mv-feature-item.active .mv-feature-label');
                return {
                    stageOpacity: stage ? getComputedStyle(stage).opacity : null,
                    thumbOpacity: thumb ? getComputedStyle(thumb).opacity : null,
                    innerTransform: inner ? inner.style.transform : null,
                    csOpacity: cs ? getComputedStyle(cs).opacity : null,
                    activeLabel: activeFeature ? activeFeature.innerText : null
                };
            }""")
            print(f"Progress {p_val}: {state}")

            filename = f"meet_vaya_{width}x{height}_p{int(p_val * 100)}.png"
            filepath = os.path.join(OUT, filename)
            await page.screenshot(path=filepath)
            print(f"Captured {filename}")

        # Check also 2560x1080 for plate aspect ratio distortion check
        await browser.close()

    print(f"Console errors for {width}x{height}: {len(console_errors)}")
    if console_errors:
        for err in console_errors:
            print("  [Console Error]", err)

async def test_ultrawide():
    print(f"\n--- Testing Ultrawide 2560x1080 ---")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport={"width": 2560, "height": 1080})
        page = await ctx.new_page()
        await page.goto("http://localhost:3000", wait_until="networkidle", timeout=30000)
        await asyncio.sleep(1.5)
        pos = await page.evaluate("""() => {
            const el = document.getElementById('meet-vaya');
            return el ? el.getBoundingClientRect().top + window.scrollY : null;
        }""")
        if pos:
            target_y = pos + 0.5 * (3.2 * 1080)
            await page.evaluate(f"window.scrollTo(0, {target_y})")
            await asyncio.sleep(0.8)
            filepath = os.path.join(OUT, "meet_vaya_2560x1080_p50.png")
            await page.screenshot(path=filepath)
            print("Captured meet_vaya_2560x1080_p50.png")
        await browser.close()

async def main():
    await test_viewport(1440, 900)
    await test_viewport(1920, 1200)
    await test_ultrawide()

if __name__ == "__main__":
    asyncio.run(main())

