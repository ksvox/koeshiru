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
  pitchZoneCents: 17, pitchGoodCents: 2, pitchBadCents: 40, // 満点の幅=半音の1/6(2026-10-06) // ゾーンを超えた分のズレ(平均)
  pitchSkipSec: 0.18, // 音に入ってから判定を始めるまで(人の声が音程に到達する時間)
  // リズム:拍の前後 rhythmZoneMs 以内に入れば満点(音楽ゲームのPerfect判定のように)
  rhythmZoneMs: 100, rhythmZeroMs: 300, // イヤホンあり(ゾーン外は rhythmZeroMs で0点)
  rhythmZoneNoEarMs: 150, rhythmZeroNoEarMs: 420, // イヤホンなし(光に合わせるので少し広め)
  rhythmDriftMs: 90, // テンポが途中で走る/もたるとみなす変化
  rhythmOffsetMaxMs: 700, // 全体の一定のズレはスマホの音の遅れとみなして差し引く(これを超えたら差し引かない)
  longWobbleGood: 10, longWobbleBad: 40, // ロングトーンの音程の揺れ(セント)
  longDropGood: 3, longDropBad: 12, // ロングトーンの音量の落ち込み(dB)
  longTailSec: 0.4, // ロングトーンの最後の収め方は判定しない
  attackGoodMs: 90, attackBadMs: 320, // 狙った音に入るまでの時間
  scoopCents: -70, // これより下から入ると「しゃくり」
  legatoGapGoodMs: 40, legatoGapBadMs: 200, // 音と音の間の途切れ
  legatoMoveGoodMs: 90, legatoMoveBadMs: 300, // 音の移り変わりにかかる時間

  // 声質マップ(2026-10-06 実測2名で中心を合わせ直し。人数が増えたら再調整)
  brightCenter: -10, brightRange: 6, // 明るさ(高い倍音の割合 dB)
  clearCenter: 0.014, clearRange: 0.012, // 息っぽさ(周期のゆらぎ)(2026-10-07 生徒3名6件で再調整)

  // 母音の響き(ド・レ・ミ・ファの「お・え・い・あ」で判定)
  // 日本語の母音の標準的な響きの位置 [F1, F2](Hz、話し言葉の平均的な値)
  vowelRefM: { i: [300, 2200], e: [480, 1900], a: [750, 1200], o: [480, 850] },
  vowelRefF: { i: [350, 2750], e: [550, 2400], a: [850, 1450], o: [530, 950] },
  vowelRefScale: 1.0, // 標準の何割の個性で「線の先いっぱい」とするか(1=標準と同じ)
  vowelWeak: 0.5, // これより個性が弱いと「い」が暗い/「お」が軽い とコメント
  // 子音の強さ(タイプ判定だけに使用。マイクの影響を受けやすい)
  consCenter: -22, consRange: 10,

  // その他の特徴
  vibratoMinCents: 14, // ビブラートとみなす揺れ幅
  dynamicsBigDb: 4.5, // 音量の起伏が大きい
  biasCents: 35, // 全体が低め/高めとみなすズレ
  regionWeak: 0.14, // 高音部/低音部が「弱い」とみなす差
};

// レーダーの見た目の目盛り(測定値0〜1を、表示用に少し控えめにする)
// 表示 = scale × 測定値^power 。生徒さんの良い結果が「5段階の2〜4」あたりに来るように調整(2026-10-07)
export const RADAR_DISPLAY = { scale: 0.85, power: 1.8 };
export const radarShow = (v) => Math.max(0.08, Math.min(1, RADAR_DISPLAY.scale * Math.pow(Math.max(0, v), RADAR_DISPLAY.power)));

export const LINKS = {
  apply: 'https://www.ksvox.net/apply/',
  showcase: 'https://showcase.ksvox.net',
  site: 'https://www.ksvox.net',
  app: 'https://koeshiru.ksvox.net',
};
