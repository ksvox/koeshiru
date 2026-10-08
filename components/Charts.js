// レーダー・音程の軌跡・声質マップ
import { C } from './Art';
import { NOTES, SOLFEGE, radarShow } from '../lib/config';

export const RADAR_LABELS = [['ピッチ', ''], ['リズム', ''], ['ロングトーン', '音を伸ばす力'], ['音の立ち上がり', ''], ['音のつながり', ''], ['母音の響き', '音色の変化']];
export const angles = (n) => Array.from({ length: n }, (_, i) => -90 + (i * 360) / n);
export const ANG = angles(6);

export function radarPoint(v, a, cx = 150, cy = 140, r = 100) {
  const t = (a * Math.PI) / 180;
  return [cx + r * v * Math.cos(t), cy + r * v * Math.sin(t)];
}
export function labelPos(a) {
  const [x, y] = radarPoint(1.17, a);
  const c = Math.cos((a * Math.PI) / 180), s = Math.sin((a * Math.PI) / 180);
  const anchor = c > 0.3 ? 'start' : c < -0.3 ? 'end' : 'middle';
  return [x, s < -0.9 ? y - 4 : s > 0.9 ? y + 14 : y + 5, anchor];
}

export function Radar({ values, small = false }) {
  const vals = values.map(radarShow);
  const n = vals.length;
  const ang = angles(n);
  const labels = RADAR_LABELS.slice(0, n);
  const poly = (lv) => ang.map((a) => radarPoint(lv, a).map((k) => k.toFixed(1)).join(',')).join(' ');
  return (
    <svg viewBox="-64 -2 428 298" style={{ width: '100%', display: 'block' }} role="img" aria-label="歌の基礎力のレーダーチャート">
      {[0.25, 0.5, 0.75, 1].map((lv) => <polygon key={lv} points={poly(lv)} fill="none" stroke={C.line} strokeWidth="1" />)}
      {ang.map((a) => { const [x, y] = radarPoint(1, a); return <line key={a} x1="150" y1="140" x2={x} y2={y} stroke={C.line} strokeWidth="1" />; })}
      <polygon className="radar-shape" points={vals.map((v, i) => radarPoint(v, ang[i]).map((k) => k.toFixed(1)).join(',')).join(' ')} fill="rgba(178,58,38,0.16)" stroke={C.verm} strokeWidth="2" strokeLinejoin="round" />
      {vals.map((v, i) => { const [x, y] = radarPoint(v, ang[i]); return <circle key={i} cx={x} cy={y} r="3.5" fill={C.verm} />; })}
      {labels.map(([l, sub], i) => {
        const [x, y, an] = labelPos(ang[i]);
        return (
          <g key={l}>
            <text x={x} y={y} textAnchor={an} fontFamily="var(--gothic)" fontWeight="700" fontSize={small ? 17 : 15} fill={C.ink}>{l}</text>
            {sub && !small ? <text x={x} y={y + 15} textAnchor={an} fontFamily="var(--gothic)" fontSize="11" fill={C.sub}>{sub}</text> : null}
          </g>
        );
      })}
    </svg>
  );
}

// trace: 1拍8点×24拍、値は「ルート音からの半音×10」
export function tracePaths(trace) {
  const X = (b) => 14 + b * 13.0;
  const Y = (s) => 122 - s * 8.2;
  let target = '';
  let first = true;
  for (let b = 0; b < 24; b++) {
    const n = NOTES.find(([, st, len]) => b >= st && b < st + len);
    if (!n) { first = true; continue; }
    target += `${first ? 'M' : 'L'}${X(b).toFixed(1)},${Y(n[0]).toFixed(1)} L${X(b + 1).toFixed(1)},${Y(n[0]).toFixed(1)} `;
    first = false;
  }
  let sung = '';
  let pen = false;
  trace.forEach((v, q) => {
    const b = (q + 0.5) / 8;
    if (v === null || v < -40 || v > 160) { pen = false; return; }
    sung += `${pen ? 'L' : 'M'}${X(b).toFixed(1)},${Y(v / 10).toFixed(1)} `;
    pen = true;
  });
  return { target, sung, X, Y };
}

