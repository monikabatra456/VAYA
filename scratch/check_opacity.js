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
  const info = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const h = document.querySelector('.mv-headline');
      const col = document.querySelector('.mv-left-col');
      const grad = document.querySelector('.mv-gradient-overlay');
      return {
        hOpacity: window.getComputedStyle(h).opacity,
        hColor: window.getComputedStyle(h).color,
        hTransform: window.getComputedStyle(h).transform,
        colOpacity: window.getComputedStyle(col).opacity,
        colZIndex: window.getComputedStyle(col).zIndex,
        gradZIndex: window.getComputedStyle(grad).zIndex
      };
    })()`
  });
  console.log(info.result.value);
  ws.close();
  process.exit(0);
}
run();
