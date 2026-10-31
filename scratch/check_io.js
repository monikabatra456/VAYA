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
      const videos = Array.from(document.querySelectorAll('video')).map(v => ({
        src: v.src,
        paused: v.paused,
        currentTime: v.currentTime,
        readyState: v.readyState
      }));
      return {
        scrollY: window.scrollY,
        videos,
        introEl: !!document.querySelector('.mv-phone-screen-root > div[style*=\"z-index: 45\"]')
      };
    })()`
  });
  console.log(info.result.value);
  ws.close();
  process.exit(0);
}
run();