export function PitchTrace({ trace }) {
  const { target, sung, X, Y } = tracePaths(trace);
  const labels = NOTES.map(([, st], i) => [st, SOLFEGE[i]]);
  return (
    <svg viewBox="0 0 340 160" style={{ width: '100%', display: 'block' }} role="img" aria-label="見本の音とあなたの声の音程の軌跡">
      {[0, 12].map((s) => <line key={s} x1="10" y1={Y(s)} x2="330" y2={Y(s)} stroke={C.line} strokeWidth="1" />)}
      <rect x={X(11)} y="14" width="13" height="116" fill={C.line} opacity="0.5" />
      <text x={X(11) + 6.5} y="12" textAnchor="middle" fontSize="9" fontFamily="var(--gothic)" fill={C.sub}>息</text>
      <path d={target} fill="none" stroke={C.sub} strokeWidth="1.4" strokeDasharray="4 3" />
      <path d={sung} fill="none" stroke={C.verm} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {labels.map(([st, l], i) => <text key={i} x={X(st) + 6.5} y="152" textAnchor="middle" fontSize="9.5" fontFamily="var(--gothic)" fill={C.sub}>{l}</text>)}
    </svg>
  );
}

const MAP_PTS = { ITA: [240, 58], DEU: [78, 58], USA: [78, 185], FRA: [238, 185], GBR: [170, 88], KOR: [130, 140], JPN: [205, 106] };
export function mapXY(map) {
  return [160 + map[0] * 125, 120 - map[1] * 88];
}
export function VoiceMap({ map, dark = false }) {
  const ink = dark ? '#E9E3D3' : C.ink, sub = dark ? '#AEB5C6' : C.sub, ln = dark ? '#3A4766' : C.line;
  const [x, y] = mapXY(map);
  return (
    <svg viewBox="-34 0 388 250" style={{ width: '100%', display: 'block' }} role="img" aria-label="声質マップ">
      <rect x="20" y="20" width="280" height="200" fill="none" stroke={ln} strokeWidth="1" />
      <line x1="160" y1="20" x2="160" y2="220" stroke={ln} />
      <line x1="20" y1="120" x2="300" y2="120" stroke={ln} />
      {[[160, 13, 'クリア', 'middle'], [160, 240, '息っぽい', 'middle'], [16, 124, '暗い', 'end'], [304, 124, '明るい', 'start']].map(([tx, ty, t, an]) => (
        <text key={t} x={tx} y={ty} textAnchor={an} fontSize="11" fontFamily="var(--gothic)" fontWeight="700" fill={sub}>{t}</text>
      ))}
      {Object.entries(MAP_PTS).map(([k, [px, py]]) => <text key={k} x={px} y={py} textAnchor="middle" fontSize="10" fontFamily="var(--mono)" fill={sub} opacity="0.8">{k}</text>)}
      <circle cx={x} cy={y} r="14" fill="none" stroke={C.verm} strokeWidth="1" strokeDasharray="2 2" />
      <circle cx={x} cy={y} r="6" fill={C.verm} />
      <text x={x > 250 ? x - 18 : x + 18} y={y + 4} textAnchor={x > 250 ? 'end' : 'start'} fontSize="12" fontFamily="var(--gothic)" fontWeight="700" fill={ink}>あなた</text>
    </svg>
  );
}

