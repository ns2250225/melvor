// 装备、工具、容器、材料类图标绘制器
import { type Drawer, type X, P, F, L, TL, C, Co, E, R, G, blob, star, smooth, poly, ringPts, segment, twinkle, sym, ri, rf, pick, n1, shade, mix, WOOD, METAL, GOLD, PAPER, WHITE, SW } from './prim';

// ---------- 武器 ----------
function sword(x: X, top = 4, guard = 15) {
  const blade = x.c, tip = top;
  return P(x, `M32 ${tip}L37 ${tip + 7}L37 42L27 42L27 ${tip + 7}Z`, blade)
    + F(`M32 ${tip + 3}L32 41L28.6 41L28.6 ${tip + 8}Z`, '#fff', 0.4)
    + P(x, `M${32 - guard} 41h${guard * 2}v5h-${guard * 2}Z`, x.a)
    + P(x, 'M29.5 46h5v10h-5Z', shade(WOOD, -8))
    + C(x, 32, 58.5, 3.6, x.a);
}
function blade(x: X) {
  switch (x.v) {
    case 'dagger': return G('rotate(45 32 32) translate(0 -4)', sword(x, 16, 11));
    case 'cross': return G('rotate(40 32 32) scale(.92) translate(2.8 2.8)', sword(x)) + G('rotate(-40 32 32) scale(.92) translate(2.8 2.8)', sword(x));
    case 'knife': return G('rotate(40 32 32)', P(x, 'M28 6Q39 12 37 40L28 40Z', x.c) + F('M29.5 9Q35 14 34.5 38L29.5 38Z', '#fff', 0.35) + P(x, 'M27 40h11v18q-5.5 4 -11 0Z', WOOD) + Co(32.5, 45, 1.4, x.o) + Co(32.5, 52, 1.4, x.o));
    case 'fork': return G('rotate(-35 32 32)', TL(x, 'M32 30V60', METAL, 4) + P(x, 'M24 6v14q0 10 8 10q8 0 8 -10v-14h-3v14h-3.5v-14h-3v14h-3.5v-14Z', METAL))
      + G('rotate(35 32 32)', P(x, 'M29 4q8 6 7 26h-7Z', METAL) + TL(x, 'M32.5 30V60', WOOD, 4));
    default: {
      const curved = x.r() < 0.3;
      if (curved) return G('rotate(40 32 32)', P(x, 'M27 42Q24 22 34 4Q40 22 37 42Z', x.c) + F('M29 40Q27 24 33 9Q31 26 32 40Z', '#fff', 0.35) + P(x, 'M18 41h28v5h-28Z', x.a) + P(x, 'M29.5 46h5v10h-5Z', WOOD) + C(x, 32, 58.5, 3.6, x.a));
      return G('rotate(45 32 32)', sword(x, 4, ri(x, 12, 16)));
    }
  }
}
function axe(x: X) {
  const double = x.r() < 0.25;
  return G('rotate(28 32 32)', P(x, 'M29.5 8h5v52h-5Z', WOOD)
    + P(x, 'M34 10Q54 6 57 30Q46 25 34 28Z', x.c) + L('M38 11Q52 10 54.5 26', '#fff', 1.6, 0.5)
    + (double ? P(x, 'M30 10Q10 6 7 30Q18 25 30 28Z', x.c) : P(x, 'M30 13L23 15L23 24L30 26Z', x.c))
    + P(x, 'M28 9h8v20h-8Z', shade(x.c, -15)));
}
function pickInner(x: X) {
  return (P(x, 'M29.5 16h5v44h-5Z', WOOD)
    + P(x, 'M5 27Q32 -2 59 27L55 29Q32 11 9 29Z', x.c) + L('M10 24Q32 4 54 24', '#fff', 1.4, 0.45)
    + P(x, 'M27 12h10v9h-10Z', shade(x.c, -20)));
}
const pick_ = (x: X) => G('rotate(32 32 32)', pickInner(x));
function hammerOne(x: X) {
  return P(x, 'M29.5 20h5v40h-5Z', WOOD) + R(x, 13, 8, 38, 14, x.c, 3) + F('M15 10h34v4h-34Z', '#fff', 0.35) + R(x, 27, 6, 10, 18, shade(x.c, -18), 2);
}
function hammer(x: X) {
  if (x.v === 'cross') return G('rotate(-38 32 32) scale(.86) translate(5 5)', hammerOne(x)) + G('rotate(38 32 32) scale(.86) translate(5 5)', pickInner(x));
  return G('rotate(30 32 32)', hammerOne(x));
}
function saw(x: X) {
  let d = 'M6 22L46 18L46 38';
  for (let i = 8; i >= 0; i--) d += `L${n1(10.4 + i * 4)} 43L${n1(8.4 + i * 4)} 38`;
  return G('rotate(-15 32 32)', P(x, d + 'L6 38Z', x.c) + F('M8 24L44 20.5V24L8 27Z', '#fff', 0.35) + P(x, 'M44 14h14v28h-14Z', WOOD) + R(null, 48, 20, 6, 14, x.o, 3));
}
function shovel(x: X) {
  return G('rotate(30 32 32)', TL(x, 'M32 8V42', WOOD, 4.5) + P(x, 'M25 4h14v7h-14Z', WOOD) + P(x, 'M21 40h22v8Q32 64 21 48Z', x.c) + F('M24 42h4v6q2 6 4 9q-6 -3 -8 -9Z', '#fff', 0.35));
}
function broom(x: X) {
  return G('rotate(30 32 32)', TL(x, 'M32 4V36', WOOD, 4) + P(x, 'M26 34h12l8 24h-28Z', x.c) + R(x, 25, 33, 14, 5, shade(x.c, -25), 1) + L('M28 40L25 56M32 40V57M36 40L39 56', shade(x.c, -25), 1.4));
}
function bow(x: X) {
  return G('rotate(-35 32 32)', TL(x, 'M22 5Q54 32 22 59', x.c, 4.5) + L('M22 5L22 59', '#efe8d8', 1.3)
    + P(x, 'M35 27h6v10h-6Z', x.a) + TL(x, 'M12 32H48', '#d9c08a', 2.4)
    + P(x, 'M47 27.5L58 32L47 36.5Z', METAL) + P(x, 'M12 32L6 27h6l5 5Z', x.a, 1.6) + P(x, 'M12 32L6 37h6l5 -5Z', x.a, 1.6));
}
function arrow1(x: X, head = true, len = 1, fl = true) {
  const h = head ? P(x, 'M46 10L58 6L54 18Z', x.c) : '';
  const f = fl ? P(x, 'M14 50L6 46L10 42L18 46Z', x.a, 1.8) + P(x, 'M14 50L18 58L22 54L18 46Z', x.a, 1.8) : '';
  return G(`translate(32 32) scale(${len}) translate(-32 -32)`, TL(x, 'M12 52L50 14', '#d9b77a', 2.6) + h + f);
}
function arrow(x: X) {
  switch (x.v) {
    case 'bolt': return G('translate(4 4) scale(.85)', TL(x, 'M14 50L48 16', '#b58a52', 4) + P(x, 'M44 12L58 6L52 20Z', x.c) + P(x, 'M14 50L8 48L14 42L20 44Z', shade(x.c, -15), 1.8));
    case 'shafts': return G('translate(-6 4)', TL(x, 'M12 52L50 14', '#d9b77a', 3)) + G('translate(6 -2)', TL(x, 'M12 52L50 14', '#c9a46a', 3));
    case 'headless': return arrow1(x, false);
    default: return arrow1(x) + (x.r() < 0.5 ? '' : '');
  }
}
function target(x: X) {
  return C(x, 30, 34, 24, '#e74c3c') + Co(30, 34, 17, WHITE) + Co(30, 34, 10, '#e74c3c') + Co(30, 34, 4, WHITE)
    + TL(x, 'M31 33L56 8', '#d9b77a', 2.4) + P(x, 'M50 6L58 4L56 12Z', x.a, 1.8);
}
function staff(x: X) {
  if (x.v === 'trident') {
    return TL(x, 'M32 22V62', WOOD, 4) + P(x, 'M17 6L20 12L20 22Q20 30 32 30Q44 30 44 22L44 12L47 6L50 22Q50 36 35 36L29 36Q14 36 14 22Z', x.c)
      + P(x, 'M32 2L36 10L34 30H30L28 10Z', x.c) + F('M31 6L31 28L30 28L29.5 10Z', '#fff', 0.4);
  }
  if (x.v === 'staff') {
    return TL(x, 'M24 60L40 14', WOOD, 4.5) + P(x, 'M40 14Q30 4 40 2Q52 2 50 14Q48 22 40 18', 'none') + C(x, 42, 12, 7, x.c) + Co(40, 10, 2.4, '#fff', 0.7) + twinkle(52, 24, 4);
  }
  let s = TL(x, 'M12 56L42 24', shade(WOOD, -20), 4) + R(null, 0, 0, 0, 0, 'none');
  s += P(x, star(46, 19, 5, 11, 4.8, -60), x.c) + F(star(46, 19, 5, 5, 2.2, -60), '#fff', 0.55);
  for (let i = 0; i < 3; i++) s += twinkle(rf(x, 20, 58), rf(x, 4, 40), rf(x, 2.5, 4.5));
  return s;
}
function shield(x: X) {
  const SH = 'M32 5L54 11Q55 38 32 59Q9 38 10 11Z';
  let s = P(x, SH, x.c) + G('translate(7.2 7.4) scale(.775)', L(SH, shade(x.c, -22), 3));
  const em = pick(x, ['cross', 'chevron', 'boss', 'diag', 'star']);
  if (em === 'cross') s += F('M28 12h8v40h-8Z', x.a) + F('M15 24h34v8h-34Z', x.a);
  else if (em === 'chevron') s += P(x, 'M17 28L32 18L47 28V36L32 26L17 36Z', x.a, 1.6);
  else if (em === 'boss') s += C(x, 32, 30, 8, x.a) + Co(30, 28, 3, '#fff', 0.5);
  else if (em === 'diag') s += F('M14 16L20 13L50 42L44 48Z', x.a);
  else s += P(x, star(32, 30, 5, 11, 4.5), x.a, 1.6);
  return s + F('M32 9L14 14Q14 36 32 54Z', '#fff', 0.14);
}
function helm(x: X) {
  if (x.v === 'safety') return P(x, 'M10 42Q10 12 32 12Q54 12 54 42Z', x.c) + P(x, 'M6 42H58V48H6Z', shade(x.c, -15)) + F('M29 18h6v8h8v6h-8v8h-6v-8h-8v-6h8Z', WHITE) + F('M16 36Q16 20 28 16Q20 22 20 36Z', '#fff', 0.35);
  let s = '';
  if (x.r() < 0.5) s += P(x, 'M30 12Q34 -2 50 4Q40 6 38 14Z', x.a);
  s += P(x, 'M12 44Q12 10 32 10Q52 10 52 44L52 52L12 52Z', x.c);
  s += x.r() < 0.5 ? F('M17 30h30v6h-30Z', x.o) + F('M29.5 30h5v16h-5Z', x.o) : F('M17 32h12v5h-12ZM35 32h12v5h-12Z', x.o);
  s += P(x, 'M10 50H54V56H10Z', shade(x.c, -18)) + F('M17 28Q17 14 28 12Q21 18 21 28Z', '#fff', 0.35);
  return s;
}
function armor(x: X) {
  const v = x.v;
  if (v === 'shirt' || v === 'vest') {
    let s = P(x, 'M20 8L12 12L4 26L13 31L16 26V58H48V26L51 31L60 26L52 12L44 8Q38 14 32 14Q26 14 20 8Z', x.c);
    s += L('M24 9Q32 18 40 9', shade(x.c, -25), 2);
    if (v === 'vest') s += F('M16 40h32v4h-32Z', '#f4f4f4', 0.8);
    else if (x.r() < 0.5) s += F('M16 32h32v5h-32Z', shade(x.c, 20));
    return s;
  }
  if (v === 'robe') return P(x, 'M20 6L8 16L4 34L14 36L18 24V60H46V24L50 36L60 34L56 16L44 6Q32 18 20 6Z', x.c) + P(x, 'M20 6L36 30L44 6', 'none', 2) + P(x, 'M17 34h30v6h-30Z', x.a) + L('M32 40V60', shade(x.c, -20), 1.6);
  if (v === 'coat') return P(x, 'M20 6L8 14L6 50L16 50L18 26V60H46V26L48 50L58 50L56 14L44 6L32 20Z', x.c) + P(x, 'M20 6L26 26L32 20L38 26L44 6', shade(x.c, 12), 2) + Co(32, 34, 1.8, x.o) + Co(32, 42, 1.8, x.o) + Co(32, 50, 1.8, x.o);
  return P(x, 'M14 14Q22 8 26 11Q32 17 38 11Q42 8 50 14L57 26L48 31L48 56L16 56L16 31L7 26Z', x.c)
    + L('M32 18V54', shade(x.c, -25), 2) + P(x, 'M16 42H48V48H16Z', x.a, 2) + F('M18 18Q24 14 26 16Q24 26 20 32Z', '#fff', 0.3)
    + F('M13 15L7 26L12 28L18 18Z', shade(x.c, -15));
}
const legs: Drawer = (x) => P(x, 'M16 8H48L50 58H37L32 22L27 58H14Z', x.c) + P(x, 'M16 8H48V15H16Z', shade(x.c, -22), 2) + L('M24 16V30', shade(x.c, 18), 1.6) + F('M18 16H22L19 56H16Z', '#fff', 0.2);
function boots(x: X) {
  const one = (t: string) => G(t, P(x, `M20 ${x.v === 'tall' ? 4 : 12}H36V38Q48 40 54 48V54H20Z`, x.c) + P(x, 'M18 52H56V58H18Z', shade(x.c, -30)) + P(x, `M19 ${x.v === 'tall' ? 4 : 12}H37V${x.v === 'tall' ? 10 : 18}H19Z`, shade(x.c, 14), 2));
  return one('translate(-6 0) scale(.9)') + one('translate(10 6) scale(.9)');
}
const gloves: Drawer = (x) => P(x, 'M18 30Q16 14 22 13L25 27L26 8Q30 5 32.5 8L33 25L36 9Q40 6 42.5 10L41.5 27L45.5 16Q50 14 50 19L47 37Q46 46 38 48L24 48Q18 44 18 30Z', x.c)
  + P(x, 'M22 46H41V59H22Z', shade(x.c, -22)) + F('M21 30Q20 18 22.5 16L24 30Z', '#fff', 0.35);
