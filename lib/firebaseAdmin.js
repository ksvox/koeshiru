// 門弟アプリと同じFirebaseを、サーバー側からだけ読む
import admin from 'firebase-admin';

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'ksvox-montei';

function init() {
  if (admin.apps.length) return admin.apps[0];
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';
  privateKey = privateKey.replace(/^"|"$/g, '').replace(/\\n/g, '\n');
  if (!clientEmail || !privateKey) throw new Error('サーバーの設定(FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY)が未登録です。');
  return admin.initializeApp({ credential: admin.credential.cert({ projectId: PROJECT_ID, clientEmail, privateKey }) });
}

export function adminDb() { init(); return admin.firestore(); }
