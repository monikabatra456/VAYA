"""
Use Playwright to open the webm files in a browser and capture frames at different timestamps.
"""
import asyncio, os
from playwright.async_api import async_playwright

OUT = r"C:\Users\lenovo\.gemini\antigravity\brain\0db8bdd5-6ec3-4c43-b458-cb6fb49e4a3d"

VIDEOS = {
    "ref37": r"C:\Users\lenovo\Downloads\screen-capture (37).webm",
    "ref35": r"C:\Users\lenovo\Downloads\screen-capture (35).webm",
}

async def capture_video_frames(page, video_path, prefix, times_sec):
    # Create minimal HTML page with the video
    html = f"""<!DOCTYPE html>
<html><body style="margin:0;background:#000;">
<video id="v" src="file:///{video_path.replace(chr(92), '/')}" style="width:100%;height:100vh;object-fit:contain;" muted></video>
</body></html>"""
    
    tmp_html = os.path.join(OUT, f"_tmp_{prefix}.html")
    with open(tmp_html, "w") as f:
        f.write(html)
    
    await page.goto(f"file:///{tmp_html.replace(chr(92), '/')}")
    await asyncio.sleep(1)
    
    for t in times_sec:
        await page.evaluate(f"document.getElementById('v').currentTime = {t}")
        await asyncio.sleep(0.5)
        out_path = os.path.join(OUT, f"{prefix}_t{t}s.png")
        await page.screenshot(path=out_path)
        if os.path.exists(out_path):
            print(f"  OK: {prefix}@{t}s")
        else:
            print(f"  FAIL: {prefix}@{t}s")
    
    os.remove(tmp_html)

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await ctx.new_page()
        
        for prefix, path in VIDEOS.items():
            if os.path.exists(path):
                print(f"Processing {prefix}...")
                await capture_video_frames(page, path, prefix, [2, 5, 8, 12, 16, 20, 25])
            else:
                print(f"NOT FOUND: {path}")
        
        await browser.close()
        print("Done!")

asyncio.run(main())

