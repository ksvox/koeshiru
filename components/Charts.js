// レーダー・音程の軌跡・声質マップ
import { C } from './Art';
import { NOTES, SOLFEGE } from '../lib/config';

const ANG = [-90, -18, 54, 126, 198];
export const RADAR_LABELS = [['ピッチ', ''], ['リズム', ''], ['ロングトーン', '音を伸ばす力'], ['音の立ち上がり', ''], ['音のつながり', '']];

export function radarPoint(v, a, cx = 150, cy = 140, r = 100) {
  const t = (a * Math.PI) / 180;
  return [cx + r * v * Math.cos(t), cy + r * v * Math.sin(t)];
}

export function Radar({ values, small = false }) {
  const vals = values.map((v) => Math.max(0.12, Math.min(1, v)));
  const poly = (lv) => ANG.map((a) => radarPoint(lv, a).map((n) => n.toFixed(1)).join(',')).join(' ');
  const pos = [[150, 22, 'middle'], [262, 104, 'start'], [214, 248, 'start'], [86, 248, 'end'], [38, 104, 'end']];
  return (
    <svg viewBox="-45 0 390 270" style={{ width: '100%', display: 'block' }} role="img" aria-label="歌の基礎力のレーダーチャート">
      {[0.25, 0.5, 0.75, 1].map((lv) => <polygon key={lv} points={poly(lv)} fill="none" stroke={C.line} strokeWidth="1" />)}
      {ANG.map((a) => { const [x, y] = radarPoint(1, a); return <line key={a} x1="150" y1="140" x2={x} y2={y} stroke={C.line} strokeWidth="1" />; })}
      <polygon className="radar-shape" points={vals.map((v, i) => radarPoint(v, ANG[i]).map((n) => n.toFixed(1)).join(',')).join(' ')} fill="rgba(178,58,38,0.16)" stroke={C.verm} strokeWidth="2" strokeLinejoin="round" />
      {vals.map((v, i) => { const [x, y] = radarPoint(v, ANG[i]); return <circle key={i} cx={x} cy={y} r="3.5" fill={C.verm} />; })}
      {RADAR_LABELS.map(([l, sub], i) => (
        <g key={l}>
          <text x={pos[i][0]} y={pos[i][1]} textAnchor={pos[i][2]} fontFamily="var(--gothic)" fontWeight="700" fontSize={small ? 17 : 15} fill={C.ink}>{l}</text>
          {sub && !small ? <text x={pos[i][0]} y={pos[i][1] + 15} textAnchor={pos[i][2]} fontFamily="var(--gothic)" fontSize="11" fill={C.sub}>{sub}</text> : null}
        </g>
      ))}
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
    <svg viewBox="0 0 320 250" style={{ width: '100%', display: 'block' }} role="img" aria-label="声質マップ">
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
