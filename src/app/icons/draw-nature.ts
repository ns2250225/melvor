// 自然、食物与元素类图标绘制器
import { type Drawer, type X, P, F, L, TL, C, Co, E, R, G, blob, star, smooth, ringPts, segment, twinkle, sym, ri, rf, pick, n1, shade, WOOD, WHITE, PAPER, GOLD, SW } from './prim';

// ---------- 植物 ----------
function tree(x: X) {
  if (x.v === 'pine') {
    let s = P(x, 'M28 48h8v12h-8Z', WOOD);
    const tiers = ri(x, 3, 4);
    for (let i = tiers - 1; i >= 0; i--) { const y = 8 + i * (40 / tiers), w = 10 + i * 6; s += P(x, `M32 ${n1(y)}L${32 + w} ${n1(y + 18)}H${32 - w}Z`, shade(x.c, -i * 3)); }
    return s + F('M32 10L26 20H30Z', '#fff', 0.25);
  }
  const k = ri(x, 4, 6), cs: [number, number, number][] = [[32, 24, 14]];
  for (let i = 0; i < k; i++) { const a = (i / k) * Math.PI * 2 + x.r(); cs.push([32 + Math.cos(a) * rf(x, 9, 14), 26 + Math.sin(a) * rf(x, 6, 10), rf(x, 8, 11)]); }
  let s = P(x, 'M28 34Q29 50 26 60H38Q35 50 36 34Z', WOOD) + blob(x, cs, x.c, shade(x.c, 15));
  if (x.r() < 0.35) for (let i = 0; i < 3; i++) s += C(x, rf(x, 22, 42), rf(x, 18, 34), 2.6, '#e74c3c', 1.2);
  return s;
}
function leaf(x: X) {
  if (x.v === 'clover' || x.v === 'clover3') {
    const n = x.v === 'clover' ? 4 : 3; let s = TL(x, 'M32 34Q34 48 44 58', shade(x.c, -15), 3);
    for (let i = 0; i < n; i++) { const a = -90 + (i * 360) / n + (n === 3 ? 0 : 45); s += G(`rotate(${a + 90} 32 32)`, P(x, 'M32 32Q20 26 20 16Q22 8 30 12Q32 13 32 16Q32 13 34 12Q42 8 44 16Q44 26 32 32Z', x.c, 2)); }
    return s + Co(32, 32, 2.6, shade(x.c, 20));
  }
  if (x.v === 'fall') return G('rotate(-30 32 32)', P(x, 'M32 6Q52 18 50 36Q46 52 32 58Q18 52 14 36Q12 18 32 6Z', x.c) + L('M32 10V62M32 24L42 18M32 34L46 28M32 24L22 18M32 34L18 28M32 44L42 40M32 44L22 40', shade(x.c, -25), 1.6));
  let s = TL(x, 'M32 60Q30 36 38 6', shade(x.c, -20), 2.4);
  const n = ri(x, 3, 5);
  for (let i = 0; i < n; i++) { const t = (i + 1) / (n + 1), px = 32 + t * 5, py = 60 - t * 50, side = i % 2 ? 1 : -1; s += E(x, px + side * 9, py, 10, 4.8, shade(x.c, rf(x, -6, 6)), side * -30, 2); }
  return s + E(x, 38, 6, 4.8, 7, x.c, 15, 2);
}
const sprout: Drawer = (x) => P(x, 'M8 56Q32 40 56 56Z', '#7a5230') + TL(x, 'M32 50Q32 36 32 28', shade(x.c, -15), 2.6) + P(x, 'M32 32Q18 32 14 20Q28 16 32 32Z', x.c, 2) + P(x, 'M32 28Q40 14 52 16Q50 30 32 28Z', shade(x.c, 8), 2);
function wheat(x: X) {
  let s = '';
  for (const [dx, rot] of [[-10, -16], [0, 0], [10, 16]] as const) {
    let g = TL(x, 'M32 60V22', '#c7a24a', 1.8);
    for (let i = 0; i < 5; i++) { const y = 10 + i * 6; g += E(x, 28.5, y, 3, 5, x.c, -25, 1.4) + E(x, 35.5, y, 3, 5, x.c, 25, 1.4); }
    g += E(x, 32, 6, 2.6, 4.6, x.c, 0, 1.4);
    s += G(`translate(${dx} 0) rotate(${rot} 32 60) scale(1 .95)`, g);
  }
  return s;
}
function flower(x: X) {
  if (x.v === 'lotus') return P(x, 'M6 46Q32 60 58 46Q32 52 6 46Z', '#2e8b57') + [[-40, 14], [40, 14], [-20, 6], [20, 6], [0, 0]].map(([r, d]) => G(`rotate(${r} 32 48)`, P(x, `M32 48Q${20} ${30 + d} 32 ${10 + d}Q${44} ${30 + d} 32 48Z`, shade(x.c, d / 2)))).join('');
  if (x.v === 'wilt') return TL(x, 'M32 60Q32 30 44 22', '#5d7a3a', 2.4) + G('rotate(120 44 22)', [0, 1, 2, 3, 4].map((i) => E(x, 44 + Math.cos(i * 1.256) * 7, 22 + Math.sin(i * 1.256) * 7, 6, 4, x.c, i * 72, 1.8)).join('') + C(x, 44, 22, 4, '#5a3a2a', 1.6)) + E(x, 26, 44, 7, 3, '#5d7a3a', 30, 1.8);
  const n = ri(x, 5, 8), r = rf(x, 11, 14);
  let s = TL(x, 'M32 34V62', '#3f8f3a', 2.6) + E(x, 40, 50, 7, 3.4, '#4caf50', -30, 1.8);
  for (let i = 0; i < n; i++) { const a = (i / n) * 360; s += G(`rotate(${n1(a)} 32 26)`, E(x, 32, 26 - r * 0.6, r * 0.42, r * 0.7, x.c, 0, 2)); }
  return s + C(x, 32, 26, r * 0.42, x.a === x.c ? GOLD : '#f5c542', 2);
}
const cactus: Drawer = (x) => P(x, 'M18 50H46L42 62H22Z', '#c0663a') + P(x, 'M25 50V14Q25 8 32 8Q39 8 39 14V50Z', x.c) + P(x, 'M25 34H16Q12 34 12 30V20Q12 16 16 16Q19 16 19 20V27H25Z', x.c, 2) + P(x, 'M39 28H46V18Q46 14 49 14Q53 14 53 18V30Q53 36 47 36H39Z', x.c, 2) + L('M32 14V46', shade(x.c, -15), 1.4);
function mushroom(x: X) {
  let s = P(x, 'M24 34H40L42 56Q32 60 22 56Z', '#f1e3c8') + P(x, 'M6 36Q6 8 32 8Q58 8 58 36Q32 42 6 36Z', x.c);
  const k = ri(x, 3, 5);
  for (let i = 0; i < k; i++) s += E(null, rf(x, 14, 50), rf(x, 16, 30), rf(x, 2.5, 4.5), rf(x, 2, 3.5), WHITE);
  return s + F('M12 30Q12 14 26 11Q16 18 16 32Z', '#fff', 0.3);
}
function fruit(x: X) {
  switch (x.v) {
    case 'cherry': return L('M24 40Q28 18 40 8M42 42Q40 22 40 8', '#5d7a3a', 2.4) + E(x, 46, 10, 7, 3.5, '#4caf50', -20, 1.8) + C(x, 22, 46, 11, x.c) + C(x, 42, 46, 11, x.c) + Co(18, 42, 3, '#fff', 0.5) + Co(38, 42, 3, '#fff', 0.5);
    case 'berry': { let s = P(x, 'M32 60Q10 40 14 24Q20 16 32 18Q44 16 50 24Q54 40 32 60Z', x.c); for (let i = 0; i < 9; i++) s += E(null, rf(x, 20, 44), rf(x, 26, 48), 1, 1.8, '#f5e08a'); return s + P(x, 'M20 20L32 12L44 20L38 24L32 18L26 24Z', '#4caf50', 2); }
    case 'melon': { let s = P(x, 'M6 24A26 26 0 0 0 58 24Z', '#3f8f3a') + F('M10 24A22 22 0 0 0 54 24Z', '#f1f8e0') + F('M13 24A19 19 0 0 0 51 24Z', x.c); for (let i = 0; i < 6; i++) s += E(null, 18 + i * 5.5, 30 + (i % 2) * 5, 1.2, 2, '#2a2430'); return G('translate(0 6)', s); }
    default: { const s = C(x, 32, 36, 21, x.c) + TL(x, 'M32 18Q32 10 36 6', WOOD, 2.4) + E(x, 42, 12, 8, 4, '#4caf50', -25, 1.8) + E(null, 23, 28, 5, 7, '#fff', 30).replace('/>', ' opacity="0.35"/>'); return s; }
  }
}
function veg(x: X) {
  switch (x.v) {
    case 'carrot': return G('rotate(35 32 32)', P(x, 'M24 18H40L33 62Q32 63 31 62Z', x.c) + L('M27 26H31M30 36H34M29 46H32', shade(x.c, -20), 1.6) + P(x, 'M32 18Q24 4 28 2Q32 10 32 18Q34 2 40 4Q38 12 32 18Z', '#4caf50', 2));
    case 'corn': { let s = P(x, 'M32 4Q46 12 44 36Q42 52 32 58Q22 52 20 36Q18 12 32 4Z', x.c); for (let i = 0; i < 6; i++) s += L(`M23 ${12 + i * 7}H41`, shade(x.c, -18), 1, 0.7); return s + L('M27 8V54M32 5V58M37 8V54', shade(x.c, -18), 1, 0.7) + P(x, 'M32 58Q14 50 12 24Q22 36 30 44Z', '#6ab04c', 2) + P(x, 'M32 58Q50 50 52 24Q42 36 34 44Z', '#58a53c', 2); }
    case 'onion': return P(x, 'M32 14Q54 30 50 46Q44 58 32 58Q20 58 14 46Q10 30 32 14Z', x.c) + L('M32 18Q22 34 26 56M32 18Q42 34 38 56', shade(x.c, -20), 1.4) + TL(x, 'M32 14Q30 6 26 2M32 14Q34 6 38 2', '#6ab04c', 2.4);
    case 'leafy': return blob(x, [[32, 36, 20], [22, 30, 12], [42, 30, 12], [32, 22, 12]], x.c, shade(x.c, 18)) + L('M32 56V26M32 40L22 30M32 40L42 30', shade(x.c, 30), 1.6);
    case 'potato': { let s = P(x, smooth(ringPts(x, 32, 34, 22, 7, 0.12, 0.7)), x.c); for (let i = 0; i < 4; i++) s += Co(rf(x, 20, 44), rf(x, 26, 42), 1.4, shade(x.c, -30)); return s; }
    default: return fruit(x);
  }
}
const nut: Drawer = (x) => P(x, 'M16 30Q16 56 32 60Q48 56 48 30Z', x.c) + P(x, 'M12 30Q12 14 32 14Q52 14 52 30Z', shade(x.c, -22)) + TL(x, 'M32 14V6', WOOD, 2.4) + F('M20 34Q22 48 28 54Q20 48 20 34Z', '#fff', 0.35);

