# scratch/test_fs.py
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True)
        page = await b.new_page()

        with open('src/components/hero/ProceduralClouds.jsx', 'r', encoding='utf-8') as f:
            code = f.read()

        def extract_var(name):
            s = code.find(f'const {name} = `') + len(f'const {name} = `')
            e = code.find('`;', s)
            return code[s:e]

        vs_src = extract_var('VS_SOURCE')
        fs_valley = extract_var('FS_VALLEY')
        fs_fg = extract_var('FS_FOREGROUND')

        res = await page.evaluate('''(args) => {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl');
            
            function test(type, src) {
                const s = gl.createShader(type);
                gl.shaderSource(s, src);
                gl.compileShader(s);
                return {
                    status: gl.getShaderParameter(s, gl.COMPILE_STATUS),
                    log: gl.getShaderInfoLog(s)
                };
            }

            return {
                vs: test(gl.VERTEX_SHADER, args.vs),
                valley: test(gl.FRAGMENT_SHADER, args.valley),
                fg: test(gl.FRAGMENT_SHADER, args.fg)
            };
        }''', {"vs": vs_src, "valley": fs_valley, "fg": fs_fg})

        print("Compile results:", res)
        await b.close()

if __name__ == '__main__':
    asyncio.run(main())

