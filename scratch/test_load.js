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
  // Reload page at 1440 width
  await send('Page.reload');
  await new Promise(r => setTimeout(r, 2500));

  const info = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const el = document.getElementById('meet-vaya');
      const ps = el.closest('.pin-spacer') || el;
      return {
        display: window.getComputedStyle(el).display,
        psDisplay: window.getComputedStyle(ps).display,
        psTop: ps.getBoundingClientRect().top + window.scrollY,
        psHeight: ps.offsetHeight
      };
    })()`
  });
  console.log('After reload at 1440:', info.result.value);

  // Scroll to meet-vaya pin
  const targetY = info.result.value.psTop + 1000;
  await send('Runtime.evaluate', {
    expression: `window.scrollTo({ top: ${targetY}, behavior: 'instant' });`
  });
  await new Promise(r => setTimeout(r, 1000));

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('meet-vaya-at-1440.png', Buffer.from(shot.data, 'base64'));
  console.log('Saved meet-vaya-at-1440.png');

  ws.close();
  process.exit(0);
}
run();