// ---------- 水产与肉食 ----------
function fish(x: X) {
  if (x.v === 'whale') return P(x, 'M6 38Q10 20 32 22Q48 22 52 34L60 26L58 42Q48 52 28 52Q8 50 6 38Z', x.c) + F('M10 42Q28 50 48 44Q38 52 26 51Q12 50 10 42Z', shade(x.c, 35)) + Co(20, 34, 2, '#111') + L('M28 20Q26 12 22 10M28 20Q30 12 34 10', '#7fc7ff', 2.4);
  if (x.v === 'sushi') return R(x, 12, 34, 40, 18, WHITE, 8) + P(x, 'M10 34Q12 22 32 22Q52 22 54 34Q32 40 10 34Z', x.c) + L('M18 26L22 34M28 24L32 34M38 24L42 34', shade(x.c, 25), 2);
  const tropical = x.v === 'tropical';
  let s = P(x, 'M40 32L56 18L54 32L56 46Z', shade(x.c, -12)) + P(x, 'M6 32Q20 12 42 22Q48 26 48 32Q48 38 42 42Q20 52 6 32Z', x.c);
  s += F('M10 34Q22 46 42 40Q24 44 10 34Z', shade(x.c, 25), 0.8);
  const k = tropical ? 2 : ri(x, 0, 3);
  for (let i = 0; i < k; i++) { const sx = 20 + i * 7; s += tropical ? F(`M${sx} 19Q${sx + 4} 32 ${sx} 45L${sx + 4} 45Q${sx + 8} 32 ${sx + 4} 19Z`, WHITE, 0.85) : L(`M${sx} 24Q${sx + 3} 32 ${sx} 40`, shade(x.c, -20), 1.6); }
  s += P(x, 'M24 22Q30 12 36 20Z', shade(x.c, -10), 1.8) + C(x, 15, 29, 3, WHITE, 1.4) + Co(15.5, 29, 1.5, '#111');
  return s;
}
function shell(x: X) {
  if (x.v === 'crab') return sym((s) => L(`M${32 + s * 12} 40L${32 + s * 24} 48M${32 + s * 12} 44L${32 + s * 22} 56`, x.o, 2.6) + L(`M${32 + s * 12} 32Q${32 + s * 22} 28 ${32 + s * 20} 16`, x.o, 3) + P(x, `M${32 + s * 20} 16Q${32 + s * 30} 10 ${32 + s * 24} 4Q${32 + s * 22} 10 ${32 + s * 16} 8Q${32 + s * 14} 14 ${32 + s * 20} 16Z`, x.c, 2)) + E(x, 32, 38, 16, 11, x.c) + Co(27, 30, 2, '#111') + Co(37, 30, 2, '#111');
  let s = P(x, 'M32 54L8 30Q10 10 32 8Q54 10 56 30Z', x.c);
  for (let i = -2; i <= 2; i++) s += L(`M32 52L${32 + i * 10} 12`, shade(x.c, -20), 1.5);
  return s + P(x, 'M24 52H40L36 58H28Z', shade(x.c, -15), 2);
}
function octopus(x: X) {
  let s = '';
  const n = 5;
  for (let i = 0; i < n; i++) { const bx = 16 + i * 8, w = rf(x, -6, 6); s += TL(x, `M${bx} 36Q${bx + w} 50 ${bx - w} 60`, x.c, 5); }
  s += P(x, 'M12 38Q8 8 32 6Q56 8 52 38Q32 44 12 38Z', x.c) + C(x, 24, 28, 4, WHITE, 1.6) + C(x, 40, 28, 4, WHITE, 1.6) + Co(24, 29, 2, '#111') + Co(40, 29, 2, '#111') + F('M18 16Q24 8 32 9Q22 12 20 22Z', '#fff', 0.3);
  return s;
}
function meat(x: X) {
  if (x.v === 'steak') return P(x, smooth([[10, 26], [28, 12], [50, 14], [56, 32], [44, 50], [22, 52], [8, 40]]), x.c) + P(x, smooth([[16, 28], [28, 18], [46, 20], [50, 32], [40, 44], [24, 46], [14, 38]]), shade(x.c, 8), 0) + C(x, 30, 32, 5, WHITE, 1.6);
  if (x.v === 'bacon') return [0, 1].map((i) => G(`translate(0 ${i * 16 - 8})`, P(x, 'M6 30Q16 22 26 30T46 30T58 30V40Q48 32 38 40T18 40T6 40Z', x.c) + L('M8 35Q18 28 28 35T48 35', '#f6d3c0', 2.4))).join('');
  return G('rotate(-35 32 32)', TL(x, 'M32 38V54', '#f2e8d8', 5) + C(x, 28, 57, 4, '#f2e8d8') + C(x, 36, 57, 4, '#f2e8d8') + P(x, 'M18 30Q14 8 32 6Q50 8 46 30Q42 42 32 42Q22 42 18 30Z', x.c) + F('M22 16Q26 10 32 10Q24 14 23 24Z', '#fff', 0.35));
}
function bread(x: X) {
  switch (x.v) {
    case 'pie': return P(x, 'M6 36H58L52 52H12Z', shade(x.c, -15)) + P(x, 'M8 36Q32 18 56 36Z', x.c) + L('M18 32L22 28M30 28L34 24M42 30L46 27', shade(x.c, -25), 2);
    case 'pizza': { let s = P(x, 'M10 14Q32 4 54 14L32 60Z', '#e74c3c') + P(x, 'M14 18Q32 10 50 18L32 54Z', x.c, 0) + P(x, 'M10 14Q32 4 54 14L52 20Q32 10 12 20Z', '#d4a259', 2); for (let i = 0; i < 3; i++) s += C(x, rf(x, 26, 38), rf(x, 22, 40), 3.4, '#c0392b', 1.4); return s; }
    case 'cake': return P(x, 'M8 30L56 20V50L8 58Z', x.c) + F('M8 42L56 34V38L8 46Z', '#e57373') + P(x, 'M8 30L56 20L40 14L8 22Z', WHITE) + C(x, 30, 16, 4.5, '#c0392b', 1.6);
    default: { let s = P(x, 'M6 44Q4 22 32 18Q60 22 58 44Q58 52 50 52H14Q6 52 6 44Z', x.c); const n = ri(x, 3, 4); for (let i = 0; i < n; i++) s += L(`M${16 + i * (32 / n)} 26Q${22 + i * (32 / n)} 30 ${20 + i * (32 / n)} 38`, shade(x.c, -22), 2); return s + F('M12 36Q14 26 26 23Q18 28 16 38Z', '#fff', 0.3); }
  }
}
function bowl(x: X) {
  switch (x.v) {
    case 'plate': return E(x, 32, 38, 28, 15, WHITE) + E(null, 32, 37, 19, 9, '#e3e3e3') + C(x, 26, 34, 6, '#c0663a', 1.8) + E(x, 38, 36, 7, 4, '#58b947', 20, 1.8) + Co(33, 40, 3, '#e74c3c');
    case 'pan': return TL(x, 'M44 40L62 52', '#2a2430', 5) + E(x, 28, 36, 24, 14, x.c) + E(null, 28, 35, 18, 9, shade(x.c, 10)) + E(null, 26, 34, 10, 6, WHITE) + Co(27, 34, 4, '#f5c542');
    case 'can': return P(x, 'M14 14H50V54H14Z', METALish(x)) + R(x, 14, 22, 36, 24, x.c, 0) + E(x, 32, 14, 18, 5, '#d8dde2') + C(x, 32, 34, 6, WHITE, 1.4);
    case 'box': return R(x, 6, 18, 52, 36, x.c, 4) + R(x, 10, 22, 22, 28, WHITE, 2) + R(x, 34, 22, 20, 12, '#6ab04c', 2) + R(x, 34, 38, 20, 12, '#e67e22', 2);
    case 'pot': return E(x, 32, 28, 22, 6, x.c) + P(x, 'M10 28H54Q54 52 32 54Q10 52 10 28Z', '#6d4c41') + L('M10 34H4M54 34H60', x.o, 3) + TL(x, 'M36 26L50 6', '#bbb', 2);
    default: {
      const food = x.c;
      let s = '';
      for (let i = 0; i < 3; i++) s += L(`M${22 + i * 10} 22Q${18 + i * 10} 16 ${22 + i * 10} 10Q${26 + i * 10} 4 ${22 + i * 10} 0`, '#d0d0d0', 2, 0.8);
      s += E(x, 32, 32, 24, 7, food) + Co(24, 31, 3.2, shade(food, 20)) + Co(37, 33, 3, shade(food, -15)) + Co(30, 34, 2.4, shade(food, 30));
      s += P(x, 'M8 32H56Q54 54 32 56Q10 54 8 32Z', x.a) + F('M12 36Q16 48 26 52Q16 50 12 36Z', '#fff', 0.35);
      return s;
    }
  }
}
const METALish = (x: X) => shade(x.c, 30, -40);
function egg(x: X) {
  if (x.v === 'hatch') return C(x, 32, 22, 12, '#f9d71c') + Co(28, 20, 1.8, '#111') + Co(36, 20, 1.8, '#111') + P(x, 'M30 24L34 24L32 28Z', '#f39c12', 1.2) + P(x, 'M12 34L18 30L24 36L30 30L36 36L42 30L48 36L52 32Q54 58 32 60Q10 58 12 34Z', x.c);
  let s = P(x, 'M32 6Q52 20 52 40Q52 58 32 58Q12 58 12 40Q12 20 32 6Z', x.c);
  const k = ri(x, 0, 4);
  for (let i = 0; i < k; i++) s += E(null, rf(x, 22, 42), rf(x, 22, 50), rf(x, 2, 3.5), rf(x, 1.5, 3), shade(x.c, -25));
  return s + E(null, 23, 26, 4, 7, '#fff', 25).replace('/>', ' opacity="0.5"/>');
}
function feather(x: X) {
  let s = P(x, 'M48 6Q60 22 42 44L18 56Q22 30 48 6Z', x.c);
  for (let i = 1; i < 6; i++) { const t = i / 6, px = 18 + 30 * t, py = 56 - 50 * t; s += L(`M${n1(px)} ${n1(py)}L${n1(px + 9 - t * 4)} ${n1(py + 3)}`, shade(x.c, -20), 1.2); }
  return s + TL(x, 'M10 60L48 8', '#e8dcc0', 1.6);
}
const bone: Drawer = (x) => G('rotate(-40 32 32)', P(x, 'M18 28H46A6 6 0 1 1 50 34A6 6 0 1 1 46 40H18A6 6 0 1 1 14 34A6 6 0 1 1 18 28Z', x.c) + F('M18 30H46V32H18Z', '#fff', 0.5));
function skull(x: X) {
  let s = '';
  if (x.v === 'bones') s += G('rotate(40 32 44)', bone({ ...x }).replace(/rotate\(-40 32 32\)/, 'translate(0 12)')) + G('rotate(-40 32 44)', bone({ ...x }).replace(/rotate\(-40 32 32\)/, 'translate(0 12)'));
  s += P(x, 'M12 28Q12 6 32 6Q52 6 52 28Q52 38 45 42V52H19V42Q12 38 12 28Z', x.c);
  s += P(x, 'M18 26Q20 20 27 22Q29 30 23 33Q18 32 18 26Z', '#2a2430', 1.2) + P(x, 'M46 26Q44 20 37 22Q35 30 41 33Q46 32 46 26Z', '#2a2430', 1.2);
  if (x.r() < 0.4) s += Co(23, 27, 1.6, '#ff5252') + Co(41, 27, 1.6, '#ff5252');
  s += F('M32 34L35 40H29Z', '#2a2430') + L('M25 44V51M32 44V52M39 44V51', '#2a2430', 1.6) + F('M16 22Q18 10 30 9Q20 14 19 26Z', '#fff', 0.35);
  return s;
}
const tooth: Drawer = (x) => P(x, 'M14 18Q14 8 24 8Q28 8 32 11Q36 8 40 8Q50 8 50 18Q50 32 44 38L42 56Q40 60 37 56L34 42Q32 38 30 42L27 56Q24 60 22 56L20 38Q14 32 14 18Z', x.c) + F('M18 16Q20 11 25 11Q20 14 20 22Z', '#fff', 0.6);

