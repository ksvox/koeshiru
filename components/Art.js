// 国旗・地図・スタンプ・地紋など、パスポートの絵柄
import MAPS from '../lib/maps.json';

export const C = { navy: '#1E2B4A', navy2: '#16203A', paper: '#F3EEE2', ink: '#1A1F2B', sub: '#555A66', verm: '#B23A26', gold: '#C9A85A', line: '#D8D0BC', cream: '#E9E3D3', mist: '#AEB5C6' };

export function Flag({ code, w = 30 }) {
  const h = Math.round((w * 2) / 3);
  const box = { display: 'block', borderRadius: 2, boxShadow: '0 0 0 0.5px rgba(0,0,0,0.25)', flex: 'none' };
  let body = null;
  if (code === 'ITA' || code === 'FRA') {
    const [a, b, c] = code === 'ITA' ? ['#009246', '#FFFFFF', '#CE2B37'] : ['#0055A4', '#FFFFFF', '#EF4135'];
    body = (<><rect width="10" height="20" fill={a} /><rect x="10" width="10" height="20" fill={b} /><rect x="20" width="10" height="20" fill={c} /></>);
  } else if (code === 'DEU') {
    body = (<><rect width="30" height="6.7" fill="#000" /><rect y="6.7" width="30" height="6.7" fill="#DD0000" /><rect y="13.3" width="30" height="6.7" fill="#FFCE00" /></>);
  } else if (code === 'JPN') {
    body = (<><rect width="30" height="20" fill="#FFF" /><circle cx="15" cy="10" r="6" fill="#BC002D" /></>);
  } else if (code === 'USA') {
    const stripes = [];
    for (let i = 0; i < 13; i += 2) stripes.push(<rect key={i} y={(i * 20) / 13} width="30" height={20 / 13} fill="#B22234" />);
    const stars = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) stars.push(<circle key={`${r}-${c}`} cx={1.4 + c * 2.3 + (r % 2) * 1.1} cy={1.5 + r * 2.5} r="0.45" fill="#FFF" />);
    body = (<><rect width="30" height="20" fill="#FFF" />{stripes}<rect width="12" height="10.77" fill="#3C3B6E" />{stars}</>);
  } else if (code === 'GBR') {
    body = (<><rect width="30" height="20" fill="#012169" /><path d="M0 0 L30 20 M30 0 L0 20" stroke="#FFF" strokeWidth="4" /><path d="M0 0 L30 20 M30 0 L0 20" stroke="#C8102E" strokeWidth="1.3" /><path d="M15 0 V20 M0 10 H30" stroke="#FFF" strokeWidth="6" /><path d="M15 0 V20 M0 10 H30" stroke="#C8102E" strokeWidth="3.6" /></>);
  } else if (code === 'KOR') {
    const tri = [[6, 4.5, -33.7], [24, 15.5, -33.7], [24, 4.5, 33.7], [6, 15.5, 33.7]];
    body = (<><rect width="30" height="20" fill="#FFF" /><circle cx="15" cy="10" r="5" fill="#0047A0" /><path d="M10 10 A5 5 0 0 1 20 10 A2.5 2.5 0 0 1 15 10 A2.5 2.5 0 0 0 10 10 Z" fill="#CD2E3A" />
      {tri.map(([x, y, a], i) => (<g key={i} transform={`translate(${x} ${y}) rotate(${a})`}>{[0, 1, 2].map((k) => <rect key={k} x="-2.5" y={-1.6 + k * 1.2} width="5" height="0.7" fill="#000" />)}</g>))}</>);
  }
  return <svg width={w} height={h} viewBox="0 0 30 20" style={box} aria-hidden="true">{body}</svg>;
}

export function MapShape({ code, size, color, opacity = 0.1 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" aria-hidden="true">
      <path d={MAPS[code]} fill={color} fillOpacity={opacity} stroke={color} strokeOpacity={opacity * 1.5} strokeWidth="0.6" />
    </svg>
  );
}

