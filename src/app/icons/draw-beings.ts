// 生物、人物、建筑与杂项符号图标绘制器。
// 生物与人物采用“头像”式构图：由种子决定耳朵、角、眼睛、配饰等细节组合。
import { type Drawer, type X, P, F, L, TL, C, Co, E, R, G, blob, star, smooth, ringPts, twinkle, sym, ri, rf, pick, n1, shade, WOOD, METAL, GOLD, WHITE, PAPER, SKINS, SW } from './prim';

const EYE_GLOW = ['#ffd84d', '#ff5a5a', '#7cf3ff', '#b57bff'];
function eyes(x: X, cx: number, cy: number, dx: number, r: number, glow = x.r() < 0.3) {
  const col = glow ? pick(x, EYE_GLOW) : '#1b1722';
  return sym((s) => Co(cx + s * dx, cy, r + 1, glow ? '#1b1722' : WHITE) + Co(cx + s * dx, cy, r * (glow ? 1 : 0.7), col) + Co(cx + s * dx - r * 0.35, cy - r * 0.35, r * 0.3, '#fff', 0.9));
}
const brows = (x: X, cx: number, cy: number, dx: number) => sym((s) => L(`M${cx + s * (dx + 5)} ${cy - 3}L${cx + s * (dx - 3)} ${cy + 1}`, x.o, 2.4));

