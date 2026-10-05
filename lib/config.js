// ===== コエシルの基本設定 =====
// 測定の「ものさし」はここに集めています。生徒テストの結果を見て、ここの数字を調整します。

export const BPM = 90;
export const BEAT = 60 / BPM; // 1拍の秒数
export const COUNT_BEATS = 4; // カウント
export const SING_BEATS = 24; // 歌う部分(上行8+3、息継ぎ1、下行8+3、休符1)
export const ROOT = { female: 57, male: 52 }; // A3 / E3(MIDIノート番号)

// 歌う音: [半音, 開始拍, 長さ(拍)]  ※開始拍は歌い出し=0
export const NOTES = [
  [0, 0, 1], [2, 1, 1], [4, 2, 1], [5, 3, 1], [7, 4, 1], [9, 5, 1], [11, 6, 1], [12, 7, 4],
  [12, 12, 1], [11, 13, 1], [9, 14, 1], [7, 15, 1], [5, 16, 1], [4, 17, 1], [2, 18, 1], [0, 19, 4],
];
export const SOLFEGE = ['ド', 'レ', 'ミ', 'ファ', 'ソ', 'ラ', 'シ', 'ド', 'ド', 'シ', 'ラ', 'ソ', 'ファ', 'ミ', 'レ', 'ド'];
export const LOW_IDX = [0, 1, 2, 13, 14, 15]; // ド・レ・ミ(上り/下り)
export const HIGH_IDX = [4, 5, 6, 7, 8, 9, 10, 11]; // ソ・ラ・シ・上のド(上り/下り)

// 録音前の静かな時間(雑音を測る)
export const PRE_ROLL = 0.8;

// ===== 判定のものさし(調整用) =====
export const TUNE = {
  // 録音の失敗チェック
  minVoiceDb: -42, // 声の大きさ(これより小さいと「声が小さい」)
  maxNoiseDb: -48, // 歌う前の周りの音(これより大きいと「雑音が多い」)
  clipRatio: 0.002, // 音割れの割合
  minVoicedRatio: 0.6, // 歌っている時間の割合(これより少ないと「途中で途切れた」)
  maxMedianCents: 350, // 見本の音とあまりに違う時

  // 5項目の評価(0〜1に換算するための基準)
  pitchGoodCents: 12, pitchBadCents: 60, // 音程のズレ(平均)
  rhythmGoodMs: 35, rhythmBadMs: 140, // タイミングのばらつき
  rhythmBiasAllowMs: 90, // 平均のズレはここまで許す(イヤホンの遅れなどを考慮)
  longWobbleGood: 8, longWobbleBad: 35, // ロングトーンの音程の揺れ(セント)
  longDropGood: 2, longDropBad: 9, // ロングトーンの音量の落ち込み(dB)
  attackGoodMs: 50, attackBadMs: 220, // 狙った音に入るまでの時間
  scoopCents: -45, // これより下から入ると「しゃくり」
  legatoGapGoodMs: 20, legatoGapBadMs: 160, // 音と音の間の途切れ
  legatoMoveGoodMs: 60, legatoMoveBadMs: 220, // 音の移り変わりにかかる時間

  // 声質マップ(マイクや部屋で変わりやすいので、生徒テストで要調整)
  brightCenter: -14, brightRange: 10, // 明るさ(高い倍音の割合 dB)
  clearCenter: 0.13, clearRange: 0.08, // 息っぽさ(周期のゆらぎ)

  // その他の特徴
  vibratoMinCents: 14, // ビブラートとみなす揺れ幅
  dynamicsBigDb: 4.5, // 音量の起伏が大きい
  biasCents: 25, // 全体が低め/高めとみなすズレ
  regionWeak: 0.14, // 高音部/低音部が「弱い」とみなす差
};

export const LINKS = {
  apply: 'https://www.ksvox.net/apply/',
  showcase: 'https://showcase.ksvox.net',
  site: 'https://www.ksvox.net',
  app: 'https://koeshiru.ksvox.net',
};
