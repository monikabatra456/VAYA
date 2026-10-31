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

  await send('Runtime.evaluate', {
    expression: `(() => {
      const el = document.getElementById('meet-vaya');
      const ps = el ? (el.closest('.pin-spacer') || el) : null;
      if (ps) {
        const top = ps.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: top + 1000, behavior: 'instant' });
      }
    })()`
  });
  await new Promise(r => setTimeout(r, 1000));

  const res = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const screenEl = document.querySelector('.mv-screen-layer');
      const r = screenEl.getBoundingClientRect();
      const status = document.querySelector('.mv-screen-status-bar');
      const sr = status ? status.getBoundingClientRect() : null;
      const phoneStage = document.querySelector('.mv-phone-stage');
      const pr = phoneStage ? phoneStage.getBoundingClientRect() : null;
      return {
        phoneStageWidth: pr ? Math.round(pr.width) : 0,
        phoneStageHeight: pr ? Math.round(pr.height) : 0,
        screenWidth: Math.round(r.width),
        screenHeight: Math.round(r.height),
        statusHeight: sr ? Math.round(sr.height) : 0
      };
    })()`
  });
  console.log('Screen measurements:', res.result.value);
  ws.close();
}
run();
