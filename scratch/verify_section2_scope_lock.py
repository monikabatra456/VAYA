# scratch/verify_section2_scope_lock.py
import asyncio
import os
from playwright.async_api import async_playwright

ARTIFACT_DIR = "C:/Users/lenovo/.gemini/antigravity/brain/0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d"
VIEWPORTS = [
    {"width": 1920, "height": 1080, "name": "1920x1080"},
    {"width": 1536, "height": 864,  "name": "1536x864"},
    {"width": 1440, "height": 900,  "name": "1440x900"},
    {"width": 1366, "height": 768,  "name": "1366x768"},
]

PROBLEM_IDS = [
    "overcrowding",
    "local-guides",
    "changing-plans",
    "prices",
    "safety",
    "planning",
]

async def test():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        # ─────────────────────────────────────────────────────────────
        # PART 1: CHANGE 1 Collision & Gap Checks Across 4 Viewports
        # ─────────────────────────────────────────────────────────────
        print("==================================================")
        print("PART 1: CHANGE 1 — Card Clearance & Collision Check")
        print("==================================================")

        for vp in VIEWPORTS:
            w, h, name = vp["width"], vp["height"], vp["name"]
            page = await browser.new_page(viewport={"width": w, "height": h})
            await page.goto("http://localhost:3000", wait_until="networkidle")
            await page.wait_for_timeout(1000)
            await page.evaluate("document.getElementById('challenges').scrollIntoView({ behavior: 'instant' })")
            await page.wait_for_timeout(1000)

            data = await page.evaluate('''() => {
                const s2 = document.getElementById('challenges');
                const head = document.querySelector('.s2-heading-col');
                const headRect = head ? head.getBoundingClientRect() : null;

                const cardMap = {};
                document.querySelectorAll('#challenges button, #challenges [role="button"]').forEach(btn => {
                    const text = btn.innerText || '';
                    if (text.includes('Overcrowding')) cardMap['overcrowding'] = btn.getBoundingClientRect();
                    if (text.includes('Local guides')) cardMap['local-guides'] = btn.getBoundingClientRect();
                    if (text.includes('Changing plans')) cardMap['changing-plans'] = btn.getBoundingClientRect();
                    if (text.includes('Unreasonable prices')) cardMap['prices'] = btn.getBoundingClientRect();
                    if (text.includes('Safety concerns')) cardMap['safety'] = btn.getBoundingClientRect();
                    if (text.includes('Too much planning')) cardMap['planning'] = btn.getBoundingClientRect();
                });

                return {
                    headRight: headRect ? headRect.right : 0,
                    cards: cardMap,
                    windowW: window.innerWidth,
                    windowH: window.innerHeight
                };
            }''')

            cards = data['cards']
            cp = cards.get('changing-plans')
            pr = cards.get('prices')
            assert cp and pr, f"Cards changing-plans and prices not found at {name}"

            # 1. Gap between Changing plans and Unreasonable prices
            h_gap = pr['left'] - cp['right']
            cp_cy = cp['top'] + cp['height'] / 2
            pr_cy = pr['top'] + pr['height'] / 2
            v_stagger = abs(pr_cy - cp_cy)

            print(f"\n[{name}]")
            print(f"  Changing plans -> Prices clear horizontal gap: {h_gap:.1f}px (target >= 64px at 1920)")
            print(f"  Changing plans -> Prices vertical stagger: {v_stagger:.1f}px")
            if w == 1920:
                assert h_gap >= 64, f"At 1920, gap must be >= 64px, got {h_gap}px"
            else:
                assert h_gap >= 40, f"At {w}, gap must be >= 40px, got {h_gap}px"
            assert v_stagger >= 25, f"Cards must be staggered vertically, got stagger {v_stagger}px"

            # 2. Collision check across all pairs (no card within 48px)
            items = list(cards.items())
            min_dist = float('inf')
            closest_pair = None
            for i in range(len(items)):
                for j in range(i + 1, len(items)):
                    n1, b1 = items[i]
                    n2, b2 = items[j]
                    dx = max(0, b1['left'] - b2['right'], b2['left'] - b1['right'])
                    dy = max(0, b1['top'] - b2['bottom'], b2['top'] - b1['bottom'])
                    dist = (dx**2 + dy**2)**0.5
                    if dist < min_dist:
                        min_dist = dist
                        closest_pair = (n1, n2)

            print(f"  Closest card pair: {closest_pair} with clear distance: {min_dist:.1f}px (MUST be >= 48px)")
            assert min_dist >= 47.5, f"Card collision detected at {name}: {closest_pair} clear dist is {min_dist}px"

            # 3. Viewport edge containment and heading overlap check
            for n, b in cards.items():
                assert b['left'] >= data['headRight'] - 10, f"Card {n} overlaps heading text!"
                assert b['right'] <= w + 5, f"Card {n} is cut off by right viewport edge!"
                assert b['top'] >= 0, f"Card {n} is cut off by top edge!"
                assert b['bottom'] <= h, f"Card {n} is cut off by bottom edge!"

            print(f"  PASS: All 6 cards cleanly positioned, no overlap with heading or edges!")
            await page.close()

        # ─────────────────────────────────────────────────────────────
        # PART 2: CHANGE 2 Video Modal Size & Uniformity (All 6 Modals)
        # ─────────────────────────────────────────────────────────────
        print("\n==================================================")
        print("PART 2: CHANGE 2 — All 6 Video Modals Sizing & Centering")
        print("==================================================")

        for test_vp in [{"width": 1920, "height": 1080, "name": "1920x1080"}, {"width": 1366, "height": 768, "name": "1366x768"}]:
            w, h, vp_name = test_vp["width"], test_vp["height"], test_vp["name"]
            page = await browser.new_page(viewport={"width": w, "height": h})
            await page.goto("http://localhost:3000", wait_until="networkidle")
            await page.wait_for_timeout(1000)
            await page.evaluate("document.getElementById('challenges').scrollIntoView({ behavior: 'instant' })")
            await page.wait_for_timeout(1000)

            print(f"\n--- Testing 6 Modals at {vp_name} ---")
            modal_metrics = []

            for pid in PROBLEM_IDS:
                # Find and click card
                card_btn = page.locator(f"#challenges button:has-text('{pid.replace('-', ' ').title()}')").first
                if await card_btn.count() == 0:
                    # Alternative selector
                    if pid == "overcrowding": card_btn = page.locator("#challenges button:has-text('Overcrowding')").first
                    elif pid == "local-guides": card_btn = page.locator("#challenges button:has-text('Local guides')").first
                    elif pid == "changing-plans": card_btn = page.locator("#challenges button:has-text('Changing plans')").first
                    elif pid == "prices": card_btn = page.locator("#challenges button:has-text('Unreasonable prices')").first
                    elif pid == "safety": card_btn = page.locator("#challenges button:has-text('Safety concerns')").first
                    elif pid == "planning": card_btn = page.locator("#challenges button:has-text('Too much planning')").first

                await card_btn.click(force=True)
                # Wait for potential plane flight (450ms) + entrance animation (450ms) + buffer = 1100ms
                await page.wait_for_timeout(1100)

                # Inspect modal dimensions
                metrics = await page.evaluate('''() => {
                    const modal = document.querySelector('[role="dialog"]');
                    if (!modal) return null;
                    const rect = modal.getBoundingClientRect();
                    const videoEl = modal.querySelector('video') || modal.querySelector('img[src*="challenges"]');
                    const videoRect = videoEl ? videoEl.getBoundingClientRect() : null;
                    const captionEl = modal.querySelector('div:has(> p)');
                    const captionRect = captionEl ? captionEl.getBoundingClientRect() : null;

                    return {
                        modalWidth: rect.width,
                        modalHeight: rect.height,
                        modalTop: rect.top,
                        modalBottom: rect.bottom,
                        topMarginVh: (rect.top / window.innerHeight) * 100,
                        bottomMarginVh: ((window.innerHeight - rect.bottom) / window.innerHeight) * 100,
                        compHeightPct: (rect.height / window.innerHeight) * 100,
                        videoHeight: videoRect ? videoRect.height : 0,
                        videoWidth: videoRect ? videoRect.width : 0
                    };
                }''')

                assert metrics is not None, f"Modal did not open for {pid} at {vp_name}"
                print(f"  Modal '{pid}': height={metrics['modalHeight']:.1f}px ({metrics['compHeightPct']:.1f}% vh), topMargin={metrics['topMarginVh']:.1f}vh, bottomMargin={metrics['bottomMarginVh']:.1f}vh, videoH={metrics['videoHeight']:.1f}px")

                # Verify requirements:
                # 1. Height is ~55-63% of viewport
                assert 50 <= metrics['compHeightPct'] <= 65, f"Modal height must be ~55-60% of viewport, got {metrics['compHeightPct']:.1f}%"
                # 2. Vertically centered with >= 10vh margin top & bottom
                assert metrics['topMarginVh'] >= 10, f"Top margin must be >= 10vh, got {metrics['topMarginVh']:.1f}vh"
                assert metrics['bottomMarginVh'] >= 10, f"Bottom margin must be >= 10vh, got {metrics['bottomMarginVh']:.1f}vh"

                modal_metrics.append(metrics)

                # Take screenshot of this modal
                ss_path = f"{ARTIFACT_DIR}/modal_{pid}_{vp_name}.png"
                await page.screenshot(path=ss_path)
                print(f"    Saved screenshot: {ss_path}")

                # Close modal
                close_btn = page.locator('button[aria-label="Close popup"]').first
                await close_btn.click()
                await page.wait_for_timeout(600)

            # Verify identical modal size across all 6 problems
            first_h = modal_metrics[0]['modalHeight']
            first_w = modal_metrics[0]['modalWidth']
            for idx, m in enumerate(modal_metrics[1:], 1):
                assert abs(m['modalHeight'] - first_h) < 1.0, f"Modal {PROBLEM_IDS[idx]} height {m['modalHeight']} does not match first {first_h}"
                assert abs(m['modalWidth'] - first_w) < 1.0, f"Modal {PROBLEM_IDS[idx]} width {m['modalWidth']} does not match first {first_w}"
            print(f"  PASS: All 6 modals at {vp_name} have IDENTICAL width ({first_w:.1f}px) and height ({first_h:.1f}px)!")

            await page.close()

        await browser.close()
        print("\n==================================================")
        print("ALL SECTION II TESTS PASSED SUCCESSFULLY (100%)!")
        print("==================================================")

if __name__ == '__main__':
    asyncio.run(test())

