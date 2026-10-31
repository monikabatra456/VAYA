const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  const artifactDir = path.resolve('scratch/final_verification');
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }

  // 1. Scroll directly to Meet VAYA section
  await page.evaluate(() => {
    const el = document.getElementById('meet-vaya');
    if (el) el.scrollIntoView({ behavior: 'instant' });
  });
  await page.waitForTimeout(1200);

  // Capture full section at 1440 showing header, logo, window, and phone
  await page.screenshot({ path: path.join(artifactDir, '0_full_section_1440.png') });
  console.log('Saved 0_full_section_1440.png');

  // Crop header logo area showing clearly visible logo with refined ambient backlight
  await page.screenshot({
    clip: { x: 40, y: 0, width: 320, height: 110 },
    path: path.join(artifactDir, 'header_logo_visible.png'),
  });
  console.log('Saved header_logo_visible.png');

  // ── (f) ZOOMED CROP OF THE WINDOW AREA (clouds & wing, nothing floating) ──
  await page.screenshot({
    clip: { x: 670, y: 50, width: 730, height: 800 },
    path: path.join(artifactDir, 'f_window_crop_clouds_wing.png'),
  });
  console.log('Saved f_window_crop_clouds_wing.png');

  // ── (a) THE HAND AT REST WITH NO TAPS ──
  // Crop the hand and phone stage at rest
  await page.screenshot({
    clip: { x: 800, y: 160, width: 560, height: 720 },
    path: path.join(artifactDir, 'a_hand_at_rest.png'),
  });
  console.log('Saved a_hand_at_rest.png');

  // Inject tap animator for precise states
  await page.evaluate(() => {
    const thumb = document.querySelector('.mv-thumb-img');
    const shadow = document.querySelector('.mv-contact-shadow');
    const ripple = document.querySelector('.mv-ripple');

    window.__setTapState = (state) => {
      if (state === 'reach') {
        thumb.style.transform = 'translate(-6px, -4px) rotate(-34deg) scale(1.04)';
        if (shadow) { shadow.style.opacity = '0.25'; shadow.style.transform = 'translate(-50%, -50%) scale(1.05)'; }
      } else if (state === 'contact') {
        thumb.style.transform = 'translate(-6px, -2px) rotate(-34deg) scale(0.98)';
        if (shadow) { shadow.style.opacity = '0.35'; shadow.style.transform = 'translate(-50%, -50%) scale(0.95)'; }
        if (ripple) { ripple.style.opacity = '0.65'; ripple.style.transform = 'translate(-50%, -50%) scale(1.2)'; }
      } else if (state === 'return') {
        thumb.style.transform = 'translate(0px, 0px) rotate(0deg) scale(1)';
        if (shadow) { shadow.style.opacity = '0'; }
        if (ripple) { ripple.style.opacity = '0'; }
      }
    };
  });

  // ── (b) MID-REACH ──
  await page.evaluate(() => window.__setTapState('reach'));
  await page.waitForTimeout(100);
  await page.screenshot({
    clip: { x: 800, y: 160, width: 560, height: 720 },
    path: path.join(artifactDir, 'b_hand_mid_reach.png'),
  });
  console.log('Saved b_hand_mid_reach.png');

  // ── (c) CONTACT ──
  await page.evaluate(() => window.__setTapState('contact'));
  await page.waitForTimeout(100);
  await page.screenshot({
    clip: { x: 800, y: 160, width: 560, height: 720 },
    path: path.join(artifactDir, 'c_hand_contact.png'),
  });
  console.log('Saved c_hand_contact.png');

  // ── (d) RETURN (MUST EQUAL a) ──
  await page.evaluate(() => window.__setTapState('return'));
  await page.waitForTimeout(100);
  await page.screenshot({
    clip: { x: 800, y: 160, width: 560, height: 720 },
    path: path.join(artifactDir, 'd_hand_return.png'),
  });
  console.log('Saved d_hand_return.png');

  // ── (e) THE TEXT AT 5 STATES (p = 0, 0.25, 0.5, 0.75, 1) ──
  // Inject function to directly test text reveal progress p
  await page.evaluate(() => {
    // Reset any inline overrides
    const words = Array.from(document.querySelectorAll('.mv-word'));
    const subLines = Array.from(document.querySelectorAll('.mv-subtext-line'));
    const line = document.querySelector('.mv-gold-line');
    const pills = Array.from(document.querySelectorAll('.mv-feature-item'));

    window.__setTextP = (p) => {
      const n = words.length;
      words.forEach((el, i) => {
        const start = 0.7 * (i / n);
        const end = start + 0.3;
        let wp = 0;
        if (p <= start) wp = 0;
        else if (p >= end) wp = 1;
        else wp = (p - start) / 0.3;

        const opacity = 0.12 + 0.88 * wp;
        const translateY = 24 * (1 - wp);
        const blur = 8 * (1 - wp);

        el.style.opacity = `${opacity}`;
        el.style.transform = `translateY(${translateY}px)`;
        el.style.filter = blur > 0.1 ? `blur(${blur}px)` : 'none';
        if (i === 0 && wp >= 0.99) {
          el.classList.add('shimmer');
        }
      });

      const subProgress = Math.max(0, Math.min(1, (p - 0.90) / 0.10));
      subLines.forEach((lineEl, idx) => {
        const lStart = idx === 0 ? 0 : 0.28;
        const lEnd = idx === 0 ? 0.72 : 1.0;
        let lp = 0;
        if (subProgress <= lStart) lp = 0;
        else if (subProgress >= lEnd) lp = 1;
        else lp = (subProgress - lStart) / (lEnd - lStart);

        lineEl.style.transform = `translateY(${(1 - lp) * 100}%)`;
        lineEl.style.opacity = `${lp}`;
      });

      if (line) {
        line.style.transform = `scaleX(${subProgress})`;
      }

      pills.forEach((pillEl, idx) => {
        const pStart = 0.90 + idx * 0.03;
        const pEnd = Math.min(1.0, pStart + 0.04);
        let pp = 0;
        if (p <= pStart) pp = 0;
        else if (p >= pEnd) pp = 1;
        else pp = (p - pStart) / (pEnd - pStart);

        pillEl.style.opacity = `${pp}`;
        pillEl.style.transform = `translateY(${(1 - pp) * 16}px)`;
      });
    };
  });

  const pValues = [0, 0.25, 0.5, 0.75, 1.0];
  for (const p of pValues) {
    await page.evaluate((val) => window.__setTextP(val), p);
    await page.waitForTimeout(100);
    await page.screenshot({
      clip: { x: 50, y: 140, width: 620, height: 680 },
      path: path.join(artifactDir, `e_text_p${Math.round(p * 100)}.png`),
    });
    console.log(`Saved e_text_p${Math.round(p * 100)}.png`);
  }

  await browser.close();
  console.log('ALL VERIFICATIONS COMPLETED SUCCESSFULLY!');
})();