function cape(x: X) {
  let s = P(x, 'M12 12Q32 22 52 12L54 22Q32 32 10 22Z', x.c) + P(x, 'M36 24L46 54L36 57L30 27Z', shade(x.c, -8));
  if (x.r() < 0.6) s += F('M19 17L22 25L26 26L23 18ZM40 18L42 27L46 25L44 17Z', shade(x.c, 25));
  s += L('M37 56V61M40.5 55V60M44 54V59', shade(x.c, -20), 1.6);
  return s;
}
function amulet(x: X) {
  let s = '';
  if (x.v === 'beads') {
    for (let i = 0; i <= 14; i++) { const t = i / 14, px = 14 + 36 * t, py = 8 + 4 * 34 * t * (1 - t); s += C(x, px, py, 2.8, i % 4 === 0 ? x.a : x.c, 1.4); }
    return s + P(x, 'M32 42L38 52L32 60L26 52Z', x.a);
  }
  s += L('M14 6Q32 50 50 6', '#c9a35a', 2.2) + L('M14 6Q32 50 50 6', x.o, 0.8, 0.5);
  if (x.v === 'eye') return s + C(x, 32, 46, 12, '#2e86c1') + Co(32, 46, 8, WHITE) + Co(32, 46, 5, '#5dade2') + Co(32, 46, 2.6, '#111') + Co(29, 43, 1.6, '#fff');
  s += P(x, 'M32 30L44 44L32 60L20 44Z', GOLD) + P(x, 'M32 35L39 44L32 54L25 44Z', x.c, 1.6) + F('M32 36L28 44H32Z', '#fff', 0.5);
  return s;
}
const ring: Drawer = (x) => `<ellipse cx="32" cy="42" rx="17" ry="13" fill="none" stroke="${x.o}" stroke-width="${7 + SW * 2}"/><ellipse cx="32" cy="42" rx="17" ry="13" fill="none" stroke="${x.c}" stroke-width="7"/>`
  + L('M18 38Q22 31 30 30', '#fff', 1.8, 0.6) + P(x, 'M32 14L41 22L32 32L23 22Z', x.a) + F('M32 16L27 22H32Z', '#fff', 0.55);
