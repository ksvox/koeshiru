// 結果の文章を組み立てる(先生が手直しした部品を組み合わせる)
import C from './content.json';
import { rng, pick } from './rand';

const GOOD = 0.75, WEAK = 0.55;
const SHORT_GOOD = {
  pitch: '正確な音程', rhythm: '安定したリズム', long: '最後まで保たれるロングトーン', attack: '迷いのない音の入り',
  legato: 'なめらかな音のつながり', hi: '高音でも崩れない安定感', lo: '豊かな低音の響き',
};
const SHORT_WEAK = {
  pitch_weak: '音程', rhythm_rush: 'テンポ', rhythm_drag: 'テンポ', long_pitch: 'ロングトーン', long_vol: 'ロングトーンの終わり',
  attack_weak: '音の入り', legato_weak: '音のつながり', high_weak: '高音部の支え', low_weak: '低音部の響き',
};
const TYPE_SHORT = {
  ITA: '明るく前に飛ぶ響き', DEU: '深く重厚な響き', USA: '息が乗った太く温かい響き', FRA: 'ささやくように柔らかい響き',
  GBR: '輪郭の整った端正な響き', KOR: 'なめらかに感情が流れる響き', JPN: '透き通るまっすぐな響き',
};
const ADVICE = {
  pitch_weak: 'pitch', rhythm_rush: 'rush', rhythm_drag: 'drag', long_pitch: 'long_pitch', long_vol: 'long_vol',
  attack_weak: 'attack', legato_weak: 'legato', high_weak: 'high', low_weak: 'low',
};

export function buildTexts(r, type, sub, seed) {
  const rand = rng(seed);
  const [pitch, rhythm, long, attack, legato] = r.radar;
  const f = r.f;
  const t = C.types[type];

  const strengths = [
    ['pitch_good', pitch, 'pitch'], ['rhythm_good', rhythm, 'rhythm'], ['long_good', long, 'long'],
    ['attack_good', attack, 'attack'], ['legato_good', legato, 'legato'],
    ['high_good', f.hw ? 0 : f.hi + 0.02, 'hi'], ['low_good', f.lw ? 0 : f.lo, 'lo'],
  ].filter(([, v]) => v >= GOOD).sort((a, b) => b[1] - a[1]).slice(0, 2);
  if (!strengths.length) {
    const best = [['pitch_good', pitch, 'pitch'], ['rhythm_good', rhythm, 'rhythm'], ['long_good', long, 'long'], ['attack_good', attack, 'attack'], ['legato_good', legato, 'legato']].sort((a, b) => b[1] - a[1])[0];
    if (best[1] >= 0.5) strengths.push(best);
  }

  const weak = [
    ['pitch_weak', pitch < WEAK ? pitch : 9], ['rhythm_rush', f.rush ? Math.min(rhythm, 0.6) : 9], ['rhythm_drag', f.drag ? Math.min(rhythm, 0.6) : 9],
    ['long_pitch', f.lp ? Math.min(long, 0.6) : 9], ['long_vol', f.lv && !f.lp ? Math.min(long, 0.62) : 9],
    ['attack_weak', attack < WEAK || f.sc ? Math.min(attack, 0.6) : 9], ['legato_weak', legato < 0.5 ? legato : 9],
    ['high_weak', f.hw ? 0.5 : 9], ['low_weak', f.lw ? 0.52 : 9],
  ].filter(([, v]) => v < 9).sort((a, b) => a[1] - b[1]).slice(0, 2);

  const feats = [];
  if (Math.abs(f.bias) >= 25) feats.push(f.bias < 0 ? 'pitch_flat' : 'pitch_sharp');
  else if (f.dw) feats.push('desc_weak');
  else if (f.aw) feats.push('asc_weak');
  else if (f.vib) feats.push('vibrato');
  else if (f.dyn >= 0.5) feats.push('dynamics');

  const line = (id) => ({ kind: C.comments[id].kind, text: pick(rand, C.comments[id].texts) });
  const comments = [...strengths.map(([id]) => line(id)), ...weak.map(([id]) => line(id)), ...feats.map(line)];

  const main = weak[0] ? ADVICE[weak[0][0]] : 'overall';
  const advice = pick(rand, C.advice[main]);

  const sGood = strengths[0] ? SHORT_GOOD[strengths[0][2]] : null;
  const sWeak = weak[0] ? SHORT_WEAK[weak[0][0]] : null;
  let summary = `${TYPE_SHORT[type]}`;
  summary += sGood ? `と、${sGood}が魅力。` : 'が魅力。';
  summary += sWeak ? `${sWeak}を整えると、さらに魅力が増します。` : '表現の幅を広げると、さらに輝く声です。';

  return {
    name: t.name, catch: t.catch, feature: t.feature, charm: t.charm, english: t.english,
    subName: C.types[sub].name, subLine: C.types[sub].sub,
    comments, advice, summary,
  };
}

export const FIXED = C.fixed;
export const TYPES = C.types;