// ---------- 兽类头像 ----------
function beast(x: X) {
  const v = x.v, hx = 32, hy = 36, rx = rf(x, 17, 20), ry = rf(x, 15, 17.5);
  let back = '', front = '';
  const ear = v === 'rabbit' ? 'long' : v === 'mouse' ? 'big' : v === 'bear' || v === 'monkey' ? 'round' : v === 'cat' || v === 'wolf' ? 'point' : v === 'horned' || v === 'unicorn' || v === 'horse' ? 'point' : pick(x, ['point', 'round', 'point', 'flop']);
  if (v === 'lion') back += blob(x, Array.from({ length: 12 }, (_, i) => [hx + Math.cos(i * 0.52) * 21, hy + Math.sin(i * 0.52) * 19, 8] as [number, number, number]), x.a);
  back += sym((s) => {
    if (ear === 'point') return P(x, `M${hx + s * (rx - 7)} ${hy - ry + 5}L${hx + s * (rx + 1)} ${hy - ry - 13}L${hx + s * (rx - 15)} ${hy - ry + 1}Z`, x.c) + F(`M${hx + s * (rx - 8)} ${hy - ry + 3}L${hx + s * rx} ${hy - ry - 8}L${hx + s * (rx - 12)} ${hy - ry + 1}Z`, '#f3b6b6', 0.8);
    if (ear === 'round') return C(x, hx + s * (rx - 4), hy - ry + 3, 7, x.c) + Co(hx + s * (rx - 4), hy - ry + 3, 3.5, shade(x.c, 18));
    if (ear === 'big') return C(x, hx + s * (rx - 2), hy - ry + 1, 11, x.c) + Co(hx + s * (rx - 2), hy - ry + 1, 6.5, '#f3b6b6');
    if (ear === 'long') return E(x, hx + s * 8, hy - ry - 12, 5, 15, x.c, s * 10) + E(null, hx + s * 8, hy - ry - 12, 2.2, 10, '#f3b6b6', s * 10);
    return P(x, `M${hx + s * (rx - 6)} ${hy - ry + 4}Q${hx + s * (rx + 10)} ${hy - ry} ${hx + s * (rx + 6)} ${hy + 4}Q${hx + s * rx} ${hy} ${hx + s * (rx - 8)} ${hy - ry + 9}Z`, shade(x.c, -15));
  });
  if (v === 'horned' || (v === '' && x.r() < 0.2)) back += sym((s) => P(x, `M${hx + s * 10} ${hy - ry + 4}Q${hx + s * 26} ${hy - ry} ${hx + s * 28} ${hy - ry - 14}Q${hx + s * 22} ${hy - ry - 4} ${hx + s * 12} ${hy - ry - 2}Z`, '#efe3c6'));
  if (v === 'unicorn') front += P(x, `M${hx - 4} ${hy - ry + 3}L${hx} ${hy - ry - 20}L${hx + 4} ${hy - ry + 3}Z`, GOLD);
  const head = v === 'horse' ? P(x, `M${hx - 14} ${hy - 12}Q${hx} ${hy - 22} ${hx + 14} ${hy - 12}L${hx + 10} ${hy + 20}Q${hx} ${hy + 26} ${hx - 10} ${hy + 20}Z`, x.c) : E(x, hx, hy, rx, ry, x.c);
  let face = '';
  if (v === 'monkey') face += E(null, hx, hy + 3, rx * 0.7, ry * 0.7, '#f1d3b0');
  const my = v === 'horse' ? hy + 14 : hy + ry * 0.45;
  face += E(x, hx, my, v === 'horse' ? 10 : rx * 0.5, v === 'horse' ? 8 : ry * 0.38, shade(x.c, 22), 0, 1.8);
  face += E(null, hx, my - 2.5, 3.6, 2.4, '#1b1722');
  face += L(`M${hx - 4} ${my + 3}Q${hx} ${my + 6} ${hx} ${my + 1}Q${hx} ${my + 6} ${hx + 4} ${my + 3}`, x.o, 1.5);
  face += eyes(x, hx, hy - rf(x, 2, 5), rf(x, 6.5, 8.5), rf(x, 2.2, 3.4));
  if (x.r() < 0.35) face += brows(x, hx, hy - 7, 7);
  if (v === 'boar' || (v === '' && x.r() < 0.15)) face += sym((s) => P(x, `M${hx + s * 6} ${my + 2}Q${hx + s * 12} ${my - 2} ${hx + s * 10} ${my - 10}Q${hx + s * 9} ${my - 2} ${hx + s * 4} ${my + 4}Z`, WHITE, 1.4));
  if (v === 'cat' || v === 'mouse') face += sym((s) => L(`M${hx + s * 6} ${my}L${hx + s * 18} ${my - 3}M${hx + s * 6} ${my + 2}L${hx + s * 18} ${my + 3}`, x.o, 1, 0.7));
  if (v === 'hedgehog') back = blob(x, Array.from({ length: 9 }, (_, i) => [hx + Math.cos(-2.6 + i * 0.4) * 20, hy + Math.sin(-2.6 + i * 0.4) * 18, 5] as [number, number, number]), shade(x.c, -20)) + back;
  return back + head + face + front;
}
function bird(x: X) {
  const v = x.v;
  let s = '';
  if (v === 'bat') {
    s += sym((sd) => P(x, `M${32 + sd * 12} 30L${32 + sd * 30} 18Q${32 + sd * 28} 34 ${32 + sd * 26} 44Q${32 + sd * 22} 38 ${32 + sd * 18} 44Q${32 + sd * 16} 38 ${32 + sd * 10} 42Z`, shade(x.c, -12)));
    s += sym((sd) => P(x, `M${32 + sd * 6} 26L${32 + sd * 14} 10L${32 + sd * 14} 28Z`, x.c));
    return s + C(x, 32, 34, 13, x.c) + eyes(x, 32, 32, 5, 2.4, true) + sym((sd) => F(`M${32 + sd * 3} 40l${sd * 1.5} 4l${sd * 1.5} -4Z`, WHITE));
  }
  if (v === 'chicken') s += blob(x, [[28, 14, 4.5], [33, 12, 5], [38, 15, 4.2]], '#e74c3c');
  else if (x.r() < 0.5) s += sym((sd) => P(x, `M32 18Q${32 + sd * 6} 4 ${32 + sd * 2} 2Q${32 + sd * 2} 10 32 16Z`, shade(x.c, -15), 1.6));
  s += C(x, 32, 32, 19, x.c);
  if (v === 'penguin') s += P(x, 'M20 38Q20 22 32 26Q44 22 44 38Q44 50 32 50Q20 50 20 38Z', WHITE, 0);
  else s += E(null, 32, 40, 12, 9, shade(x.c, 20), 0).replace('/>', ' opacity="0.6"/>');
  s += eyes(x, 32, 28, 7.5, 3.4, x.r() < 0.15);
  s += v === 'eagle' || x.r() < 0.3 ? P(x, 'M26 34Q32 32 38 34Q38 44 32 48Q33 42 26 34Z', '#f5a623', 1.8) : P(x, 'M27 34H37L32 42Z', '#f5a623', 1.8);
  if (v === 'chicken') s += E(x, 32, 46, 3, 4, '#e74c3c', 0, 1.4);
  return s;
}
function reptile(x: X) {
  const v = x.v;
  let s = '';
  if (v === 'turtle') {
    s += P(x, 'M10 50Q10 22 36 22Q60 24 58 50Z', '#8d6e47') + L('M22 30L28 40L40 40L46 30M28 40L24 50M40 40L44 50', '#5d4627', 1.6);
    return s + C(x, 18, 38, 10, x.c) + Co(15, 35, 2.4, '#1b1722') + L('M12 42Q16 44 20 42', x.o, 1.4);
  }
  if (v !== 'dino' && x.r() < 0.4) s += sym((sd) => P(x, `M${32 + sd * 18} 30L${32 + sd * 30} 20L${32 + sd * 28} 34L${32 + sd * 30} 46L${32 + sd * 18} 40Z`, shade(x.c, 15), 1.8));
  s += P(x, 'M10 36Q12 18 32 18Q52 18 54 36Q50 52 32 52Q14 52 10 36Z', x.c);
  s += sym((sd) => C(x, 32 + sd * 12, 20, 7, x.c)) + eyes(x, 32, 20, 12, 3.2, x.r() < 0.5);
  s += Co(28, 32, 1.4, x.o) + Co(36, 32, 1.4, x.o) + L('M14 40Q32 48 50 40', x.o, 2);
  if (v === 'dino') for (let i = 0; i < 5; i++) s += F(`M${20 + i * 5.5} 41l2.5 4l2.5 -4Z`, WHITE);
  if (x.r() < 0.5) for (let i = 0; i < 4; i++) s += Co(rf(x, 18, 46), rf(x, 26, 44), rf(x, 1.2, 2.2), shade(x.c, -18));
  return s;
}
function serpent(x: X) {
  return `<circle cx="32" cy="44" r="15" fill="none" stroke="${x.o}" stroke-width="${10 + SW * 2}"/><circle cx="32" cy="44" r="15" fill="none" stroke="${x.c}" stroke-width="10"/>`
    + `<circle cx="32" cy="44" r="15" fill="none" stroke="${shade(x.c, -18)}" stroke-width="2" stroke-dasharray="2 5"/>`
    + TL(x, 'M44 34Q48 22 38 18', x.c, 9) + L('M28 12L20 10M20 10L16 7M20 10L16 13', '#e74c3c', 1.6) + E(x, 34, 16, 10, 7, x.c, -15) + eyes(x, 34, 14, 4, 1.8, true);
}
function dragon(x: X) {
  let s = '';
  if (x.r() < 0.5) s += sym((sd) => P(x, `M${32 + sd * 14} 34L${32 + sd * 30} 8L${32 + sd * 28} 24L${32 + sd * 32} 30L${32 + sd * 26} 38Z`, shade(x.c, -15)));
  const hl = rf(x, 22, 32);
  s += sym((sd) => P(x, `M${32 + sd * 7} 16Q${32 + sd * 14} ${n1(16 - hl * 0.6)} ${32 + sd * hl} ${n1(16 - hl * 0.4)}Q${32 + sd * 16} 12 ${32 + sd * 14} 22Z`, '#efe3c6', 2));
  s += sym((sd) => P(x, `M${32 + sd * 16} 30L${32 + sd * 27} 30L${32 + sd * 17} 38Z`, shade(x.c, -12), 1.8));
  s += P(x, 'M14 30Q14 12 32 12Q50 12 50 30L48 44Q46 58 32 60Q18 58 16 44Z', x.c);
  s += E(x, 32, 47, 12, 9, shade(x.c, 18), 0, 1.8) + Co(28, 45, 1.6, x.o) + Co(36, 45, 1.6, x.o);
  s += sym((sd) => P(x, `M${32 + sd * 4} 30L${32 + sd * 14} 25L${32 + sd * 13} 32Z`, '#ffd84d', 1.4) + L(`M${32 + sd * 9.5} 27V31`, '#1b1722', 1.4));
  s += L('M20 52L24 50L26 53L29 51L32 54L35 51L38 53L40 50L44 52', WHITE, 1.4);
  s += F('M18 24Q20 16 28 14Q22 18 21 28Z', '#fff', 0.25);
  return s;
}
const frog: Drawer = (x) => E(x, 32, 40, 24, 16, x.c) + sym((s) => C(x, 32 + s * 13, 24, 9, x.c) + Co(32 + s * 13, 24, 6, WHITE) + Co(32 + s * 13, 25, 3.6, '#1b1722')) + L('M16 44Q32 54 48 44', x.o, 2) + Co(22, 42, 2.4, '#f3a6a6', 0.7) + Co(42, 42, 2.4, '#f3a6a6', 0.7);
function bug(x: X) {
  switch (x.v) {
    case 'spider': {
      let s = sym((sd) => [0, 1, 2, 3].map((i) => L(`M32 30L${32 + sd * (18 + i * 2)} ${16 + i * 9}L${32 + sd * (26 + i)} ${24 + i * 11}`, x.o, 3)).join(''));
      s += C(x, 32, 42, 15, x.c) + C(x, 32, 22, 9, shade(x.c, 8));
      const k = ri(x, 2, 4); for (let i = 0; i < k; i++) s += Co(32 + (i - (k - 1) / 2) * 4.5, 20 + (i % 2) * 2, 1.8, '#ff4d4d');
      return s + (x.r() < 0.5 ? F('M28 36L36 36L32 42L36 48H28L32 42Z', '#e74c3c') : Co(32, 42, 4, shade(x.c, 15)));
    }
    case 'scorpion': return TL(x, 'M32 46Q50 50 52 30Q54 14 42 12', x.c, 6) + P(x, 'M42 12L36 8L40 16Z', '#e74c3c', 1.6) + sym((s) => TL(x, `M${32 + s * 6} 34L${32 + s * 18} 24`, x.c, 4) + P(x, `M${32 + s * 18} 24Q${32 + s * 28} 18 ${32 + s * 22} 10Q${32 + s * 20} 18 ${32 + s * 15} 18Z`, x.c, 2) + L(`M${32 + s * 6} 42L${32 + s * 18} 46M${32 + s * 6} 48L${32 + s * 16} 56`, x.o, 2)) + E(x, 32, 42, 9, 13, x.c) + eyes(x, 32, 34, 3, 1.4, true);
    case 'bee': return sym((s) => E(x, 32 + s * 12, 22, 10, 7, '#dff3ff', s * -30)) + E(x, 32, 38, 13, 17, x.c) + F('M19.5 34H44.5V39H19.5ZM20 44H44V49H20Z', '#1b1722') + C(x, 32, 18, 8, '#1b1722') + eyes(x, 32, 17, 3.4, 1.4) + L('M28 11L24 4M36 11L40 4', x.o, 1.6) + P(x, 'M30 55L32 61L34 55Z', '#1b1722', 1.2);
    case 'snail': { let d = ''; for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 4, r = 2 + i / 40 * 14; d += `${i ? 'L' : 'M'}${n1(38 + Math.cos(a) * r)} ${n1(32 + Math.sin(a) * r)}`; } return P(x, 'M4 52Q8 44 24 44H54Q58 52 50 54H8Z', '#c9b49a') + L('M10 46L6 30M16 46L16 30', x.o, 1.6) + Co(6, 30, 2.4, x.o) + Co(16, 30, 2.4, x.o) + C(x, 38, 32, 17, x.c) + L(d, shade(x.c, -25), 2); }
    default: { let s = ''; const pts = Array.from({ length: 7 }, (_, i) => [12 + i * 7, 40 + Math.sin(i * 1.1 + x.r()) * 9] as [number, number]); for (const [px, py] of pts) s += C(x, px, py, 7, x.c, 2); const [hx, hy] = pts[pts.length - 1]; return s + eyes(x, hx, hy - 2, 2.6, 1.4); }
  }
}
function demon(x: X) {
  let s = '';
  const hs = pick(x, ['short', 'long', 'curl']);
  s += sym((sd) => hs === 'curl' ? P(x, `M${32 + sd * 10} 16Q${32 + sd * 24} 16 ${32 + sd * 24} 4Q${32 + sd * 30} 18 ${32 + sd * 16} 24Z`, '#3a2a2a') : P(x, `M${32 + sd * 8} 16L${32 + sd * (hs === 'long' ? 22 : 18)} ${hs === 'long' ? 0 : 6}L${32 + sd * 16} 22Z`, '#3a2a2a'));
  s += sym((sd) => P(x, `M${32 + sd * 16} 26L${32 + sd * 28} 20L${32 + sd * 18} 36Z`, x.c));
  s += P(x, 'M14 28Q14 10 32 10Q50 10 50 28Q50 46 32 56Q14 46 14 28Z', x.c);
  s += sym((sd) => P(x, `M${32 + sd * 3} 28L${32 + sd * 13} 24L${32 + sd * 12} 32Z`, '#ffd84d', 1.4));
  s += L('M22 42Q32 48 42 42', x.o, 2) + sym((sd) => F(`M${32 + sd * 6} 43.5l${sd * 2} 5l${sd * 2} -4Z`, WHITE));
  return s + F('M18 24Q20 14 28 12Q22 18 21 28Z', '#fff', 0.25);
}
function alien(x: X) {
  const N = 7, cell = 6.4, ox = 32 - (N * cell) / 2, oy = 32 - (N * cell) / 2;
  const on: boolean[][] = [];
  for (let r = 0; r < N; r++) { on[r] = []; for (let c = 0; c <= 3; c++) on[r][c] = on[r][N - 1 - c] = x.r() < (r === 0 ? 0.35 : 0.62); }
  on[2][2] = on[2][4] = true; on[3][3] = true; on[2][3] = true;
  let back = '', fill = '';
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (on[r][c]) { back += R(null, ox + c * cell - 1.6, oy + r * cell - 1.6, cell + 3.2, cell + 3.2, x.o); fill += R(null, ox + c * cell, oy + r * cell, cell + 0.2, cell + 0.2, x.c); }
  return back + fill + R(null, ox + 2 * cell + 1.5, oy + 2 * cell + 1.5, cell - 3, cell - 3, '#1b1722') + R(null, ox + 4 * cell + 1.5, oy + 2 * cell + 1.5, cell - 3, cell - 3, '#1b1722');
}
const snowman: Drawer = (x) => C(x, 32, 44, 16, WHITE) + C(x, 32, 22, 11, WHITE) + R(x, 22, 6, 20, 4, '#2a2430', 1) + R(x, 25, -2, 14, 10, '#2a2430', 1) + Co(28, 20, 1.6, '#1b1722') + Co(36, 20, 1.6, '#1b1722') + P(x, 'M32 23L42 25L32 26Z', '#e67e22', 1.2) + P(x, 'M20 30Q32 36 44 30V35Q32 40 20 35Z', x.c, 1.8) + Co(32, 40, 1.8, '#1b1722') + Co(32, 47, 1.8, '#1b1722');
const ghost: Drawer = (x) => P(x, 'M14 58L14 28Q14 8 32 8Q50 8 50 28L50 58Q46 52 41 58Q37 52 32 58Q27 52 23 58Q18 52 14 58Z', x.c) + E(null, 26, 28, 3.4, 5, '#1b1722') + E(null, 38, 28, 3.4, 5, '#1b1722') + (x.r() < 0.5 ? E(null, 32, 40, 3.4, 4.5, '#1b1722') : L('M26 40Q32 44 38 40', '#1b1722', 2)) + F('M18 26Q20 14 28 12Q22 18 21 30Z', '#fff', 0.5);
const slime: Drawer = (x) => P(x, 'M8 52Q6 30 22 22Q30 10 34 18Q52 18 56 52Q32 58 8 52Z', x.c) + E(null, 24, 38, 3, 4.5, '#1b1722') + E(null, 40, 38, 3, 4.5, '#1b1722') + L('M27 46Q32 49 37 46', '#1b1722', 1.8) + F('M14 40Q16 28 24 24Q18 32 18 42Z', '#fff', 0.4);
const germ: Drawer = (x) => Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * Math.PI * 2; return TL(x, `M${n1(32 + Math.cos(a) * 16)} ${n1(32 + Math.sin(a) * 16)}L${n1(32 + Math.cos(a) * 25)} ${n1(32 + Math.sin(a) * 25)}`, x.c, 2) + C(x, 32 + Math.cos(a) * 26, 32 + Math.sin(a) * 26, 3, shade(x.c, 15), 1.6); }).join('') + P(x, smooth(ringPts(x, 32, 32, 18, 8, 0.1)), x.c) + eyes(x, 32, 30, 6, 2.6) + Co(26, 40, 2, shade(x.c, -20)) + Co(40, 38, 1.5, shade(x.c, -20));