function crown(x: X) {
  const n = x.v === 'king' ? 3 : pick(x, [3, 5]);
  let d = 'M10 46L10 18';
  for (let i = 0; i < n; i++) { const w = 44 / n; d += `L${n1(10 + w * (i + 0.5))} ${i % 2 && n === 5 ? 22 : 10}`.replace(/(\d)$/, '$1') + `L${n1(10 + w * (i + 1))} ${i === n - 1 ? 18 : 28}`; }
  d += 'L54 46Z';
  let s = P(x, d, x.c) + P(x, 'M10 44H54V54H10Z', shade(x.c, -15));
  for (let i = 0; i < 3; i++) s += C(x, 20 + i * 12, 49, 2.8, i === 1 ? '#e74c3c' : '#3498db', 1.4);
  return s + F('M13 22L13 42L17 42Z', '#fff', 0.35);
}
function hat(x: X) {
  switch (x.v) {
    case 'top': return E(x, 32, 50, 26, 6, x.c) + P(x, 'M18 50V14Q32 10 46 14V50Q32 54 18 50Z', x.c) + F('M18 40Q32 44 46 40V46Q32 50 18 46Z', x.a) + F('M21 16V38H24V16Z', '#fff', 0.2);
    case 'straw': return E(x, 32, 44, 28, 10, x.c) + P(x, 'M16 42Q16 18 32 18Q48 18 48 42Q32 48 16 42Z', x.c) + F('M16 36Q32 42 48 36V41Q32 47 16 41Z', x.a) + L('M10 44Q32 52 54 44', shade(x.c, -20), 1.2);
    case 'scholar': return P(x, 'M32 12L60 24L32 36L4 24Z', x.c) + P(x, 'M18 30V42Q32 50 46 42V30L32 36Z', shade(x.c, -10)) + L('M32 24L52 28V44', x.a, 1.8) + C(x, 52, 46, 2.6, x.a, 1.4);
    default: { let s = P(x, 'M6 52Q32 62 58 52Q52 44 42 44L34 6Q30 2 28 8L22 44Q12 44 6 52Z', x.c) + F('M22 40Q32 44 42 40L43 45Q32 50 21 45Z', x.a);
      for (let i = 0; i < 3; i++) s += twinkle(rf(x, 26, 36), rf(x, 16, 36), 3); return s; }
  }
}
function bag(x: X) {
  if (x.v === 'pack') return P(x, 'M14 18Q14 10 22 10H42Q50 10 50 18V56H14Z', x.c) + P(x, 'M14 18Q14 10 22 10H42Q50 10 50 18V28Q32 34 14 28Z', shade(x.c, 12)) + R(x, 22, 38, 20, 14, shade(x.c, -12), 3) + L('M26 10V4H38V10', x.o, 2.4);
  if (x.v === 'purse') return P(x, 'M8 30Q8 22 16 22H48Q56 22 56 30L52 54H12Z', x.c) + L('M20 22Q32 4 44 22', x.o, 2.6) + C(x, 32, 30, 3.2, GOLD, 1.6);
  let s = P(x, 'M22 20Q6 34 12 50Q18 60 32 60Q46 60 52 50Q58 34 42 20Z', x.c) + P(x, 'M24 12L40 12L44 21L20 21Z', shade(x.c, -10)) + L('M20 21Q32 26 44 21', x.o, 2.2);
  if (x.v === 'gold') s += C(x, 32, 42, 9, GOLD, 1.8) + L('M32 36V48M29 39.5Q32 37 35 39.5Q29 42 35 45Q32 47.5 29 45', x.o, 1.4);
  return s + F('M20 32Q16 42 20 52Q14 42 20 32Z', '#fff', 0.3);
}
function quiver(x: X) {
  let s = '';
  for (let i = 0; i < 3; i++) { const dx = 23 + i * 6; s += TL(x, `M${dx} 30L${dx - 2} 6`, '#d9b77a', 1.6) + P(x, `M${dx - 2} 6l-3 -3v7l3 3l3 -3v-7Z`, x.a, 1.4); }
  return G('rotate(-18 32 32)', s + P(x, 'M19 18H45V58Q32 62 19 58Z', x.c) + P(x, 'M18 16H46V22H18Z', shade(x.c, -20)) + F('M22 24H26V56H22Z', '#fff', 0.25) + L('M44 26L50 44', x.o, 2));
}

