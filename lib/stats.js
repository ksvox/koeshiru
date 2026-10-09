// 集計の送信(声や個人の情報は送らない。数値だけ)
function send(body) {
  try {
    const data = JSON.stringify(body);
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/stats', new Blob([data], { type: 'application/json' }));
    } else {
      fetch('/api/stats', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: data, keepalive: true }).catch(() => {});
    }
  } catch (e) { /* 集計に失敗しても診断には影響させない */ }
}
export function sendDiag(result, type) {
  const tms = (result.tm || []).filter((v) => v !== null && v !== undefined).map(Math.abs);
  send({
    ev: 'diag', g: result.g, type,
    radar: result.radar.map((v) => Math.max(0, Math.min(1, v))),
    tm: tms.length ? tms.reduce((a, b) => a + b, 0) / tms.length : undefined,
    vc: result.f && result.f.vc ? result.f.vc : undefined,
  });
}
export function sendTrial() { send({ ev: 'trial' }); }
