import asyncio
import os
from playwright.async_api import async_playwright

async def test_console():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        page.on("console", lambda msg: print(f"[{msg.type}] {msg.text}"))
        page.on("pageerror", lambda err: print(f"[PAGE ERROR] {err}"))
        await page.goto("http://localhost:3000/phone-preview", wait_until="networkidle")
        await asyncio.sleep(3.0)
        await browser.close()

if __name__ == "__main__":
    asyncio.run(test_console())

