// トップ下のバナー(門弟アプリの管理画面で差し替え。未登録の時は最初から入っている画像を出す)
import { useEffect, useState } from 'react';

const API = 'https://montei.ksvox.net/api/public/banner?slot=koeshiru';
const DEFAULT = { image: '/banner-default.jpg', link: 'https://showcase.ksvox.net/', alt: "K's VOX RECORD Showcase" };

export default function Banner() {
  const [b, setB] = useState(DEFAULT);
  useEffect(() => {
    let alive = true;
    fetch(API).then((r) => r.json()).then((j) => {
      if (alive && j && j.active && j.image && j.link) setB({ image: j.image, link: j.link, alt: 'おすすめアプリ' });
    }).catch(() => {});
    return () => { alive = false; };
  }, []);
  return (
    <a href={b.link} target="_blank" rel="noopener noreferrer" className="rel"
      style={{ display: 'block', margin: '22px 16px 0', borderRadius: 6, overflow: 'hidden', boxShadow: '0 0 0 1px #3A4766, 0 8px 20px rgba(0,0,0,.35)' }}>
      <img src={b.image} alt={b.alt} width="1200" height="400" loading="lazy" style={{ display: 'block', width: '100%', height: 'auto', aspectRatio: '3 / 1', objectFit: 'cover' }} />
    </a>
  );
}