function creature(x: X) {
  switch (x.v) {
    case 'bird': case 'chicken': case 'penguin': case 'eagle': case 'bat': return bird(x);
    case 'reptile': case 'dino': case 'turtle': return reptile(x);
    case 'serpent': return serpent(x);
    case 'dragon': return dragon(x);
    case 'frog': return frog(x);
    case 'spider': case 'scorpion': case 'bee': case 'snail': case 'worm': return bug(x);
    case 'demon': return demon(x);
    case 'alien': return alien(x);
    case 'snowman': return snowman(x);
    case 'beast': return beast({ ...x, v: '' });
    default: return beast(x);
  }
}

// ---------- 人物头像 ----------
function person(x: X) {
  const v = x.v;
  const skin = v === 'troll' || v === 'zombie' ? '#8fbf6a' : v === 'genie' ? '#5dade2' : v === 'vampire' ? '#ece4ef' : v === 'shadow' ? shade(x.c, -20) : pick(x, SKINS);
  const hair = pick(x, ['#2c2118', '#5b3a1e', '#c9a35a', '#a33a1e', '#e8e0d0', '#1e1e2a']);
  let back = '', s = '';
  if (v === 'angel' || v === 'fairy') back += sym((sd) => P(x, `M${32 + sd * 8} 40Q${32 + sd * 30} 20 ${32 + sd * 28} 46Q${32 + sd * 22} 54 ${32 + sd * 10} 48Z`, v === 'fairy' ? '#d6f0ff' : WHITE));
  if (v === 'vampire') back += P(x, 'M8 64L14 30L24 40H40L50 30L56 64Z', '#8e1b1b');
  const longHair = !['wizard', 'witch', 'ninja', 'guard', 'troll', 'shadow', 'genie', 'snowman', 'fencer'].includes(v) && x.r() < 0.35;
  if (longHair) back += P(x, 'M17 28Q16 12 32 12Q48 12 47 28L48 50H16Z', hair);
  s += P(x, 'M6 64Q8 44 32 42Q56 44 58 64Z', x.c) + F('M12 64Q14 50 26 46Q18 54 18 64Z', '#fff', 0.15);
  if (v === 'elf') s += sym((sd) => P(x, `M${32 + sd * 11} 26L${32 + sd * 22} 16L${32 + sd * 12} 32Z`, skin, 2));
  if (v === 'troll') s += sym((sd) => C(x, 32 + sd * 13, 28, 4, skin));
  s += C(x, 32, 28, 13, skin);
  if (v === 'ninja') s += P(x, 'M19 28Q19 14 32 14Q45 14 45 28Q45 40 32 41Q19 40 19 28Z', x.c) + R(null, 21, 24, 22, 7, skin, 3);
  if (v === 'shadow') s += Co(32, 28, 13, x.c);
  const eyeCol = v === 'shadow' ? '#ff5a5a' : v === 'genie' ? '#fff' : '#1b1722';
  s += v === 'zombie' ? Co(27, 28, 2.8, WHITE) + Co(27, 28, 1.2, '#1b1722') + L('M35 27l3 2M38 27l-3 2', '#1b1722', 1.4) : Co(27, 28, 1.8, eyeCol) + Co(37, 28, 1.8, eyeCol);
  if (v !== 'ninja' && v !== 'shadow') s += v === 'troll' ? E(x, 32, 33, 4, 3.4, shade(skin, -10), 0, 1.4) + sym((sd) => P(x, `M${32 + sd * 5} 38l${sd * 2} -5l${sd * 1.5} 5Z`, WHITE, 1)) : L(x.r() < 0.5 ? 'M29 35Q32 37 35 35' : 'M29 35H35', x.o, 1.5);
  if (v === 'vampire') s += sym((sd) => F(`M${32 + sd * 2} 35l${sd} 3l${sd} -3Z`, WHITE));
  if (v === 'zombie') s += L('M22 20l6 3M23 23l2 -3M26 24l2 -3', '#3a2a2a', 1.2);
  if (!longHair && !['wizard', 'witch', 'ninja', 'king', 'guard', 'farmer', 'scholar', 'genie', 'shadow', 'fencer', 'troll', 'zombie'].includes(v)) {
    const hs = pick(x, ['cap', 'spike', 'part']);
    s += hs === 'spike' ? P(x, 'M19 24L20 14L25 18L28 11L32 16L36 11L39 18L44 14L45 24Q32 18 19 24Z', hair, 2) : hs === 'part' ? P(x, 'M19 26Q18 14 32 14Q46 14 45 26Q40 18 34 19Q26 17 19 26Z', hair, 2) : P(x, 'M19 25Q19 14 32 14Q45 14 45 25Q32 20 19 25Z', hair, 2);
  }
  if (longHair) s += P(x, 'M19 25Q19 14 32 14Q45 14 45 25Q38 18 32 20Q26 18 19 25Z', hair, 2);
  if (v === 'wizard' || v === 'beard') s += P(x, 'M20 31Q20 52 32 58Q44 52 44 31Q38 37 32 37Q26 37 20 31Z', v === 'wizard' ? '#ececec' : hair, 2) + L('M29 35Q32 37 35 35', x.o, 1.4);
  if (v === 'wizard' || v === 'witch') s += P(x, v === 'witch' ? 'M8 22Q32 28 56 22Q46 18 40 18L30 -2Q26 4 24 18Q16 18 8 22Z' : 'M14 22Q32 28 50 22L36 -2Q32 -4 30 0Z', v === 'witch' ? '#2a2430' : x.c) + twinkle(34, 12, 3);
  if (v === 'king') s += P(x, 'M20 18L20 6L26 12L32 4L38 12L44 6L44 18Z', GOLD, 2) + Co(32, 13, 1.8, '#e74c3c');
  if (v === 'guard') s += P(x, 'M17 24Q17 8 32 8Q47 8 47 24H43V20H21V24Z', METAL) + P(x, 'M30 8Q32 -2 40 2Q36 4 34 8Z', '#e74c3c', 1.6);
  if (v === 'farmer') s += E(x, 32, 18, 22, 5, '#e8c76a') + P(x, 'M21 18Q21 6 32 6Q43 6 43 18Z', '#e8c76a') + F('M21 14H43V17H21Z', '#c0392b');
  if (v === 'scholar') s += P(x, 'M32 6L56 14L32 22L8 14Z', '#2a2430') + L('M32 14L48 18V28', GOLD, 1.6);
  if (v === 'genie') s += P(x, 'M18 22Q16 8 32 6Q48 8 46 22Q32 16 18 22Z', '#f5f5f5') + C(x, 32, 12, 3, '#e74c3c', 1.4);
  if (v === 'runner' || v === 'climber' || v === 'lifter') s += F('M19 20H45V24H19Z', x.a);
  if (v === 'fencer') s += C(x, 32, 28, 13, '#d8dde2') + `<circle cx="32" cy="28" r="9" fill="none" stroke="#555" stroke-width="1" stroke-dasharray="1.5 1.5"/>` + L('M32 14V42', '#555', 1);
  if (v === 'villain') s += P(x, 'M19 25Q26 22 32 26Q38 22 45 25L44 31Q38 33 32 29Q26 33 20 31Z', '#2a2430', 1.6) + Co(27, 28, 1.6, WHITE) + Co(37, 28, 1.6, WHITE);
  if (v === 'angel') s = E(null, 32, 10, 11, 3.4, 'none').replace('fill="none"', `fill="none" stroke="${GOLD}" stroke-width="2.6"`) + s;
  return back + s;
}
function face(x: X) {
  const v = x.v;
  let s = C(x, 32, 32, 26, x.c) + F('M14 24Q16 12 28 9Q18 16 17 28Z', '#fff', 0.3);
  if (v === 'angel') s = E(null, 32, 6, 14, 4, 'none').replace('fill="none"', `fill="none" stroke="${GOLD}" stroke-width="3"`) + s + Co(24, 28, 2.4, '#1b1722') + Co(40, 28, 2.4, '#1b1722') + L('M24 40Q32 46 40 40', x.o, 2);
  else if (v === 'dizzy') s += L('M20 24l7 7M27 24l-7 7M37 24l7 7M44 24l-7 7', x.o, 2.4) + E(null, 32, 44, 4, 5, '#1b1722');
  else if (v === 'pain') s += L('M20 26l7 3l-7 3M44 26l-7 3l7 3', x.o, 2.4) + L('M22 44l4 -3l4 3l4 -3l4 3l4 -3', x.o, 2);
  else if (v === 'angry') s += brows(x, 32, 26, 8) + Co(24, 30, 2.4, '#1b1722') + Co(40, 30, 2.4, '#1b1722') + L('M24 44Q32 38 40 44', x.o, 2.4);
  else if (v === 'sick') s += Co(24, 28, 2.4, '#1b1722') + Co(40, 28, 2.4, '#1b1722') + P(x, 'M16 34H48V46Q32 54 16 46Z', WHITE, 1.8) + L('M16 36L8 30M48 36L56 30', WHITE, 1.4);
  else s += Co(24, 28, 2.4, '#1b1722') + `<circle cx="40" cy="28" r="6" fill="#dff3ff" fill-opacity=".5" stroke="${GOLD}" stroke-width="2"/>` + Co(40, 28, 2.4, '#1b1722') + L('M46 32Q50 44 46 56', GOLD, 1.2) + L('M26 42H38', x.o, 2);
  return s;
}

