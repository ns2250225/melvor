// 程序化图标的绘图基元：随机数、颜色运算与 SVG 片段构造函数。
// 所有图标在 64×64 的坐标系中绘制，统一使用深色描边 + 平涂 + 半透明高光的风格。

export interface X {
  /** 主色 */ c: string;
  /** 亮色 */ l: string;
  /** 暗色 */ d: string;
  /** 描边色 */ o: string;
  /** 强调色 */ a: string;
  /** 变体 */ v: string;
  /** 种子随机数 [0,1) */ r: () => number;
}
export type Drawer = (x: X) => string;

// ---------- 随机数 ----------
export function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
export function mulberry(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const ri = (x: X, a: number, b: number) => a + Math.floor(x.r() * (b - a + 1));
export const rf = (x: X, a: number, b: number) => a + x.r() * (b - a);
export const pick = <T>(x: X, arr: readonly T[]): T => arr[Math.floor(x.r() * arr.length)];

// ---------- 颜色 ----------
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
function rgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h.slice(0, 6), 16) || 0;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const hex2 = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');
function toHsl(hex: string): [number, number, number] {
  const [r, g, b] = rgb(hex).map((v) => v / 255);
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l * 100];
  const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s * 100, l * 100];
}
function fromHsl(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return `#${hex2(f(0) * 255)}${hex2(f(8) * 255)}${hex2(f(4) * 255)}`;
}
/** 调整亮度 / 饱和度 / 色相 */
export function shade(hex: string, dl: number, ds = 0, dh = 0): string {
  const [h, s, l] = toHsl(hex);
  return fromHsl((h + dh + 360) % 360, clamp(s + ds, 0, 100), clamp(l + dl, 0, 100));
}
export function mix(a: string, b: string, t: number): string {
  const A = rgb(a), B = rgb(b);
  return `#${hex2(A[0] + (B[0] - A[0]) * t)}${hex2(A[1] + (B[1] - A[1]) * t)}${hex2(A[2] + (B[2] - A[2]) * t)}`;
}
export const lightness = (hex: string) => toHsl(hex)[2];

// ---------- 常用材质色 ----------
export const WOOD = '#9c6b3c';
export const METAL = '#c9d1d9';
export const GOLD = '#f2c230';
export const PAPER = '#f1e3bd';
export const WHITE = '#f6f4ee';
export const INK = '#1b1722';
export const SKINS = ['#f5cba7', '#e0ac69', '#c68642', '#8d5524', '#ffdbac'] as const;

// ---------- SVG 片段 ----------
export const SW = 2.4;
export const n1 = (v: number) => (Math.round(v * 10) / 10).toString();
const op = (o: number) => (o < 1 ? ` opacity="${o}"` : '');

/** 带描边的填充路径 */
export const P = (x: X, d: string, f = x.c, w = SW) =>
  `<path d="${d}" fill="${f}" stroke="${x.o}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
/** 无描边的填充路径（高光 / 阴影） */
export const F = (d: string, f: string, o = 1) => `<path d="${d}" fill="${f}"${op(o)}/>`;
/** 线条 */
export const L = (d: string, col: string, w = SW, o = 1) =>
  `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${op(o)}/>`;
/** 带外描边的粗线：先画深色宽线，再画彩色细线 */
export const TL = (x: X, d: string, col: string, w: number) => L(d, x.o, w + SW * 2) + L(d, col, w);
export const C = (x: X | null, cx: number, cy: number, r: number, f: string, w = SW) =>
  `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(r)}" fill="${f}"${x ? ` stroke="${x.o}" stroke-width="${w}"` : ''}/>`;
export const Co = (cx: number, cy: number, r: number, f: string, o = 1) => `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(r)}" fill="${f}"${op(o)}/>`;
export const E = (x: X | null, cx: number, cy: number, rx: number, ry: number, f: string, rot = 0, w = SW) =>
  `<ellipse cx="${n1(cx)}" cy="${n1(cy)}" rx="${n1(rx)}" ry="${n1(ry)}" fill="${f}"${x ? ` stroke="${x.o}" stroke-width="${w}"` : ''}${rot ? ` transform="rotate(${n1(rot)} ${n1(cx)} ${n1(cy)})"` : ''}/>`;
export const R = (x: X | null, rx: number, ry: number, w: number, h: number, f: string, rr = 0) =>
  `<rect x="${n1(rx)}" y="${n1(ry)}" width="${n1(w)}" height="${n1(h)}" rx="${rr}" fill="${f}"${x ? ` stroke="${x.o}" stroke-width="${SW}" stroke-linejoin="round"` : ''}/>`;
export const G = (t: string, s: string) => `<g transform="${t}">${s}</g>`;
/** 多个圆合并成一个带统一描边的团块（树冠、云朵等） */
export function blob(x: X, circles: [number, number, number][], f: string, hl?: string) {
  let s = circles.map(([cx, cy, r]) => Co(cx, cy, r + SW, x.o)).join('');
  s += circles.map(([cx, cy, r]) => Co(cx, cy, r, f)).join('');
  if (hl) s += circles.map(([cx, cy, r]) => Co(cx - r * 0.3, cy - r * 0.35, r * 0.4, hl, 0.5)).join('');
  return s;
}
/** 星形路径 */
export function star(cx: number, cy: number, n: number, R0: number, r0: number, rot = -90) {
  let d = '';
  for (let i = 0; i < n * 2; i++) {
    const a = ((rot + (i * 180) / n) * Math.PI) / 180, rr = i % 2 ? r0 : R0;
    d += `${i ? 'L' : 'M'}${n1(cx + Math.cos(a) * rr)} ${n1(cy + Math.sin(a) * rr)}`;
  }
  return d + 'Z';
}
/** 经过各顶点中点的平滑闭合曲线 */
export function smooth(pts: [number, number][]) {
  const m = (a: [number, number], b: [number, number]): [number, number] => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const s = m(pts[pts.length - 1], pts[0]);
  let d = `M${n1(s[0])} ${n1(s[1])}`;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = m(p, pts[(i + 1) % pts.length]);
    d += `Q${n1(p[0])} ${n1(p[1])} ${n1(q[0])} ${n1(q[1])}`;
  }
  return d + 'Z';
}
export function poly(pts: [number, number][]) { return 'M' + pts.map(([a, b]) => `${n1(a)} ${n1(b)}`).join('L') + 'Z'; }
/** 绕中心的随机抖动顶点环 */
export function ringPts(x: X, cx: number, cy: number, r: number, n: number, jit: number, sy = 1): [number, number][] {
  const off = x.r() * Math.PI * 2;
  return Array.from({ length: n }, (_, i) => {
    const a = off + (i / n) * Math.PI * 2, rr = r * (1 - jit + x.r() * jit * 2);
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * sy] as [number, number];
  });
}
/** 位于圆内水平线以下的弓形（液面） */
export function segment(cx: number, cy: number, r: number, y: number) {
  const dy = y - cy, w = Math.sqrt(Math.max(0, r * r - dy * dy));
  return `M${n1(cx - w)} ${n1(y)}A${r} ${r} 0 ${dy < 0 ? 1 : 0} 0 ${n1(cx + w)} ${n1(y)}Z`;
}
/** 小四角闪光 */
export const twinkle = (cx: number, cy: number, s: number, f = '#fffbe0') => F(star(cx, cy, 4, s, s * 0.28), f);
/** 两侧对称：对 s=-1 与 s=1 各调用一次 */
export const sym = (fn: (s: number) => string) => fn(-1) + fn(1);
