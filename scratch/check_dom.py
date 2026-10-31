import asyncio
from playwright.async_api import async_playwright

async def check_dom():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto("http://localhost:3000/phone-preview", wait_until="networkidle")
        for i in range(8):
            await asyncio.sleep(1.0)
            dom_info = await page.evaluate("""() => {
                const el = document.querySelector('.vaya-phone-screen-root');
                return {
                    time: Date.now(),
                    text: el ? el.innerText : null,
                    hasLogo: !!document.querySelector('.vaya-brand-splash'),
                    hasResults: !!document.querySelector('[data-testid="search-result"]'),
                    hasBars: !!document.querySelector('[data-testid="crowd-bars"]'),
                    hasAlert: !!document.querySelector('[data-testid="crowd-alert"]'),
                };
            }""")
            print(f"Tick {i+1}s: {dom_info}")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(check_dom())

