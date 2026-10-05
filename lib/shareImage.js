// 保存・シェア用の画像(1080×1920)をスマホの中で作る
import MAPS from './maps.json';
import { guillochePaths } from '../components/Art';
import { tracePaths, radarPoint, RADAR_LABELS, mapXY } from '../components/Charts';

const NAVY = '#1E2B4A', PAPER = '#F3EEE2', INK = '#1A1F2B', SUB = '#555A66', VERM = '#B23A26', GOLD = '#C9A85A', LINE = '#D8D0BC', MIST = '#AEB5C6';
const MIN = "'Shippori Mincho B1', 'Hiragino Mincho ProN', serif";
const GOT = "'Zen Kaku Gothic New', 'Hiragino Sans', sans-serif";
const MONO = "'IBM Plex Mono', Menlo, monospace";

async function fonts() {
  if (!document.fonts) return;
  const specs = [`800 60px ${MIN}`, `700 40px ${MIN}`, `700 20px ${GOT}`, `400 20px ${GOT}`, `500 20px ${MONO}`];
  await Promise.race([Promise.all(specs.map((s) => document.fonts.load(s, 'コエシル声ABC'))), new Promise((r) => setTimeout(r, 2500))]);
}

function rr(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
function wrap(g, text, maxW) {
  const lines = [];
  let cur = '';
  for (const ch of text) {
    if (g.measureText(cur + ch).width > maxW && cur) {
      if ('、。!?」)'.includes(ch)) { cur += ch; continue; }
      lines.push(cur); cur = ch;
    } else cur += ch;
  }
  if (cur) lines.push(cur);
  return lines;
}
function flag(g, code, x, y, w) {
  const h = (w * 2) / 3;
  g.save();
  g.translate(x, y);
  g.scale(w / 30, h / 20);
  const R = (c, a, b, ww, hh) => { g.fillStyle = c; g.fillRect(a, b, ww, hh); };
  if (code === 'ITA') { R('#009246', 0, 0, 10, 20); R('#FFF', 10, 0, 10, 20); R('#CE2B37', 20, 0, 10, 20); }
  if (code === 'FRA') { R('#0055A4', 0, 0, 10, 20); R('#FFF', 10, 0, 10, 20); R('#EF4135', 20, 0, 10, 20); }
  if (code === 'DEU') { R('#000', 0, 0, 30, 6.7); R('#DD0000', 0, 6.7, 30, 6.7); R('#FFCE00', 0, 13.3, 30, 6.7); }
  if (code === 'JPN') { R('#FFF', 0, 0, 30, 20); g.fillStyle = '#BC002D'; g.beginPath(); g.arc(15, 10, 6, 0, Math.PI * 2); g.fill(); }
  if (code === 'USA') {
    R('#FFF', 0, 0, 30, 20);
    for (let i = 0; i < 13; i += 2) R('#B22234', 0, (i * 20) / 13, 30, 20 / 13);
    R('#3C3B6E', 0, 0, 12, 10.77);
    g.fillStyle = '#FFF';
    for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) { g.beginPath(); g.arc(1.4 + c * 2.3 + (r % 2) * 1.1, 1.5 + r * 2.5, 0.45, 0, Math.PI * 2); g.fill(); }
  }
  if (code === 'GBR') {
    R('#012169', 0, 0, 30, 20);
    const ln = (p, c, wd) => { g.strokeStyle = c; g.lineWidth = wd; g.stroke(new Path2D(p)); };
    ln('M0 0 L30 20 M30 0 L0 20', '#FFF', 4); ln('M0 0 L30 20 M30 0 L0 20', '#C8102E', 1.3);
    ln('M15 0 V20 M0 10 H30', '#FFF', 6); ln('M15 0 V20 M0 10 H30', '#C8102E', 3.6);
  }
  if (code === 'KOR') {
    R('#FFF', 0, 0, 30, 20);
    g.fillStyle = '#0047A0'; g.beginPath(); g.arc(15, 10, 5, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#CD2E3A'; g.fill(new Path2D('M10 10 A5 5 0 0 1 20 10 A2.5 2.5 0 0 1 15 10 A2.5 2.5 0 0 0 10 10 Z'));
    [[6, 4.5, -33.7], [24, 15.5, -33.7], [24, 4.5, 33.7], [6, 15.5, 33.7]].forEach(([cx, cy, a]) => {
      g.save(); g.translate(cx, cy); g.rotate((a * Math.PI) / 180); g.fillStyle = '#000';
      for (let k = 0; k < 3; k++) g.fillRect(-2.5, -1.6 + k * 1.2, 5, 0.7);
      g.restore();
    });
  }
  g.restore();
}
function stamp(g, cx, cy, size, code, name, date, color) {
  const c = size / 2;
  g.save();
  g.translate(cx, cy);
  g.rotate((-10 * Math.PI) / 180);
  g.strokeStyle = color; g.fillStyle = color; g.textAlign = 'center';
  g.lineWidth = size * 0.02; g.beginPath(); g.arc(0, 0, c - 6, 0, Math.PI * 2); g.stroke();
  g.lineWidth = size * 0.007; g.beginPath(); g.arc(0, 0, c - 18, 0, Math.PI * 2); g.stroke();
  g.font = `400 ${size * 0.075}px ${MONO}`; g.fillText('VOICE ENTRY', 0, c * 0.55 - c);
  g.font = `500 ${size * 0.2}px ${MONO}`; g.fillText(code, 0, c * 1.02 - c);
  g.beginPath(); g.moveTo(-c * 0.6, c * 0.18); g.lineTo(c * 0.6, c * 0.18); g.stroke();
  g.font = `700 ${size * 0.09}px ${GOT}`; g.fillText(name, 0, c * 0.38);
  g.font = `400 ${size * 0.065}px ${MONO}`; g.fillText(date, 0, c * 0.6);
  g.restore();
}

export async function makeShareImage({ result, type, tx, dot, no }) {
  await fonts();
  const W = 1080, H = 1920;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  g.fillStyle = NAVY; g.fillRect(0, 0, W, H);
  // 地紋
  g.save(); g.scale(W / 540, H / 960); g.strokeStyle = GOLD; g.globalAlpha = 0.12; g.lineWidth = 0.6;
  guillochePaths(540, 960).forEach((p) => { g.beginPath(); p.split(' ').forEach((xy, i) => { const [x, y] = xy.split(',').map(Number); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); });
  g.restore();

  // ヘッダー
  g.strokeStyle = GOLD; g.lineWidth = 2;
  g.beginPath(); g.arc(98, 98, 32, 0, Math.PI * 2); g.stroke();
  g.save(); g.translate(66, 66); g.scale(1, 1); g.lineWidth = 2.4;
  g.stroke(new Path2D('M10 32 L16 32 L19 22 L23 42 L27 16 L31 48 L35 20 L39 40 L43 26 L47 36 L50 32 L54 32')); g.restore();
  g.fillStyle = GOLD; g.font = `700 30px ${MIN}`; g.textAlign = 'left'; g.fillText('声 の 旅 券', 150, 110);
  g.font = `400 24px ${MONO}`; g.textAlign = 'right'; g.fillText(`No. ${no}`, W - 64, 108);

  // スタンプと地図
  g.save(); g.translate(40, 170); g.scale(400 / 200, 400 / 200); g.fillStyle = GOLD; g.globalAlpha = 0.14; g.fill(new Path2D(MAPS[type])); g.restore();
  stamp(g, 240, 370, 290, type, tx.name, dot, '#D9573F');
  g.textAlign = 'left';
  g.fillStyle = MIST; g.font = `400 28px ${GOT}`; g.fillText('わたしの声は', 440, 300);
  flag(g, type, 440, 330, 72);
  g.fillStyle = PAPER; g.font = `800 ${tx.name.length > 5 ? 70 : 84}px ${MIN}`; g.fillText(tx.name, 528, 388);
  g.fillStyle = '#E9E3D3'; g.font = `400 30px ${GOT}`; g.fillText(`${tx.subName}寄り`, 440, 450);
  g.fillStyle = PAPER; g.font = `700 42px ${MIN}`; g.fillText(tx.catch, 64, 580);

  // レーダーと声質マップ
  rr(g, 64, 620, W - 128, 430, 12); g.fillStyle = PAPER; g.fill();
  g.save(); g.translate(76, 650); const s1 = 470 / 464; g.scale(s1, s1); g.translate(82, 0);
  g.strokeStyle = LINE; g.lineWidth = 1;
  const ANG = [-90, -18, 54, 126, 198];
  [0.25, 0.5, 0.75, 1].forEach((lv) => { g.beginPath(); ANG.forEach((a, i) => { const [x, y] = radarPoint(lv, a); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); g.stroke(); });
  ANG.forEach((a) => { const [x, y] = radarPoint(1, a); g.beginPath(); g.moveTo(150, 140); g.lineTo(x, y); g.stroke(); });
  const vals = result.radar.map((v) => Math.max(0.12, Math.min(1, v)));
  g.beginPath(); vals.forEach((v, i) => { const [x, y] = radarPoint(v, ANG[i]); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath();
  g.fillStyle = 'rgba(178,58,38,0.16)'; g.fill(); g.strokeStyle = VERM; g.lineWidth = 2; g.stroke();
  const pos = [[150, 22, 'center'], [262, 104, 'left'], [214, 248, 'left'], [86, 248, 'right'], [38, 104, 'right']];
  g.fillStyle = INK; g.font = `700 17px ${GOT}`;
  RADAR_LABELS.forEach(([l], i) => { g.textAlign = pos[i][2]; g.fillText(l, pos[i][0], pos[i][1]); });
  g.restore();
  const s2 = 430 / 388; g.save(); g.translate(560 + 34 * s2, 680); g.scale(s2, s2);
  g.strokeStyle = LINE; g.lineWidth = 1; g.strokeRect(20, 20, 280, 200);
  g.beginPath(); g.moveTo(160, 20); g.lineTo(160, 220); g.moveTo(20, 120); g.lineTo(300, 120); g.stroke();
  g.fillStyle = SUB; g.font = `700 11px ${GOT}`; g.textAlign = 'center';
  g.fillText('クリア', 160, 13); g.fillText('息っぽい', 160, 240); g.textAlign = 'right'; g.fillText('暗い', 16, 124); g.textAlign = 'left'; g.fillText('明るい', 304, 124);
  const [mx, my] = mapXY(result.map);
  g.fillStyle = VERM; g.beginPath(); g.arc(mx, my, 6, 0, Math.PI * 2); g.fill();
  g.setLineDash([2, 2]); g.strokeStyle = VERM; g.beginPath(); g.arc(mx, my, 14, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
  g.restore();

  // 音程の軌跡
  rr(g, 64, 1080, W - 128, 420, 12); g.fillStyle = PAPER; g.fill();
  g.fillStyle = SUB; g.font = `400 22px ${MONO}`; g.textAlign = 'left'; g.fillText('PITCH TRACE · 音程の軌跡', 96, 1124);
  g.fillStyle = VERM; g.textAlign = 'right'; g.font = `400 22px ${GOT}`; g.fillText('━ あなたの声', W - 96, 1124);
  const { target, sung } = tracePaths(result.trace);
  g.save(); g.translate(96, 1150); const s3 = (W - 192) / 340; g.scale(s3, s3 * 0.95);
  g.strokeStyle = LINE; g.lineWidth = 0.6; [122, 122 - 12 * 8.2].forEach((y) => { g.beginPath(); g.moveTo(10, y); g.lineTo(330, y); g.stroke(); });
  g.setLineDash([4, 3]); g.strokeStyle = SUB; g.lineWidth = 1.2; g.stroke(new Path2D(target)); g.setLineDash([]);
  g.strokeStyle = VERM; g.lineWidth = 2; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(new Path2D(sung));
  g.restore();

  // 総合コメント
  g.strokeStyle = '#3A4766'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(64, 1540); g.lineTo(W - 64, 1540); g.stroke();
  g.fillStyle = PAPER; g.font = `500 34px ${MIN}`; g.textAlign = 'left';
  const lines = wrap(g, tx.summary, W - 140).slice(0, 3);
  lines.forEach((l, i) => g.fillText(l, 70, 1596 + i * 54));
  const yB = 1596 + lines.length * 54 - 10;
  g.beginPath(); g.moveTo(64, yB); g.lineTo(W - 64, yB); g.stroke();

  // フッター
  g.fillStyle = MIST; g.font = `400 26px ${GOT}`; g.fillText('ドレミを歌うだけで声のタイプがわかる', 64, H - 120);
  g.fillStyle = PAPER; g.font = `800 58px ${MIN}`; g.fillText('歌声診断 コエシル', 64, H - 56);
  g.fillStyle = GOLD; g.font = `500 26px ${MONO}`; g.textAlign = 'right';
  g.fillText('無料で診断 →', W - 64, H - 104); g.fillText('koeshiru.ksvox.net', W - 64, H - 64);

  return new Promise((res, rej) => cv.toBlob((b) => (b ? res(b) : rej(new Error('blob'))), 'image/png'));
}
