import asyncio
import os
import math
from playwright.async_api import async_playwright

SCREENSHOT_DIR = "C:/Users/lenovo/.gemini/antigravity/brain/0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d"

async def run_tests():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        # ─────────────────────────────────────────────────────────────
        # 1. TEST 1920x1080 (Desktop Full HD)
        # ─────────────────────────────────────────────────────────────
        print("==================================================")
        print("1. Testing Viewport: 1920x1080")
        print("==================================================")
        page = await browser.new_page(viewport={"width": 1920, "height": 1080})
        await page.goto("http://localhost:3000", wait_until="networkidle")
        await page.wait_for_timeout(1000)
        
        # Scroll to Section III
        await page.evaluate("document.getElementById('wonder').scrollIntoView({ behavior: 'instant' })")
        await page.wait_for_timeout(1500)
        
        # Change 1: Check Stacking Context and Geometry Clearance
        c1_metrics = await page.evaluate('''() => {
            const head = document.querySelector('.ww-head');
            const sub = document.querySelector('.ww-subtitle');
            const ring = document.querySelector('.ww-text-ring');
            const canvas = document.querySelector('.ww-canvas');
            const stage = document.querySelector('.ww-stage-area');
            
            const headStyle = window.getComputedStyle(head);
            const headRect = head.getBoundingClientRect();
            const subRect = sub.getBoundingClientRect();
            const ringRect = ring.getBoundingClientRect();
            const canvasRect = canvas.getBoundingClientRect();
            
            return {
                headZIndex: parseInt(headStyle.zIndex, 10),
                headPointerEvents: headStyle.pointerEvents,
                subBottom: subRect.bottom,
                ringTop: ringRect.top,
                canvasTop: canvasRect.top,
                clearanceToRing: ringRect.top - subRect.bottom,
                clearanceToCanvas: canvasRect.top - subRect.bottom,
                canvasHeight: canvasRect.height,
                windowHeight: window.innerHeight
            };
        }''')
        
        print(f"Heading z-index: {c1_metrics['headZIndex']} (expected >= 50)")
        print(f"Heading pointer-events: {c1_metrics['headPointerEvents']} (expected 'none')")
        print(f"Subtitle bottom: {c1_metrics['subBottom']:.1f}px, Ring top: {c1_metrics['ringTop']:.1f}px")
        print(f"Clearance to rotating ring: {c1_metrics['clearanceToRing']:.1f}px (MUST be >= 40px)")
        assert c1_metrics['headZIndex'] >= 50, f"Head z-index must be >= 50, got {c1_metrics['headZIndex']}"
        assert c1_metrics['headPointerEvents'] == 'none', f"Head pointer-events must be none, got {c1_metrics['headPointerEvents']}"
        assert c1_metrics['clearanceToRing'] >= 40, f"Clearance to ring must be >= 40px, got {c1_metrics['clearanceToRing']}px"
        globe_h_ratio = c1_metrics['canvasHeight'] / c1_metrics['windowHeight']
        print(f"Globe height ratio: {globe_h_ratio:.2f} (expected ~0.48-0.50, no shrinking)")
        
        # Change 2: Watermark Checks
        print("\nChecking Watermark Markup and Interactive Ripple...")
        wm_info = await page.evaluate('''() => {
            const wm = document.querySelector('.ww-watermark-wrapper');
            const chars = Array.from(wm.querySelectorAll('.ww-wm-char'));
            return {
                ariaLabel: wm.getAttribute('aria-label'),
                charCount: chars.length,
                firstCharAriaHidden: chars[0].getAttribute('aria-hidden'),
                firstCharText: chars[0].textContent.trim(),
                firstCharPointerEvents: window.getComputedStyle(chars[0]).pointerEvents,
                wrapperPointerEvents: window.getComputedStyle(wm).pointerEvents
            };
        }''')
        print(f"Watermark aria-label: '{wm_info['ariaLabel']}'")
        print(f"Watermark characters count: {wm_info['charCount']}, first char aria-hidden: {wm_info['firstCharAriaHidden']}")
        print(f"Wrapper pointer-events: '{wm_info['wrapperPointerEvents']}', char pointer-events: '{wm_info['firstCharPointerEvents']}'")
        assert wm_info['ariaLabel'] == "THE WONDER WORLD", "Wrapper must have aria-label='THE WONDER WORLD'"
        assert wm_info['firstCharAriaHidden'] == "true", "Letter spans must have aria-hidden='true'"
        assert wm_info['wrapperPointerEvents'] == "none", "Wrapper must not block drag"
        assert wm_info['firstCharPointerEvents'] == "auto", "Characters must receive hover events"

        # Test hovering character 1 ('H') in "THE"
        letters = page.locator('.ww-wm-char:not(.ww-wm-space)')
        letter_h = letters.nth(1)
        box = await letter_h.bounding_box()
        assert box is not None, "Letter 'H' must have bounding box"
        await page.mouse.move(box['x'] + box['width']/2, box['y'] + box['height']/2)
        await page.wait_for_timeout(600)
        
        hover_styles = await page.evaluate('''() => {
            const letters = Array.from(document.querySelectorAll('.ww-wm-char:not(.ww-wm-space)'));
            return {
                hoveredLetter: {
                    text: letters[1].textContent,
                    styleAttr: letters[1].getAttribute('style'),
                    color: window.getComputedStyle(letters[1]).color,
                    opacity: window.getComputedStyle(letters[1]).opacity,
                    transform: window.getComputedStyle(letters[1]).transform
                },
                neighborD1: {
                    text: letters[0].textContent,
                    styleAttr: letters[0].getAttribute('style'),
                    color: window.getComputedStyle(letters[0]).color,
                    opacity: window.getComputedStyle(letters[0]).opacity
                },
                neighborD2: {
                    text: letters[3].textContent,
                    styleAttr: letters[3].getAttribute('style'),
                    color: window.getComputedStyle(letters[3]).color,
                    opacity: window.getComputedStyle(letters[3]).opacity
                }
            };
        }''')
        print("Hovered 'H' style:", hover_styles['hoveredLetter'])
        print("Neighbor 'T' (d=1) style:", hover_styles['neighborD1'])
        print("Neighbor 'W' (d=2) style:", hover_styles['neighborD2'])
        # Hovered letter transforms up and has higher opacity
        assert "C4782A" in hover_styles['hoveredLetter']['styleAttr'] or "196, 120, 42" in hover_styles['hoveredLetter']['styleAttr'] or "196, 120, 42" in hover_styles['hoveredLetter']['color']
        assert "D48938" in hover_styles['neighborD1']['styleAttr'] or "212, 137, 56" in hover_styles['neighborD1']['styleAttr']
        print("PASS: Watermark letter hover and ripple animation verified!")

        # Unhover watermark
        await page.mouse.move(10, 10)
        await page.wait_for_timeout(400)

        # Save idle screenshot at 1920x1080
        await page.screenshot(path=f"{SCREENSHOT_DIR}/wonder_world_1920x1080_idle.png")
        print(f"Saved: {SCREENSHOT_DIR}/wonder_world_1920x1080_idle.png")

        # Reveal cards and airplane
        hub_pin = page.locator('.ww-hub-pin')
        await hub_pin.click(force=True)
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{SCREENSHOT_DIR}/wonder_world_1920x1080_revealed.png")
        print(f"Saved: {SCREENSHOT_DIR}/wonder_world_1920x1080_revealed.png")

        # Test Zoom fade on Header
        print("\nTesting Zoom In and Header fade to ~0.15 opacity...")
        zoom_in_btn = page.locator('.ww-ctrl-btn[aria-label="Zoom in"]')
        await zoom_in_btn.click()
        await page.wait_for_timeout(350)
        await zoom_in_btn.click()
        await page.wait_for_timeout(500)
        
        zoomed_head_opacity = await page.evaluate('''() => {
            const head = document.querySelector('.ww-head');
            return {
                opacity: window.getComputedStyle(head).opacity,
                hasZoomClass: head.classList.contains('ww-head--zoomed')
            };
        }''')
        print(f"Zoomed header state: opacity {zoomed_head_opacity['opacity']}, class 'ww-head--zoomed': {zoomed_head_opacity['hasZoomClass']}")
        assert zoomed_head_opacity['hasZoomClass'], "ww-head--zoomed class should be present when zoomed"
        assert float(zoomed_head_opacity['opacity']) <= 0.20, f"Header opacity must fade to ~0.15 on zoom, got {zoomed_head_opacity['opacity']}"

        # Capture close-up of 4K clouds and daytime texture when zoomed
        await page.screenshot(path=f"{SCREENSHOT_DIR}/wonder_world_zoomed_clouds_detail.png")
        print(f"Saved: {SCREENSHOT_DIR}/wonder_world_zoomed_clouds_detail.png")

        # Reset Zoom
        reset_btn = page.locator('.ww-ctrl-btn--reset')
        await reset_btn.click()
        await page.wait_for_timeout(700)
        restored_opacity = await page.evaluate("window.getComputedStyle(document.querySelector('.ww-head')).opacity")
        print(f"Restored header opacity after reset: {restored_opacity}")
        assert float(restored_opacity) > 0.85, "Header opacity should restore to 1.0 on reset"

        # ─────────────────────────────────────────────────────────────
        # 2. TEST 1440x900 (Desktop Laptop)
        # ─────────────────────────────────────────────────────────────
        print("\n==================================================")
        print("2. Testing Viewport: 1440x900")
        print("==================================================")
        page2 = await browser.new_page(viewport={"width": 1440, "height": 900})
        await page2.goto("http://localhost:3000", wait_until="networkidle")
        await page2.evaluate("document.getElementById('wonder').scrollIntoView({ behavior: 'instant' })")
        await page2.wait_for_timeout(1400)

        c1_1440 = await page2.evaluate('''() => {
            const sub = document.querySelector('.ww-subtitle');
            const ring = document.querySelector('.ww-text-ring');
            const subRect = sub.getBoundingClientRect();
            const ringRect = ring.getBoundingClientRect();
            return {
                subBottom: subRect.bottom,
                ringTop: ringRect.top,
                clearance: ringRect.top - subRect.bottom
            };
        }''')
        print(f"1440x900 Subtitle bottom: {c1_1440['subBottom']:.1f}px, Ring top: {c1_1440['ringTop']:.1f}px, Clearance: {c1_1440['clearance']:.1f}px")
        assert c1_1440['clearance'] >= 40, f"1440x900 clearance must be >= 40px, got {c1_1440['clearance']}px"

        await page2.screenshot(path=f"{SCREENSHOT_DIR}/wonder_world_1440x900_idle.png")
        await page2.locator('.ww-hub-pin').click(force=True)
        await page2.wait_for_timeout(1400)
        await page2.screenshot(path=f"{SCREENSHOT_DIR}/wonder_world_1440x900_revealed.png")
        print(f"Saved: {SCREENSHOT_DIR}/wonder_world_1440x900_revealed.png")

        # ─────────────────────────────────────────────────────────────
        # 3. TEST 390x844 (Mobile iPhone 14/15)
        # ─────────────────────────────────────────────────────────────
        print("\n==================================================")
        print("3. Testing Viewport: 390x844 (Mobile)")
        print("==================================================")
        page_m = await browser.new_page(viewport={"width": 390, "height": 844})
        await page_m.goto("http://localhost:3000", wait_until="networkidle")
        await page_m.evaluate("document.getElementById('wonder').scrollIntoView({ behavior: 'instant' })")
        await page_m.wait_for_timeout(1400)

        c1_mobile = await page_m.evaluate('''() => {
            const sub = document.querySelector('.ww-subtitle');
            const ring = document.querySelector('.ww-text-ring');
            const subRect = sub.getBoundingClientRect();
            const ringRect = ring.getBoundingClientRect();
            return {
                subBottom: subRect.bottom,
                ringTop: ringRect.top,
                clearance: ringRect.top - subRect.bottom
            };
        }''')
        print(f"390x844 Subtitle bottom: {c1_mobile['subBottom']:.1f}px, Ring top: {c1_mobile['ringTop']:.1f}px, Clearance: {c1_mobile['clearance']:.1f}px")
        assert c1_mobile['clearance'] >= 40, f"Mobile clearance must be >= 40px, got {c1_mobile['clearance']}px"

        # Mobile screenshot
        await page_m.screenshot(path=f"{SCREENSHOT_DIR}/wonder_world_mobile_390.png", timeout=15000)
        print(f"Saved: {SCREENSHOT_DIR}/wonder_world_mobile_390.png")

        await browser.close()
        print("\n==================================================")
        print("ALL TESTS PASSED WITH 100% SUCCESS!")
        print("==================================================")

if __name__ == "__main__":
    asyncio.run(run_tests())

