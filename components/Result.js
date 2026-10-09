// 結果画面(声のパスポート)
import { useEffect, useMemo, useRef, useState } from 'react';
import { C, Flag, MapShape, Stamp, Guilloche, Emblem, VoicePrint } from './Art';
import { Radar, PitchTrace, VoiceMap, VowelCross, TimingChart } from './Charts';
import { classify, EN, LAND } from '../lib/types';
import { buildTexts, FIXED } from '../lib/texts';
import { recommend } from '../lib/recommend';
import { encodeResult } from '../lib/resultCode';
import { makeShareImage } from '../lib/shareImage';
import { sendTrial } from '../lib/stats';
import { LINKS } from '../lib/config';

const TAGC = { 強み: '#2F6B45', 伸びしろ: C.verm, 特徴: '#3B5A8C' };
const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

function Visa({ no, en, jp, page, children }) {
  return (
    <section className="visa">
      <Guilloche w={362} h={900} color="#B9AE92" opacity={0.22} />
      <div className="visa-h"><span>査証 VISAS</span><span>VOICE PASSPORT</span></div>
      <div className="visa-b">
        <div className="sec-title">
          <span className="mono" style={{ fontSize: 12, color: C.verm }}>{no}</span>
          <h2>{jp}</h2>
          <span className="mono" style={{ marginLeft: 'auto', fontSize: 10, letterSpacing: '0.2em', color: C.sub }}>{en}</span>
        </div>
        {children}
      </div>
      <div className="visa-f">— {page} —</div>
    </section>
  );
}
function Field({ jp, en, children, mono }) {
  return (
    <div>
      <div className="field-l">{jp} / <span className="mono">{en}</span></div>
      <div className={mono ? 'mono' : ''} style={{ fontWeight: 500, fontSize: 14, lineHeight: 1.3 }}>{children}</div>
    </div>
  );
}

function SongCard({ song, gate }) {
  const [open, setOpen] = useState(false);
  const sub = [song.genres[0], song.moods[0] || song.vibes[0]].filter(Boolean).join(' / ');
  return (
    <div style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 6, overflow: 'hidden' }}>
      <div style={{ display: 'flex' }}>
        <div style={{ flex: 1, padding: '12px 14px', minWidth: 0 }}>
          <div className="mono" style={{ fontSize: 9, letterSpacing: '0.2em', color: C.sub }}>BOARDING PASS · K'S VOX RECORD</div>
          <div className="mincho" style={{ fontWeight: 700, fontSize: 17, marginTop: 4, overflowWrap: 'anywhere' }}>{song.title}</div>
          <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>{sub}{song.vocal ? ` ・ ${song.vocal}ボーカル` : ''}</div>
        </div>
        <div style={{ width: 92, borderLeft: `1px dashed ${C.line}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 8 }}>
          <div className="mono" style={{ fontSize: 9, color: C.sub }}>GATE</div>
          <div className="mono" style={{ fontSize: 20, fontWeight: 500 }}>{gate}</div>
          <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} style={{ minHeight: 44, minWidth: 64, border: `1px solid ${C.ink}`, background: open ? C.ink : 'transparent', color: open ? '#fff' : C.ink, borderRadius: 22, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            {open ? '閉じる' : '▶ 試聴'}
          </button>
        </div>
      </div>
      {open ? <div className="yt"><iframe src={`https://www.youtube-nocookie.com/embed/${song.youtubeId}?autoplay=1&playsinline=1&rel=0`} title={song.title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen /></div> : null}
    </div>
  );
}

