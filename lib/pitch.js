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