export function Stamp({ code, name, date, size = 150, rot = -12, color = C.verm, animate = false }) {
  const c = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={animate ? 'stamp-in' : ''} style={{ transform: `rotate(${rot}deg)`, display: 'block' }} role="img" aria-label={`${name}の入国スタンプ`}>
      <circle cx={c} cy={c} r={c - 4} fill="none" stroke={color} strokeWidth="3" />
      <circle cx={c} cy={c} r={c - 11} fill="none" stroke={color} strokeWidth="1" />
      <text x={c} y={c * 0.55} textAnchor="middle" fontFamily="var(--mono)" fontSize={size * 0.075} fill={color} letterSpacing="2">VOICE ENTRY</text>
      <text x={c} y={c * 1.02} textAnchor="middle" fontFamily="var(--mono)" fontSize={size * 0.2} fontWeight="500" fill={color} letterSpacing="3">{code}</text>
      <line x1={size * 0.2} y1={c * 1.18} x2={size * 0.8} y2={c * 1.18} stroke={color} strokeWidth="1" />
      <text x={c} y={c * 1.38} textAnchor="middle" fontFamily="var(--gothic)" fontWeight="700" fontSize={size * 0.09} fill={color}>{name}</text>
      <text x={c} y={c * 1.6} textAnchor="middle" fontFamily="var(--mono)" fontSize={size * 0.065} fill={color}>{date}</text>
    </svg>
  );
}

// 紙幣のような地紋
export function guillochePaths(w, h) {
  const out = [];
  for (let k = 0; k < 14; k++) {
    const pts = [];
    for (let x = 0; x <= w; x += 6) {
      const y = h / 2 + h * 0.32 * Math.sin((x / (w / (2.2 + k * 0.07))) * Math.PI + k * 0.45) * Math.cos((x / w) * Math.PI * 0.9 - k * 0.2);
      pts.push(`${x},${y.toFixed(1)}`);
    }
    out.push(pts.join(' '));
  }
  return out;
}
export function Guilloche({ w = 390, h = 400, color = C.gold, opacity = 0.18 }) {
  return (
    <svg className="guilloche" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      {guillochePaths(w, h).map((p, i) => <polyline key={i} points={p} fill="none" stroke={color} strokeWidth="0.6" opacity={opacity} />)}
    </svg>
  );
}

export function Emblem({ size = 64, color = C.gold }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="30" fill="none" stroke={color} strokeWidth="1.2" />
      <circle cx="32" cy="32" r="25" fill="none" stroke={color} strokeWidth="0.6" />
      <circle cx="32" cy="32" r="20" fill="none" stroke={color} strokeWidth="0.6" strokeDasharray="1 2" />
      <path d="M10 32 L16 32 L19 22 L23 42 L27 16 L31 48 L35 20 L39 40 L43 26 L47 36 L50 32 L54 32" fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

// あなただけの声紋(本人の歌声の音量の波形と音程の動きから描く)
import { NOTES as _NOTES, BEAT as _BEAT } from '../lib/config';
export function VoicePrint({ wave, trace, w = 90, h = 108 }) {
  const vals = wave ? wave.split('').map(Number) : Array(48).fill(5);
  const devs = (trace || []).map((v, q) => {
    if (v === null || v === undefined) return 0;
    const b = (q + 0.5) / 8;
    const n = _NOTES.find(([, st, len]) => b >= st && b < st + len);
    return n ? Math.max(-1.5, Math.min(1.5, v / 10 - n[0])) : 0;
  });
  const T = devs.length || 1;
  const cx = w / 2, cy = h / 2;
  const rings = [];
  for (let k = 0; k < 13; k++) {
    const base = 4 + k * 3.05;
    let d = '';
    for (let a = 0; a <= 96; a++) {
      const th = (a / 96) * Math.PI * 2;
      const wv = vals[Math.floor((a / 96) * (vals.length - 1))] / 9;
      const dv = devs.length ? devs[(Math.floor((a / 96) * T) + k * 11) % T] : 0;
      const r = base * (0.8 + 0.2 * wv) + dv * (0.6 + k * 0.22) + Math.sin(th * 3 + k * 0.7) * 0.6;
      const x = cx + r * Math.cos(th), y = cy + r * Math.sin(th) * 1.18;
      d += `${a ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
    }
    rings.push(<path key={k} d={`${d}Z`} fill="none" stroke={C.navy} strokeWidth={k % 3 ? 0.6 : 1} opacity={0.35 + k * 0.045} />);
  }
  return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label="あなたの声紋" style={{ display: 'block', overflow: 'hidden' }}>{rings}</svg>;
}
