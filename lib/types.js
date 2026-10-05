// 7つのボイスタイプの判定(先生の「判定プロフィール」表を数値にしたもの)
// 値: 明るさ・クリアさは -1〜1、その他は 0〜1。w は重み(★=2、通常=1、問わない=0)
const BRIGHT = { 明るい: 0.6, やや明るい: 0.3, 中: 0, '中〜やや暗い': -0.15, 暗い: -0.6 };
const CLEAR = { クリア: 0.6, ややクリア: 0.3, 中: 0, 息っぽい: -0.6 };
const LEVEL = { 高: 0.85, 中: 0.6, 低: 0.35 };
const DYN = { 大: 0.8, 中: 0.5, 小: 0.2 };

// [値, ★なら2]
export const PROFILES = {
  ITA: { bright: ['明るい', 2], clear: ['クリア', 2], pitch: ['中'], rhythm: ['中'], long: ['高', 2], attack: ['中'], legato: ['高'], vib: ['あり'], dyn: ['中'], hi: ['高', 2] },
  DEU: { bright: ['暗い', 2], clear: ['クリア', 2], pitch: ['中'], rhythm: ['中'], long: ['中'], attack: ['高', 2], legato: ['中'], vib: ['少なめ'], dyn: ['小'], lo: ['高', 2] },
  USA: { bright: ['暗い', 2], clear: ['息っぽい', 2], rhythm: ['高'], long: ['中'], attack: ['低'], legato: ['中'], dyn: ['大', 2], hi: ['高'], lo: ['高'] },
  FRA: { bright: ['やや明るい'], clear: ['息っぽい', 2], pitch: ['中'], rhythm: ['中'], long: ['中'], attack: ['低', 2], legato: ['高', 2], dyn: ['小'] },
  GBR: { bright: ['中'], clear: ['ややクリア'], pitch: ['高', 2], rhythm: ['高'], long: ['中'], attack: ['高', 2], legato: ['中'], vib: ['少なめ'], dyn: ['小'], hi: ['中'] },
  KOR: { bright: ['中〜やや暗い'], clear: ['中'], pitch: ['中'], rhythm: ['中'], long: ['高', 2], attack: ['中'], legato: ['高', 2], vib: ['あり', 2], dyn: ['中'], hi: ['中'] },
  JPN: { bright: ['やや明るい'], clear: ['ややクリア'], pitch: ['高'], rhythm: ['低'], long: ['中'], attack: ['中'], legato: ['低', 2], vib: ['少なめ', 2], dyn: ['小', 2], lo: ['中'] },
};
export const ORDER = ['ITA', 'DEU', 'USA', 'FRA', 'GBR', 'KOR', 'JPN'];
export const EN = { ITA: 'ITALIAN', DEU: 'GERMAN', USA: 'AMERICAN', FRA: 'FRENCH', GBR: 'BRITISH', KOR: 'KOREAN', JPN: 'JAPANESE' };
export const LAND = { ITA: 'ITALIA', DEU: 'DEUTSCHLAND', USA: 'U.S.A.', FRA: 'FRANCE', GBR: 'UNITED KINGDOM', KOR: 'KOREA', JPN: 'JAPAN' };

function target(key, word) {
  if (key === 'bright') return BRIGHT[word];
  if (key === 'clear') return CLEAR[word];
  if (key === 'vib') return word === 'あり' ? 1 : 0;
  if (key === 'dyn') return DYN[word];
  return LEVEL[word];
}

export function features(r) {
  const [pitch, rhythm, long, attack, legato] = r.radar;
  return { bright: r.map[0], clear: r.map[1], pitch, rhythm, long, attack, legato, vib: r.f.vib, dyn: r.f.dyn, hi: r.f.hi, lo: r.f.lo };
}

export function classify(r) {
  const f = features(r);
  const scored = ORDER.map((code) => {
    let sum = 0, wsum = 0;
    Object.entries(PROFILES[code]).forEach(([key, [word, w = 1]]) => {
      const t = target(key, word);
      let diff = f[key] - t;
      if (key === 'bright' || key === 'clear') diff /= 2; // -1〜1 の幅をそろえる
      sum += w * diff * diff;
      wsum += w;
    });
    return { code, d: sum / wsum };
  }).sort((a, b) => a.d - b.d);
  return { type: scored[0].code, sub: scored[1].code };
}
