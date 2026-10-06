// 結果をリンクに入れる(サーバーには何も保存しない)
export function encodeResult(o) {
  const t = o.trace.map((v) => (v === null ? '' : v)).join(',');
  const data = { v: 1, g: o.g, d: o.date, s: o.seed, r: o.radar, m: o.map, f: o.f, t, w: o.wave || '' };
  const json = JSON.stringify(data);
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function decodeResult(code) {
  try {
    const b64 = code.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(escape(atob(b64)));
    const d = JSON.parse(json);
    if (d.v !== 1) return null;
    return { g: d.g, date: d.d, seed: d.s, radar: d.r, map: d.m, f: d.f, trace: d.t.split(',').map((v) => (v === '' ? null : Number(v))), wave: d.w || '' };
  } catch (e) {
    return null;
  }
}
