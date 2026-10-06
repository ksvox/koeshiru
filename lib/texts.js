// 結果の文章を組み立てる(先生の文章表=content.json の部品を組み合わせる)
import C from './content.json';
import { rng, pick } from './rand';

const GOOD = 0.75, WEAK = 0.55;
const fill = (tpl, o) => String(tpl || '').replace(/\{タイプ\}/g, o.t).replace(/\{強み\}/g, o.g).replace(/\{伸びしろ\}/g, o.w);

export function buildTexts(r, type, sub, seed) {
  const rand = rng(seed);
  const [pitch, rhythm, long, attack, legato, vowel = null] = r.radar;
  const f = r.f;
  const t = C.types[type];

  // 強み(高い順に2つまで)
  const cand = [
    ['pitch_good', pitch, 'pitch'], ['rhythm_good', rhythm, 'rhythm'], ['long_good', long, 'long'],
    ['attack_good', attack, 'attack'], ['legato_good', legato, 'legato'],
    ...(vowel === null ? [] : [['vowel_good', vowel, 'vowel']]),
    ['high_good', f.hw ? 0 : f.hi + 0.02, 'hi'], ['low_good', f.lw ? 0 : f.lo, 'lo'],
  ];
  const strengths = cand.filter(([, v]) => v >= GOOD).sort((a, b) => b[1] - a[1]).slice(0, 2);
  if (!strengths.length) {
    const best = cand.slice(0, vowel === null ? 5 : 6).sort((a, b) => b[1] - a[1])[0];
    if (best[1] >= 0.5) strengths.push(best);
  }

  // 伸びしろ(低い順に2つまで。1つ目が「一番の伸びしろ」)
  const weak = [
    ['pitch_weak', pitch < WEAK ? pitch : 9], ['rhythm_rush', f.rush ? Math.min(rhythm, 0.6) : 9], ['rhythm_drag', f.drag ? Math.min(rhythm, 0.6) : 9],
    ['long_pitch', f.lp ? Math.min(long, 0.6) : 9], ['long_vol', f.lv && !f.lp ? Math.min(long, 0.62) : 9],
    ['attack_weak', attack < WEAK || f.sc ? Math.min(attack, 0.6) : 9], ['legato_weak', legato < 0.5 ? legato : 9],
    ['vowel_weak', vowel !== null && vowel < WEAK ? vowel : 9],
    ['high_weak', f.hw ? 0.5 : 9], ['low_weak', f.lw ? 0.52 : 9],
  ].filter(([, v]) => v < 9).sort((a, b) => a[1] - b[1]).slice(0, 2);

  // 特徴(1つ)
  const feats = [];
  if (Math.abs(f.bias) >= 35) feats.push(f.bias < 0 ? 'pitch_flat' : 'pitch_sharp');
  else if (f.vi && C.comments.vowel_i_dark) feats.push('vowel_i_dark');
  else if (f.vo && C.comments.vowel_o_light) feats.push('vowel_o_light');
  else if (f.dw) feats.push('desc_weak');
  else if (f.aw) feats.push('asc_weak');
  else if (f.vib) feats.push('vibrato');
  else if (f.dyn >= 0.5) feats.push('dynamics');

  const line = (id) => (C.comments[id] ? { kind: C.comments[id].kind, text: pick(rand, C.comments[id].texts) } : null);
  const comments = [...strengths.map(([id]) => line(id)), ...weak.map(([id]) => line(id)), ...feats.map(line)].filter(Boolean);

  // 「もっと良くなるために」:練習のヒント → 日本語の歌 → 英語歌唱のすすめ
  const mainWeak = weak[0] ? weak[0][0] : null;
  const topStrength = strengths.find(([, , k]) => !['hi', 'lo'].includes(k)) || cand.slice(0, 6).sort((a, b) => b[1] - a[1])[0];
  const condKey = mainWeak || `good_${topStrength[2]}`;
  const pickOr = (arr) => (arr && arr.length ? pick(rand, arr) : '');
  const practice = pickOr(C.practice[mainWeak || 'overall'] || C.practice.overall);
  const ja = [pickOr(C.ja.type[type]), pickOr(C.ja.cond[condKey])].filter(Boolean);
  const en = [pickOr(C.en.type[type]), pickOr(C.en.cond[condKey])].filter(Boolean);

  // シェア画像の一言コメント
  const S = C.summary;
  const gKey = strengths[0] ? strengths[0][2] : null;
  const summary = fill(mainWeak ? S.withWeak : S.noWeak, { t: S.type[type] || t.catch, g: (gKey && S.good[gKey]) || '声そのもの', w: (mainWeak && S.weak[mainWeak]) || '' });

  return {
    name: t.name, catch: t.catch, feature: t.feature, charm: t.charm,
    subName: C.types[sub].name, subLine: C.types[sub].sub,
    comments, practice, ja, enLead: C.en.lead, en, summary,
  };
}

export const FIXED = C.fixed;
export const TYPES = C.types;
