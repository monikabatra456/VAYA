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
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

  await send('Runtime.evaluate', {
    expression: `(() => {
      const el = document.getElementById('meet-vaya');
      el.scrollIntoView();
    })()`
  });
  await new Promise(r => setTimeout(r, 1500));

  // Now check where meet-vaya is relative to viewport
  const rect = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const el = document.getElementById('meet-vaya');
      const r = el.getBoundingClientRect();
      return { r, scrollY: window.scrollY };
    })()`
  });
  console.log('meet-vaya rect:', rect.result.value);

  // Now scroll further down to enter the pinned timeline
  await send('Runtime.evaluate', {
    expression: `window.scrollBy(0, 800);`
  });
  await new Promise(r => setTimeout(r, 1000));

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('meet-vaya-entered.png', Buffer.from(shot.data, 'base64'));
  console.log('Saved meet-vaya-entered.png');
  ws.close();
  process.exit(0);
}
run();
