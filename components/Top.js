// トップ画面
import { useState } from 'react';
import { C, Flag, Guilloche } from './Art';
import { ORDER } from '../lib/types';
import { TYPES, FIXED } from '../lib/texts';
import Banner from './Banner';

function Feat({ no, title, body, children, last }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '14px 0', borderBottom: last ? 'none' : `1px dashed ${C.line}` }}>
      <div className="mono" style={{ flex: 'none', width: 30, height: 30, borderRadius: '50%', background: C.navy, color: C.gold, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{no}</div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>{title}</div>
        <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.7, marginTop: 3 }}>{body}</div>
        {children}
      </div>
    </div>
  );
}

export default function Top({ onStart }) {
  const [g, setG] = useState('');
  const [err, setErr] = useState('');
  const start = () => {
    if (!g) { setErr('女性か男性を選んでください。'); return; }
    onStart(g);
  };
  return (
    <div className="navy rel" style={{ minHeight: '100vh', paddingBottom: 30 }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: 380 }}><Guilloche w={390} h={380} opacity={0.16} /></div>
      <div className="rel" style={{ padding: '30px 24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <a href="https://www.ksvox.net" className="mono" style={{ fontSize: 11, letterSpacing: '0.3em', color: C.gold, textDecoration: 'none' }}>K'S VOX</a>
        <div style={{ marginTop: 18, border: `1px solid ${C.gold}`, color: C.gold, borderRadius: 20, padding: '4px 14px', fontSize: 13, fontWeight: 700, letterSpacing: '0.1em' }}>歌声診断アプリ</div>
        <h1 className="mincho" style={{ margin: '12px 0 0', fontWeight: 800, fontSize: 58, letterSpacing: '0.12em', color: C.paper, lineHeight: 1.2 }}>コエシル</h1>
        <svg width="220" height="34" viewBox="0 0 220 34" aria-hidden="true" style={{ marginTop: 6 }}>
          <path d="M0 17 L60 17 L66 8 L72 26 L78 3 L84 31 L90 10 L96 24 L102 14 L108 20 L114 17 L220 17" fill="none" stroke={C.gold} strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
        <p className="mincho" style={{ margin: '12px 0 0', fontWeight: 700, fontSize: 21, color: C.paper, lineHeight: 1.6 }}>ドレミを歌うだけで、<br />あなたの声のタイプがわかる!?</p>
        <p style={{ margin: '10px 0 0', fontSize: 13, color: '#AEB5C6' }}>所要時間 約1分 ・ 無料 ・ 登録不要</p>
      </div>

      <div className="card rel" style={{ margin: '26px 16px 0', padding: '6px 18px 4px' }}>
        <Feat no="01" title="声を解析" body="ピッチ・リズム・ロングトーン・音の立ち上がり・音のつながり、そして声の明るさや息の混ざり方まで細かく測定します。" />
        <Feat no="02" title="7つのタイプに分類" body="あなたの声の響きを、言語の響きにたとえた7タイプで診断。歌の基礎力や拍感覚、母音の個性まで、グラフで分かりやすく見える化します。">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 4px', marginTop: 10 }}>
            {ORDER.map((c) => (
              <div key={c} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, width: 46 }}>
                <Flag code={c} w={34} />
                <span style={{ fontSize: 9, color: C.sub, whiteSpace: 'nowrap' }}>{TYPES[c].name}</span>
              </div>
            ))}
          </div>
        </Feat>
        <Feat no="03" title="アドバイスと提案" body="声がもっと良くなる練習法と、K's VOXのオリジナル英語曲からあなたにお勧めの曲をご提案します。" last />
      </div>

      <div className="card rel" style={{ margin: '14px 16px 0', padding: '20px 18px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>声の高さに合わせて選んでください</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
          {[['female', '女性', 'KEY A'], ['male', '男性', 'KEY E']].map(([k, l, key]) => (
            <button key={k} type="button" className={`choice${g === k ? ' on' : ''}`} aria-pressed={g === k} onClick={() => { setG(k); setErr(''); }}>
              <span style={{ fontWeight: 700, fontSize: 17 }}>{l}</span>
              <span className="mono" style={{ fontSize: 11, color: C.sub }}>{key}</span>
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, lineHeight: 1.7 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth="1.6" aria-hidden="true" style={{ flex: 'none', marginTop: 2 }}><path d="M4 14v-2a8 8 0 0 1 16 0v2" /><rect x="3" y="14" width="4" height="6" rx="1" /><rect x="17" y="14" width="4" height="6" rx="1" /></svg>
          <span>ワイヤレスイヤホンは外し、スマホを顔から30cmほど離して、静かな場所でお試しください。</span>
        </div>
        {err ? <div className="err" role="alert">{err}</div> : null}
        <button type="button" className="btn primary" onClick={start}>診断をはじめる</button>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, color: C.sub, lineHeight: 1.7 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.sub} strokeWidth="1.8" aria-hidden="true" style={{ flex: 'none', marginTop: 3 }}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
          <span>{FIXED['トップ・注意書き']}</span>
        </div>
      </div>
      <Banner />
      <p className="rel" style={{ textAlign: 'center', fontSize: 11, color: '#7F89A3', marginTop: 22 }}>© ボーカル道場K's VOX (東京・五反田)</p>
    </div>
  );
}
