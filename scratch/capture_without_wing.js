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
  await send('Runtime.evaluate', {
    expression: "document.querySelector('.mv-wing-layer').style.display = 'none';"
  });
  await new Promise(r => setTimeout(r, 200));
  let shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratch/screenshot_without_wing.png', Buffer.from(shot.data, 'base64'));
  console.log('Saved scratch/screenshot_without_wing.png');
  ws.close();
}
run();
