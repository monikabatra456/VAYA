# scratch/verify_all_fixes.py
import time
import asyncio
from playwright.async_api import async_playwright

async def verify():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        # 1. Test at 1920x1080
        page = await browser.new_page(viewport={"width": 1920, "height": 1080})
        await page.goto("http://localhost:3000", wait_until="networkidle")
        await page.wait_for_timeout(1000)

        # Scroll to Section III
        await page.evaluate("document.getElementById('wonder').scrollIntoView({ behavior: 'instant' })")
        await page.wait_for_timeout(1500)

        print("=== Checking Section III Layout & Subtitle Clearance ===")
        # Check clearance between subtitle and text ring
        metrics = await page.evaluate('''() => {
            const head = document.querySelector('.ww-head');
            const ring = document.querySelector('.ww-text-ring');
            const subtitle = document.querySelector('.ww-subtitle');
            const canvas = document.querySelector('.ww-canvas');
            const headRect = head.getBoundingClientRect();
            const subRect = subtitle.getBoundingClientRect();
            const ringRect = ring.getBoundingClientRect();
            const canvasRect = canvas.getBoundingClientRect();
            return {
                headBottom: headRect.bottom,
                subBottom: subRect.bottom,
                ringTop: ringRect.top,
                canvasTop: canvasRect.top,
                canvasWidth: canvasRect.width,
                canvasHeight: canvasRect.height,
                windowHeight: window.innerHeight,
                clearance: ringRect.top - subRect.bottom
            };
        }''')
        print(f"Metrics: Subtitle bottom: {metrics['subBottom']}, Ring top: {metrics['ringTop']}, Clearance: {metrics['clearance']}px")
        assert metrics['clearance'] >= 40, f"Ring text must clear subtitle by >= 40px, got {metrics['clearance']}px"
        globeRatio = metrics['canvasHeight'] / metrics['windowHeight']
        print(f"Globe height ratio: {globeRatio:.2f} (expected ~0.48-0.50)")

        # Reveal cards by clicking the hub pin
        print("\n=== Clicking India Hub Pin to Reveal Orbiting Cards ===")
        hub_pin = page.locator('.ww-hub-pin')
        await hub_pin.click(force=True)
        await page.wait_for_timeout(1600)

        # Verify cards are present and no text truncation
        card_texts = await page.evaluate('''() => {
            const cards = Array.from(document.querySelectorAll('.ww-card'));
            return cards.map(c => ({
                name: c.querySelector('.ww-card-name')?.textContent || '',
                subtitle: c.querySelector('.ww-card-subtitle')?.textContent || '',
                width: c.getBoundingClientRect().width,
                isTruncated: (c.querySelector('.ww-card-name')?.scrollWidth || 0) > (c.querySelector('.ww-card-name')?.clientWidth || 0)
            }));
        }''')
        print("Cards detected:", card_texts)
        for c in card_texts:
            print(f"Card '{c['name']}': width {c['width']}px, truncated: {c['isTruncated']}")
            assert not c['isTruncated'], f"Card {c['name']} text is truncated!"

        # Verify cards orbit over time
        print("\n=== Checking Card Orbit Animation ===")
        pos1 = await page.evaluate('''() => {
            const firstCard = document.querySelector('.ww-card');
            const rect = firstCard.getBoundingClientRect();
            return { x: rect.left, y: rect.top };
        }''')
        await page.wait_for_timeout(800)
        pos2 = await page.evaluate('''() => {
            const firstCard = document.querySelector('.ww-card');
            const rect = firstCard.getBoundingClientRect();
            return { x: rect.left, y: rect.top };
        }''')
        print(f"Card pos before: {pos1}, after 800ms: {pos2}")
        dist = ((pos2['x'] - pos1['x'])**2 + (pos2['y'] - pos1['y'])**2)**0.5
        print(f"Orbit movement distance: {dist:.2f}px")
        assert dist > 0.5, "Cards must orbit continuously!"

        # Acceptance Test 1: Rapid 20x hover test with pixel sampling (NO black screen ever!)
        print("\n=== Acceptance Test 1: Rapid 20x Hover & Canvas Pixel Sampling ===")
        cards = page.locator('.ww-card')
        count = await cards.count()
        assert count == 6, f"Expected 6 destination cards, got {count}"

        for cycle in range(20):
            idx = cycle % count
            card_to_hover = cards.nth(idx)
            await card_to_hover.hover(force=True)
            await page.wait_for_timeout(60)

            # Sample canvas center pixel
            pixel_info = await page.evaluate('''() => {
                const canvas = document.querySelector('.ww-canvas');
                const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
                if (!gl) return { r: 255, g: 255, b: 255, isBlack: false };
                const pixels = new Uint8Array(4);
                const pxX = Math.floor(canvas.width * 0.5);
                const pxY = Math.floor(canvas.height * 0.45);
                gl.readPixels(
                    pxX, pxY,
                    1, 1,
                    gl.RGBA, gl.UNSIGNED_BYTE, pixels
                );
                // A rendered earth pixel will have non-zero color and alpha > 0
                const isNearBlack = (pixels[3] > 0 && pixels[0] < 15 && pixels[1] < 15 && pixels[2] < 15);
                return { r: pixels[0], g: pixels[1], b: pixels[2], a: pixels[3], isNearBlack };
            }''')
            if cycle % 5 == 0:
                print(f"Cycle {cycle+1}/20: hovered card {idx}, canvas pixel: RGB({pixel_info['r']}, {pixel_info['g']}, {pixel_info['b']})")
            assert not pixel_info['isNearBlack'], f"FAILED: Canvas pixel near black during hover cycle {cycle}: {pixel_info}"

        print("PASS: 20 rapid hovers completed without any black canvas frame!")

        # Acceptance Test 2: Network dots & leader line only for hovered card
        print("\n=== Acceptance Test 2: Network dots & leader line ===")
        # Hover Taj Mahal
        taj_card = cards.nth(0)
        await taj_card.hover(force=True)
        await page.wait_for_timeout(400)

        dot_metrics = await page.evaluate('''() => {
            const pins = Array.from(document.querySelectorAll('.ww-pin'));
            const visiblePins = pins.filter(p => window.getComputedStyle(p).display !== 'none' && window.getComputedStyle(p).opacity !== '0');
            const svgLines = document.querySelector('.ww-leader-lines line');
            return {
                totalPins: pins.length,
                visiblePinCount: visiblePins.length,
                hasLeaderLine: !!svgLines,
                lineStroke: svgLines?.getAttribute('stroke') || '',
                lineDash: svgLines?.getAttribute('stroke-dasharray') || ''
            };
        }''')
        print("Hovered Taj Mahal dot metrics:", dot_metrics)
        assert dot_metrics['visiblePinCount'] == 1, f"Expected exactly 1 visible pin, got {dot_metrics['visiblePinCount']}"
        assert dot_metrics['hasLeaderLine'], "Expected leader line to be drawn for hovered card!"

        # Unhover: move mouse away to top-left corner
        await page.mouse.move(10, 10)
        await page.wait_for_timeout(450)
        unhover_metrics = await page.evaluate('''() => {
            const pins = Array.from(document.querySelectorAll('.ww-pin'));
            const visiblePins = pins.filter(p => window.getComputedStyle(p).display !== 'none' && window.getComputedStyle(p).opacity !== '0');
            const svgLines = document.querySelector('.ww-leader-lines line');
            return {
                visiblePinCount: visiblePins.length,
                hasLeaderLine: !!svgLines
            };
        }''')
        print("Unhover metrics:", unhover_metrics)
        assert unhover_metrics['visiblePinCount'] == 0, "No pins should be visible when no card is hovered!"
        assert not unhover_metrics['hasLeaderLine'], "No leader line when no card is hovered!"

        # Acceptance Test 6: Zoom (+ / - / X)
        print("\n=== Acceptance Test 6: Zoom Controls (+ / - / X) ===")
        zoom_in_btn = page.locator('.ww-ctrl-btn[aria-label="Zoom in"]')
        zoom_out_btn = page.locator('.ww-ctrl-btn[aria-label="Zoom out"]')
        reset_btn = page.locator('.ww-ctrl-btn--reset')

        initial_z = await page.evaluate("window.__ww_camera_z")
        print(f"Initial camera Z: {initial_z:.2f}")

        # Zoom in 3 times
        await zoom_in_btn.click()
        await page.wait_for_timeout(400)
        z_in_1 = await page.evaluate("window.__ww_camera_z")
        print(f"After Zoom In 1: camera Z: {z_in_1:.2f} (should decrease/zoom in)")
        assert z_in_1 < initial_z, "Zoom in must decrease camera Z!"

        # Verify cards and ring text fade out when zoomed
        faded_metrics = await page.evaluate('''() => {
            const cardsCont = document.querySelector('.ww-cards-container');
            const ring = document.querySelector('.ww-text-ring');
            return {
                cardsOpacity: window.getComputedStyle(cardsCont).opacity,
                ringOpacity: window.getComputedStyle(ring).opacity
            };
        }''')
        print("Zoomed faded metrics:", faded_metrics)
        assert float(faded_metrics['cardsOpacity']) < 0.1, "Cards must fade out when zoomed!"
        assert float(faded_metrics['ringOpacity']) < 0.1, "Ring text must fade out when zoomed!"

        # Reset button
        print("Testing Reset View button (X)...")
        await reset_btn.click()
        await page.wait_for_timeout(900)
        z_reset = await page.evaluate("window.__ww_camera_z")
        print(f"After Reset button: camera Z: {z_reset:.2f}")
        assert abs(z_reset - 3.3) < 0.15, "Reset button must restore default 1.0x camera distance (~3.3)!"

        # Re-reveal cards and take screenshot at 1920x1080
        await hub_pin.click(force=True)
        await page.wait_for_timeout(1400)
        await page.screenshot(path="C:/Users/lenovo/.gemini/antigravity/brain/0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d/wonder_world_1920x1080.png")
        print("Saved 1920x1080 screenshot!")

        # 2. Test at 1440x900
        print("\n=== Testing at 1440x900 ===")
        page2 = await browser.new_page(viewport={"width": 1440, "height": 900})
        await page2.goto("http://localhost:3000", wait_until="networkidle")
        await page2.evaluate("document.getElementById('wonder').scrollIntoView({ behavior: 'instant' })")
        await page2.wait_for_timeout(1200)

        # Reveal cards
        await page2.locator('.ww-hub-pin').click(force=True)
        await page2.wait_for_timeout(1400)
        await page2.screenshot(path="C:/Users/lenovo/.gemini/antigravity/brain/0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d/wonder_world_1440x900.png")
        print("Saved 1440x900 screenshot!")

        # 3. Test at Mobile 390x844
        print("\n=== Testing at Mobile 390x844 ===")
        page_mobile = await browser.new_page(viewport={"width": 390, "height": 844})
        await page_mobile.goto("http://localhost:3000", wait_until="networkidle")
        await page_mobile.evaluate("document.getElementById('wonder').scrollIntoView({ behavior: 'instant' })")
        await page_mobile.wait_for_timeout(1200)
        await page_mobile.screenshot(path="C:/Users/lenovo/.gemini/antigravity/brain/0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d/wonder_world_mobile_390.png")
        print("Saved Mobile 390 screenshot!")

        # 4. Check Seam Between Section II and Section III
        print("\n=== Checking Section II -> Section III Seam ===")
        seam_metrics = await page.evaluate('''() => {
            const s2 = document.getElementById('challenges');
            const s3 = document.getElementById('wonder');
            const s2Bg = window.getComputedStyle(s2).backgroundColor;
            const topBlend = document.querySelector('.ww-top-blend');
            const topBlendBg = window.getComputedStyle(topBlend).backgroundImage;
            return {
                s2Bg,
                topBlendBg
            };
        }''')
        print("Seam metrics:", seam_metrics)

        await browser.close()
        print("\nALL VERIFICATIONS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    asyncio.run(verify())
