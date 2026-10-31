import time
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    
    print("Navigating to http://localhost:3000...")
    page.goto("http://localhost:3000", wait_until="networkidle")
    time.sleep(2)
    
    # Scroll to #wonder
    wonder = page.locator("#wonder")
    wonder.scroll_into_view_if_needed()
    time.sleep(1.5)
    
    # Tap India (hub pin)
    hub_pin = page.locator(".ww-hub-pin")
    if hub_pin.is_visible():
        print("Tapping Hub Pin to trigger India Reveal...")
        hub_pin.click()
        time.sleep(2)
        
        # Test clicking Taj Mahal card
        taj_card = page.locator(".ww-card-btn").first
        if taj_card.is_visible():
            print("Clicking Taj Mahal card with force=True...")
            taj_card.click(force=True)
            time.sleep(1)
            page.screenshot(path=r"C:\Users\lenovo\.gemini\antigravity\brain\0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d\wonder_step9_modal.png")
            print("Screenshot 3 (Modal) saved.")
            
            # Press Escape to close modal
            page.keyboard.press("Escape")
            time.sleep(0.5)

    browser.close()
    print("Test finished successfully!")

