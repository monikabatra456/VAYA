# scratch/test_shader_log.py
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True)
        page = await b.new_page()
        res = await page.evaluate('''() => {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl');
            
            const vs = gl.createShader(gl.VERTEX_SHADER);
            gl.shaderSource(vs, "attribute vec2 a_pos; varying vec2 v_uv; void main() { v_uv = a_pos * 0.5 + 0.5; gl_Position = vec4(a_pos, 0.0, 1.0); }");
            gl.compileShader(vs);
            const vsStatus = gl.getShaderParameter(vs, gl.COMPILE_STATUS);
            const vsLog = gl.getShaderInfoLog(vs);
            const err = gl.getError();
            return { vsStatus, vsLog, err };
        }''')
        print("Shader test result:", res)
        await b.close()

if __name__ == '__main__':
    asyncio.run(main())

