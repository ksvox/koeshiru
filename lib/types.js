// 7つのボイスタイプの判定
// 先生の「②判定プロフィール」表(content.json の profiles)をそのまま使う。★=重み2、問わない=使わない
import C from './content.json';

const WORDS = {
  bright: { 明るい: 0.6, やや明るい: 0.3, 中: 0, 中間: 0, '中〜やや暗い': -0.15, やや暗い: -0.3, 暗い: -0.6 },
  clear: { クリア: 0.6, ややクリア: 0.3, 中: 0, 中間: 0, やや息っぽい: -0.3, 息っぽい: -0.6 },
  vowel: { 明瞭: 0.85, やや明瞭: 0.7, 中間: 0.55, 中: 0.55, やや不明瞭: 0.4, 不明瞭: 0.3 },
  cons: { 強め: 0.8, やや強め: 0.65, 中間: 0.5, 中: 0.5, やや弱め: 0.4, 弱め: 0.3 },
  level: { 高: 0.85, やや高: 0.75, 中: 0.6, 低め: 0.35, 低: 0.35 },
  vib: { あり: 1, 少なめ: 0, なし: 0 },
  dyn: { 大: 0.8, 中: 0.5, 小: 0.2 },
};
function target(key, word) {
  const dict = WORDS[key] || WORDS.level;
  return dict[word];
}

export const ORDER = ['ITA', 'DEU', 'USA', 'FRA', 'GBR', 'KOR', 'JPN'];
export const EN = { ITA: 'ITALIAN', DEU: 'GERMAN', USA: 'AMERICAN', FRA: 'FRENCH', GBR: 'BRITISH', KOR: 'KOREAN', JPN: 'JAPANESE' };
export const LAND = { ITA: 'ITALIA', DEU: 'DEUTSCHLAND', USA: 'U.S.A.', FRA: 'FRANCE', GBR: 'UNITED KINGDOM', KOR: 'KOREA', JPN: 'JAPAN' };

export function features(r) {
  const [pitch, rhythm, long, attack, legato, vowel = 0.5] = r.radar;
  return { bright: r.map[0], clear: r.map[1], vowel, cons: r.f.cons ?? 0.5, pitch, rhythm, long, attack, legato, vib: r.f.vib, dyn: r.f.dyn, hi: r.f.hi, lo: r.f.lo };
}

export function classify(r) {
  const f = features(r);
  const scored = ORDER.map((code) => {
    let sum = 0, wsum = 0;
    Object.entries(C.profiles[code] || {}).forEach(([key, [word, w = 1]]) => {
      const t = target(key, word);
      if (t === undefined || f[key] === undefined) return;
      let diff = f[key] - t;
      if (key === 'bright' || key === 'clear') diff /= 2; // -1〜1 の幅をそろえる
      sum += w * diff * diff;
      wsum += w;
    });
    return { code, d: wsum ? sum / wsum : 9 };
  }).sort((a, b) => a.d - b.d);
  return { type: scored[0].code, sub: scored[1].code };
}
