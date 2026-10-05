// 見本を聴く → 録音する
import { useEffect, useRef, useState } from 'react';
import { C } from './Art';
import { tracePaths } from './Charts';
import { BEAT, NOTES, ROOT, PRE_ROLL } from '../lib/config';
import { getCtx, resumeCtx, schedule, stopAll, openMic, Recorder, outLatency } from '../lib/audio';
import { livePitch, toMidi, db } from '../lib/pitch';
import { analyze } from '../lib/analyze';
import { FIXED } from '../lib/texts';

const LADDER = ['ド', 'レ', 'ミ', 'ファ', 'ソ', 'ラ', 'シ', 'ド'];
const TOTAL = 28; // カウント4+歌24

function guideAt(p) {
  const [c1, c2] = String(FIXED['見本ガイド(カウント)']).split('→').map((s) => s.trim());
  if (p < 0) return '準備しています…';
  if (p < 2) return c1;
  if (p < 4) return c2;
  const s = p - 4;
  if (s < 7) return FIXED['見本ガイド(上行)'];
  if (s < 12) return FIXED['見本ガイド(上のド)'];
  if (s < 19) return FIXED['見本ガイド(下行)'];
  if (s < 24) return FIXED['見本ガイド(下のド)'];
  return FIXED['見本ガイド(終わり)'];
}
function noteAt(s) {
  for (let i = 0; i < NOTES.length; i++) {
    const [, st, len] = NOTES[i];
    if (s >= st && s < st + len) return i;
  }
  return -1;
}

