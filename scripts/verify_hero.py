import os
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT_DIR = Path(r"C:\Users\lenovo\.gemini\antigravity-ide\brain\033395f2-57e2-43c7-8555-346e4eadba48\screenshots")
OUT_DIR.mkdir(parents=True, exist_ok=True)

PROG_LIST = [0.02, 0.15, 0.3, 0.45, 0.58, 0.7]
VIEWPORTS = [
    {"name": "desktop", "width": 1440, "height": 900, "scroll_len_mult": 9.0},
    {"name": "mobile", "width": 390, "height": 844, "scroll_len_mult": 6.5},
]

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        for vp in VIEWPORTS:
            context = browser.new_context(
                viewport={"width": vp["width"], "height": vp["height"]},
                device_scale_factor=1,
            )
            page = context.new_page()
            print(f"Navigating for {vp['name']} ({vp['width']}x{vp['height']})...")
            page.goto("http://localhost:3000", wait_until="networkidle")
            page.wait_for_timeout(1000)

            # Retrieve exact scrollMax from page debug or fallback
            debug_info = page.evaluate("() => window.__debugHero || {}")
            page_scroll_max = debug_info.get("scrollMax")
            h = vp["height"]
            scroll_max = page_scroll_max if page_scroll_max else (vp["scroll_len_mult"] - 1.0) * h
            print(f"  Using scroll_max = {scroll_max} (height={h})")

            for prog in PROG_LIST:
                sy = prog * scroll_max
                page.evaluate(f"window.scrollTo(0, {sy})")

                # Allow 55 requestAnimationFrame cycles for GSAP ticker damping (0.07) to converge
                page.evaluate("""() => new Promise(resolve => {
                    let count = 0;
                    function f() {
                        count++;
                        if (count > 55) resolve();
                        else requestAnimationFrame(f);
                    }
                    requestAnimationFrame(f);
                })""")

                fname = f"{vp['name']}_p_{int(prog*100):02d}.png"
                out_path = OUT_DIR / fname
                page.screenshot(path=str(out_path), full_page=False)
                print(f"  Saved {fname} (target_p={prog}, scroll_y={sy:.0f})")

            context.close()
        browser.close()
    print("All screenshots captured successfully.")

if __name__ == "__main__":
    run()