// ---------- 身体部位 ----------
const paw: Drawer = (x) => P(x, 'M20 44Q20 32 32 32Q44 32 44 44Q44 54 32 54Q20 54 20 44Z', x.c) + [[16, 30], [25, 20], [39, 20], [48, 30]].map(([cx, cy]) => E(x, cx, cy, 5.5, 7, x.c)).join('');
const hand: Drawer = (x) => sym((s) => P(x, `M32 8Q${32 + s * 8} 8 ${32 + s * 9} 20L${32 + s * 12} 36Q${32 + s * 18} 46 ${32 + s * 14} 54L${32 + s * 4} 60H32Z`, x.c)) + L('M32 8V58', x.o, 1.6) + sym((s) => L(`M${32 + s * 20} 14l${s * 4} -4M${32 + s * 22} 22l${s * 6} -1`, GOLD, 2));
const fist: Drawer = (x) => P(x, 'M8 56Q10 42 20 38Q18 24 28 16Q38 10 44 18Q48 24 42 28Q52 30 54 42Q54 56 40 58H8Z', x.c) + L('M24 40Q30 34 38 36', shade(x.c, -25), 1.8) + F('M22 22Q26 16 32 15Q26 20 25 28Z', '#fff', 0.4);
const brain: Drawer = (x) => P(x, 'M10 34Q8 18 22 14Q30 8 40 12Q54 14 54 28Q58 40 48 46Q44 54 32 52Q22 56 16 48Q8 44 10 34Z', x.c) + L('M32 13V50M20 22Q26 26 22 32Q18 38 24 42M44 22Q38 26 42 32Q46 38 40 44', shade(x.c, -22), 1.8);
function eye(x: X) {
  let s = P(x, 'M4 32Q32 6 60 32Q32 58 4 32Z', WHITE) + C(x, 32, 32, 12, x.v === 'bubble' ? '#5d6dce' : pick(x, ['#3a7bd5', '#4caf50', '#8e5b3c', '#9b59b6', '#e67e22'])) + Co(32, 32, 5.5, '#1b1722') + Co(28, 28, 2.6, '#fff');
  if (x.v === 'bubble') s = P(x, 'M8 6H56V48H28L16 58V48H8Z', '#f2f2f2') + G('translate(4 -6) scale(.88)', s);
  return s;
}
const wing: Drawer = (x) => P(x, 'M6 14Q30 2 52 14Q62 22 56 32Q48 48 28 56Q20 58 16 52Q24 46 28 40Q16 44 10 38Q18 32 24 28Q12 28 6 14Z', x.c) + L('M14 22Q34 18 50 24M20 32Q34 30 46 36M24 42Q32 42 38 46', shade(x.c, -22), 1.6) + F('M12 16Q30 8 46 14Q30 12 16 20Z', '#fff', 0.5);

