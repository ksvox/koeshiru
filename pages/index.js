import { useEffect, useState } from 'react';
import Head from 'next/head';
import Top from '../components/Top';
import Session from '../components/Session';
import Result from '../components/Result';
import { C } from '../components/Art';
import { decodeResult } from '../lib/resultCode';
import { FIXED } from '../lib/texts';
import { LINKS } from '../lib/config';

const ERR = {
  quiet: FIXED['エラー:声が小さい'],
  noise: FIXED['エラー:雑音が多い'],
  clip: FIXED['エラー:音割れ'],
  cut: FIXED['エラー:途中で途切れた'],
  mismatch: '⚠️見本の音とかなり違う高さで歌っていたようです。カウントの間に鳴る音をよく聴いて、その音から歌い始めてみましょう。',
  denied: FIXED['エラー:マイク不許可'],
  nomic: '⚠️このブラウザでは録音ができないようです。SafariやChromeの最新版でお試しください。',
};

function MicHelp() {
  return (
    <div className="card" style={{ padding: '14px 16px', color: C.ink, fontSize: 13, lineHeight: 1.9, textAlign: 'left' }}>
      <b>iPhoneの場合</b><br />
      画面上部(または下部)のアドレス欄の「ぁあ」→「Webサイトの設定」→「マイク」を「許可」にして、ページを再読み込みしてください。うまくいかない時は、「設定」アプリ→「Safari」→「マイク」→「許可」にしてください。<br />
      <b>Androidの場合</b><br />
      アドレス欄の左の鍵マーク(または調整マーク)→「権限」→「マイク」を「許可」にして、ページを再読み込みしてください。
    </div>
  );
}

export default function Home() {
  const [screen, setScreen] = useState('top');
  const [gender, setGender] = useState('female');
  const [result, setResult] = useState(null);
  const [fromLink, setFromLink] = useState(false);
  const [err, setErr] = useState('');
  const [toast, setToast] = useState('');
  const [debug, setDebug] = useState(false);
  const [retry, setRetry] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get('debug') === '1') setDebug(true);
    const code = q.get('r');
    if (code) {
      const r = decodeResult(code);
      if (r) { setResult(r); setFromLink(true); setScreen('result'); }
      window.history.replaceState(null, '', '/');
    }
  }, []);

  function showToast(t) {
    setToast(t);
    clearTimeout(showToast.t);
    showToast.t = setTimeout(() => setToast(''), 5000);
  }
  function go(s) { setScreen(s); window.scrollTo(0, 0); }

  function onResult(r) {
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const seed = (Math.random() * 2147483647) >>> 0;
    setResult({ ...r, g: gender, date, seed });
    setFromLink(false);
    go('result');
  }

  return (
    <>
      <Head>
        <title>コエシル|歌声診断アプリ ドレミを歌うだけで声のタイプがわかる</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="description" content="ドレミを歌うだけで、あなたの声を解析。ピッチ・リズム・ロングトーンなどを測定し、7つの声のタイプに分類、練習のアドバイスと合う曲までご提案します。K's VOXの無料アプリ。" />
        <meta property="og:title" content="歌声診断アプリ コエシル" />
        <meta property="og:description" content="ドレミを歌うだけで、あなたの声のタイプがわかる!? 無料・登録不要・約1分。" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={LINKS.app} />
        <meta property="og:image" content={`${LINKS.app}/og-image.png`} />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <main className="app">
        {screen === 'top' ? <Top onStart={(g) => { setGender(g); setRetry(false); go('session'); }} /> : null}
        {screen === 'session' ? (
          <Session gender={gender} skipIntro={retry} onBack={() => go('top')} onResult={onResult} onError={(e) => { setErr(e); go('error'); }} />
        ) : null}
        {screen === 'error' ? (
          <div className="navy" style={{ minHeight: '100vh', padding: '40px 22px', display: 'flex', flexDirection: 'column', gap: 18, textAlign: 'center' }}>
            <div className="mono" style={{ fontSize: 11, letterSpacing: '0.25em', color: C.gold }}>RETRY</div>
            <div className="mincho" style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.6 }}>うまく測定できませんでした</div>
            <p style={{ fontSize: 15, lineHeight: 1.9, margin: 0 }}>{String(ERR[err] || ERR.cut).replace('⚠️', '').replace('(iPhone/Androidの手順を表示)', '')}</p>
            {err === 'denied' ? <MicHelp /> : null}
            <button type="button" className="btn gold" onClick={() => { setRetry(true); go('session'); }}>もう一度録音する</button>
            <button type="button" className="linkbtn" style={{ color: '#AEB5C6' }} onClick={() => go('top')}>トップへ戻る</button>
          </div>
        ) : null}
        {screen === 'result' && result ? (
          <Result result={result} fromLink={fromLink} debug={debug} showToast={showToast} onRetry={() => { setFromLink(false); go('top'); }} />
        ) : null}
        {toast ? <div className="toast" role="status">{toast}</div> : null}
      </main>
    </>
  );
}
