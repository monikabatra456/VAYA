# scratch/test_5_contexts.py
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True)
        page = await b.new_page()
        res = await page.evaluate('''() => {
            const results = [];
            for (let i = 0; i < 6; i++) {
                const c = document.createElement('canvas');
                c.width = 300; c.height = 300;
                document.body.appendChild(c);
                const gl = c.getContext('webgl');
                results.push({ index: i, hasGL: gl !== null, isLost: gl ? gl.isContextLost() : true });
            }
            return results;
        }''')
        print("5 Contexts test:", res)
        await b.close()

if __name__ == '__main__':
    asyncio.run(main())

