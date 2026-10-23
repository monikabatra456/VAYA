from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    b = p.chromium.launch()
    page = b.new_page(viewport={"width": 1440, "height": 900})
    page.goto("http://localhost:3000", wait_until="networkidle")
    page.wait_for_timeout(500)
    page.evaluate("window.scrollTo(0, 3150)")

    # Run 45 animation frames in the page
    page.evaluate("""() => new Promise(resolve => {
        let count = 0;
        function f() {
            count++;
            if (count > 45) resolve();
            else requestAnimationFrame(f);
        }
        requestAnimationFrame(f);
    })""")

    res = page.evaluate("() => window.__debugHero")
    print("Debug hero state after 45 RAFs:", res)

    text_info = page.evaluate("""() => {
        const text = document.querySelector(".hero-text");
        const letter = document.querySelector(".vaya-letter");
        return {
            vis: text.style.visibility,
            op: text.style.opacity,
            letterTransform: letter ? letter.style.transform : null,
        };
    }""")
    print("Text info:", text_info)
    b.close()
