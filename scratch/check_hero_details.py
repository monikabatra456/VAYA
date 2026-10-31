# scratch/check_hero_details.py
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True)
        page = await b.new_page()
        page.on("console", lambda m: print(f"[{m.type}] {m.text}"))
        page.on("pageerror", lambda e: print(f"[PAGE_ERROR] {e}"))
        await page.goto("http://localhost:3000", wait_until="networkidle")
        await page.wait_for_timeout(2000)
        await b.close()

if __name__ == '__main__':
    asyncio.run(main())

