const fs = require('fs');

async function run() {
  const v = await fetch('http://127.0.0.1:9222/json/list').then(r => r.json());
  const ws = new WebSocket(v[0].webSocketDebuggerUrl);
  let id = 1;
  const send = (m, p = {}) => new Promise((res) => {
    const curId = id++;
    const h = (e) => {
      const d = JSON.parse(e.data);
      if (d.id === curId) { ws.removeEventListener('message', h); res(d.result); }
    };
    ws.addEventListener('message', h);
    ws.send(JSON.stringify({ id: curId, method: m, params: p }));
  });
  await new Promise(r => ws.onopen = r);
  await send('Page.enable');

  const widths = [1440, 1024];

  for (const w of widths) {
    console.log(`Setting device metrics to width: ${w}`);
    await send('Emulation.setDeviceMetricsOverride', {
      width: w,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 2200));

    // Scroll to meet-vaya pin
    await send('Runtime.evaluate', {
      expression: `(() => {
        const el = document.getElementById('meet-vaya');
        const ps = el.closest('.pin-spacer') || el;
        const top = ps.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: top + 1000, behavior: 'instant' });
      })()`
    });

    // Wait 2.4s for the 1.2s intro to scale + fade out and reveal Step 1 video
    console.log(`Waiting for intro to complete and video to play...`);
    await new Promise(r => setTimeout(r, 2400));

    // Step 1: Click feature 0
    console.log(`Capturing ${w} Step 1...`);
    await send('Runtime.evaluate', {
      expression: `document.querySelectorAll('.mv-feature-item')[0]?.click();`
    });
    await new Promise(r => setTimeout(r, 1200));
    let shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`screenshot-${w}-step1.png`, Buffer.from(shot.data, 'base64'));

    // Step 2: Click feature 1
    console.log(`Capturing ${w} Step 2...`);
    await send('Runtime.evaluate', {
      expression: `document.querySelectorAll('.mv-feature-item')[1]?.click();`
    });
    await new Promise(r => setTimeout(r, 1200));
    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`screenshot-${w}-step2.png`, Buffer.from(shot.data, 'base64'));

    // Step 3: Click feature 2
    console.log(`Capturing ${w} Step 3...`);
    await send('Runtime.evaluate', {
      expression: `document.querySelectorAll('.mv-feature-item')[2]?.click();`
    });
    await new Promise(r => setTimeout(r, 1500));
    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`screenshot-${w}-step3.png`, Buffer.from(shot.data, 'base64'));
  }

  console.log('All screenshots captured!');
  ws.close();
  process.exit(0);
}

run().catch(console.error);
