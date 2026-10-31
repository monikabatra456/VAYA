# scratch/debug_shader.py
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True)
        page = await b.new_page()
        
        # Read ProceduralClouds.jsx source directly
        with open('src/components/hero/ProceduralClouds.jsx', 'r', encoding='utf-8') as f:
            code = f.read()

        # Extract VS_SOURCE and FS_SOURCE
        vs_start = code.find('const VS_SOURCE = `') + len('const VS_SOURCE = `')
        vs_end = code.find('`;', vs_start)
        vs = code[vs_start:vs_end]

        fs_start = code.find('const FS_SOURCE = `') + len('const FS_SOURCE = `')
        fs_end = code.find('`;', fs_start)
        fs = code[fs_start:fs_end]

        result = await page.evaluate('''(args) => {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl');
            
            function comp(type, src) {
                const s = gl.createShader(type);
                gl.shaderSource(s, src);
                gl.compileShader(s);
                const ok = gl.getShaderParameter(s, gl.COMPILE_STATUS);
                return { ok, log: gl.getShaderInfoLog(s) };
            }
            
            return {
                vs: comp(gl.VERTEX_SHADER, args.vs),
                fs: comp(gl.FRAGMENT_SHADER, args.fs)
            };
        }''', {"vs": vs, "fs": fs})

        print("VS status:", result['vs'])
        print("FS status:", result['fs'])
        await b.close()

if __name__ == '__main__':
    asyncio.run(main())