// ---------- 容器与液体 ----------
function potion(x: X) {
  const liq = x.c, glass = '#e4eef3';
  if (x.v === 'tube') {
    let s = P(x, 'M25 4H39V8H37V48A5 5 0 0 1 27 48V8H25Z', glass) + F('M28.2 26H35.8V48A3.8 3.8 0 0 1 28.2 48Z', liq) + F('M29 10H31V44H29Z', '#fff', 0.6);
    for (let i = 0; i < 3; i++) s += Co(rf(x, 30, 34), rf(x, 30, 46), rf(x, 0.8, 1.6), '#fff', 0.7);
    return G('rotate(22 32 32)', s);
  }
  if (x.v === 'flask') return P(x, 'M26 6H38V20L52 54Q52 58 48 58H16Q12 58 12 54L26 20Z', glass) + F('M19.5 38H44.5L50.5 54Q50.5 56 48 56H16Q13.5 56 13.5 54Z', liq) + R(x, 24, 3, 16, 5, WOOD, 1) + F('M28 22L21 40H24L30 22Z', '#fff', 0.55);
  if (x.v === 'bottle') return P(x, 'M24 10H40V18Q48 22 48 32V56Q48 60 44 60H20Q16 60 16 56V32Q16 22 24 18Z', liq) + R(x, 23, 5, 18, 6, '#3498db', 1) + F('M20 32H24V54H20Z', '#fff', 0.5);
  const lvl = rf(x, 34, 40);
  let s = P(x, 'M27 8H37V24A17 17 0 1 1 27 24Z', glass) + F(segment(32, 40, 15, lvl), liq) + F(segment(32, 40, 15, lvl + 6), shade(liq, -12));
  for (let i = 0; i < 4; i++) s += Co(rf(x, 24, 40), rf(x, lvl + 3, 50), rf(x, 0.9, 2), '#fff', 0.6);
  s += R(x, 26, 3, 12, 7, WOOD, 1.5) + F('M21 34Q22 28 27 26L27 30Q24 31 23.5 35Z', '#fff', 0.7);
  return s;
}
const cup: Drawer = (x) => P(x, 'M44 24H50Q56 24 56 32V38Q56 46 48 46H44', 'none', 4) + P(x, 'M14 18H46V54Q46 58 42 58H18Q14 58 14 54Z', x.c) + blob(x, [[18, 18, 6], [26, 15, 7], [35, 16, 7], [42, 18, 5.5]], WHITE) + F('M18 26H22V54H18Z', '#fff', 0.35);
function urn(x: X) {
  let s = P(x, 'M24 6H40V10Q37 12 38 16Q54 24 52 42Q50 56 40 58H24Q14 56 12 42Q10 24 26 16Q27 12 24 10Z', x.c);
  const b = ri(x, 1, 2);
  for (let i = 0; i < b; i++) s += L(`M${14 + i} ${32 + i * 10}Q32 ${36 + i * 10} ${50 - i} ${32 + i * 10}`, shade(x.c, -25), 2.4);
  if (x.r() < 0.5) s += L('M24 14Q14 14 16 26M40 14Q50 14 48 26', x.o, 2.4);
  return s + F('M18 30Q18 22 26 19Q21 26 22 40Z', '#fff', 0.3);
}
function chest(x: X) {
  switch (x.v) {
    case 'box': return P(x, 'M10 22L32 14L54 22V48L32 56L10 48Z', x.c) + P(x, 'M10 22L32 30L54 22L32 14Z', shade(x.c, 12)) + L('M32 30V56', x.o, 2) + F('M18 19L40 27L44 25.5L22 17.5Z', '#e8d7b0', 0.9);
    case 'toolbox': return L('M24 18V10H40V18', x.o, 3) + P(x, 'M8 18H56V54H8Z', x.c) + P(x, 'M8 18H56V28H8Z', shade(x.c, -12)) + R(x, 28, 24, 8, 8, METAL, 1);
    case 'gift': return P(x, 'M10 26H54V36H10Z', x.c) + P(x, 'M14 36H50V58H14Z', shade(x.c, -8)) + F('M29 26H35V58H29Z', GOLD) + P(x, 'M32 26Q18 10 22 20Q22 26 32 26Q42 26 42 20Q46 10 32 26Z', GOLD, 2);
    default: return P(x, 'M8 30H56V56H8Z', WOOD) + P(x, 'M8 30Q8 12 32 12Q56 12 56 30Z', shade(WOOD, 8)) + F('M14 14H20V56H14ZM44 14H50V56H44Z', x.c) + R(x, 27, 26, 10, 12, GOLD, 2) + Co(32, 32, 1.8, x.o);
  }
}