// 母音の個性(中心に「う」、✕の線の先に い・え・あ・お)
const VPOS = { i: [-1, -1], e: [1, -1], a: [-1, 1], o: [1, 1] };
const VLAB = { i: 'い', e: 'え', a: 'あ', o: 'お' };
export function VowelCross({ vc }) {
  const v = { i: vc[0], e: vc[1], a: vc[2], o: vc[3] };
  const c = 130, R = 88;
  const show = (x) => Math.max(0.06, Math.min(1, x));
  const pt = (k, f) => [c + VPOS[k][0] * R * f, c + VPOS[k][1] * R * f];
  const order = ['i', 'e', 'o', 'a'];
  return (
    <svg viewBox="0 0 260 260" style={{ width: '100%', maxWidth: 320, display: 'block', margin: '0 auto' }} role="img" aria-label="母音の個性のグラフ">
      {order.map((k) => { const [x, y] = pt(k, 1); return <line key={k} x1={c} y1={c} x2={x} y2={y} stroke={C.sub} strokeWidth="1" opacity="0.55" />; })}
      {order.map((k) => [0.33, 0.66].map((f) => { const [x, y] = pt(k, f); return <circle key={k + f} cx={x} cy={y} r="1.6" fill={C.sub} opacity="0.5" />; }))}
      <polygon points={order.map((k) => pt(k, show(v[k])).map((n) => n.toFixed(1)).join(',')).join(' ')} fill="rgba(178,58,38,0.16)" stroke={C.verm} strokeWidth="2" strokeLinejoin="round" />
      {order.map((k) => { const [x, y] = pt(k, show(v[k])); return <circle key={k} cx={x} cy={y} r="4" fill={C.verm} />; })}
      {order.map((k) => {
        const [x, y] = pt(k, 1.17);
        return (
          <g key={k}>
            <circle cx={x} cy={y} r="15" fill="none" stroke={C.ink} strokeWidth="1.3" />
            <text x={x} y={y + 6} textAnchor="middle" fontSize="16" fontWeight="700" fontFamily="var(--gothic)" fill={C.ink}>{VLAB[k]}</text>
          </g>
        );
      })}
      <circle cx={c} cy={c} r="15" fill={C.paper} stroke="#3B5A8C" strokeWidth="1.5" />
      <text x={c} y={c + 6} textAnchor="middle" fontSize="16" fontWeight="700" fontFamily="var(--gothic)" fill="#3B5A8C">う</text>
    </svg>
  );
}

// 拍感覚(タイム感):16音それぞれの拍に対する早い・遅い
export function TimingChart({ tm, zone = 150 }) {
  const x0 = 40, w = 36, cy = 96, lim = 300, sc = 70 / lim;
  return (
    <svg viewBox="0 0 640 200" style={{ width: '100%', display: 'block' }} role="img" aria-label="拍感覚のグラフ">
      <rect x={x0 - 4} y={cy - zone * sc} width={16 * w + 8} height={2 * zone * sc} fill={C.line} opacity="0.45" />
      <line x1={x0 - 4} y1={cy} x2={x0 + 16 * w + 4} y2={cy} stroke={C.ink} />
      <text x={x0 - 8} y={cy - 58} textAnchor="end" fontSize="11" fontFamily="var(--gothic)" fill={C.sub}>遅い</text>
      <text x={x0 - 8} y={cy + 66} textAnchor="end" fontSize="11" fontFamily="var(--gothic)" fill={C.sub}>早い</text>
      <line x1={x0 + 8 * w} y1="18" x2={x0 + 8 * w} y2="172" stroke="#898781" strokeDasharray="3 3" />
      <text x={x0 + 4 * w} y="14" textAnchor="middle" fontSize="11" fontFamily="var(--gothic)" fill={C.sub}>上り</text>
      <text x={x0 + 12 * w} y="14" textAnchor="middle" fontSize="11" fontFamily="var(--gothic)" fill={C.sub}>下り</text>
      {tm.map((v, i) => {
        const x = x0 + i * w + 8;
        const label = <text key={'l' + i} x={x + (w - 16) / 2} y="192" textAnchor="middle" fontSize="12" fontFamily="var(--gothic)" fill={C.ink}>{SOLFEGE[i]}</text>;
        if (v === null || v === undefined) return [label, <text key={'q' + i} x={x + (w - 16) / 2} y={cy + 4} textAnchor="middle" fontSize="10" fill={C.sub}>?</text>];
        const cl = Math.max(-lim, Math.min(lim, v));
        const hh = Math.max(1.5, Math.abs(cl) * sc);
        const out = Math.abs(v) > zone;
        return [label, <rect key={'b' + i} x={x} y={cl > 0 ? cy - hh : cy} width={w - 16} height={hh} rx="2" fill={out ? C.verm : '#3B5A8C'} />];
      })}
    </svg>
  );
}
