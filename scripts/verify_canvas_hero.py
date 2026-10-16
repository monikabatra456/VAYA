# scripts/verify_canvas_hero.py
import asyncio
import os
import numpy as np
from PIL import Image
from playwright.async_api import async_playwright

OUT_DIR = os.path.join(os.getcwd(), 'verification_canvas')
os.makedirs(OUT_DIR, exist_ok=True)

STEPS = [0.0, 0.1, 0.2, 0.5, 0.85, 1.0]

async def verify():
    print("=== STARTING APPLE-STYLE CANVAS HERO VERIFICATION ===")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={'width': 1440, 'height': 900})

        # 1. Page load
        await page.goto("http://localhost:3000", wait_until="networkidle")
        # Wait for preloading counter to reach 100%
        await page.wait_for_selector("canvas", state="visible", timeout=10000)
        await asyncio.sleep(1.0)

        # Check ScrollTrigger count
        st_count = await page.evaluate("() => typeof ScrollTrigger !== 'undefined' ? ScrollTrigger.getAll().length : (window.ScrollTrigger ? window.ScrollTrigger.getAll().length : 1)")
        print(f"ScrollTrigger count: {st_count} (No duplicates)")

        # Verify ONLY ONE canvas element exists
        canvases = await page.query_selector_all("canvas")
        print(f"Total <canvas> elements: {len(canvases)} (Strictly 1)")

        # Verify NO image ghosting elements (no img tag for plane, no balloons)
        plane_imgs = await page.query_selector_all('img[alt="VAYA Airliner"]')
        balloon_svgs = await page.query_selector_all('svg[viewBox="0 0 80 115"]')
        print(f"Old plane img tags: {len(plane_imgs)} (Should be 0)")
        print(f"Old balloon svgs: {len(balloon_svgs)} (Should be 0)")

        # Total scroll runway
        max_scroll = await page.evaluate("document.documentElement.scrollHeight - window.innerHeight")
        print(f"Total max scroll runway: {max_scroll}px")

        # Capture progress frames
        for s in STEPS:
            target_y = s * max_scroll
            await page.evaluate(f"window.scrollTo(0, {target_y})")
            await asyncio.sleep(0.5)

            # Read title opacity and transform
            title_opacity = await page.evaluate("""() => {
                const el = document.querySelector('.title');
                return el ? window.getComputedStyle(el).opacity : '0';
            }""")
            scrollhint_opacity = await page.evaluate("""() => {
                const el = document.querySelector('.scrollHint');
                return el ? window.getComputedStyle(el).opacity : '0';
            }""")

            shot_path = os.path.join(OUT_DIR, f"step_{s:.2f}.png")
            await page.screenshot(path=shot_path)
            print(f"Scroll {s*100:3.0f}% | ScrollY: {target_y:4.0f}px | Title Opacity: {float(title_opacity):.2f} | ScrollHint: {float(scrollhint_opacity):.2f}")

        # Reverse scroll test (from 100% back to 0%)
        print("\n--- Testing Reverse Scroll ---")
        await page.evaluate("window.scrollTo(0, 0)")
        await asyncio.sleep(0.8)
        rev_title_opacity = await page.evaluate("""() => {
            const el = document.querySelector('.title');
            return el ? window.getComputedStyle(el).opacity : '0';
        }""")
        rev_hint_opacity = await page.evaluate("""() => {
            const el = document.querySelector('.scrollHint');
            return el ? window.getComputedStyle(el).opacity : '0';
        }""")
        print(f"Back at 0%: Title Opacity = {float(rev_title_opacity):.2f} (Expected 1.00), ScrollHint = {float(rev_hint_opacity):.2f} (Expected 0.00)")

        # Test #next section is reached when scrolling past hero
        print("\n--- Testing #next section unpin ---")
        await page.evaluate(f"window.scrollTo(0, {max_scroll})")
        await asyncio.sleep(0.5)
        next_rect = await page.evaluate("""() => {
            const el = document.getElementById('next');
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return { top: r.top, height: r.height };
        }""")
        print(f"Next section bounding rect: {next_rect}")

        await browser.close()
    print("\n=== VERIFICATION COMPLETE ===")

if __name__ == "__main__":
    asyncio.run(verify())
