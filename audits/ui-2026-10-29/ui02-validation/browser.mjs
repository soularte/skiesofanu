export async function connect() {
  const cdp = process.env.UI_CDP_URL ?? 'http://127.0.0.1:9335';
  const target = await (await fetch(cdp + '/json/new?about:blank', { method: 'PUT' })).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(resolve => { ws.onopen = resolve; });
  let id = 0;
  const pending = new Map();
  const errors = [];
  ws.onmessage = event => {
    const m = JSON.parse(event.data);
    if (m.id) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(m.error) : p.resolve(m.result); }
    else if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text);
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    pending.set(++id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
    return r.result.value;
  };
  const key = async (key, shift = false, type) => {
    const codes = { Tab: 9, Escape: 27, Enter: 13, ' ': 32, ArrowLeft: 37, ArrowRight: 39 };
    for (const eventType of type ? [type] : ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', {
      type: eventType, key, code: key === ' ' ? 'Space' : key, windowsVirtualKeyCode: codes[key], modifiers: shift ? 8 : 0,
    });
  };
  const navigate = async url => {
    errors.length = 0; await send('Page.navigate', { url });
    for (let i = 0; i < 100; i++) {
      if (await evaluate(`document.readyState==='complete' && typeof window.__openLightbox==='function'`)) break;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    await evaluate(`document.fonts.ready.then(()=>true)`);
  };
  await send('Page.enable'); await send('Runtime.enable');
  return { send, evaluate, key, navigate, errors, close: () => ws.close() };
}