// ---------- 宝石与材料 ----------
function gem(x: X) {
  const c = x.c, l = shade(c, 22), d = shade(c, -18);
  const cut = x.v === 'rhomb' ? 'rhomb' : pick(x, ['brilliant', 'brilliant', 'hex', 'oval', 'rhomb']);
  if (cut === 'rhomb') return P(x, 'M32 5L55 32L32 59L9 32Z', c) + F('M32 5L9 32H32Z', l) + F('M32 32L55 32L32 59Z', d) + P(x, 'M32 18L43 32L32 46L21 32Z', 'none', 1.4) + twinkle(24, 24, 4.5);
  if (cut === 'hex') return P(x, 'M32 6L54 19V45L32 58L10 45V19Z', c) + P(x, 'M32 18L43 25V39L32 46L21 39V25Z', l, 1.4) + F('M43 25L54 19V45L43 39Z', d) + F('M21 39L32 46V58L10 45Z', d, 0.6) + twinkle(26, 27, 4);
  if (cut === 'oval') return E(x, 32, 32, 20, 25, c) + E(x, 32, 32, 11, 15, l, 0, 1.4) + F('M32 47A11 15 0 0 0 43 32H52A20 25 0 0 1 32 57Z', d) + twinkle(26, 23, 4);
  return P(x, 'M12 22L21 9H43L52 22L32 57Z', c) + F('M12 22L21 9H43L52 22Z', l) + L('M12 22H52M21 9L26 22L32 9L38 22L43 9M26 22L32 57L38 22', x.o, 1.3) + F('M38 22L52 22L32 57Z', d, 0.7) + twinkle(25, 15, 3.5);
}
function crystal(x: X) {
  const n = ri(x, 3, 4); let s = '';
  const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => Math.abs(a - (n - 1) / 2) < Math.abs(b - (n - 1) / 2) ? 1 : -1);
  for (const i of order) {
    const cx = 32 + (i - (n - 1) / 2) * 11, h = (i === Math.floor(n / 2) ? 44 : rf(x, 24, 36)), w = rf(x, 5.5, 7.5), tilt = (i - (n - 1) / 2) * 12;
    const top = 56 - h;
    s += G(`rotate(${n1(tilt)} ${n1(cx)} 56)`, P(x, `M${n1(cx - w)} 56L${n1(cx - w)} ${n1(top + w)}L${n1(cx)} ${n1(top)}L${n1(cx + w)} ${n1(top + w)}L${n1(cx + w)} 56Z`, x.c) + F(`M${n1(cx - w)} 56L${n1(cx - w)} ${n1(top + w)}L${n1(cx)} ${n1(top)}L${n1(cx)} 56Z`, '#fff', 0.35));
  }
  return s + P(x, 'M8 56Q32 50 56 56Q32 62 8 56Z', shade(x.c, -30), 2);
}
function orb(x: X) {
  let s = '';
  if (x.v === 'ball') s += P(x, 'M18 50H46L42 60H22Z', '#7a5230');
  s += Co(32, 32, 26, x.c, 0.18) + C(x, 32, 32, 20, x.c) + Co(34, 35, 13, shade(x.c, 18), 0.6) + Co(35, 37, 6, '#fff', 0.35) + E(null, 25, 24, 6, 4, '#fff', -35) ;
  if (x.v !== 'plain') for (let i = 0; i < 2; i++) s += twinkle(rf(x, 26, 40), rf(x, 28, 42), 2.4);
  return s;
}
function ore(x: X) {
  const rock = x.v === 'plain' || x.v === 'lump' ? x.c : '#8b8d92';
  const pts = ringPts(x, 32, 36, 22, 9, 0.18, 0.82);
  let s = P(x, smooth(pts), rock) + F('M18 30Q22 20 32 18Q24 24 22 34Z', '#fff', 0.3);
  if (x.v === 'lump') return s + F(poly([[30, 26], [40, 24], [44, 34], [34, 36]]), '#fff', 0.15) + F(poly([[20, 40], [28, 38], [26, 46]]), '#fff', 0.1);
  if (x.v === 'plain') return s + L(`M${n1(rf(x, 26, 34))} 24L32 34L40 38`, x.o, 1.6, 0.6);
  const k = ri(x, 3, 5);
  for (let i = 0; i < k; i++) { const cx = rf(x, 20, 44), cy = rf(x, 28, 46); s += P(x, smooth(ringPts(x, cx, cy, rf(x, 3.5, 5.5), 5, 0.3)), x.c, 1.6) + Co(cx - 1, cy - 1, 1.2, '#fff', 0.7); }
  return s;
}
const bar: Drawer = (x) => G('translate(0 6)', P(x, 'M10 30L20 18H52L44 30Z', shade(x.c, 18)) + P(x, 'M10 30H44V44H10Z', x.c) + P(x, 'M44 30L52 18V32L44 44Z', shade(x.c, -18)) + F('M14 33H40V36H14Z', '#fff', 0.35));
function brick(x: X) {
  let s = '';
  for (let r = 0; r < 4; r++) for (let c = -1; c < 3; c++) { const bx = 8 + c * 18 + (r % 2 ? 9 : 0); if (bx > 40 || bx + 16 < 8) continue; const x0 = Math.max(8, bx), x1 = Math.min(56, bx + 16); s += R(x, x0, 10 + r * 11, x1 - x0, 9, shade(x.c, (r * 7 + c * 5) % 11 - 5), 1); }
  return s;
}
const leather: Drawer = (x) => P(x, 'M14 12Q22 6 32 11Q42 6 50 12Q57 22 50 32Q57 42 50 52Q40 58 32 53Q24 58 14 52Q7 42 14 32Q7 22 14 12Z', x.c)
  + `<path d="M18 16Q24 12 32 15Q40 12 46 16Q51 24 46 32Q51 40 46 48Q40 52 32 49Q24 52 18 48Q13 40 18 32Q13 24 18 16Z" fill="none" stroke="${shade(x.c, 25)}" stroke-width="1.4" stroke-dasharray="3 3"/>`;
