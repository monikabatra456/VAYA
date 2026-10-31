# scratch/check_hero.py
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True)
        page = await b.new_page()
        page.on("console", lambda m: print("CONSOLE:", m.type, m.text))
        page.on("pageerror", lambda e: print("PAGE_ERROR:", e))
        await page.goto("http://localhost:3000", wait_until="networkidle")
        hero = await page.query_selector("#hero")
        print("Hero element exists:", hero is not None)
        if hero:
            canvases = await hero.query_selector_all("canvas")
            print("Canvas count inside hero:", len(canvases))
            children = await page.evaluate('''() => {
                const h = document.getElementById("hero");
                return Array.from(h.querySelectorAll("*")).map(el => el.tagName + (el.id ? "#"+el.id : "") + (el.className ? "."+el.className : ""));
            }''')
            print("Hero descendants:", children[:15])
        await b.close()

if __name__ == "__main__":
    asyncio.run(main())

