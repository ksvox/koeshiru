// K's VOXのオリジナル曲(公開してよい項目だけ)を返す
import { adminDb } from '../../lib/firebaseAdmin';

const TTL = 10 * 60 * 1000;
let cache = { at: 0, songs: null };

function displayTitle(title) {
  return String(title || '').replace(/-\s*\([^()]+\)\s*$/, '').trim();
}

export default async function handler(req, res) {
  try {
    if (!cache.songs || Date.now() - cache.at > TTL) {
      const snap = await adminDb().collection('songs').get();
      const songs = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((s) => !s.draft && s.title && s.youtubeId)
        .map((s) => ({
          id: s.id,
          title: displayTitle(s.title),
          release: (s.release || '').trim(),
          vocal: s.vocal || '',
          genres: s.genres || [],
          moods: s.moods || [],
          vibes: s.vibes || [],
          tempo: s.tempo || '',
          range: s.range || '',
          youtubeId: s.youtubeId,
        }));
      cache = { at: Date.now(), songs };
    }
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.status(200).json({ songs: cache.songs });
  } catch (e) {
    res.status(500).json({ error: '曲を読み込めませんでした。' });
  }
}
