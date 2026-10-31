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
        cx = box['x'] + box['width']/2
        cy = box['y'] + box['height']/2
        
        elements = await page.evaluate(f'''() => {{
            const els = document.elementsFromPoint({cx}, {cy});
            return els.map(e => ({{ tag: e.tagName, className: e.className }}));
        }}''')
        print('Elements from point:', elements)
        await b.close()

asyncio.run(check())

