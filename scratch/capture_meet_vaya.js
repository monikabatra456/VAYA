const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  page.on('console', m => console.log('BROWSER LOG:', m.text()));
  page.on('pageerror', e => console.log('BROWSER ERR:', e));

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  if (!fs.existsSync('scratch/verification')) {
    fs.mkdirSync('scratch/verification', { recursive: true });
  }

  const meetTop = await page.evaluate(() => {
    const el = document.getElementById('meet-vaya');
    return el ? el.offsetTop : null;
  });
  console.log('Meet VAYA offsetTop:', meetTop);

  // ── (e) TEXT AT 5 STATES (p = 0, 0.25, 0.5, 0.75, 1) ──
  const vh = 900;
  const scrollStart = meetTop - vh * 0.85;
  const scrollEnd = meetTop;
  const pValues = [0, 0.25, 0.5, 0.75, 1.0];

  for (let idx = 0; idx < pValues.length; idx++) {
    const p = pValues[idx];
    const targetY = scrollStart + (scrollEnd - scrollStart) * p;
    await page.evaluate((y) => window.scrollTo(0, y), targetY);
    await page.waitForTimeout(400);

    const leftCol = await page.$('.mv-left-col');
    if (leftCol) {
      await leftCol.screenshot({ path: `scratch/verification/text_state_p${Math.round(p * 100)}.png` });
      console.log(`Captured text_state_p${Math.round(p * 100)}.png`);
    }
  }

  // ── Full Viewport at p = 1.0 showing top header & refined shade ──
  await page.screenshot({ path: 'scratch/verification/full_section_1440.png' });
  console.log('Captured full_section_1440.png');

  // Crop top header with logo
  await page.screenshot({
    clip: { x: 30, y: 0, width: 350, height: 130 },
    path: 'scratch/verification/header_logo_zoom.png'
  });
  console.log('Captured header_logo_zoom.png');

  // ── (f) ZOOMED CROP OF THE WINDOW AREA (clouds & wing, nothing floating) ──
  const plate = await page.$('.mv-plate-wrapper');
  if (plate) {
    const box = await plate.boundingBox();
    await page.screenshot({
      clip: {
        x: Math.round(box.x + box.width * 0.46),
        y: Math.round(box.y + box.height * 0.05),
        width: Math.round(box.width * 0.52),
        height: Math.round(box.height * 0.88),
      },
      path: 'scratch/verification/window_crop_clouds_wing.png',
    });
    console.log('Captured window_crop_clouds_wing.png');
  }

  // ── (a) HAND AT REST WITH NO TAPS ──
  await page.evaluate((y) => window.scrollTo(0, y + 150), meetTop);
  await page.waitForTimeout(600);

  const phoneStage = await page.$('.mv-phone-stage');
  if (phoneStage) {
    await phoneStage.screenshot({ path: 'scratch/verification/hand_rest_a.png' });
    console.log('Captured hand_rest_a.png');
  }

  // ── (b), (c), (d): TAP CYCLE (mid-reach, contact, return) ──
  await page.evaluate(() => {
    const thumb = document.querySelector('.mv-thumb-img');
    const shadow = document.querySelector('.mv-contact-shadow');
    const ripple = document.querySelector('.mv-ripple');

    window.__snapTap = (stage) => {
      if (stage === 'reach') {
        thumb.style.transform = 'translate(-6px, -4px) rotate(-34deg) scale(1.04)';
        if (shadow) { shadow.style.opacity = '0.25'; shadow.style.transform = 'translate(-50%, -50%) scale(1.05)'; }
      } else if (stage === 'contact') {
        thumb.style.transform = 'translate(-6px, -2px) rotate(-34deg) scale(0.98)';
        if (shadow) { shadow.style.opacity = '0.35'; shadow.style.transform = 'translate(-50%, -50%) scale(0.95)'; }
        if (ripple) { ripple.style.opacity = '0.65'; ripple.style.transform = 'translate(-50%, -50%) scale(1.2)'; }
      } else if (stage === 'return') {
        thumb.style.transform = 'translate(0px, 0px) rotate(0deg) scale(1)';
        if (shadow) { shadow.style.opacity = '0'; }
        if (ripple) { ripple.style.opacity = '0'; }
      }
    };
  });

  // (b) mid-reach
  await page.evaluate(() => window.__snapTap('reach'));
  await page.waitForTimeout(100);
  await phoneStage.screenshot({ path: 'scratch/verification/hand_mid_reach_b.png' });
  console.log('Captured hand_mid_reach_b.png');

  // (c) contact
  await page.evaluate(() => window.__snapTap('contact'));
  await page.waitForTimeout(100);
  await phoneStage.screenshot({ path: 'scratch/verification/hand_contact_c.png' });
  console.log('Captured hand_contact_c.png');

  // (d) return (must equal a)
  await page.evaluate(() => window.__snapTap('return'));
  await page.waitForTimeout(100);
  await phoneStage.screenshot({ path: 'scratch/verification/hand_return_d.png' });
  console.log('Captured hand_return_d.png');

  await browser.close();
  console.log('All verification captures completed successfully!');
})();
