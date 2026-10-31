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
  const evalRes = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const items = Array.from(document.querySelectorAll('*')).filter(el => {
        const rect = el.getBoundingClientRect();
        return rect.top >= 0 && rect.top < 450 && rect.left >= 0 && rect.left < 500 && (el.tagName === 'IMG' || el.innerText?.includes('VAYA') || el.innerText?.includes('Stand'));
      });
      return items.map(el => ({ tag: el.tagName, className: el.className, text: el.innerText, src: el.src, rect: el.getBoundingClientRect() }));
    })()`
  });
  console.log(JSON.stringify(evalRes.result.value, null, 2));
  ws.close();
  process.exit(0);
}
run();