export default function Result({ result, fromLink, onRetry, showToast, debug }) {
  const { type, sub } = useMemo(() => classify(result), [result]);
  const tx = useMemo(() => buildTexts(result, type, sub, result.seed), [result, type, sub]);
  const [songs, setSongs] = useState(null);
  const [songErr, setSongErr] = useState(false);
  const [busy, setBusy] = useState('');
  const [preview, setPreview] = useState(null);
  const pageRef = useRef(null);

  useEffect(() => {
    fetch('/api/songs').then((r) => r.json()).then((j) => {
      if (!j.songs) throw new Error();
      setSongs(recommend(j.songs, result, type, result.g, result.seed));
    }).catch(() => setSongErr(true));
  }, [result, type]);

  const d = new Date(result.date + 'T00:00:00');
  const dot = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  const issue = `${String(d.getDate()).padStart(2, '0')} ${MON[d.getMonth()]} ${d.getFullYear()}`;
  const yy = String(d.getFullYear()).slice(2);
  const no = `KV${yy}${String(result.seed % 100000).padStart(5, '0')}`;
  const ymd = `${yy}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const mrz1 = `P<KSV<${EN[type]}<<${EN[sub]}`.padEnd(36, '<');
  const mrz2 = `${no}<0KSV${ymd}<${result.g === 'female' ? 'A' : 'E'}<090`.padEnd(36, '<');
  const link = `${LINKS.app}/?r=${encodeResult(result)}`;

  const shareText = `わたしの声は「${tx.name}」タイプでした!ドレミを歌うだけでわかる歌声診断 #コエシル`;
  const isMobile = () => /iPhone|iPad|Android/i.test(navigator.userAgent);

  // 画像を手元に残す(スマホは共有メニューから「画像を保存」、パソコンはダウンロード)
  async function deliver(blob, name) {
    const file = new File([blob], name, { type: 'image/png' });
    if (isMobile() && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file] });
    } else {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    }
  }

  // 結果ページ全体を1枚の画像にして保存(本人用)
  async function save() {
    setBusy('save');
    const z0 = document.documentElement.style.zoom;
    try {
      const html2canvas = (await import('html2canvas')).default;
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      const el = pageRef.current;
      document.documentElement.style.zoom = '';
      const w = el.offsetWidth, h = el.scrollHeight;
      const scale = Math.min(2, Math.sqrt(15000000 / (w * h)));
      const cv = await html2canvas(el, {
        backgroundColor: '#E7E1D3', scale, useCORS: true, logging: false, scrollX: 0, scrollY: -window.scrollY, windowWidth: w,
        ignoreElements: (n) => (n.dataset && n.dataset.nosave === '1') || n.tagName === 'IFRAME',
      });
      document.documentElement.style.zoom = z0;
      const blob = await new Promise((res, rej) => cv.toBlob((b) => (b ? res(b) : rej(new Error('blob'))), 'image/png'));
      await deliver(blob, `koeshiru-result-${ymd}.png`);
    } catch (e) { document.documentElement.style.zoom = z0; if (e && e.name !== 'AbortError') showToast('画像を作れませんでした。もう一度お試しください。'); }
    setBusy('');
  }

  // シェア:先にシェアされる画像を大きく見せてから
  async function openShare() {
    setBusy('share');
    try {
      const blob = await makeShareImage({ result, type, tx, dot, no });
      setPreview({ blob, url: URL.createObjectURL(blob) });
    } catch (e) { showToast('シェア用の画像を作れませんでした。'); }
    setBusy('');
  }
  function closeShare() {
    if (preview) URL.revokeObjectURL(preview.url);
    setPreview(null);
  }
  async function doShare() {
    const file = new File([preview.blob], `koeshiru-${ymd}.png`, { type: 'image/png' });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text: `${shareText}\n${LINKS.app}` });
      } else if (navigator.share) {
        await navigator.share({ text: shareText, url: LINKS.app });
      } else {
        await navigator.clipboard.writeText(`${shareText}\n${LINKS.app}`);
        await deliver(preview.blob, file.name);
        showToast('画像を保存し、紹介文をコピーしました。SNSに貼り付けてお使いください。');
      }
    } catch (e) { if (e && e.name !== 'AbortError') showToast('シェアできませんでした。'); }
  }
  async function copyLink() {
    try { await navigator.clipboard.writeText(link); showToast('この結果のリンクをコピーしました。あとで開くと、同じ結果を見られます。'); }
    catch (e) { window.prompt('このリンクをコピーしてください', link); }
  }

  return (
    <div className="paperbg" ref={pageRef} style={{ minHeight: '100vh', paddingBottom: 34 }}>
      {fromLink ? (
        <div data-nosave="1" style={{ background: C.navy, color: C.cream, padding: '54px 16px 12px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
          <span style={{ flex: 1 }}>保存された診断結果を表示しています</span>
          <button type="button" className="btn gold" style={{ width: 'auto', minHeight: 40, fontSize: 13 }} onClick={onRetry}>自分も診断する</button>
        </div>
      ) : null}
      <div style={{ padding: '18px 20px 0', textAlign: 'center' }}>
        <div style={{ fontSize: 12, color: C.sub }}>歌声診断アプリ コエシル</div>
        <div className="mincho fade-up" style={{ fontWeight: 700, fontSize: 19, marginTop: 6, lineHeight: 1.5 }}>診断が完了しました。<br />あなたの声のパスポートが発行されました!</div>
      </div>

      {/* 表紙 */}
      <div className="fade-up" style={{ background: '#1A2542', margin: '18px 14px 0', borderRadius: '4px 14px 14px 4px', padding: '30px 20px 34px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, borderLeft: '6px solid #111A30' }}>
        <div className="mincho" style={{ fontWeight: 700, fontSize: 17, letterSpacing: '0.5em', color: C.gold }}>声の旅券</div>
        <div className="mono" style={{ fontSize: 10, letterSpacing: '0.4em', color: C.gold }}>K'S VOX · KOESHIRU</div>
        <div style={{ margin: '10px 0' }}><Emblem size={104} /></div>
        <div className="mincho" style={{ fontWeight: 700, fontSize: 26, letterSpacing: '0.35em', color: C.gold }}>PASSPORT</div>
        <div className="mono" style={{ fontSize: 9, letterSpacing: '0.3em', color: '#8C7A4E' }}>VOICE · TYPE · DIAGNOSIS</div>
      </div>

      {/* 身分事項のページ */}
      <div style={{ margin: '18px 14px 0', background: C.paper, border: '1px solid #CFC5AC', borderRadius: '4px 10px 10px 4px', position: 'relative', overflow: 'hidden' }}>
        <Guilloche w={362} h={420} color="#9FB3C8" opacity={0.45} />
        <div style={{ position: 'absolute', right: -40, top: 30 }}><MapShape code={type} size={300} color="#2F6B45" opacity={0.08} /></div>
        <div className="rel" style={{ padding: '12px 14px 0' }}>
          <div className="mono" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: C.sub, borderBottom: '1px solid #CFC5AC', paddingBottom: 6 }}><span>旅券 PASSPORT</span><span>型 TYPE P</span><span>発行 KSV</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 6 }}>
            <span className="mincho" style={{ fontWeight: 700, fontSize: 13 }}>声の旅券</span>
            <span className="mono" style={{ fontSize: 13, color: C.verm, letterSpacing: '0.1em' }}>{no}</span>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
            <div style={{ flex: 'none', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
              <div style={{ width: 98, height: 122, background: '#E4E9EE', border: '1px solid #B9C4CF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <VoicePrint wave={result.wave} trace={result.trace} />
              </div>
              <div className="mono" style={{ fontSize: 8, color: C.sub }}>VOICEPRINT</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0, flex: 1 }}>
              <div>
                <div className="field-l">タイプ / <span className="mono">Type</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Flag code={type} w={30} /><span className="mincho" style={{ fontWeight: 800, fontSize: 22, lineHeight: 1.3 }}>{tx.name}</span></div>
                <div className="mono" style={{ fontSize: 11, letterSpacing: '0.2em' }}>{EN[type]}</div>
              </div>
              <Field jp="サブタイプ" en="Sub type"><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Flag code={sub} w={18} />{tx.subName}寄り</span></Field>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 6 }}>
                <Field jp="キー" en="Key">{result.g === 'female' ? 'A(女性)' : 'E(男性)'}</Field>
                <Field jp="テンポ" en="Tempo" mono>90 BPM</Field>
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 6, marginTop: 10 }}>
            <Field jp="発行年月日" en="Date of issue" mono>{issue}</Field>
            <Field jp="発行機関" en="Authority" mono>K's VOX GOTANDA</Field>
          </div>
          <div style={{ marginTop: 8 }}>
            <div className="field-l">所持人自署 / <span className="mono">Signature</span></div>
            <div className="mincho" style={{ borderBottom: `1px solid ${C.ink}`, height: 24, fontStyle: 'italic', fontSize: 16, color: '#3B5A8C' }}>your voice</div>
          </div>
        </div>
        <div className="mono rel" style={{ marginTop: 12, background: 'rgba(255,255,255,0.55)', padding: '10px 14px 12px', fontSize: 12, letterSpacing: '0.05em', lineHeight: 1.55, wordBreak: 'break-all' }}>{mrz1}<br />{mrz2}</div>
      </div>

      <Visa no="00" en="ENTRY" jp="入国審査" page="03">
        <div className="rel" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 210, marginBottom: 6 }}>
          <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}><MapShape code={type} size={210} color="#2F6B45" opacity={0.12} /></div>
          <div className="mono" style={{ position: 'absolute', left: 4, top: 6, display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: C.sub }}><Flag code={type} w={24} />{LAND[type]}</div>
          <div className="rel"><Stamp code={type} name={tx.name} date={dot} size={150} animate /></div>
        </div>
        <div className="mincho" style={{ fontWeight: 700, fontSize: 21, lineHeight: 1.5, textAlign: 'center' }}>{tx.catch}</div>
        <p className="p" style={{ marginTop: 10 }}>{tx.feature}{tx.subLine}</p>
        <p className="p" style={{ marginTop: 8 }}>{tx.charm}</p>
      </Visa>

      <Visa no="01" en="FUNDAMENTALS" jp="歌の基礎力" page="04">
        <Radar values={result.radar} />
        <div style={{ marginTop: 6 }}>
          {tx.comments.map((c, i) => (
            <div key={i} className="comment">
              <span className="tag" style={{ color: TAGC[c.kind], borderColor: TAGC[c.kind] }}>{c.kind}</span>
              <span style={{ fontSize: 14, lineHeight: 1.75 }}>{c.text}</span>
            </div>
          ))}
        </div>
      </Visa>

      <Visa no="02" en="PITCH TRACE" jp="音程の軌跡" page="05">
        <div style={{ display: 'flex', gap: 14, fontSize: 11, color: C.sub, marginBottom: 6 }}><span>点線 = 見本の音</span><span style={{ color: C.verm }}>実線 = あなたの声</span></div>
        <PitchTrace trace={result.trace} />
      </Visa>

      {result.tm ? (
        <Visa no="03" en="TIME FEEL" jp="拍感覚(タイム感)" page="06">
          <TimingChart tm={result.tm} />
          <p style={{ fontSize: 12, color: C.sub, margin: '6px 0 0', lineHeight: 1.7 }}>0の線が光の点滅(拍)ぴったり。帯の中なら合格ゾーンです。全体が一定に早い・遅い分は、スマホの音の遅れとして差し引いています。</p>
        </Visa>
      ) : null}

      {result.f && result.f.vc ? (
        <Visa no="04" en="VOWEL CHARACTER" jp="母音の個性" page="07">
          <VowelCross vc={result.f.vc} />
          <p style={{ fontSize: 12, color: C.sub, margin: '6px 0 0', lineHeight: 1.7 }}>「ド・レ・ミ・ファ」の「お・え・い・あ」の響きを測り、それぞれの母音らしさが線の先に向かってどれだけ出ているかを示しています。4つとも個性が出ていると、整った四角形になります。</p>
        </Visa>
      ) : null}

      <Visa no="05" en="VOICE MAP" jp="声質マップ" page="08">
        <VoiceMap map={result.map} />
        <p style={{ fontSize: 12, color: C.sub, margin: '6px 0 0', lineHeight: 1.7 }}>良い・悪いではなく、あなたの声の個性です。</p>
      </Visa>

      <Visa no="06" en="NEXT STEP" jp="もっと良くなるために" page="09">
        <div style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 6, padding: 14, fontSize: 14, lineHeight: 1.85 }}>{tx.practice}</div>
        {tx.ja.map((t, i) => <p key={i} className="p" style={{ marginTop: 12 }}>{t}</p>)}
        <div style={{ marginTop: 20, paddingTop: 14, borderTop: `1px dashed ${C.line}` }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>英語で歌うとき</div>
          <p className="p" style={{ marginTop: 6, fontWeight: 700, color: C.verm }}>{tx.enLead}</p>
          {tx.en.map((t, i) => <p key={i} className="p" style={{ marginTop: 8 }}>{t}</p>)}
        </div>
      </Visa>

      <Visa no="07" en="YOUR FLIGHTS" jp="あなたの声に合う曲" page="10">
        <p style={{ fontSize: 13, lineHeight: 1.75, margin: '0 0 12px' }}>K's VOXが制作した<b>オリジナル英語曲</b>の中から、あなたの声のタイプに合う3曲を選びました。</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {songs ? songs.map((s, i) => <SongCard key={s.id} song={s} gate={String(i + 1).padStart(2, '0')} />) : null}
          {!songs && !songErr ? <div style={{ fontSize: 13, color: C.sub, padding: '10px 0' }}>曲を選んでいます…</div> : null}
          {songErr ? <div className="err">{String(FIXED['エラー:曲が読み込めない']).replace('⚠️', '')}</div> : null}
        </div>
        <a href={LINKS.showcase} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center', fontSize: 13, marginTop: 12 }}>K's VOXのオリジナル曲をもっと聴く</a>
      </Visa>

      <section style={{ padding: '22px 14px 0' }}>
        <div className="rel" style={{ background: C.navy, borderRadius: 6, padding: '22px 20px', color: C.cream, overflow: 'hidden' }}>
          <Guilloche w={362} h={220} opacity={0.14} />
          <div className="rel">
            <div className="mono" style={{ fontSize: 10, letterSpacing: '0.25em', color: C.gold }}>NEXT DESTINATION</div>
            <div className="mincho" style={{ fontWeight: 700, fontSize: 22, marginTop: 6, color: C.paper }}>{FIXED['お試しレッスンのカード(見出し)']}</div>
            <p style={{ fontSize: 14, lineHeight: 1.85, margin: '10px 0 16px', color: C.gold }}>{FIXED['お試しレッスンのカード(本文)']}</p>
            <a href={LINKS.apply} target="_blank" rel="noopener noreferrer" className="btn gold" style={{ fontSize: 15 }} onClick={() => { if (!debug) sendTrial(); }}>お試しレッスンについて見る</a>
          </div>
        </div>
      </section>

      <section data-nosave="1" style={{ padding: '22px 20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button type="button" className="btn primary" onClick={save} disabled={!!busy}>{busy === 'save' ? '画像を作成中…' : '結果ページを画像で保存'}</button>
        <button type="button" className="btn" onClick={openShare} disabled={!!busy}>{busy === 'share' ? '画像を作成中…' : '結果をシェア'}</button>
        <button type="button" className="linkbtn" onClick={copyLink}>この結果のリンクをコピー(あとで見返せます)</button>
        <button type="button" className="btn" style={{ marginTop: 4 }} onClick={onRetry}>{FIXED['もう一度診断ボタン'] || 'もう一度診断する'}</button>
        <p style={{ fontSize: 11, color: C.sub, textAlign: 'center', lineHeight: 1.7, margin: '6px 0 0' }}>声の状態や録音の環境で、結果が変わることもあります。</p>
      </section>

      {debug && result.raw ? (
        <pre data-nosave="1" style={{ margin: '20px 14px 0', fontSize: 11, background: '#fff', padding: 10, borderRadius: 6, whiteSpace: 'pre-wrap' }}>
          {JSON.stringify({ type, sub, radar: result.radar, map: result.map, f: result.f, raw: result.raw }, null, 1)}
        </pre>
      ) : null}
      {preview ? (
        <div data-nosave="1" role="dialog" aria-modal="true" aria-label="シェアする画像の確認" style={{ position: 'fixed', inset: 0, background: 'rgba(10,14,26,0.92)', zIndex: 40, overflowY: 'auto' }}>
          <div style={{ maxWidth: 440, margin: '0 auto', padding: '24px 20px 40px', color: C.cream, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="mincho" style={{ fontSize: 20, fontWeight: 700 }}>この画像がシェアされます</div>
            <p style={{ fontSize: 13, lineHeight: 1.8, margin: 0, color: C.mist }}>タイプ・グラフ・音程の軌跡と、ひとことコメントが入った画像です。録音した声や、お名前などは含まれません。</p>
            <img src={preview.url} alt="シェアされる診断結果の画像" style={{ width: '100%', borderRadius: 8, display: 'block', boxShadow: '0 0 0 1px #3A4766' }} />
            <div style={{ background: '#24304D', borderRadius: 6, padding: '10px 12px', fontSize: 13, lineHeight: 1.7 }}>
              <div style={{ fontSize: 11, color: C.mist, marginBottom: 4 }}>一緒に送られる紹介文</div>
              {shareText}<br />{LINKS.app}
            </div>
            <button type="button" className="btn gold" onClick={doShare}>この画像をシェアする</button>
            <button type="button" className="btn ghostDark" onClick={() => deliver(preview.blob, `koeshiru-${ymd}.png`).catch(() => {})}>この画像を保存する</button>
            <button type="button" className="linkbtn" style={{ color: C.mist }} onClick={closeShare}>閉じる</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
