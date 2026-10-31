const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/lenovo/.gemini/antigravity/brain/a9693cba-ed1f-4605-8c52-8f741f2aa703';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const meetVaya = page.locator('#meet-vaya');
  await meetVaya.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_reverted_meet_vaya.png') });
  console.log('Captured verify_reverted_meet_vaya.png');
  console.log('Console errors:', errors);

  await browser.close();
})();

