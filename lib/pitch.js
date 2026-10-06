// 声の高さ・明るさ・息っぽさを測る道具
export const SR = 16000;

// 16kHzに変換(簡単なローパス+線形補間)
export function resample(x, sr) {
  if (sr === SR) return x;
  const r = sr / SR;
  const k = Math.max(1, Math.round(r));
  const sm = new Float32Array(x.length);
  let acc = 0;
  for (let i = 0; i < x.length; i++) {
    acc += x[i];
    if (i >= k) acc -= x[i - k];
    sm[i] = acc / Math.min(i + 1, k);
  }
  const n = Math.floor(x.length / r);
  const y = new Float32Array(n);
  const sh = (k - 1) / 2;
  for (let i = 0; i < n; i++) {
    const p = i * r + sh;
    const j = Math.floor(p);
    const f = p - j;
    y[i] = j + 1 < sm.length ? sm[j] * (1 - f) + sm[j + 1] * f : sm[sm.length - 1] || 0;
  }
  return y;
}

export const W = 512; // 32ms
const MIN_F = 70, MAX_F = 1000;
const TAU_MIN = Math.floor(SR / MAX_F);
const TAU_MAX = Math.floor(SR / MIN_F);
export const FRAME = W + TAU_MAX;
const d = new Float32Array(TAU_MAX + 1);

// YIN法でピッチを求める
export function yin(x, off) {
  let e = 0;
  for (let j = 0; j < W; j++) { const v = x[off + j] || 0; e += v * v; }
  const rms = Math.sqrt(e / W);
  d[0] = 0;
  for (let tau = 1; tau <= TAU_MAX; tau++) {
    let s = 0;
    for (let j = 0; j < W; j++) {
      const a = (x[off + j] || 0) - (x[off + j + tau] || 0);
      s += a * a;
    }
    d[tau] = s;
  }
  let run = 0;
  let best = -1, bestV = 1;
  d[0] = 1;
  for (let tau = 1; tau <= TAU_MAX; tau++) {
    run += d[tau];
    d[tau] = run > 0 ? (d[tau] * tau) / run : 1;
  }
  for (let tau = TAU_MIN; tau < TAU_MAX; tau++) {
    if (d[tau] < 0.15) {
      while (tau + 1 < TAU_MAX && d[tau + 1] < d[tau]) tau++;
      best = tau; bestV = d[tau];
      break;
    }
  }
  if (best < 0) {
    for (let tau = TAU_MIN; tau < TAU_MAX; tau++) if (d[tau] < bestV) { bestV = d[tau]; best = tau; }
  }
  let t = best;
  if (best > TAU_MIN && best < TAU_MAX) {
    const a = d[best - 1], b = d[best], c = d[best + 1];
    const den = a + c - 2 * b;
    if (den !== 0) t = best + (a - c) / (2 * den);
  }
  return { f0: best > 0 ? SR / t : 0, aper: bestV, rms };
}

// FFT(大きさのみ)
const N = 1024;
const re = new Float32Array(N), im = new Float32Array(N);
const hann = new Float32Array(N).map((_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1)));
function fft() {
  for (let i = 1, j = 0; i < N; i++) {
    let bit = N >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let len = 2; len <= N; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    for (let i = 0; i < N; i += len) {
      for (let k = 0; k < len / 2; k++) {
        const wr = Math.cos(ang * k), wi = Math.sin(ang * k);
        const xr = re[i + k + len / 2] * wr - im[i + k + len / 2] * wi;
        const xi = re[i + k + len / 2] * wi + im[i + k + len / 2] * wr;
        re[i + k + len / 2] = re[i + k] - xr; im[i + k + len / 2] = im[i + k] - xi;
        re[i + k] += xr; im[i + k] += xi;
      }
    }
  }
}
// 明るさ:高い帯域(1〜5kHz)と低い帯域(50Hz〜1kHz)のエネルギー比(dB)
export function brightness(x, off) {
  for (let i = 0; i < N; i++) { re[i] = (x[off + i] || 0) * hann[i]; im[i] = 0; }
  fft();
  let lo = 0, hi = 0;
  const bin = SR / N;
  for (let k = 1; k < N / 2; k++) {
    const f = k * bin;
    const p = re[k] * re[k] + im[k] * im[k];
    if (f >= 50 && f < 1000) lo += p;
    else if (f >= 1000 && f < 5000) hi += p;
  }
  return 10 * Math.log10((hi + 1e-12) / (lo + 1e-12));
}