// ---------- 建筑 ----------
const win = (x: X, wx: number, wy: number, w = 7, h = 7) => R(x, wx, wy, w, h, '#ffe9a0', 1) + L(`M${wx + w / 2} ${wy}V${wy + h}M${wx} ${wy + h / 2}H${wx + w}`, x.o, 1);
function house(x: X, ox = 0, oy = 0, sc = 1) {
  const roof = pick(x, ['#c0392b', '#8e5b3c', '#2e6db0', '#6d4c41']);
  let s = '';
  if (x.r() < 0.5) s += R(x, 40, 12, 6, 14, '#8a8f98');
  s += R(x, 15, 30, 34, 26, x.c) + P(x, 'M9 32L32 10L55 32Z', roof) + R(x, 28, 42, 8, 14, WOOD, 1) + win(x, 18, 36) + (x.r() < 0.7 ? win(x, 39, 36) : '');
  return G(`translate(${ox} ${oy}) scale(${sc})`, s);
}
function columns(x: X, pediment: string) {
  let s = P(x, 'M6 24L32 8L58 24Z', x.c) + R(x, 8, 24, 48, 6, x.c) + R(x, 6, 52, 52, 8, shade(x.c, -10));
  for (let i = 0; i < 4; i++) s += R(x, 12 + i * 11.3, 30, 6, 22, shade(x.c, 8));
  return s + pediment;
}
function building(x: X) {
  switch (x.v) {
    case 'village': return house(x, 18, 2, 0.62) + house(x, -2, 22, 0.7);
    case 'bank': return columns(x, C(x, 32, 18, 4, GOLD, 1.6));
    case 'temple': return columns(x, '');
    case 'castle': {
      const bat = (bx: number, by: number, w: number) => { let d = `M${bx} ${by + 6}`; for (let i = 0; i < 3; i++) d += `V${by}h${w / 5}v4h${w / 5}`; return d.replace(/v4h[\d.]+$/, '') + `V${by + 6}Z`; };
      return R(x, 16, 28, 32, 30, x.c) + P(x, bat(16, 22, 32), x.c, 2) + R(x, 6, 18, 14, 40, shade(x.c, -8)) + R(x, 44, 18, 14, 40, shade(x.c, -8)) + P(x, 'M4 18L13 4L22 18Z', '#c0392b') + P(x, 'M42 18L51 4L60 18Z', '#c0392b') + P(x, 'M26 58V46Q32 38 38 46V58Z', '#3a2a1a') + win(x, 10, 26, 5, 7) + win(x, 49, 26, 5, 7);
    }
    case 'tower': return P(x, 'M20 58L24 20H40L44 58Z', x.c) + P(x, 'M18 22H46V14H18Z', shade(x.c, -10)) + P(x, 'M20 14L32 0L44 14Z', '#2e6db0') + win(x, 29, 26, 6, 8) + win(x, 29, 40, 6, 8) + R(x, 28, 50, 8, 8, WOOD);
    case 'shrine': return R(x, 16, 20, 5, 40, x.c) + R(x, 43, 20, 5, 40, x.c) + P(x, 'M4 10Q32 16 60 10L58 18Q32 22 6 18Z', x.c) + R(x, 12, 24, 40, 5, x.c) + R(x, 29, 18, 6, 8, shade(x.c, -15));
    case 'pagoda': return [0, 1, 2].map((i) => R(x, 20 + i * 3, 48 - i * 16, 24 - i * 6, 12, WOOD) + P(x, `M${6 + i * 6} ${50 - i * 16}Q32 ${40 - i * 16} ${58 - i * 6} ${50 - i * 16}L${50 - i * 6} ${44 - i * 16}H${14 + i * 6}Z`, x.c, 2)).join('') + TL(x, 'M32 12V2', GOLD, 2);
    case 'ruin': return P(x, 'M8 58V24L14 30L18 20L24 28V40H40V24L46 32L50 22L56 30V58Z', x.c) + P(x, 'M24 58V48Q32 40 40 48V58Z', '#3a2a1a') + R(x, 50, 52, 8, 6, shade(x.c, -15), 1) + R(x, 4, 54, 6, 4, shade(x.c, -15), 1);
    case 'shop': return R(x, 10, 26, 44, 32, WHITE) + [0, 1, 2, 3, 4].map((i) => P(x, `M${8 + i * 9.6} 16H${17.6 + i * 9.6}V28Q${12.8 + i * 9.6} 32 ${8 + i * 9.6} 28Z`, i % 2 ? WHITE : x.c, 1.8)).join('') + R(x, 28, 40, 10, 18, WOOD) + win(x, 14, 36, 10, 10);
    case 'church': return P(x, 'M14 58V30L32 18L50 30V58Z', x.c) + P(x, 'M26 26V12L32 2L38 12V26Z', x.c) + L('M32 4V0M30 2H34', GOLD, 1.6) + P(x, 'M28 58V46Q32 40 36 46V58Z', WOOD) + Co(32, 34, 4, '#9ad0ff');
    case 'school': return R(x, 8, 30, 48, 28, x.c) + P(x, 'M4 32L32 16L60 32Z', '#c0392b') + R(x, 26, 6, 12, 12, x.c) + C(x, 32, 12, 3, GOLD, 1.4) + win(x, 13, 38) + win(x, 44, 38) + R(x, 28, 44, 8, 14, WOOD);
    case 'hospital': return R(x, 10, 16, 44, 42, x.c) + F('M28 22h8v6h6v8h-6v6h-8v-6h-6v-8h6Z', '#e74c3c') + win(x, 14, 46) + win(x, 43, 46) + R(x, 27, 46, 10, 12, '#9ad0ff');
    case 'hut': return E(x, 32, 50, 22, 10, x.c) + P(x, 'M8 46Q32 -6 56 46Q32 54 8 46Z', '#c9a35a') + L('M16 36L48 36M12 42L52 42', '#9c7a3a', 1.4) + P(x, 'M28 56V46Q32 42 36 46V56Z', '#3a2a1a');
    default: return house(x);
  }
}
function statue(x: X) {
  if (x.v === 'torch') return R(x, 18, 52, 28, 8, '#8a8f98') + P(x, 'M22 52L24 24Q32 18 40 24L42 52Z', x.c) + C(x, 32, 18, 8, x.c) + TL(x, 'M40 24L48 8', x.c, 3) + P(x, 'M48 8Q44 0 50 -2Q54 4 48 8Z', '#ff9f43', 1.6) + P(x, 'M24 14L28 6L32 12L36 6L40 14Z', x.c, 1.6);
  return P(x, 'M18 58V26Q18 6 32 6Q46 6 46 26V58Z', x.c) + R(x, 14, 18, 36, 6, shade(x.c, -15), 2) + R(null, 22, 26, 7, 4, shade(x.c, -30)) + R(null, 35, 26, 7, 4, shade(x.c, -30)) + P(x, 'M30 30L34 30L35 42H29Z', shade(x.c, 8), 1.6) + L('M26 48H38', shade(x.c, -30), 2.4) + F('M20 26Q22 12 28 9Q24 18 24 40Z', '#fff', 0.2);
}
function grave(x: X) {
  if (x.v === 'coffin') return G('rotate(-15 32 32)', P(x, 'M24 4H40L48 18L42 60H22L16 18Z', x.c) + L('M32 14V36M25 22H39', GOLD, 2.4));
  return P(x, 'M4 58Q32 50 60 58V62H4Z', '#5d8a3a') + P(x, 'M16 58V22Q16 8 32 8Q48 8 48 22V58Z', x.c) + L('M32 18V36M25 24H39', shade(x.c, -25), 2.4) + L('M22 44H42M24 50H40', shade(x.c, -20), 1.6);
}
const mirror: Drawer = (x) => P(x, 'M24 54L20 62H44L40 54Z', WOOD) + TL(x, 'M32 46V56', WOOD, 3) + E(x, 32, 26, 17, 22, GOLD) + E(null, 32, 26, 13, 18, x.c) + F('M24 18L30 12L32 14L26 22Z', '#fff', 0.6) + F('M26 30L36 20L38 22L28 32Z', '#fff', 0.4);
const nest: Drawer = (x) => P(x, 'M6 34Q8 56 32 56Q56 56 58 34Q32 42 6 34Z', x.c) + E(x, 32, 34, 26, 7, shade(x.c, -20)) + L('M10 40L26 48M54 40L36 50M14 46L40 44M20 52L50 46', shade(x.c, -25), 1.4);

