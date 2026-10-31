# scratch/test_fix2_section2.py
import asyncio
import os
from playwright.async_api import async_playwright

OUT = r"C:\Users\lenovo\.gemini\antigravity\brain\0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d"

async def test_section2():
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True)
        
        for w, h, vp_name in [(1920, 1200, "1920x1200"), (1440, 900, "1440x900"), (1366, 768, "1366x768")]:
            print(f"\n==========================================")
            print(f"Testing Section 2 at {vp_name} ({w}x{h})")
            print(f"==========================================")
            page = await b.new_page(viewport={"width": w, "height": h})
            
            errors = []
            page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
            page.on("pageerror", lambda err: errors.append(str(err)))

            await page.goto("http://localhost:3000", wait_until="networkidle")
            await page.wait_for_timeout(1000)

            # Scroll to Section 2
            await page.evaluate("document.getElementById('challenges').scrollIntoView({ behavior: 'instant' })")
            await page.wait_for_timeout(800)

            # Inspect card positions
            card_info = await page.evaluate('''() => {
                const map = {};
                const cards = document.querySelectorAll('.s2-card');
                cards.forEach(card => {
                    const title = card.querySelector('h3')?.innerText?.trim();
                    const rect = card.getBoundingClientRect();
                    if (title) {
                        map[title] = {
                            left: rect.left,
                            right: rect.right,
                            top: rect.top,
                            bottom: rect.bottom,
                            width: rect.width,
                            height: rect.height,
                            cy: rect.top + rect.height / 2
                        };
                    }
                });
                return map;
            }''')

            print("Cards detected:", list(card_info.keys()))
            assert len(card_info) == 6, f"Expected 6 cards, found {len(card_info)}"

            # 1. Left column x-alignment (Overcrowding, Changing plans, Safety concerns)
            left_col = ["Overcrowding", "Changing plans", "Safety concerns"]
            left_xs = [card_info[t]["left"] for t in left_col]
            print(f"Left column X edges: {left_xs}")
            assert max(left_xs) - min(left_xs) < 2.0, f"Left column cards not aligned! X edges: {left_xs}"

            # 2. Right column x-alignment (Local guides, Unreasonable prices, Too much planning)
            right_col = ["Local guides", "Unreasonable prices", "Too much planning"]
            right_xs = [card_info[t]["left"] for t in right_col]
            print(f"Right column X edges: {right_xs}")
            assert max(right_xs) - min(right_xs) < 2.0, f"Right column cards not aligned! X edges: {right_xs}"

            # 3. "Unreasonable prices" vertically centered between Local guides and Too much planning
            lg_cy = card_info["Local guides"]["cy"]
            tmp_cy = card_info["Too much planning"]["cy"]
            up_cy = card_info["Unreasonable prices"]["cy"]
            expected_center = (lg_cy + tmp_cy) / 2
            center_diff = abs(up_cy - expected_center)
            print(f"Right column vertical centering: LG cy={lg_cy:.1f}, TMP cy={tmp_cy:.1f}, Prices cy={up_cy:.1f}, expected={expected_center:.1f}, diff={center_diff:.1f}px")
            assert center_diff < 15.0, f"Prices not vertically centered! Diff is {center_diff:.1f}px"

            # 4. Active card does NOT change its layout x/y
            card_btn = page.locator("button:has-text('Overcrowding')").first
            pos_before = await page.evaluate('''() => {
                const c = document.querySelector('.s2-card');
                return { left: c.style.left, top: c.style.top };
            }''')
            await card_btn.hover(force=True)
            await page.wait_for_timeout(300)
            pos_after = await page.evaluate('''() => {
                const c = document.querySelector('.s2-card');
                return { left: c.style.left, top: c.style.top };
            }''')
            print(f"Layout position check: before={pos_before}, after={pos_after}")
            assert pos_before['left'] == pos_after['left'], "Card left changed on hover!"
            assert pos_before['top'] == pos_after['top'], "Card top changed on hover!"

            # 5. Capture Section 2 overview screenshot
            shot_path = os.path.join(OUT, f"section2_clean_grid_{vp_name}.png")
            await page.screenshot(path=shot_path)
            print(f"Saved Section 2 overview: {shot_path}")

            # 6. Click card to open modal & verify phone mockup is large
            await card_btn.click(force=True)
            await page.wait_for_timeout(1000)

            modal_metrics = await page.evaluate('''() => {
                const modal = document.querySelector('[role="dialog"]');
                if (!modal) return null;
                const rect = modal.getBoundingClientRect();
                const video = modal.querySelector('video') || modal.querySelector('img[src*="challenges"]');
                const vRect = video ? video.getBoundingClientRect() : null;
                return {
                    modalW: rect.width,
                    modalH: rect.height,
                    videoH: vRect ? vRect.height : 0,
                    videoW: vRect ? vRect.width : 0
                };
            }''')

            print(f"Modal metrics: Modal={modal_metrics['modalW']:.1f}x{modal_metrics['modalH']:.1f}, Video={modal_metrics['videoW']:.1f}x{modal_metrics['videoH']:.1f}")
            assert modal_metrics['modalW'] >= 360, f"Modal width too small: {modal_metrics['modalW']}"
            assert modal_metrics['modalH'] >= 600, f"Modal height too small: {modal_metrics['modalH']}"
            assert modal_metrics['videoH'] >= 450, f"Phone video inside modal too small: {modal_metrics['videoH']}"

            modal_shot = os.path.join(OUT, f"section2_modal_restored_large_{vp_name}.png")
            await page.screenshot(path=modal_shot)
            print(f"Saved modal screenshot: {modal_shot}")

            await page.close()

        await b.close()
        print("\nALL SECTION 2 CHECKS PASSED WITH FLYING COLORS!")

if __name__ == '__main__':
    asyncio.run(test_section2())
