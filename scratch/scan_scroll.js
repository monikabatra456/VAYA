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
  await new Promise(r => setTimeout(r, 2000));

  // Let's check between 7500 and 14000 in steps of 300px
  const report = [];
  for (let y = 7500; y <= 14500; y += 400) {
    await send('Runtime.evaluate', {
      expression: `window.scrollTo({ top: ${y}, behavior: 'instant' });`
    });
    await new Promise(r => setTimeout(r, 200));

    // Capture screenshot or evaluate elements at center of screen
    const check = await send('Runtime.evaluate', {
      returnByValue: true,
      expression: `(() => {
        // Sample points across viewport
        const points = [
          { x: 720, y: 450 },
          { x: 300, y: 300 },
          { x: 1100, y: 300 },
          { x: 720, y: 700 }
        ];
        const tags = points.map(p => {
          const el = document.elementFromPoint(p.x, p.y);
          return el ? (el.tagName + '.' + el.className + '#' + el.id) : 'null';
        });

        // Check if any element has text or non-cream background
        // Also take a quick screenshot if suspected blank
        return {
          scrollY: window.scrollY,
          tags
        };
      })()`
    });
    report.push(check.result.value);
  }
  console.log(JSON.stringify(report, null, 2));
  ws.close();
}
run().catch(console.error);
