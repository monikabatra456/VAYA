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
  await send('Page.reload');
  await new Promise(r => setTimeout(r, 2000));

  await send('Runtime.evaluate', {
    expression: `(() => {
      const el = document.getElementById('meet-vaya');
      const ps = el.closest('.pin-spacer') || el;
      const top = ps.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top + 1000, behavior: 'instant' });
    })()`
  });
  // Capture at 500ms when intro logo is active
  await new Promise(r => setTimeout(r, 500));
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('screenshot-logo-intro.png', Buffer.from(shot.data, 'base64'));
  console.log('Saved screenshot-logo-intro.png');
  ws.close();
  process.exit(0);
}

run().catch(console.error);
