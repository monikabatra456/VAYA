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

  const info = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const els = Array.from(document.querySelectorAll('main > section, main > div, .pin-spacer')).map(el => {
        const r = el.getBoundingClientRect();
        return {
          id: el.id,
          className: el.className,
          tagName: el.tagName,
          top: Math.round(r.top + window.scrollY),
          bottom: Math.round(r.bottom + window.scrollY),
          height: Math.round(r.height),
          bg: window.getComputedStyle(el).backgroundColor,
        };
      });
      return {
        scrollHeight: document.documentElement.scrollHeight,
        sections: els
      };
    })()`
  });
  console.log('Document info:', JSON.stringify(info.result.value, null, 2));
  ws.close();
}
run().catch(console.error);
