# scratch/check_console_errors.py
import asyncio
from playwright.async_api import async_playwright

async def main():
    errors = []
    warnings = []
    failed_requests = []
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1920, "height": 1080})
        
        page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else warnings.append(msg.text) if msg.type == "warning" else None)
        page.on("pageerror", lambda err: errors.append(str(err)))
        page.on("requestfailed", lambda req: failed_requests.append(f"{req.url} - {req.failure}"))
        
        print("Navigating to http://localhost:3000...")
        resp = await page.goto("http://localhost:3000", wait_until="networkidle")
        print(f"Status: {resp.status}")
        
        # Scroll down through all sections to trigger all hooks & components
        print("Scrolling through all sections...")
        await page.evaluate("window.scrollTo(0, document.body.scrollHeight / 2)")
        await page.wait_for_timeout(1000)
        await page.evaluate("document.getElementById('wonder').scrollIntoView()")
        await page.wait_for_timeout(2000)
        
        # Click pin on wonder section
        hub = page.locator('.ww-hub-pin').first
        if await hub.count() > 0:
            await hub.click(force=True)
            await page.wait_for_timeout(1000)
            
        await page.close()
        await browser.close()
        
    print(f"\n--- CONSOLE ERRORS: {len(errors)} ---")
    for e in errors:
        print("ERROR:", e)
        
    print(f"\n--- FAILED REQUESTS (404/Network): {len(failed_requests)} ---")
    for r in failed_requests:
        print("FAILED:", r)

    if len(errors) == 0 and len(failed_requests) == 0:
        print("\nALL CLEAN! Zero console errors, zero failed requests.")

if __name__ == '__main__':
    asyncio.run(main())