function log(x: X) {
  let s = P(x, 'M12 22H50A7 12 0 0 1 50 46H12Z', x.c);
  for (let i = 0; i < 3; i++) s += L(`M${n1(rf(x, 18, 44))} ${n1(rf(x, 26, 30))}h${n1(rf(x, 6, 12))}`, shade(x.c, -25), 1.6);
  if (x.r() < 0.5) s += P(x, 'M34 22L38 12L42 13L40 22Z', x.c, 2);
  s += E(x, 12, 34, 7.5, 12, '#e6c48e') + E(null, 12, 34, 4.5, 7.5, 'none').replace('fill="none"', `fill="none" stroke="${shade('#e6c48e', -25)}" stroke-width="1.3"`) + Co(12, 34, 1.6, shade('#e6c48e', -30));
  return G('rotate(-22 32 34)', s);
}
const coal: Drawer = (x) => ore({ ...x, v: 'lump' });

// ---------- 书写与文书 ----------
function scroll(x: X) {
  if (x.v === 'clipboard') return P(x, 'M12 10H52V60H12Z', x.c) + R(x, 17, 15, 30, 40, PAPER, 1) + R(x, 24, 5, 16, 9, METAL, 2) + L('M22 26H42M22 33H42M22 40H36', '#8a7a5a', 2);
  let s = P(x, 'M14 12H48V52H14Z', x.c);
  for (let i = 0; i < 4; i++) s += L(`M20 ${20 + i * 7}H${n1(rf(x, 34, 42))}`, '#8a6e3a', 1.8, 0.75);
  s += P(x, 'M10 8Q10 4 14 4H50Q54 4 54 8Q54 12 50 12H14Q10 12 10 8Z', shade(x.c, -10)) + P(x, 'M10 54Q10 50 14 50H50Q54 50 54 54Q54 58 50 58H14Q10 58 10 54Z', shade(x.c, -10));
  if (x.r() < 0.5) s += C(x, 42, 46, 5, '#c0392b', 1.6);
  return s;
}
function book(x: X) {
  if (x.v === 'stack') {
    const cols = [x.c, shade(x.c, 0, 0, 120), shade(x.c, 0, 0, 220)];
    return [0, 1, 2].map((i) => G(`translate(${i % 2 ? 3 : -2} ${-i * 13})`, P(x, 'M10 46H52V56H10Z', cols[i]) + F('M46 48H50V54H46Z', PAPER) + F('M16 49H34V51H16Z', GOLD))).join('');
  }
  return P(x, 'M14 10H48Q52 10 52 14V54H18Q14 54 14 50Z', x.c) + P(x, 'M18 50H52V58H18Q14 58 14 54Q14 50 18 50Z', PAPER) + L('M18 54H50', '#bfae86', 1)
    + L('M20 10V50', shade(x.c, -25), 2) + (x.r() < 0.5 ? P(x, star(36, 28, 5, 7, 3), GOLD, 1.4) : R(x, 28, 22, 16, 10, GOLD, 1.5)) + F('M44 10H48V22L46 20L44 22Z', '#c0392b');
}
function pen(x: X) {
  if (x.v === 'brush') return G('rotate(40 32 32)', TL(x, 'M32 4V40', WOOD, 4) + P(x, 'M28 38H36V44H28Z', METAL) + P(x, 'M28 44H36Q38 54 32 62Q26 54 28 44Z', x.c));
  return G('rotate(40 32 32)', P(x, 'M27 6H37V40H27Z', x.c) + P(x, 'M27 40H37L32 58Z', GOLD) + L('M32 46V54', x.o, 1.3) + F('M29 8H31V38H29Z', '#fff', 0.35) + R(x, 26, 14, 12, 4, GOLD, 1));
}
function map(x: X) {
  let s = P(x, 'M6 14L22 8L42 14L58 8V50L42 56L22 50L6 56Z', x.c) + F('M22 8L42 14V56L22 50Z', shade(x.c, -10)) + L('M22 8V50M42 14V56', x.o, 1.2, 0.6);
  s += `<path d="M12 44Q${n1(rf(x, 18, 30))} ${n1(rf(x, 22, 34))} 32 34T48 22" fill="none" stroke="#c0392b" stroke-width="2" stroke-dasharray="3 3"/>`;
  return s + L('M45 18L51 26M51 18L45 26', '#c0392b', 2.6);
}
function compass(x: X) {
  const a = rf(x, -40, 40);
  return C(x, 32, 32, 25, x.c) + C(x, 32, 32, 19, PAPER, 1.6) + L('M32 15V19M32 45V49M15 32H19M45 32H49', '#8a7a5a', 1.6)
    + G(`rotate(${n1(a)} 32 32)`, P(x, 'M32 14L37 32H27Z', '#e74c3c', 1.4) + P(x, 'M32 50L37 32H27Z', WHITE, 1.4)) + C(x, 32, 32, 2.6, GOLD, 1.2);
}
const pin: Drawer = (x) => P(x, 'M32 60Q14 38 14 24A18 18 0 0 1 50 24Q50 38 32 60Z', x.c) + C(x, 32, 24, 7, WHITE, 1.6) + F('M20 20Q22 12 30 10Q24 15 23 22Z', '#fff', 0.4);
function key(x: X) {
  let teeth = 'M38 32';
  const n = ri(x, 2, 3);
  for (let i = 0; i < n; i++) teeth += `V${n1(rf(x, 39, 44))}H${n1(41 + i * 6)}V32`;
  return G('rotate(-40 32 32)', TL(x, 'M24 30H56', x.c, 5) + P(x, `${teeth}H${n1(41 + n * 6)}`, x.c, 2) + C(x, 16, 30, 10, x.c) + Co(16, 30, 4.5, '#2a2430') + F('M8 26Q10 21 15 20', 'none'));
}
const lock: Drawer = (x) => L('M20 30V20A12 12 0 0 1 44 20V30', x.o, 6 + SW * 2) + L('M20 30V20A12 12 0 0 1 44 20V30', METAL, 6) + P(x, 'M12 28H52V58H12Z', x.c) + C(x, 32, 40, 4.5, x.o, 0) + F('M30 42H34L35 50H29Z', x.o) + F('M15 31H19V55H15Z', '#fff', 0.3);
const unlock: Drawer = (x) => L('M20 28V18A12 12 0 0 1 44 18', x.o, 6 + SW * 2) + L('M20 28V18A12 12 0 0 1 44 18', METAL, 6) + P(x, 'M12 28H52V58H12Z', x.c) + C(x, 32, 40, 4.5, x.o, 0) + F('M30 42H34L35 50H29Z', x.o) + F('M15 31H19V55H15Z', '#fff', 0.3);
function gear(x: X) {
  if (x.v === 'bolt') return G('rotate(-35 32 32)', TL(x, 'M32 26V60', METAL, 7) + L('M28 34L36 36M28 40L36 42M28 46L36 48M28 52L36 54', x.o, 1.2) + P(x, 'M20 10H44L48 18L44 26H20L16 18Z', x.c));
  const n = 8; let d = '';
  for (let i = 0; i < n * 4; i++) { const a = (i / (n * 4)) * Math.PI * 2, r = i % 4 < 2 ? 25 : 19; d += `${i ? 'L' : 'M'}${n1(32 + Math.cos(a) * r)} ${n1(32 + Math.sin(a) * r)}`; }
  return P(x, d + 'Z', x.c) + C(x, 32, 32, 8, '#2a2430') + `<circle cx="32" cy="32" r="14" fill="none" stroke="${shade(x.c, -20)}" stroke-width="2"/>`;
}
const disk: Drawer = (x) => P(x, 'M8 8H50L56 14V56H8Z', x.c) + P(x, 'M18 8H44V24H18Z', METAL, 2) + F('M36 11H41V21H36Z', x.o) + R(x, 14, 32, 36, 24, WHITE, 2) + L('M18 40H46M18 47H40', '#b0b0b0', 1.6);
function chart(x: X) {
  let s = R(x, 6, 6, 52, 52, WHITE, 5);
  if (x.v === 'line') { let d = 'M12 48'; for (let i = 1; i <= 4; i++) d += `L${12 + i * 9} ${n1(48 - i * 7 - rf(x, -5, 5))}`; return s + L(d, x.c, 3.4) + P(x, 'M44 16L54 12L52 22Z', x.c, 1.6) + L('M12 52H52', '#999', 1.4); }
  const cols = [x.c, shade(x.c, 0, 0, 140), shade(x.c, 0, 0, 260)];
  for (let i = 0; i < 3; i++) { const h = rf(x, 12, 36); s += R(x, 14 + i * 13, 52 - h, 9, h, cols[i], 1); }
  return s;
}
const folder: Drawer = (x) => P(x, 'M6 14H24L29 20H56V54H6Z', shade(x.c, -12)) + P(x, 'M6 26H58L54 54H6Z', x.c) + F('M9 29H54L53 33H9Z', '#fff', 0.35);
function tray(x: X) {
  const arrow = x.v === 'out' ? P(x, 'M32 6L44 20H37V34H27V20H20Z', x.c) : P(x, 'M32 36L44 22H37V6H27V22H20Z', x.c);
  return P(x, 'M6 36H18L22 44H42L46 36H58V56H6Z', '#95a5a6') + arrow;
}
const refresh: Drawer = (x) => TL(x, 'M14 32A18 18 0 0 1 46 20', x.c, 5) + P(x, 'M40 12L54 16L46 28Z', x.c, 2) + TL(x, 'M50 32A18 18 0 0 1 18 44', x.c, 5) + P(x, 'M24 52L10 48L18 36Z', x.c, 2);
function search(x: X) {
  if (x.v === 'scope') return TL(x, 'M26 46L20 60M30 46L40 60', WOOD, 2.6) + G('rotate(-30 32 30)', P(x, 'M8 24H50V34H8Z', x.c) + P(x, 'M50 21H58V37H50Z', shade(x.c, -15)) + P(x, 'M4 26H10V32H4Z', shade(x.c, -15)));
  return TL(x, 'M38 38L56 56', WOOD, 6) + C(x, 26, 26, 17, '#d6eaf8') + `<circle cx="26" cy="26" r="17" fill="none" stroke="${x.c}" stroke-width="4"/>` + F('M16 22Q18 14 26 13Q20 18 19 25Z', '#fff', 0.8);
}
function hourglass(x: X) {
  if (x.v === 'clock') return P(x, 'M14 58V30Q14 8 32 8Q50 8 50 30V58Z', WOOD) + C(x, 32, 30, 14, PAPER, 1.8) + L('M32 30V21M32 30L38 34', x.o, 2) + R(x, 22, 48, 20, 6, GOLD, 1);
  return P(x, 'M12 4H52V10H12Z', WOOD) + P(x, 'M12 54H52V60H12Z', WOOD) + P(x, 'M17 10H47Q47 26 34 32Q47 38 47 54H17Q17 38 30 32Q17 26 17 10Z', '#e4eef3', 2)
    + F('M22 18H42Q40 26 32 30Q24 26 22 18Z', x.c) + F('M32 34L33 50H44Q42 44 32 42Q22 44 20 50H31Z', x.c);
}
const warning: Drawer = (x) => P(x, 'M32 6L60 56H4Z', x.c) + F('M29 22H35L34 42H30Z', '#2a2430') + Co(32, 48, 3, '#2a2430');
const question: Drawer = (x) => C(x, 32, 32, 26, x.c) + L('M23 24Q23 14 32 14Q41 14 41 22Q41 28 32 31V37', WHITE, 5.5) + Co(32, 47, 3.6, WHITE);
const link: Drawer = (x) => G('rotate(-45 32 32)', `<rect x="8" y="24" width="26" height="16" rx="8" fill="none" stroke="${x.o}" stroke-width="${6 + SW * 2}"/><rect x="8" y="24" width="26" height="16" rx="8" fill="none" stroke="${x.c}" stroke-width="6"/><rect x="30" y="24" width="26" height="16" rx="8" fill="none" stroke="${x.o}" stroke-width="${6 + SW * 2}"/><rect x="30" y="24" width="26" height="16" rx="8" fill="none" stroke="${x.c}" stroke-width="6"/>`);
function flag(x: X) {
  let s = TL(x, 'M14 6V60', WOOD, 3.4) + P(x, 'M16 8Q28 4 36 8Q46 12 56 8V36Q46 40 36 36Q28 32 16 36Z', x.c);
  if (x.v === 'pirate') s += Co(36, 19, 6, WHITE) + F('M33 24h6v4h-6Z', WHITE) + L('M28 28L44 34M44 28L28 34', WHITE, 2.2) + Co(34, 19, 1.4, x.c) + Co(38, 19, 1.4, x.c);
  if (x.v === 'checker') for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) if ((i + j) % 2) s += F(`M${16 + i * 10} ${10 + j * 8.5}h10v8.5h-10Z`, '#2a2430', 0.9);
  return s;
}
const trophy: Drawer = (x) => L('M18 14Q6 14 8 24Q10 32 20 32M46 14Q58 14 56 24Q54 32 44 32', x.o, 4.5) + L('M18 14Q6 14 8 24Q10 32 20 32M46 14Q58 14 56 24Q54 32 44 32', x.c, 2.5)
  + P(x, 'M16 8H48V20Q48 38 32 40Q16 38 16 20Z', x.c) + P(x, 'M28 40H36V48H28Z', shade(x.c, -15)) + P(x, 'M18 48H46V58H18Z', WOOD) + F(star(32, 21, 5, 7, 3), shade(x.c, 22)) + F('M20 10H24V26Q21 22 20 10Z', '#fff', 0.4);