// ---------- 符号与元素 ----------
const HEART = 'M32 56C10 42 5 28 9 19Q15 7 27 11Q31 13 32 18Q33 13 37 11Q49 7 55 19Q59 28 32 56Z';
const heart: Drawer = (x) => P(x, HEART, x.c) + F('M14 22Q16 14 24 14Q18 18 17 26Z', '#fff', 0.45) + (x.v === 'grow' ? L('M50 6L56 2M54 12L60 10', x.c, 2) : '');
function star_(x: X) {
  switch (x.v) {
    case 'sparkle': { let s = P(x, star(28, 34, 4, 22, 6), x.c) + F(star(28, 34, 4, 10, 3), '#fff', 0.6); s += P(x, star(rf(x, 48, 52), rf(x, 10, 16), 4, 9, 2.6), x.c, 1.8); s += P(x, star(rf(x, 48, 54), rf(x, 46, 52), 4, 6, 2), x.c, 1.6); return s; }
    case 'shooting': return L('M6 58L30 34M14 60L32 42M4 48L26 30', x.c, 2.4, 0.7) + P(x, star(40, 24, 5, 16, 7, -70), x.c) + F(star(40, 24, 5, 7, 3, -70), '#fff', 0.5);
    case 'comet': return P(x, 'M44 20Q30 30 4 60Q20 34 30 24Q30 14 44 20Z', shade(x.c, 15), 2) + C(x, 44, 20, 11, x.c) + Co(41, 17, 4, '#fff', 0.6);
    case 'burst': return P(x, star(32, 32, 10, 26, 13, rf(x, 0, 30)), x.c) + P(x, star(32, 32, 8, 13, 7), '#ffd36b', 1.4);
    default: return P(x, star(32, 34, 5, 27, 11.5), x.c) + F(star(32, 34, 5, 12, 5), '#fff', 0.35);
  }
}
function flame(x: X) {
  const j = () => rf(x, -3, 3);
  const outer = `M32 4Q${44 + j()} 20 46 30Q${50 + j()} 22 48 15Q60 30 56 44Q52 60 32 60Q12 60 8 44Q6 30 ${18 + j()} 19Q18 30 24 32Q${20 + j()} 16 32 4Z`;
  return P(x, outer, x.c) + F(`M32 26Q${40 + j()} 36 42 44Q44 56 32 56Q20 56 22 44Q24 38 28 40Q26 32 32 26Z`, '#ffd34d') + F('M32 42Q36 48 35 52Q32 55 29 52Q28 48 32 42Z', '#fff7d0');
}
function drop(x: X) {
  const D = 'M32 6Q50 30 50 40A18 18 0 0 1 14 40Q14 30 32 6Z';
  if (x.v === 'splash') return G('translate(-8 6) scale(.7)', P(x, D, x.c)) + G('translate(24 -2) scale(.5)', P(x, D, x.c, 3.6)) + G('translate(26 30) scale(.45)', P(x, D, x.c, 4));
  return P(x, D, x.c) + F('M22 38Q22 30 28 24Q26 32 26 40Z', '#fff', 0.55);
}
function snow(x: X) {
  let s = '';
  for (let i = 0; i < 6; i++) s += G(`rotate(${i * 60} 32 32)`, L('M32 32V6M32 14L26 9M32 14L38 9M32 23L25 18M32 23L39 18', x.o, 4 + SW));
  for (let i = 0; i < 6; i++) s += G(`rotate(${i * 60} 32 32)`, L('M32 32V6M32 14L26 9M32 14L38 9M32 23L25 18M32 23L39 18', x.c, 3.2));
  return s + C(x, 32, 32, 4, WHITE, 1.6);
}
const bolt: Drawer = (x) => P(x, 'M38 3L12 36H29L22 61L52 24H35Z', x.c) + F('M36 8L18 33H24Z', '#fff', 0.5);
function cloud(x: X) {
  const base = (col: string) => blob(x, [[20, 38, 11], [32, 30, 14], [45, 38, 10], [32, 42, 10]], col, '#ffffff');
  switch (x.v) {
    case 'fog': return [0, 1, 2, 3].map((i) => L(`M${8 + (i % 2) * 6} ${16 + i * 11}Q20 ${12 + i * 11} 32 ${16 + i * 11}T${56 - (i % 2) * 6} ${16 + i * 11}`, x.c, 4.5)).join('');
    case 'wind': return TL(x, 'M6 24H40A7 7 0 1 0 33 17', x.c, 3.4) + TL(x, 'M6 36H50A7 7 0 1 1 43 43', x.c, 3.4) + TL(x, 'M10 48H28', x.c, 3.4);
    case 'storm': return base(x.c) + P(x, 'M34 44L24 58H32L28 64L42 50H34L38 44Z', '#f9d71c', 1.8);
    case 'tornado': return [0, 1, 2, 3, 4].map((i) => E(x, 32 + (i % 2 ? 3 : -3) + i, 12 + i * 10, 24 - i * 4, 4.5, shade(x.c, -i * 4), 0, 2)).join('');
    case 'steam': return P(x, 'M6 50Q32 62 58 50V56Q32 64 6 56Z', '#c0663a') + [16, 32, 48].map((cx) => L(`M${cx} 46Q${cx - 6} 38 ${cx} 30Q${cx + 6} 22 ${cx} 12`, x.c, 4)).join('');
    default: return base(x.c);
  }
}
function sun(x: X) {
  const n = ri(x, 8, 12);
  let s = '';
  for (let i = 0; i < n; i++) s += G(`rotate(${n1((i * 360) / n)} 32 32)`, P(x, 'M29 12L32 2L35 12Z', '#f39c12', 1.6));
  return s + C(x, 32, 32, 15, x.c) + Co(27, 27, 5, '#fff', 0.4);
}
function moon(x: X) {
  if (x.v === 'new') return C(x, 32, 32, 22, x.c) + Co(32, 32, 22, '#000', 0.2) + `<path d="M18 18A20 20 0 0 1 46 16" fill="none" stroke="#c9c6ff" stroke-width="2" opacity=".6"/>` + Co(24, 38, 3, shade(x.c, -10)) + Co(38, 26, 2.4, shade(x.c, -10));
  return P(x, 'M40 6A26 26 0 1 0 58 44A21 21 0 1 1 40 6Z', x.c) + Co(22, 40, 3, shade(x.c, -15)) + Co(28, 24, 2, shade(x.c, -15)) + twinkle(52, 14, 4);
}
function swirl(x: X) {
  let d = '';
  const turns = rf(x, 2.2, 2.8), off = x.r() * 6;
  for (let i = 0; i <= 60; i++) { const t = i / 60, a = off + t * turns * Math.PI * 2, r = 3 + t * 22; d += `${i ? 'L' : 'M'}${n1(32 + Math.cos(a) * r)} ${n1(32 + Math.sin(a) * r)}`; }
  return Co(32, 32, 26, x.c, 0.18) + L(d, x.o, 5 + SW * 2) + L(d, x.c, 5) + L(d, '#fff', 1.4, 0.4);
}
function void_(x: X) {
  if (x.v === 'globe') return C(x, 32, 32, 24, x.c) + L('M8 32H56M32 8V56M14 18Q32 26 50 18M14 46Q32 38 50 46', WHITE, 1.6, 0.8) + E(null, 32, 32, 11, 24, 'none').replace('fill="none"', `fill="none" stroke="${WHITE}" stroke-width="1.6" opacity=".8"`);
  if (x.v === 'galaxy') {
    let s = Co(32, 32, 28, '#1b1440');
    for (let arm = 0; arm < 2; arm++) for (let i = 0; i < 18; i++) { const t = i / 18, a = arm * Math.PI + t * 4, r = 3 + t * 24; s += Co(32 + Math.cos(a) * r, 32 + Math.sin(a) * r * 0.7, 2.6 - t * 1.6, i % 3 ? x.c : '#fff', 0.85); }
    return s + Co(32, 32, 5, '#fff6d0') + twinkle(12, 12, 3) + twinkle(52, 50, 3);
  }
  return E(x, 32, 36, 26, 13, shade(x.c, 20)) + E(null, 32, 37, 20, 9, '#07050c') + E(null, 32, 35, 26, 13, 'none').replace('fill="none"', `fill="none" stroke="#b07cff" stroke-width="1.4" opacity=".7"`);
}
const wave: Drawer = (x) => P(x, 'M4 56Q4 30 22 18Q40 8 52 18Q58 24 52 32Q48 22 38 26Q30 30 36 38Q26 40 24 52Q30 50 36 56Z', x.c) + P(x, 'M4 56H60V60H4Z', shade(x.c, -15), 2) + L('M14 44Q18 30 30 24', '#fff', 2, 0.6);
const rainbow: Drawer = (x) => ['#e74c3c', '#f39c12', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6'].map((c, i) => L(`M${6 + i * 3.2} 48A${26 - i * 3.2} ${26 - i * 3.2} 0 0 1 ${58 - i * 3.2} 48`, c, 3.4)).join('') + blob(x, [[8, 50, 6], [15, 52, 5]], WHITE) + blob(x, [[50, 52, 5], [57, 50, 6]], WHITE);

// ---------- 地形 ----------
function mountain(x: X) {
  if (x.v === 'volcano') return L('M30 12Q24 4 30 0M36 12Q42 6 38 0', '#999', 3, 0.7) + P(x, 'M2 58L22 16H42L62 58Z', x.c) + P(x, 'M22 16H42L38 22H26Z', '#ff6b1a', 2) + F('M30 22L26 36L30 34L28 46L34 30L31 32L34 22Z', '#ff8c1a');
  const snowy = x.v === 'snow';
  return P(x, 'M2 58L22 18L32 32L42 22L62 58Z', shade(x.c, -8)) + F('M22 18L28 30L22 58H2Z', '#fff', 0.12)
    + P(x, snowy ? 'M22 18L14 34L19 31L23 36L27 30L30 31Z' : 'M22 18L17 28L21 26L24 30L27 25Z', WHITE, 1.6) + P(x, snowy ? 'M42 22L36 33L40 31L44 35L48 31L50 33Z' : 'M42 22L38 29L42 28L46 30Z', WHITE, 1.6);
}
function land(x: X) {
  switch (x.v) {
    case 'island': return E(x, 32, 52, 28, 8, '#3498db') + P(x, 'M12 52Q32 36 52 52Z', x.c) + TL(x, 'M32 46Q30 30 38 18', WOOD, 3) + P(x, 'M38 18Q26 10 18 18Q28 14 38 18Q50 8 56 18Q46 14 38 18Q46 24 48 32Q40 22 38 18Q30 24 28 32Q32 22 38 18Z', '#2e9d4a', 2);
    case 'beach': return P(x, 'M2 44Q32 36 62 44V62H2Z', x.c) + P(x, 'M2 56Q32 48 62 56V62H2Z', '#3498db', 2) + TL(x, 'M30 44L36 18', '#eee', 2) + P(x, 'M18 22Q34 4 52 18Q36 14 18 22Z', '#e74c3c', 2);
    case 'park': return P(x, 'M2 40H62V62H2Z', x.c) + E(x, 40, 50, 16, 6, '#3498db') + blob(x, [[16, 26, 9], [22, 20, 8], [12, 20, 7]], '#2e8b57') + TL(x, 'M17 34V42', WOOD, 3);
    case 'desert': return C(x, 46, 16, 8, '#f9c74f') + P(x, 'M2 44Q20 30 38 44Q50 36 62 42V62H2Z', x.c) + P(x, 'M2 54Q24 44 44 54Q54 50 62 54V62H2Z', shade(x.c, -10), 2);
    default: return mountain(x);
  }
}
function web(x: X) {
  let s = '';
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; s += L(`M32 32L${n1(32 + Math.cos(a) * 28)} ${n1(32 + Math.sin(a) * 28)}`, x.c, 1.6); }
  for (let r = 8; r <= 26; r += 6) { let d = ''; for (let i = 0; i <= 8; i++) { const a = (i / 8) * Math.PI * 2; d += `${i ? 'Q' + n1(32 + Math.cos(a - 0.39) * r * 0.8) + ' ' + n1(32 + Math.sin(a - 0.39) * r * 0.8) + ' ' : 'M'}${n1(32 + Math.cos(a) * r)} ${n1(32 + Math.sin(a) * r)}`; } s += L(d, x.c, 1.4); }
  return s;
}
function rope(x: X) {
  if (x.v === 'line') return TL(x, 'M8 18V58M56 18V58', WOOD, 4) + TL(x, 'M8 22Q32 34 56 22', x.c, 2.6) + C(x, 32, 14, 5, '#f5cba7', 1.8) + TL(x, 'M32 19V29M24 22H40', '#e67e22', 2.2);
  if (x.v === 'spool') return P(x, 'M14 8H50V14H14ZM14 50H50V56H14Z', WOOD) + P(x, 'M20 14H44V50H20Z', x.c) + L('M20 20L44 24M20 28L44 32M20 36L44 40M20 44L44 48', shade(x.c, -20), 1.4) + L('M44 40Q56 44 58 58', x.c, 2);
  return `<circle cx="32" cy="32" r="18" fill="none" stroke="${x.o}" stroke-width="${7 + SW * 2}"/><circle cx="32" cy="32" r="18" fill="none" stroke="${x.c}" stroke-width="7"/>` + TL(x, 'M20 46L8 60M44 46L56 60', x.c, 5) + `<circle cx="32" cy="32" r="18" fill="none" stroke="${shade(x.c, -25)}" stroke-width="1.4" stroke-dasharray="3 4"/>`;
}

export const NATURE_DRAWERS: Record<string, Drawer> = {
  tree, leaf, sprout, wheat, flower, cactus, mushroom, fruit, veg, nut, fish, shell, octopus, meat, bread, bowl, egg, feather, bone, skull, tooth,
  heart, star: star_, flame, drop, snow, bolt, cloud, sun, moon, swirl, void: void_, wave, rainbow, mountain, land, web, rope,
};
