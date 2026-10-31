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

  // 1. Locate #meet-vaya
  const meetVaya = page.locator('#meet-vaya');
  await meetVaya.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);

  // Capture hero text entrance at #meet-vaya top
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_meet_vaya_entrance.png') });
  console.log('Captured entrance screenshot');

  // Measure pinned scroll range
  const scrollInfo = await page.evaluate(() => {
    const el = document.getElementById('meet-vaya');
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return {
      top: rect.top + window.scrollY,
      height: el.offsetHeight,
      totalHeight: document.body.scrollHeight,
    };
  });
  console.log('Scroll Info:', scrollInfo);

  // Pin scroll test across 5 progress points
  const pinStart = scrollInfo.top;
  // pinned scroll length is +=300% of viewport height = ~2700px
  const pinLength = 2700;

  const points = [
    { name: 'p0_smarter_travel_start', p: 0.05 },
    { name: 'p1_smarter_travel_swipe', p: 0.20 },
    { name: 'p2_data_driven_swipe', p: 0.52 },
    { name: 'p3_better_experiences_swipe', p: 0.85 },
    { name: 'p4_better_experiences_end', p: 0.96 },
  ];

  for (const pt of points) {
    const targetY = pinStart + pt.p * pinLength;
    await page.evaluate((y) => window.scrollTo(0, y), targetY);
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, `verify_${pt.name}.png`) });
    console.log(`Captured ${pt.name}`);
  }

  // Scroll backwards test (reverse)
  console.log('Testing reverse scroll...');
  await page.evaluate((y) => window.scrollTo(0, y), pinStart + 0.3 * pinLength);
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_reverse_scroll.png') });

  // Test mobile width
  console.log('Testing mobile width 375x667...');
  await page.setViewportSize({ width: 375, height: 667 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  const meetVayaMob = page.locator('#meet-vaya');
  await meetVayaMob.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_mobile.png') });

  console.log('Console errors during test:', errors);
  await browser.close();
  console.log('Verification finished successfully!');
})();

