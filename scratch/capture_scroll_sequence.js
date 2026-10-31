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
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send('Page.navigate', { url: 'http://localhost:3000' });
  await new Promise(r => setTimeout(r, 2500));

  // Scroll smoothly using window.scrollTo in increments of 500px from 0 to scrollHeight
  const docHeight = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: 'document.documentElement.scrollHeight'
  });
  const maxScroll = docHeight.result.value - 900;
  console.log('Max scroll:', maxScroll);

  for (let y = 0; y <= maxScroll; y += 600) {
    await send('Runtime.evaluate', {
      expression: `window.scrollTo({ top: ${y}, behavior: 'instant' }); if (window.lenis) window.lenis.scrollTo(${y}, { immediate: true });`
    });
    await new Promise(r => setTimeout(r, 250));

    let shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`scratch/scroll_shots/shot_${String(y).padStart(5, '0')}.png`, Buffer.from(shot.data, 'base64'));
  }

  console.log('Done capturing scroll sequence');
  ws.close();
}
run().catch(console.error);
