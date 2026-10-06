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
  // ピッチ:各音の「真ん中の安定した部分」だけで判定。pitchZoneCents以内のズレは満点
  pitchZoneCents: 25, pitchGoodCents: 5, pitchBadCents: 45, // ゾーンを超えた分のズレ(平均)
  pitchSkipSec: 0.18, // 音に入ってから判定を始めるまで(人の声が音程に到達する時間)
  // リズム:拍の前後 rhythmZoneMs 以内に入れば満点(音楽ゲームのPerfect判定のように)
  rhythmZoneMs: 100, rhythmZeroMs: 300, // ゾーン外は rhythmZeroMs で0点
  rhythmDriftMs: 90, // テンポが途中で走る/もたるとみなす変化
  rhythmOffsetMaxMs: 350, // 全体の一定のズレはスマホの音の遅れとみなして差し引く(これを超えたら差し引かない)
  longWobbleGood: 10, longWobbleBad: 40, // ロングトーンの音程の揺れ(セント)
  longDropGood: 3, longDropBad: 12, // ロングトーンの音量の落ち込み(dB)
  longTailSec: 0.4, // ロングトーンの最後の収め方は判定しない
  attackGoodMs: 90, attackBadMs: 320, // 狙った音に入るまでの時間
  scoopCents: -70, // これより下から入ると「しゃくり」
  legatoGapGoodMs: 40, legatoGapBadMs: 200, // 音と音の間の途切れ
  legatoMoveGoodMs: 90, legatoMoveBadMs: 300, // 音の移り変わりにかかる時間

  // 声質マップ(2026-10-06 実測2名で中心を合わせ直し。人数が増えたら再調整)
  brightCenter: -10, brightRange: 6, // 明るさ(高い倍音の割合 dB)
  clearCenter: 0.025, clearRange: 0.025, // 息っぽさ(周期のゆらぎ)

  // その他の特徴
  vibratoMinCents: 14, // ビブラートとみなす揺れ幅
  dynamicsBigDb: 4.5, // 音量の起伏が大きい
  biasCents: 35, // 全体が低め/高めとみなすズレ
  regionWeak: 0.14, // 高音部/低音部が「弱い」とみなす差
};

export const LINKS = {
  apply: 'https://www.ksvox.net/apply/',
  showcase: 'https://showcase.ksvox.net',
  site: 'https://www.ksvox.net',
  app: 'https://koeshiru.ksvox.net',
};