// ---------- 器物 ----------
const ladder: Drawer = (x) => G('rotate(12 32 32)', TL(x, 'M20 4V60M44 4V60', x.c, 3.4) + [12, 22, 32, 42, 52].map((y) => TL(x, `M20 ${y}H44`, x.c, 2.6)).join(''));
const door: Drawer = (x) => P(x, 'M12 60V24Q12 4 32 4Q52 4 52 24V60Z', x.c) + L('M22 8V60M32 4V60M42 8V60', shade(x.c, -20), 1.6) + L('M12 24H52M12 46H52', '#555', 3) + C(x, 44, 36, 2.6, GOLD, 1.4);
function candle(x: X) {
  if (x.v === 'lantern') return R(x, 24, 4, 16, 6, '#2a2430', 1) + R(x, 24, 54, 16, 6, '#2a2430', 1) + E(x, 32, 32, 22, 22, x.c) + L('M18 18Q12 32 18 46M46 18Q52 32 46 46M32 10V54', shade(x.c, -25), 1.4) + E(null, 32, 32, 8, 12, '#ffe9a0', 0).replace('/>', ' opacity="0.6"/>');
  return P(x, 'M22 26H42V58H22Z', x.c) + P(x, 'M22 26H42V30Q38 34 36 30Q32 38 28 30Q24 34 22 30Z', shade(x.c, -8), 1.6) + L('M32 26V20', x.o, 1.6) + P(x, 'M32 4Q40 14 36 20Q32 24 28 20Q24 14 32 4Z', '#ffb02e', 1.8) + F('M32 12Q35 17 33 20Q31 21 30 19Z', '#fff7d0');
}
const horn: Drawer = (x) => P(x, 'M6 30Q30 32 46 10Q56 12 58 22Q52 26 54 36Q36 42 6 40Z', x.c) + E(x, 54, 28, 4, 9, shade(x.c, -25), 15) + L('M18 31V39M28 30V39', shade(x.c, -20), 1.6) + C(x, 8, 35, 4, GOLD, 1.6);
const anchor: Drawer = (x) => TL(x, 'M32 16V56M22 24H42M10 40Q14 56 32 56Q50 56 54 40', x.c, 4) + C(x, 32, 10, 5.5, 'none') + P(x, 'M6 42L12 34L16 44Z', x.c, 1.6) + P(x, 'M58 42L52 34L48 44Z', x.c, 1.6);
const ship: Drawer = (x) => P(x, 'M4 40H60L52 56H12Z', x.c) + TL(x, 'M30 8V40', WOOD, 2.6) + P(x, 'M32 10Q50 22 32 36Z', WHITE) + P(x, 'M28 14Q14 24 28 34Z', '#f0e6d0') + P(x, 'M30 8L42 10L30 13Z', '#e74c3c', 1.4) + F('M4 58Q16 54 32 58T60 58V62H4Z', '#3498db', 0.8);
function cart(x: X) {
  if (x.v === 'tractor') return P(x, 'M10 44V28H30V16H46V44Z', x.c) + R(x, 32, 20, 12, 10, '#bfe6ff', 1) + C(x, 22, 46, 12, '#2a2430') + Co(22, 46, 5, '#9aa5ad') + C(x, 50, 50, 8, '#2a2430') + Co(50, 50, 3.4, '#9aa5ad') + TL(x, 'M16 28V18', '#555', 2);
  return L('M4 12H12L18 42H50L56 20H14', x.o, 3) + P(x, 'M14 20H56L50 40H18Z', x.c, 2) + L('M24 20L26 40M34 20L35 40M44 20L42 40', shade(x.c, -25), 1.4) + C(x, 22, 52, 4.5, '#2a2430') + C(x, 46, 52, 4.5, '#2a2430');
}
const scales: Drawer = (x) => TL(x, 'M32 8V54M10 18H54', x.c, 3) + R(x, 20, 52, 24, 6, x.c, 2) + L('M10 18L4 36M10 18L16 36M54 18L48 36M54 18L60 36', x.o, 1.4) + P(x, 'M2 36H18Q10 46 2 36Z', x.c, 2) + P(x, 'M46 36H62Q54 46 46 36Z', x.c, 2) + C(x, 32, 8, 3.4, GOLD, 1.4);
const ruler: Drawer = (x) => G('rotate(-35 32 32)', P(x, 'M4 24H60V40H4Z', x.c) + Array.from({ length: 11 }, (_, i) => L(`M${8 + i * 4.8} 24V${i % 2 ? 29 : 33}`, x.o, 1.4)).join(''));
const barrier: Drawer = (x) => TL(x, 'M14 34V60M50 34V60', '#555', 3) + P(x, 'M4 18H60V34H4Z', WHITE) + [0, 1, 2, 3].map((i) => F(`M${8 + i * 14} 18h8l-8 16h-8Z`, x.c)).join('') + P(x, 'M4 18H60V34H4Z', 'none');
const net: Drawer = (x) => P(x, 'M8 12H56V56H8Z', 'none', 3) + Array.from({ length: 5 }, (_, i) => L(`M${8 + (i + 1) * 8} 12V56M8 ${12 + (i + 1) * 7.3}H56`, x.c, 1.4)).join('') + TL(x, 'M8 12H56M8 12V56M56 12V56', '#e74c3c', 2.6);
const rod: Drawer = (x) => TL(x, 'M8 58Q30 30 52 6', WOOD, 3) + L('M52 6Q60 30 46 44', '#ddd', 1.2) + C(x, 46, 46, 4.5, '#e74c3c', 1.6) + F('M41.5 46H50.5A4.5 4.5 0 0 1 41.5 46Z', WHITE) + C(x, 14, 50, 4, x.c, 1.6);
function rune(x: X) {
  let s = P(x, smooth(ringPts(x, 32, 32, 25, 7, 0.06)), shade(x.c, -40, -20));
  const glow = x.c;
  if (x.v === 'hex') return s + L(star(32, 32, 3, 17, 17).replace('Z', '') + 'Z', glow, 2.6) + L(star(32, 32, 3, 17, 17, 90), glow, 2.6);
  if (x.v === 'aries') return s + L('M32 50V28M32 28Q30 14 22 14Q14 14 16 24M32 28Q34 14 42 14Q50 14 48 24', glow, 3.4);
  if (x.v === 'hazard') return s + [0, 120, 240].map((a) => G(`rotate(${a} 32 32)`, P(x, 'M32 30Q24 24 26 14Q32 18 38 14Q40 24 32 30Z', glow, 1.6))).join('') + Co(32, 32, 3.4, glow);
  // 随机生成的符文笔画
  const nodes: [number, number][] = [[22, 18], [32, 14], [42, 18], [22, 32], [32, 32], [42, 32], [22, 46], [32, 50], [42, 46]];
  let d = ''; let cur = ri(x, 0, 8);
  d += `M${nodes[cur][0]} ${nodes[cur][1]}`;
  for (let i = 0; i < ri(x, 3, 5); i++) { cur = (cur + ri(x, 1, 7)) % 9; d += `L${nodes[cur][0]} ${nodes[cur][1]}`; }
  return s + L(d, glow, 6, 0.3) + L(d, glow, 3);
}
const triangle: Drawer = (x) => P(x, x.v === 'down' ? 'M8 14H56L32 54Z' : 'M32 10L56 50H8Z', x.c) + F(x.v === 'down' ? 'M14 18H30L20 30Z' : 'M32 16L22 34H28Z', '#fff', 0.35);
const circle: Drawer = (x) => `<circle cx="32" cy="32" r="20" fill="none" stroke="${x.o}" stroke-width="${9 + SW * 2}"/><circle cx="32" cy="32" r="20" fill="none" stroke="${x.c}" stroke-width="9"/>`;
const screen: Drawer = (x) => R(x, 6, 8, 52, 36, x.c, 3) + R(null, 10, 12, 44, 28, '#9ad0ff') + F('M12 14H30L14 36Z', '#fff', 0.3) + P(x, 'M26 44H38L40 54H24Z', x.c) + R(x, 18, 54, 28, 4, x.c, 1);
const robot: Drawer = (x) => TL(x, 'M32 12V4', '#555', 2) + C(x, 32, 4, 3, '#e74c3c', 1.4) + R(x, 12, 12, 40, 32, x.c, 6) + R(null, 18, 20, 28, 12, '#1b2a3a', 3) + Co(25, 26, 3, '#7cf3ff') + Co(39, 26, 3, '#7cf3ff') + R(x, 22, 36, 20, 4, METAL, 1) + R(x, 6, 22, 6, 12, x.c, 2) + R(x, 52, 22, 6, 12, x.c, 2) + R(x, 18, 44, 28, 16, shade(x.c, -10), 3);
const mask: Drawer = (x) => G('rotate(-12 22 30)', P(x, 'M8 14Q22 8 36 14Q38 40 22 50Q6 40 8 14Z', x.c) + E(null, 16, 24, 3, 4, '#1b1722') + E(null, 28, 24, 3, 4, '#1b1722') + L('M14 36Q22 42 30 36', '#1b1722', 2)) + G('rotate(12 42 34)', P(x, 'M28 18Q42 12 56 18Q58 44 42 54Q26 44 28 18Z', shade(x.c, -15, 0, 40)) + E(null, 36, 28, 3, 4, '#1b1722') + E(null, 48, 28, 3, 4, '#1b1722') + L('M34 44Q42 38 50 44', '#1b1722', 2));
const puzzle: Drawer = (x) => P(x, 'M10 18H24Q22 8 30 8Q38 8 36 18H50V32Q60 30 60 38Q60 46 50 44V58H36Q38 48 30 48Q22 48 24 58H10V44Q20 46 20 38Q20 30 10 32Z', x.c) + F('M13 21H22V30Z', '#fff', 0.3);
const bomb: Drawer = (x) => C(x, 28, 38, 20, x.c) + R(x, 34, 14, 10, 8, '#555', 1) + L('M40 14Q46 4 54 8', '#c9a35a', 2) + P(x, star(55, 8, 6, 6, 2.6), '#ffb02e', 1.4) + F('M16 32Q18 24 26 22Q20 28 20 36Z', '#fff', 0.35);
function coin(x: X) {
  let s = C(x, 32, 32, 25, x.c) + `<circle cx="32" cy="32" r="19" fill="none" stroke="${shade(x.c, -22)}" stroke-width="2"/>`;
  if (x.v === 'skull') s += F('M24 30Q24 20 32 20Q40 20 40 30Q40 34 37 36V40H27V36Q24 34 24 30Z', shade(x.c, -28)) + Co(28.5, 30, 2.2, x.c) + Co(35.5, 30, 2.2, x.c);
  else s += F(star(32, 32, 5, 11, 4.6), shade(x.c, -22));
  return s + F('M12 28A21 21 0 0 1 28 11L29 15A17 17 0 0 0 16 29Z', '#fff', 0.45);
}

export const BEING_DRAWERS: Record<string, Drawer> = {
  creature, person, face, ghost, slime, germ, paw, hand, fist, brain, eye, wing, building, statue, grave, mirror, nest,
  ladder, door, candle, horn, anchor, ship, cart, scales, ruler, barrier, net, rod, rune, triangle, circle, screen, robot, mask, puzzle, bomb, coin,
};
