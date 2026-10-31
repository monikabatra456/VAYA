# scratch/check_s2_cards.py
import asyncio
from playwright.async_api import async_playwright

async def inspect():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        for w, h in [(1920, 1080), (1536, 864), (1440, 900), (1366, 768)]:
            print(f"\n==================================================")
            print(f"Viewport: {w}x{h}")
            print(f"==================================================")
            page = await browser.new_page(viewport={"width": w, "height": h})
            await page.goto("http://localhost:3000", wait_until="networkidle")
            await page.wait_for_timeout(1000)
            await page.evaluate("document.getElementById('challenges').scrollIntoView({ behavior: 'instant' })")
            await page.wait_for_timeout(1000)

            cards_info = await page.evaluate('''() => {
                const s2 = document.getElementById('challenges');
                const headingCol = document.querySelector('.s2-heading-col');
                const headRect = headingCol ? headingCol.getBoundingClientRect() : null;
                
                const cards = Array.from(document.querySelectorAll('#challenges [data-problem-id], #challenges .problem-card, #challenges [class*="problem"]'));
                // Filter actual problem cards (6 total)
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
                    cards: cardMap
                };
            }''')
            
            cards = cards_info['cards']
            for name, r in cards.items():
                print(f"  Card '{name}': left={r['left']:.1f}, top={r['top']:.1f}, width={r['width']:.1f}, height={r['height']:.1f}, right={r['right']:.1f}, bottom={r['bottom']:.1f}")

            # Calculate gap between changing-plans and prices
            cp = cards.get('changing-plans')
            pr = cards.get('prices')
            if cp and pr:
                # Horizontal clear gap
                h_gap = pr['left'] - cp['right']
                # Vertical offset between centers
                cp_cy = cp['top'] + cp['height'] / 2
                pr_cy = pr['top'] + pr['height'] / 2
                v_stagger = abs(pr_cy - cp_cy)
                print(f"  ==> Gap between 'changing-plans' & 'prices': horizontal={h_gap:.1f}px, vertical center stagger={v_stagger:.1f}px")

            await page.close()
            
        await browser.close()

if __name__ == '__main__':
    asyncio.run(inspect())