export const toMidi = (f) => 69 + 12 * Math.log2(f / 440);
export const db = (r) => 20 * Math.log10(r + 1e-9);

// 録音中のモニター用(元の音のまま、数フレームだけ)
export function livePitch(buf, sr) {
  const x = resample(buf, sr);
  if (x.length < FRAME) return { f0: 0, rms: 0 };
  const r = yin(x, x.length - FRAME);
  return r.aper < 0.3 ? r : { f0: 0, rms: r.rms };
}

// ---- 母音の響き(フォルマント)と子音の強さ ----
const LW = 512;
const ham = new Float32Array(LW).map((_, i) => 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (LW - 1)));
const ORDER = 16;
// LPC(線形予測)で声の響きの山(フォルマント)F1・F2を求める
export function formants(x, off) {
  const w = new Float32Array(LW);
  let prev = x[off - 1] || 0;
  for (let i = 0; i < LW; i++) { const v = x[off + i] || 0; w[i] = (v - 0.97 * prev) * ham[i]; prev = v; }
  const r = new Float64Array(ORDER + 1);
  for (let k = 0; k <= ORDER; k++) { let s = 0; for (let i = k; i < LW; i++) s += w[i] * w[i - k]; r[k] = s; }
  if (r[0] <= 1e-10) return null;
  r[0] *= 1.0001;
  const a = new Float64Array(ORDER + 1); a[0] = 1;
  let err = r[0];
  for (let i = 1; i <= ORDER; i++) {
    let acc = r[i];
    for (let j = 1; j < i; j++) acc += a[j] * r[i - j];
    const k = -acc / err;
    const tmp = a.slice();
    for (let j = 1; j < i; j++) a[j] = tmp[j] + k * tmp[i - j];
    a[i] = k;
    err *= 1 - k * k;
    if (err <= 0) return null;
  }
  // 0〜4000Hzのスペクトル包絡から山を探す
  const N = 200, env = new Float64Array(N);
  for (let n = 0; n < N; n++) {
    const wv = (2 * Math.PI * (n * 20)) / SR;
    let re2 = 0, im2 = 0;
    for (let j = 0; j <= ORDER; j++) { re2 += a[j] * Math.cos(wv * j); im2 -= a[j] * Math.sin(wv * j); }
    env[n] = -10 * Math.log10(re2 * re2 + im2 * im2 + 1e-12);
  }
  const peaks = [];
  for (let n = 1; n < N - 1; n++) if (env[n] > env[n - 1] && env[n] >= env[n + 1]) peaks.push(n * 20);
  // 山が重なって見えない時は「肩」(曲がり方が一番強い所)も候補にする
  if (peaks.filter((f) => f >= 220 && f <= 3200).length < 2) {
    for (let n = 2; n < N - 2; n++) {
      const d2 = env[n + 1] - 2 * env[n] + env[n - 1];
      const p2 = env[n] - 2 * env[n - 1] + env[n - 2], n2 = env[n + 2] - 2 * env[n + 1] + env[n];
      if (d2 < p2 && d2 <= n2 && d2 < -0.15 && !peaks.some((f) => Math.abs(f - n * 20) < 120)) peaks.push(n * 20);
    }
    peaks.sort((a, b) => a - b);
  }
  const f1 = peaks.find((f) => f >= 220 && f <= 1100);
  if (!f1) return null;
  const f2 = peaks.find((f) => f > f1 + 200 && f >= 600 && f <= 3200);
  if (!f2) return null;
  return { f1, f2 };
}

// 帯域のエネルギー(dB)。子音の強さを見るのに使う
export function bandDb(x, a, b, lo, hi) {
  const n = Math.max(0, b - a);
  if (n < 64) return -120;
  let tot = 0, cnt = 0;
  for (let off = a; off + N <= b + N / 2; off += N / 2) {
    for (let i = 0; i < N; i++) { re[i] = (x[off + i] || 0) * hann[i]; im[i] = 0; }
    fft();
    for (let k = 1; k < N / 2; k++) {
      const f = (k * SR) / N;
      if (f >= lo && f < hi) tot += re[k] * re[k] + im[k] * im[k];
    }
    cnt++;
  }
  return 10 * Math.log10(tot / Math.max(1, cnt) + 1e-12);
}
export const bark = (f) => (26.81 * f) / (1960 + f) - 0.53;
