// 録音した声を解析する(すべてスマホの中で計算)
import { BEAT, NOTES, LOW_IDX, HIGH_IDX, TUNE as T } from './config';
import { SR, W, FRAME, resample, yin, brightness, toMidi, db } from './pitch';

const HOP = 160; // 10ms
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lin = (v, good, bad) => clamp(1 - (v - good) / (bad - good), 0, 1);
const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);
const median = (a) => {
  if (!a.length) return NaN;
  const s = [...a].sort((x, y) => x - y);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const std = (a) => {
  if (a.length < 2) return 0;
  const m = mean(a);
  return Math.sqrt(mean(a.map((v) => (v - m) * (v - m))));
};

export function analyze({ samples, sampleRate, startTime, t0, sing, rootMidi, latency }) {
  const x = resample(samples, sampleRate);
  const tOf = (i) => startTime + i / SR;
  const iOf = (t) => Math.round((t - startTime) * SR);
  const iAt0 = iOf;

  // 歌う前の周りの音
  const n0 = Math.max(0, iOf(startTime + 0.12)), n1 = Math.max(n0 + 1, iOf(t0 - 0.12));
  let ne = 0;
  for (let i = n0; i < n1 && i < x.length; i++) ne += x[i] * x[i];
  const noiseDb = db(Math.sqrt(ne / Math.max(1, Math.min(n1, x.length) - n0)));

  // 音割れ
  const c0 = Math.max(0, Math.round((sing - startTime) * sampleRate));
  const c1 = Math.min(samples.length, Math.round((sing + 24 * BEAT - startTime) * sampleRate));
  let clip = 0;
  for (let i = c0; i < c1; i++) if (Math.abs(samples[i]) > 0.985) clip++;
  const clipRatio = clip / Math.max(1, c1 - c0);

  // フレームごとの測定
  const fs = [];
  const from = Math.max(0, iOf(sing + latency - 0.6) - W / 2);
  const to = Math.min(x.length - FRAME, iOf(sing + latency + 24 * BEAT + 0.3));
  const floorDb = Math.max(noiseDb + 8, -60);
  let k = 0;
  for (let off = from; off < to; off += HOP, k++) {
    const r = yin(x, off);
    const d = db(r.rms);
    const v = r.f0 > 0 && r.aper < 0.3 && d > floorDb;
    const fr = { s: tOf(off + W / 2) - sing - latency, m: v ? toMidi(r.f0) : NaN, a: r.aper, d, v, b: NaN };
    if (v && k % 2 === 0 && off + 1024 < x.length) fr.b = brightness(x, off);
    fs.push(fr);
  }
  const iAt = (s) => clamp(Math.round((s - (fs[0]?.s || 0)) / 0.01), 0, fs.length - 1);

  const targetAt = (s) => {
    const b = s / BEAT;
    for (const [semi, st, len] of NOTES) if (b >= st && b < st + len) return rootMidi + semi;
    return null;
  };

  // オクターブ違いで歌っても大丈夫なように補正
  const diffs = [];
  fs.forEach((f) => { if (f.v) { const t = targetAt(f.s); if (t !== null) diffs.push(f.m - t); } });
  const medDiff = median(diffs);
  const oct = Number.isFinite(medDiff) ? Math.round(medDiff / 12) * 12 : 0;
  fs.forEach((f) => { if (f.v) f.m -= oct; });
  const mismatch = Number.isFinite(medDiff) ? Math.abs(medDiff - oct) * 100 : 999;

  // 録音の失敗チェック
  let inNote = 0, voicedInNote = 0;
  const vdb = [];
  fs.forEach((f) => {
    if (targetAt(f.s) !== null) { inNote++; if (f.v) { voicedInNote++; vdb.push(f.d); } }
  });
  const voicedRatio = voicedInNote / Math.max(1, inNote);
  const voiceDb = median(vdb);
  let error = null;
  if (noiseDb > T.maxNoiseDb) error = 'noise';
  else if (clipRatio > T.clipRatio) error = 'clip';
  else if (!Number.isFinite(voiceDb) || (voiceDb < T.minVoiceDb && voicedRatio < 0.85)) error = 'quiet';
  else if (voicedRatio < T.minVoicedRatio) error = 'cut';
  else if (mismatch > T.maxMedianCents) error = 'mismatch';
  if (error) return { error };

  const near = (f, t, semis) => f.v && Math.abs(f.m - t) < semis;

  // 1音ずつ
  const notes = NOTES.map(([semi, st, len], i) => {
    const target = rootMidi + semi;
    const phraseStart = i === 0 || i === 8;
    const prev = phraseStart ? null : rootMidi + NOTES[i - 1][0];
    const tS = st * BEAT;
    const a = iAt(tS - 0.45 * BEAT), b = iAt(tS + 0.6 * BEAT);
    let onset = -1;
    for (let j = a; j <= b; j++) {
      if (prev === null) {
        let ok = 0;
        for (let q = j; q < j + 6 && q < fs.length; q++) if (fs[q].v) ok++;
        if (fs[j].v && ok >= 5) { onset = j; break; }
      } else {
        const mid = (target + prev) / 2, dir = Math.sign(target - prev);
        const cross = (q) => q < fs.length && fs[q].v && (fs[q].m - mid) * dir > 0;
        if (cross(j) && cross(j + 1) && cross(j + 2)) { onset = j; break; }
      }
    }
    const res = { i, target, onsetS: null, settle: null, dev: null, sd: null, d: null, scoop: false, detached: phraseStart, cents: [] };
    if (onset < 0) return res;
    res.onsetS = fs[onset].s;
    // 直前に途切れがあったか
    let gapBefore = 0;
    for (let q = onset - 1; q >= Math.max(0, onset - 25) && !fs[q].v; q--) gapBefore++;
    if (gapBefore >= 8) res.detached = true;
    // その音で実際に落ち着いた高さ(全体が少し低め/高めの人も公平に測るため)
    const pv = [];
    for (let j = iAt(res.onsetS + 0.15); j <= iAt(res.onsetS + len * BEAT - 0.08); j++) if (near(fs[j], target, 1)) pv.push(fs[j].m);
    const home = pv.length >= 3 && Math.abs(median(pv) - target) < 0.8 ? median(pv) : target;
    // 狙った音に落ち着くまで
    const lim = iAt(res.onsetS + Math.min(0.8, len * BEAT * 0.8));
    let arrive = -1;
    for (let j = onset; j <= lim; j++) {
      if (near(fs[j], home, 0.3) && near(fs[j + 1] || {}, home, 0.4) && near(fs[j + 2] || {}, home, 0.4)) { arrive = j; break; }
    }
    res.settle = arrive >= 0 ? (fs[arrive].s - res.onsetS) * 1000 : T.attackBadMs * 1.3;
    if (arrive < 0) arrive = Math.min(fs.length - 1, onset + 15);
    res.arriveS = fs[arrive].s;
    // しゃくり(最初の70ms)
    if (res.detached) {
      const first = [];
      for (let j = onset; j < onset + 7 && j < fs.length; j++) if (fs[j].v) first.push((fs[j].m - home) * 100);
      res.scoop = first.length >= 3 && mean(first) < T.scoopCents;
    }
    // 音程
    const isLong = len > 1;
    const e = iAt(res.onsetS + len * BEAT - (isLong ? T.longTailSec : 0.12));
    const b0 = Math.max(arrive, iAt(res.onsetS + T.pitchSkipSec));
    const cs = [], ds = [], times = [];
    for (let j = b0; j <= e; j++) {
      if (near(fs[j], target, 1.5)) { cs.push((fs[j].m - target) * 100); ds.push(fs[j].d); times.push(fs[j].s); }
    }
    if (cs.length >= 3) { res.dev = median(cs); res.sd = std(cs); res.d = median(ds); res.cents = cs; res.dbs = ds; res.times = times; }
    // 伸ばした音の中で声が出ていた割合
    const v0 = iAt(res.onsetS + 0.1), v1 = iAt(res.onsetS + len * BEAT - (len > 1 ? T.longTailSec : 0.1));
    let vv = 0;
    for (let j = v0; j <= v1; j++) if (fs[j].v) vv++;
    res.voicedFrac = vv / Math.max(1, v1 - v0 + 1);
    return res;
  });

  const found = notes.filter((n) => n.dev !== null);

  // ピッチ
  const over = (d) => Math.max(0, Math.abs(d) - T.pitchZoneCents);
  const absDevs = notes.map((n) => (n.dev === null ? 80 : Math.abs(n.dev)));
  const pitchMean = mean(absDevs);
  const pitchOver = mean(notes.map((n) => (n.dev === null ? 50 : over(n.dev))));
  const bias = mean(found.map((n) => n.dev));
  const pitch = lin(pitchOver, T.pitchGoodCents, T.pitchBadCents);

  // リズム(拍の前後に幅を持たせて判定。全体の一定のズレはスマホの遅れとして差し引く)
  const rdev = notes.filter((n) => n.onsetS !== null).map((n) => (n.onsetS - NOTES[n.i][1] * BEAT) * 1000);
  const rBias = median(rdev);
  const offset = Math.abs(rBias) <= T.rhythmOffsetMaxMs ? rBias : 0;
  const resid = rdev.map((v) => v - offset);
  const spread = mean(resid.map((v) => Math.abs(v)));
  const hit = (v) => (Math.abs(v) <= T.rhythmZoneMs ? 1 : clamp(1 - (Math.abs(v) - T.rhythmZoneMs) / (T.rhythmZeroMs - T.rhythmZoneMs), 0, 1));
  const rhythm = clamp(resid.length ? (resid.reduce((s, v) => s + hit(v), 0) / 16) : 0, 0, 1);
  const half = (idx) => mean(notes.filter((n) => idx.includes(n.i) && n.onsetS !== null).map((n) => (n.onsetS - NOTES[n.i][1] * BEAT) * 1000));
  const driftAsc = half([4, 5, 6, 7]) - half([0, 1, 2, 3]);
  const driftDesc = half([12, 13, 14, 15]) - half([8, 9, 10, 11]);
  const drift = mean([driftAsc, driftDesc].filter(Number.isFinite));
  const rush = drift < -T.rhythmDriftMs || (offset === 0 && rBias < 0);
  const drag = !rush && (drift > T.rhythmDriftMs || (offset === 0 && rBias > 0));

  // ロングトーン(上のド・下のド)
  const longs = [7, 15].map((i) => {
    const n = notes[i];
    if (!n.cents || n.cents.length < 25) return { wobble: T.longWobbleBad, drop: T.longDropBad, frac: n.voicedFrac || 0, vib: false };
    const skip = 7; // 入りの直後は除く
    const c = n.cents.slice(skip), dd = n.dbs.slice(skip);
    const sm = c.map((_, j) => mean(c.slice(Math.max(0, j - 7), j + 8)));
    const wobble = std(sm);
    const resid = c.map((v, j) => v - sm[j]);
    const extent = Math.SQRT2 * std(resid);
    let zc = 0;
    for (let j = 1; j < resid.length; j++) if (resid[j - 1] * resid[j] < 0) zc++;
    const rate = zc / 2 / (resid.length * 0.01);
    const p = Math.max(3, Math.floor(dd.length * 0.3));
    const drop = mean(dd.slice(0, p)) - mean(dd.slice(-p));
    return { wobble, drop, frac: n.voicedFrac, vib: extent >= T.vibratoMinCents && rate >= 3.8 && rate <= 8.5, extent };
  });
  const wob = mean(longs.map((l) => l.wobble));
  const drop = mean(longs.map((l) => Math.max(0, l.drop)));
  const frac = mean(longs.map((l) => l.frac));
  const long = clamp(0.5 * lin(wob, T.longWobbleGood, T.longWobbleBad) + 0.35 * lin(drop, T.longDropGood, T.longDropBad) + 0.15 * lin(1 - frac, 0.05, 0.4), 0, 1);
  const longPitchWeak = wob > (T.longWobbleGood + T.longWobbleBad) / 2;
  const longVolWeak = drop > (T.longDropGood + T.longDropBad) / 2 || frac < 0.75;
  const vibrato = longs.some((l) => l.vib);

  // 音の立ち上がり
  const settles = notes.filter((n) => n.settle !== null).map((n) => n.settle);
  const detached = notes.filter((n) => n.detached && n.onsetS !== null);
  const scoopRatio = detached.length ? detached.filter((n) => n.scoop).length / detached.length : 0;
  const attack = clamp(lin(mean(settles), T.attackGoodMs, T.attackBadMs) * (1 - 0.4 * scoopRatio), 0, 1);
  const scoop = scoopRatio >= 0.5;

  // 音のつながり
  const gaps = [], moves = [];
  notes.forEach((n) => {
    if (n.i === 0 || n.i === 8 || n.arriveS === undefined) return;
    const prev = rootMidi + NOTES[n.i - 1][0];
    const ai = iAt(n.arriveS);
    let leave = -1;
    for (let j = ai - 1; j >= Math.max(0, ai - 60); j--) if (near(fs[j], prev, 0.4)) { leave = j; break; }
    if (leave < 0) { moves.push(T.legatoMoveBadMs); gaps.push(T.legatoGapBadMs); return; }
    moves.push((fs[ai].s - fs[leave].s) * 1000);
    let g = 0;
    for (let j = leave; j < ai; j++) if (!fs[j].v) g++;
    gaps.push(g * 10);
  });
  const gapMean = mean(gaps), moveMean = mean(moves);
  const legato = clamp(0.55 * lin(gapMean, T.legatoGapGoodMs, T.legatoGapBadMs) + 0.45 * lin(moveMean, T.legatoMoveGoodMs, T.legatoMoveBadMs), 0, 1);

  // 高音部・低音部・上り下り
  const medDb = median(found.map((n) => n.d));
  const u = notes.map((n) => (n.dev === null ? 1.5 : Math.min(1.5, over(n.dev) / 50 + Math.max(0, n.sd - 10) / 40 + Math.max(0, medDb - n.d - 2) / 8)));
  const uMean = (idx) => mean(idx.map((i) => u[i]));
  const allIdx = notes.map((n) => n.i);
  const rest = (idx) => allIdx.filter((i) => !idx.includes(i));
  const hi = clamp(1 - uMean(HIGH_IDX), 0, 1);
  const lo = clamp(1 - uMean(LOW_IDX), 0, 1);
  const hiWeak = uMean(HIGH_IDX) - uMean(rest(HIGH_IDX)) > T.regionWeak;
  const loWeak = !hiWeak && uMean(LOW_IDX) - uMean(rest(LOW_IDX)) > T.regionWeak;
  const rAbs = (i) => { const n = notes[i]; return n.onsetS === null ? 0.5 : Math.max(0, Math.abs((n.onsetS - NOTES[i][1] * BEAT) * 1000 - offset) - T.rhythmZoneMs) / 200; };
  const ascU = mean([0, 1, 2, 3, 4, 5, 6, 7].map((i) => u[i] + rAbs(i)));
  const descU = mean([8, 9, 10, 11, 12, 13, 14, 15].map((i) => u[i] + rAbs(i)));
  const descWeak = descU - ascU > 0.18;
  const ascWeak = ascU - descU > 0.18;

  // 音量の起伏
  const shortDb = notes.filter((n) => n.d !== null && n.i !== 7 && n.i !== 15).map((n) => n.d);
  const dynStd = std(shortDb);
  const dyn = clamp(dynStd / (2 * T.dynamicsBigDb), 0, 1);

  // 声質マップ
  const alphas = [], apers = [];
  fs.forEach((f) => { if (f.v && targetAt(f.s) !== null) { apers.push(f.a); if (Number.isFinite(f.b)) alphas.push(f.b); } });
  const bright = clamp((median(alphas) - T.brightCenter) / T.brightRange, -1, 1) || 0;
  const clear = clamp((T.clearCenter - median(apers)) / T.clearRange, -1, 1) || 0;

  // 音程の軌跡(1拍を8つに分けて記録)
  const trace = [];
  for (let q = 0; q < 24 * 8; q++) {
    const s = (q + 0.5) * (BEAT / 8);
    const j0 = iAt(s - BEAT / 16), j1 = iAt(s + BEAT / 16);
    const ms = [];
    for (let j = j0; j <= j1; j++) if (fs[j] && fs[j].v) ms.push(fs[j].m);
    trace.push(ms.length ? Math.round((median(ms) - rootMidi) * 10) : null);
  }

  // 声の波形(大まかな輪郭だけ。ここから声を再生することはできない)
  const WB = 48;
  const w0 = iAt0(sing + latency - 0.1), w1 = iAt0(sing + latency + 24 * BEAT + 0.1);
  const env = [];
  for (let k2 = 0; k2 < WB; k2++) {
    const a2 = w0 + Math.floor(((w1 - w0) * k2) / WB), b2 = w0 + Math.floor(((w1 - w0) * (k2 + 1)) / WB);
    let e2 = 0, n2 = 0;
    for (let i = Math.max(0, a2); i < Math.min(x.length, b2); i++) { e2 += x[i] * x[i]; n2++; }
    env.push(n2 ? Math.sqrt(e2 / n2) : 0);
  }
  const emax = Math.max(...env, 1e-6);
  const wave = env.map((v) => Math.min(9, Math.round((v / emax) * 9))).join('');

  const r2 = (v) => Math.round(v * 100) / 100;
  return {
    radar: [pitch, rhythm, long, attack, legato].map(r2),
    map: [r2(bright), r2(clear)],
    f: {
      hi: r2(hi), lo: r2(lo), dyn: r2(dyn),
      vib: vibrato ? 1 : 0, bias: Math.round(bias || 0),
      rush: rush ? 1 : 0, drag: drag ? 1 : 0,
      lp: longPitchWeak ? 1 : 0, lv: longVolWeak ? 1 : 0, sc: scoop ? 1 : 0,
      hw: hiWeak ? 1 : 0, lw: loWeak ? 1 : 0, dw: descWeak ? 1 : 0, aw: ascWeak ? 1 : 0,
    },
    trace,
    wave,
    raw: { pitchMean: Math.round(pitchMean), pitchOver: Math.round(pitchOver), offset: Math.round(offset), rBias: Math.round(rBias), spread: Math.round(spread), wob: Math.round(wob), drop: r2(drop), settle: Math.round(mean(settles)), gap: Math.round(gapMean), move: Math.round(moveMean), noiseDb: Math.round(noiseDb), voiceDb: Math.round(voiceDb), dynStd: r2(dynStd), alpha: r2(median(alphas)), aper: Math.round(median(apers) * 1000) / 1000 },
  };
}