function Panel({ pos, mode, live, level }) {
  const s = pos - 4;
  const ni = s >= 0 ? noteAt(s) : -1;
  const cell = ni < 0 ? -1 : ni < 8 ? ni : 15 - ni;
  const beat = pos >= 0 && pos < TOTAL ? Math.floor(pos) % 4 : -1;
  const flash = pos >= 0 && pos - Math.floor(pos) < 0.35;
  const { target, X, Y } = tracePaths([]);
  const livePath = live.map(([b, v], i) => `${i && live[i - 1][2] === live[i][2] - 1 ? 'L' : 'M'}${X(b).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
  const rec = mode !== 'sample';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="mono" style={{ fontSize: 11, letterSpacing: '0.25em', color: C.gold }}>{rec ? 'VOICE SCAN' : 'SAMPLE'}</div>
          <div className="mincho" style={{ fontSize: 20, fontWeight: 700, marginTop: 2 }}>{rec ? '声を測定しています' : '見本を再生しています'}</div>
        </div>
        {rec ? (
          <div className="mono" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#F08C77' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#E5533A', display: 'inline-block', opacity: flash ? 1 : 0.5 }} />REC
          </div>
        ) : null}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: C.mist || '#AEB5C6' }}>{pos < 4 ? 'カウント' : 'ビート'}</span>
        <div style={{ display: 'flex', gap: 12 }}>
          {[0, 1, 2, 3].map((i) => {
            const on = i === beat;
            return (
              <div key={i} className="mono" style={{ width: 46, height: 46, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                background: on ? (flash ? C.gold : '#8C7A4E') : 'transparent', border: `2px solid ${on ? C.gold : '#3A4766'}`, color: on ? C.navy : '#6F7A96', transition: 'background 0.05s' }}>{i + 1}</div>
            );
          })}
        </div>
      </div>
      <div style={{ background: C.navy2, border: '1px solid #2E3B5C', borderRadius: 6, padding: '22px 14px', textAlign: 'center' }}>
        <div className="mono" style={{ fontSize: 10, letterSpacing: '0.25em', color: '#6F7A96' }}>GUIDE</div>
        <div className="mincho" style={{ fontWeight: 700, fontSize: 23, marginTop: 8, lineHeight: 1.5, minHeight: 70, display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-live="polite">{guideAt(pos)}</div>
      </div>
      <div>
        <div style={{ fontSize: 12, color: '#AEB5C6', marginBottom: 8 }}>今歌う音</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {LADDER.map((n, i) => {
            const on = i === cell;
            return <div key={i} style={{ flex: 1, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 3, fontSize: 13, fontWeight: 700,
              background: on ? C.verm : '#24304D', color: on ? '#fff' : '#8F9AB5' }}>{n}</div>;
          })}
        </div>
      </div>
      <div style={{ background: C.navy2, border: '1px solid #2E3B5C', borderRadius: 6, padding: '10px 10px 8px' }}>
        <div className="mono" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#6F7A96', marginBottom: 4 }}><span>PITCH MONITOR</span><span>90 BPM</span></div>
        <svg viewBox="0 0 340 140" style={{ width: '100%', display: 'block' }} aria-hidden="true">
          {[0, 12].map((v) => <line key={v} x1="10" y1={Y(v)} x2="330" y2={Y(v)} stroke="#24304D" />)}
          <path d={target} fill="none" stroke="#6F7A96" strokeWidth="1.3" strokeDasharray="4 3" />
          {rec ? <path d={livePath} fill="none" stroke={C.gold} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" /> : null}
          {s >= 0 && s <= 24 ? <line x1={X(s)} y1="10" x2={X(s)} y2="132" stroke={C.verm} strokeWidth="1.5" /> : null}
        </svg>
      </div>
      {rec ? (
        <div>
          <div className="mono" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#6F7A96', marginBottom: 6 }}><span>INPUT LEVEL</span><span>{level > 9 ? 'GOOD' : level > 3 ? 'LOW' : ''}</span></div>
          <div style={{ display: 'flex', gap: 3 }}>
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} style={{ flex: 1, height: 12, borderRadius: 1, background: i < level ? (i < 12 ? '#5F8F6A' : i < 15 ? C.gold : C.verm) : '#24304D' }} />
            ))}
          </div>
        </div>
      ) : null}
      <div>
        <div style={{ height: 4, background: '#24304D', borderRadius: 2 }}>
          <div style={{ width: `${Math.max(0, Math.min(1, pos / TOTAL)) * 100}%`, height: 4, background: C.gold, borderRadius: 2 }} />
        </div>
      </div>
    </div>
  );
}

export default function Session({ gender, onResult, onError, onBack, skipIntro }) {
  const root = ROOT[gender];
  const [phase, setPhase] = useState(skipIntro ? 'listened' : 'intro'); // intro / sample / listened / choose / prep / rec / analyzing
  const [pos, setPos] = useState(-1);
  const [live, setLive] = useState([]);
  const [level, setLevel] = useState(0);
  const tm = useRef(null);
  const raf = useRef(0);
  const recRef = useRef(null);
  const timer = useRef(0);
  const buf = useRef(null);

  useEffect(() => () => { cancelAnimationFrame(raf.current); clearTimeout(timer.current); stopAll(); if (recRef.current) recRef.current.close(); }, []);

  function loop() {
    const c = getCtx();
    const now = c.currentTime - outLatency();
    const t = tm.current;
    if (!t) return;
    const p = (now - t.t0) / BEAT;
    setPos(p);
    const rec = recRef.current;
    if (rec && rec.analyser) {
      if (!buf.current) buf.current = new Float32Array(rec.analyser.fftSize);
      rec.analyser.getFloatTimeDomainData(buf.current);
      let e = 0;
      for (let i = 0; i < buf.current.length; i++) e += buf.current[i] * buf.current[i];
      const lv = db(Math.sqrt(e / buf.current.length));
      setLevel(Math.max(0, Math.min(18, Math.round(((lv + 60) / 54) * 18))));
      const s = p - 4;
      const ni = noteAt(s);
      if (s >= 0 && s < 24) {
        const r = livePitch(buf.current, c.sampleRate);
        const step = Math.round(s * 12);
        if (r.f0 > 0 && ni >= 0) {
          let v = toMidi(r.f0) - root;
          const tgt = NOTES[ni][0];
          while (v - tgt > 6) v -= 12;
          while (tgt - v > 6) v += 12;
          setLive((L) => (L.length && L[L.length - 1][2] === step ? L : [...L, [s, v, step]]));
        }
      }
    }
    raf.current = requestAnimationFrame(loop);
  }

  async function playSample() {
    await resumeCtx();
    tm.current = schedule(root, 'sample', 0.35);
    setPhase('sample');
    setLive([]);
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(loop);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { cancelAnimationFrame(raf.current); setPhase('listened'); setPos(-1); }, (tm.current.end - getCtx().currentTime + 0.4) * 1000);
  }

  async function startRec(ear) {
    setPhase('prep');
    let stream;
    try {
      await resumeCtx();
      stream = await openMic();
    } catch (e) {
      onError(e.code === 'nomic' ? 'nomic' : 'denied');
      return;
    }
    const c = await resumeCtx();
    const rec = new Recorder(stream);
    try { await rec.start(); } catch (e) { rec.close(); onError('denied'); return; }
    recRef.current = rec;
    const t = schedule(root, ear ? 'recEar' : 'recNoEar', PRE_ROLL + 0.25);
    tm.current = t;
    const latency = outLatency() + 0.01;
    setLive([]);
    setPhase('rec');
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(loop);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      cancelAnimationFrame(raf.current);
      const data = rec.stop();
      rec.close();
      recRef.current = null;
      setPhase('analyzing');
      setTimeout(() => {
        let res;
        try {
          res = analyze({ ...data, t0: t.t0, sing: t.sing, rootMidi: root, latency });
        } catch (e) {
          res = { error: 'cut' };
        }
        if (res.error) onError(res.error);
        else onResult(res);
      }, 60);
    }, (t.end - c.currentTime + 0.45) * 1000);
  }

  function cancel() {
    clearTimeout(timer.current);
    cancelAnimationFrame(raf.current);
    stopAll();
    if (recRef.current) { recRef.current.close(); recRef.current = null; }
    setPhase('listened');
    setPos(-1);
  }

  const running = phase === 'sample' || phase === 'rec';
  return (
    <div className="navy rel" style={{ minHeight: '100vh', padding: '22px 20px 30px' }}>
      {phase === 'analyzing' ? (
        <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, textAlign: 'center' }}>
          <div className="spin" />
          <div className="mincho" style={{ fontSize: 20, fontWeight: 700 }}>声を解析しています</div>
          <div style={{ fontSize: 13, color: '#AEB5C6', lineHeight: 1.8 }}>音程・リズム・響きを計算中…<br />数秒お待ちください</div>
        </div>
      ) : (
        <>
          {!running ? (
            <button type="button" className="linkbtn" style={{ color: '#AEB5C6', padding: 0, marginBottom: 6 }} onClick={onBack}>← トップへ戻る</button>
          ) : null}
          {running || phase === 'prep' ? (
            <Panel pos={pos} mode={phase === 'rec' ? 'rec' : 'sample'} live={live} level={level} />
          ) : null}
          {phase === 'intro' ? (
            <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 20 }}>
              <div className="mono" style={{ fontSize: 11, letterSpacing: '0.25em', color: C.gold }}>STEP 1</div>
              <div className="mincho" style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.5 }}>まずは見本を<br />聴いてみましょう</div>
              <p style={{ fontSize: 14, lineHeight: 1.9, color: '#D6D9E2', margin: 0 }}>カウントが4回鳴ったあと、「ドレミファソラシド」と上がり、上のドを4拍伸ばします。息継ぎをして、今度は「ドシラソファミレド」と下がり、最後のドを4拍伸ばします。</p>
              <div className="card" style={{ padding: '14px 16px', color: C.ink, fontSize: 13, lineHeight: 1.8 }}>
                キー:<b>{gender === 'female' ? 'A(ラの音から)' : 'E(ミの音から)'}</b> ・ テンポ:<b>90</b><br />画面の文字ガイドと光が、歌うタイミングを教えてくれます。
              </div>
              <button type="button" className="btn gold" onClick={playSample}>▶ 見本を聴く</button>
            </div>
          ) : null}
          {phase === 'listened' ? (
            <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
              <div className="mono" style={{ fontSize: 11, letterSpacing: '0.25em', color: C.gold }}>STEP 2</div>
              <div className="mincho" style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.5 }}>次は、あなたの番です</div>
              <p style={{ fontSize: 14, lineHeight: 1.9, color: '#D6D9E2', margin: 0 }}>見本と同じように、カウントのあとに「ドー、レー、ミー…」と歌ってください。歌詞は「ドレミ」の階名で大丈夫です。</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
                <button type="button" className="btn ghostDark" onClick={playSample}>もう一度聴く</button>
                <button type="button" className="btn primary" onClick={() => setPhase('choose')}>録音する</button>
              </div>
            </div>
          ) : null}
          {phase === 'choose' ? (
            <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 20 }}>
              <div className="mincho" style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.5 }}>イヤホンをつけていますか?</div>
              <button type="button" className="btn primary" style={{ flexDirection: 'column', gap: 2, minHeight: 66 }} onClick={() => startRec(true)}>
                <span>録音開始(イヤホンあり)</span><span style={{ fontSize: 12, fontWeight: 500, opacity: 0.9 }}>メトロノームを聴きながら歌います</span>
              </button>
              <button type="button" className="btn ghostDark" style={{ flexDirection: 'column', gap: 2, minHeight: 66 }} onClick={() => startRec(false)}>
                <span>録音開始(イヤホンなし)</span><span style={{ fontSize: 12, fontWeight: 500, opacity: 0.85 }}>カウントのあとは、光の点滅に合わせて歌います</span>
              </button>
              <p style={{ fontSize: 12, color: '#AEB5C6', lineHeight: 1.8, margin: 0 }}>※ Bluetoothのワイヤレスイヤホンは音が少し遅れて届くことがあります。お持ちなら有線イヤホンがおすすめです。<br />※ 初めて録音する時は、マイクの使用許可を求められます。「許可」を選んでください。</p>
              <button type="button" className="linkbtn" style={{ color: '#AEB5C6' }} onClick={() => setPhase('listened')}>戻る</button>
            </div>
          ) : null}
          {running ? (
            <div style={{ marginTop: 18 }}>
              <button type="button" className="btn ghostDark" onClick={cancel}>中止する</button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
