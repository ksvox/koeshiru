// 音を鳴らす・録音する(ブラウザの中だけで完結。声はどこにも送信しない)
import { BEAT, COUNT_BEATS, NOTES, PRE_ROLL } from './config';

let ctx = null;
export function getCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC({ latencyHint: 'interactive' });
  }
  return ctx;
}
export async function resumeCtx() {
  const c = getCtx();
  if (c.state !== 'running') { try { await c.resume(); } catch (e) {} }
  return c;
}
export function outLatency() {
  const c = getCtx();
  return (c.outputLatency || 0) + (c.baseLatency || 0);
}

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

// やわらかいピアノ風の音
function tone(c, out, midi, t, dur, vol = 0.32) {
  const f = mtof(midi);
  const g = c.createGain();
  g.connect(out);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(vol * 0.55, t + 0.35);
  g.gain.setValueAtTime(vol * 0.55, Math.max(t + 0.36, t + dur - 0.09));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  const parts = [[1, 1], [2, 0.35], [3, 0.12], [4, 0.06]];
  parts.forEach(([h, a]) => {
    const o = c.createOscillator();
    o.type = h === 1 ? 'triangle' : 'sine';
    o.frequency.value = f * h;
    const pg = c.createGain();
    pg.gain.value = a;
    o.connect(pg); pg.connect(g);
    o.start(t); o.stop(t + dur + 0.02);
  });
}

// メトロノーム
function click(c, out, t, accent) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = 'square';
  o.frequency.value = accent ? 1800 : 1250;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(accent ? 0.22 : 0.15, t + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  o.connect(g); g.connect(out);
  o.start(t); o.stop(t + 0.06);
}

let master = null;
export const isIOS = () => typeof navigator !== 'undefined' && (/iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
export function stopAll() {
  if (master) { try { master.gain.setValueAtTime(0, getCtx().currentTime); master.disconnect(); } catch (e) {} master = null; }
}

// 見本/録音の再生を予約する
// mode: 'sample'(見本:音+クリック) / 'recEar'(イヤホンあり:カウント+ルート音+クリック) / 'recNoEar'(イヤホンなし:カウント+ルート音のみ)
export function schedule(rootMidi, mode, startDelay) {
  const c = getCtx();
  stopAll();
  master = c.createGain();
  // iPhoneはマイク使用中に再生音量が自動で下がるので、録音中だけ大きめに鳴らす(音割れ防止のリミッター付き)
  const boost = mode !== 'sample' && isIOS() ? 3.2 : 1;
  master.gain.value = boost;
  if (boost > 1) {
    const lim = c.createDynamicsCompressor();
    lim.threshold.value = -6; lim.knee.value = 4; lim.ratio.value = 12; lim.attack.value = 0.002; lim.release.value = 0.1;
    master.connect(lim); lim.connect(c.destination);
  } else {
    master.connect(c.destination);
  }
  const t0 = c.currentTime + startDelay; // カウント1拍目
  const sing = t0 + COUNT_BEATS * BEAT; // 歌い出し
  for (let b = 0; b < COUNT_BEATS; b++) click(c, master, t0 + b * BEAT, b === 0);
  tone(c, master, rootMidi, t0, COUNT_BEATS * BEAT - 0.12, 0.22);
  if (mode !== 'recNoEar') {
    for (let b = 0; b < 24; b++) click(c, master, sing + b * BEAT, b % 4 === 0);
  }
  if (mode === 'sample') {
    NOTES.forEach(([semi, start, len]) => tone(c, master, rootMidi + semi, sing + start * BEAT, len * BEAT - 0.04));
  }
  return { t0, sing, end: sing + 24 * BEAT };
}

// ---- 録音 ----
const WORKLET = `
class KoeCapture extends AudioWorkletProcessor {
  constructor(){ super(); this.buf = new Float32Array(2048); this.n = 0; this.start = -1; }
  process(inputs){
    const ch = inputs[0] && inputs[0][0];
    if (ch) {
      if (this.n === 0) this.start = currentFrame;
      for (let i = 0; i < ch.length; i++) {
        this.buf[this.n++] = ch[i];
        if (this.n === this.buf.length) { this.port.postMessage({ f: this.start, d: this.buf }); this.buf = new Float32Array(2048); this.n = 0; }
      }
    }
    return true;
  }
}
registerProcessor('koe-capture', KoeCapture);
`;

export async function openMic() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw Object.assign(new Error('nomic'), { code: 'nomic' });
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 },
    });
  } catch (e) {
    throw Object.assign(new Error('denied'), { code: 'denied' });
  }
}

export class Recorder {
  constructor(stream) {
    this.stream = stream;
    this.chunks = [];
    this.firstFrame = null;
    this.analyser = null;
  }
  async start() {
    const c = getCtx();
    this.src = c.createMediaStreamSource(this.stream);
    this.analyser = c.createAnalyser();
    this.analyser.fftSize = 2048;
    this.src.connect(this.analyser);
    this.mute = c.createGain();
    this.mute.gain.value = 0;
    this.mute.connect(c.destination);
    this.chunks = [];
    this.firstFrame = null;
    if (c.audioWorklet && window.AudioWorkletNode) {
      if (!Recorder.loaded) {
        const url = URL.createObjectURL(new Blob([WORKLET], { type: 'application/javascript' }));
        await c.audioWorklet.addModule(url);
        Recorder.loaded = true;
      }
      this.node = new AudioWorkletNode(c, 'koe-capture');
      this.node.port.onmessage = (e) => {
        if (this.firstFrame === null) this.firstFrame = e.data.f;
        this.chunks.push(e.data.d);
      };
    } else {
      this.node = c.createScriptProcessor(2048, 1, 1);
      this.node.onaudioprocess = (e) => {
        const d = new Float32Array(e.inputBuffer.getChannelData(0));
        if (this.firstFrame === null) {
          const pt = typeof e.playbackTime === 'number' ? e.playbackTime : c.currentTime;
          this.firstFrame = Math.max(0, Math.round((pt - d.length / c.sampleRate) * c.sampleRate));
        }
        this.chunks.push(d);
      };
    }
    this.src.connect(this.node);
    this.node.connect(this.mute);
  }
  stop() {
    try { this.src.disconnect(); this.node.disconnect(); this.mute.disconnect(); } catch (e) {}
    const c = getCtx();
    const len = this.chunks.reduce((a, b) => a + b.length, 0);
    const samples = new Float32Array(len);
    let o = 0;
    this.chunks.forEach((ch) => { samples.set(ch, o); o += ch.length; });
    return { samples, sampleRate: c.sampleRate, startTime: (this.firstFrame || 0) / c.sampleRate };
  }
  close() {
    try { this.stream.getTracks().forEach((t) => t.stop()); } catch (e) {}
  }
}

export const PRE = PRE_ROLL;
