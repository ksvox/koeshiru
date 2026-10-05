// おすすめ曲(K's VOXのオリジナル英語曲から3曲)
import { TYPES } from './texts';
import { rng } from './rand';

const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function parseNote(s) {
  const m = String(s).trim().match(/^([A-Ga-g])\s*([#♯b♭]?)\s*(-?\d)/);
  if (!m) return null;
  let v = NOTE[m[1].toUpperCase()] + (Number(m[3]) + 1) * 12;
  if (m[2] === '#' || m[2] === '♯') v += 1;
  if (m[2] === 'b' || m[2] === '♭') v -= 1;
  return v;
}
export function parseRange(r) {
  const parts = String(r || '').split(/\s*[-ー〜~–—]\s*/).filter(Boolean);
  if (parts.length < 2) return null;
  const lo = parseNote(parts[0]), hi = parseNote(parts[parts.length - 1]);
  if (lo === null || hi === null || hi <= lo) return null;
  return { lo, hi, width: hi - lo };
}
function rangeTags(song) {
  const r = parseRange(song.range);
  if (!r) return [];
  const male = song.vocal === '男性';
  const highRef = male ? 69 : 76; // A4 / E5
  const lowRef = male ? 45 : 53; // A2 / F3
  const tags = [];
  if (r.width <= 12) tags.push('narrow');
  if (r.width >= 17) tags.push('wide');
  if (r.hi >= highRef) tags.push('high');
  if (r.lo <= lowRef) tags.push('low');
  if (r.width <= 15 && r.hi < highRef) tags.push('mid');
  return tags;
}
function typeRangeWants(text) {
  const w = [];
  if (/広め/.test(text)) w.push('wide');
  if (/高め/.test(text)) w.push('high');
  if (/狭め/.test(text)) w.push('narrow');
  if (/ミドル/.test(text)) w.push('mid');
  if (/低め/.test(text)) w.push('low');
  return w;
}

// 先生の選曲ルール(測定結果ごと)
function wants(r, type, gender) {
  const [pitch, rhythm, long] = r.radar;
  const f = r.f;
  const t = TYPES[type];
  const g = new Map(), m = new Map(), rg = new Map();
  const add = (map, list, w) => list.forEach((x) => map.set(x, (map.get(x) || 0) + w));
  add(g, t.genres, 2);
  add(m, t.moods, 1.5);
  add(rg, typeRangeWants(t.range), 1.5);
  if (long < 0.5 || f.lv) { add(g, ['ポップス', 'カントリー'], 1); add(rg, ['narrow', 'mid'], 1.2); add(m, ['優しい', '静か'], 0.8); }
  if (f.hi >= 0.75 && !f.hw) { add(g, ['ロック', 'R&B'], 1); add(rg, ['high'], 1); add(m, ['激しい', '元気が出る'], 0.6); }
  if (long >= 0.75) { add(g, ['ソウル', 'バラード'], 1); add(m, ['静か', '癒される', 'クール'], 0.6); }
  if (r.map[1] <= -0.3) { add(g, ['ブルース', 'その他'], 1); add(m, ['セクシー', 'ミステリアス', 'コミカル'], 0.8); }
  if (pitch >= 0.75) { add(rg, ['wide'], 1); add(g, ['R&B', 'ソウル', 'バラード'], 0.6); }
  if (rhythm >= 0.75) { add(g, ['HipHop', 'エレクトロ', 'バラード'], 0.8); add(m, ['クール', 'ダンサブル'], 0.8); }
  if (r.map[1] >= 0.3) add(m, ['楽しい', '優しい', '明るい', '元気が出る'], 0.6);
  if (r.map[0] <= -0.3) add(m, ['暗い', 'ダーク', 'ディープ'], 0.8);
  if (r.map[0] >= 0.3) add(m, ['明るい', 'シャイニー'], 0.6);
  return { g, m, rg, gender };
}

export function recommend(songs, r, type, gender, seed) {
  const w = wants(r, type, gender);
  const rand = rng(seed + 7);
  const want = gender === 'male' ? '男性' : '女性';
  const scored = songs.map((s) => {
    let sc = 0;
    s.genres.forEach((x) => { sc += w.g.get(x) || 0; });
    [...s.moods, ...s.vibes].forEach((x) => { sc += w.m.get(x) || 0; });
    rangeTags(s).forEach((x) => { sc += w.rg.get(x) || 0; });
    if (s.vocal === want) sc += 3; else if (s.vocal === '複数' || !s.vocal) sc += 0.5;
    return { s, sc: sc + rand() * 1.2 };
  }).sort((a, b) => b.sc - a.sc);
  const out = [], eps = new Set();
  for (const { s } of scored) {
    if (s.release && eps.has(s.release)) continue;
    out.push(s);
    if (s.release) eps.add(s.release);
    if (out.length === 3) break;
  }
  return out;
}
