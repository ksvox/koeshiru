// 利用状況と、研究用のタイプ別集計(一人ひとりの結果は保存せず、合計だけを積み上げる)
import { adminDb, FieldValue } from '../../lib/firebaseAdmin';

const TYPES = ['ITA', 'DEU', 'USA', 'FRA', 'GBR', 'KOR', 'JPN'];
const num = (v, lo, hi) => typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi;

function jstDate() {
  const d = new Date(Date.now() + 9 * 3600 * 1000);
  return d.toISOString().slice(0, 10);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).end(); return; }
  try {
    let b = req.body;
    if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
    b = b || {};
    const db = adminDb();
    const col = db.collection('koeshiruStats');
    const inc = FieldValue.increment;
    const day = jstDate();
    const batch = db.batch();
    if (b.ev === 'trial') {
      batch.set(col.doc('total'), { trial: inc(1) }, { merge: true });
      batch.set(col.doc(`d_${day}`), { date: day, trial: inc(1) }, { merge: true });
    } else if (b.ev === 'diag') {
      const g = b.g === 'male' ? 'male' : b.g === 'female' ? 'female' : null;
      if (!g || !TYPES.includes(b.type) || !Array.isArray(b.radar) || b.radar.length !== 6 || !b.radar.every((v) => num(v, 0, 1))) {
        res.status(400).json({ error: 'bad' }); return;
      }
      batch.set(col.doc('total'), { diag: inc(1) }, { merge: true });
      batch.set(col.doc(`d_${day}`), { date: day, diag: inc(1) }, { merge: true });
      const t = { g, type: b.type, n: inc(1) };
      b.radar.forEach((v, i) => { t[`r${i}`] = inc(v); });
      if (num(b.tm, 0, 2000)) { t.tmSum = inc(b.tm); t.tmN = inc(1); }
      if (Array.isArray(b.vc) && b.vc.length === 4 && b.vc.every((v) => num(v, -3, 3))) {
        b.vc.forEach((v, i) => { t[`v${i}`] = inc(Math.max(0, Math.min(1, v))); });
        t.vN = inc(1);
      }
      batch.set(col.doc(`t_${g}_${b.type}`), t, { merge: true });
    } else {
      res.status(400).json({ error: 'bad' }); return;
    }
    await batch.commit();
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'failed' });
  }
}
