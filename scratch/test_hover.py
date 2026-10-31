import asyncio
from playwright.async_api import async_playwright

async def check():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        page = await b.new_page(viewport={'width': 1920, 'height': 1080})
        await page.goto('http://localhost:3000')
        await page.wait_for_timeout(1000)
        await page.evaluate("document.getElementById('wonder').scrollIntoView({ behavior: 'instant' })")
        await page.wait_for_timeout(1200)
        
        target = page.locator('.ww-wm-char:not(.ww-wm-space)').nth(1)
        box = await target.bounding_box()
        print('Bounding box:', box)
        if box:
            await page.mouse.move(box['x'] + box['width']/2, box['y'] + box['height']/2)
            await page.wait_for_timeout(500)
        
        res = await target.evaluate("el => ({ style: el.getAttribute('style'), color: window.getComputedStyle(el).color })")
        print('Real mouse move result:', res)

        # Check what element is at that coordinate
        elem_at_point = await page.evaluate(f'''() => {{
            const el = document.elementFromPoint({box['x'] + box['width']/2}, {box['y'] + box['height']/2});
            return {{
                tag: el?.tagName,
                className: el?.className,
                text: el?.textContent
            }};
        }}''')
        print('Element at point:', elem_at_point)
        await b.close()

asyncio.run(check())

