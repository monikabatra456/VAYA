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

  // Let's find ScrollTrigger for meet-vaya and scroll directly to its progress
  const info = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      // Find ScrollTrigger associated with meet-vaya
      // In GSAP, ScrollTrigger.getAll() returns all triggers
      const stList = window.ScrollTrigger?.getAll ? window.ScrollTrigger.getAll() : [];
      // If window.ScrollTrigger is not global, let's find it from gsap
      return {
        hasST: !!window.ScrollTrigger,
        stCount: stList.length,
        triggers: stList.map(s => ({
          trigger: s.trigger?.id || s.trigger?.className,
          start: s.start,
          end: s.end
        }))
      };
    })()`
  });
  console.log('ST Info:', info.result.value);

  // If window.ScrollTrigger is undefined, let's see how gsap is stored
  const gsapInfo = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const el = document.getElementById('meet-vaya');
      // Let's scroll into view smoothly or find pin spacer
      const pinSpacer = el.parentElement.classList.contains('pin-spacer') ? el.parentElement : el;
      return {
        parentClass: el.parentElement.className,
        rect: el.getBoundingClientRect(),
        pinRect: pinSpacer.getBoundingClientRect()
      };
    })()`
  });
  console.log('Meet Vaya Info:', gsapInfo.result.value);

  ws.close();
  process.exit(0);
}
run();

