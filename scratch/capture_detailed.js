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

  // Test y from 8800 to 10200 in steps of 100px
  for (let y = 8800; y <= 10200; y += 150) {
    await send('Runtime.evaluate', {
      expression: `window.scrollTo({ top: ${y}, behavior: 'instant' }); if (window.lenis) window.lenis.scrollTo(${y}, { immediate: true });`
    });
    await new Promise(r => setTimeout(r, 150));
    let shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`scratch/scroll_shots/wonder_meet_${y}.png`, Buffer.from(shot.data, 'base64'));
  }

  // Test y from 13000 to 14800 in steps of 150px
  for (let y = 13000; y <= 14500; y += 150) {
    await send('Runtime.evaluate', {
      expression: `window.scrollTo({ top: ${y}, behavior: 'instant' }); if (window.lenis) window.lenis.scrollTo(${y}, { immediate: true });`
    });
    await new Promise(r => setTimeout(r, 150));
    let shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`scratch/scroll_shots/meet_bottom_${y}.png`, Buffer.from(shot.data, 'base64'));
  }

  console.log('Done detailed captures');
  ws.close();
}
run().catch(console.error);