function medal(x: X) {
  if (x.v === 'ticket') return G('rotate(-15 32 32)', P(x, 'M6 18H58V28A4 4 0 0 0 58 36V46H6V36A4 4 0 0 0 6 28Z', x.c) + `<path d="M44 20V44" stroke="${x.o}" stroke-width="1.6" stroke-dasharray="3 3"/>` + F(star(25, 32, 5, 7, 3), WHITE));
  if (x.v === 'badge') return P(x, 'M8 14H56V50H8Z', x.c) + R(x, 12, 26, 40, 18, WHITE, 2) + L('M18 35H46', '#999', 2);
  return P(x, 'M18 4H30L36 28H26Z', '#3498db') + P(x, 'M46 4H34L28 28H38Z', '#e74c3c') + C(x, 32, 42, 16, x.c) + P(x, star(32, 42, 5, 9, 4), shade(x.c, 18), 1.4);
}
const ticket: Drawer = (x) => medal({ ...x, v: 'ticket' });

export const ITEM_DRAWERS: Record<string, Drawer> = {
  blade, axe, pick: pick_, hammer, saw, shovel, broom, bow, arrow, target, staff, shield, helm, armor, legs, boots, gloves, cape, amulet, ring, crown, hat, bag, quiver,
  potion, cup, urn, chest, gem, crystal, orb, ore, bar, brick, leather, log, coal,
  scroll, book, pen, map, compass, pin, key, lock, unlock, gear, disk, chart, folder, tray, refresh, search, hourglass, warning, question, link, flag, trophy, medal, ticket,
};
