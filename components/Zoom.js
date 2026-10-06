// 拡大🔎(門弟アプリと同じ:標準・大・特大。この端末に覚えておく)
import { useEffect, useState } from 'react';

const SIZES = [
  { key: 'normal', label: '標準', z: 1, px: 15 },
  { key: 'large', label: '大', z: 1.12, px: 17 },
  { key: 'xlarge', label: '特大', z: 1.25, px: 19 },
];
const KEY = 'koe-font-size';

function apply(key) {
  const s = SIZES.find((x) => x.key === key) || SIZES[0];
  document.documentElement.style.zoom = s.z === 1 ? '' : String(s.z);
  try { localStorage.setItem(KEY, s.key); } catch (e) { /* noop */ }
  return s.key;
}

export default function Zoom() {
  const [size, setSize] = useState('normal');
  const [open, setOpen] = useState(false);
  useEffect(() => {
    let k = 'normal';
    try { k = localStorage.getItem(KEY) || 'normal'; } catch (e) { /* noop */ }
    setSize(apply(k));
  }, []);
  const on = size !== 'normal';
  return (
    <div style={{ position: 'fixed', top: 'calc(10px + env(safe-area-inset-top))', right: 'max(10px, calc(50% - 210px))', zIndex: 35 }}>
      <button type="button" onClick={() => setOpen(!open)} aria-label="文字の拡大" aria-expanded={open}
        style={{ minHeight: 34, padding: '0 12px', borderRadius: 17, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: '1px solid #C9A85A',
          background: on ? '#C9A85A' : 'rgba(30,43,74,0.85)', color: on ? '#1E2B4A' : '#F3EEE2' }}>拡大🔎</button>
      {open ? (
        <>
          <div style={{ position: 'fixed', inset: 0 }} onClick={() => setOpen(false)} />
          <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', background: '#fff', borderRadius: 8, boxShadow: '0 6px 20px rgba(0,0,0,0.25)', padding: 8, width: 160, color: '#1A1F2B' }}>
            <p style={{ fontSize: 12, color: '#555A66', margin: '2px 8px 6px' }}>文字の大きさ</p>
            {SIZES.map((s) => (
              <button key={s.key} type="button" onClick={() => { setSize(apply(s.key)); setOpen(false); }}
                style={{ width: '100%', minHeight: 44, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 10px', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700, background: size === s.key ? '#F3EEE2' : 'transparent', color: '#1A1F2B' }}>
                <span style={{ fontSize: s.px }}>{s.label}</span>{size === s.key ? <span style={{ color: '#B23A26' }}>✓</span> : null}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
