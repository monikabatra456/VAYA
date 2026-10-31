# scratch/debug_dom_canvas.py
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True)
        page = await b.new_page()
        await page.goto('http://localhost:3000', wait_until='networkidle')
        
        diag = await page.evaluate('''() => {
            const c = document.querySelector('#hero canvas');
            if (!c) return { found: false };
            const gl = c.getContext('webgl');
            if (!gl) return { found: true, gl: null };
            
            const isLost = gl.isContextLost();
            const s = gl.createShader(gl.VERTEX_SHADER);
            return {
                found: true,
                canvasWidth: c.width,
                canvasHeight: c.height,
                isLost,
                shaderCreated: s !== null,
                glError: gl.getError()
            };
        }''')
        print("DOM Canvas Diag:", diag)
        await b.close()

if __name__ == '__main__':
    asyncio.run(main())

