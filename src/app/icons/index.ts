// 程序化图标入口：根据图标名查注册表得到 [原型, 主色, 变体, 强调色]，
// 再以 (名称 + 种子) 初始化随机数，由原型绘制器生成 SVG。结果按输入缓存。
import { type X, hashStr, mulberry, shade, mix } from './prim';
import { ITEM_DRAWERS } from './draw-items';
import { NATURE_DRAWERS } from './draw-nature';
import { BEING_DRAWERS } from './draw-beings';
import { ICONS } from './registry';

export type IconSpec = [arch: string, color: string, variant?: string, accent?: string];
const DRAW = { ...ITEM_DRAWERS, ...NATURE_DRAWERS, ...BEING_DRAWERS };
export const ARCHETYPES = Object.keys(DRAW);

const cache = new Map<string, string>();

/** 返回 64×64 视图框内的 SVG 内容（不含 <svg> 外壳），可嵌入其他 SVG。 */
export function iconInner(name: string, seed = '', tint?: string): string {
  const k = `${name}|${seed}|${tint ?? ''}`;
  const hit = cache.get(k);
  if (hit) return hit;
  const spec: IconSpec = (ICONS as Record<string, IconSpec>)[name] ?? ['rune', '#8e7cc3', ''];
  const [arch, base, variant0 = '', accent] = spec;
  // 带染色的矿石显示为灰色岩石 + 彩色矿脉
  const variant = tint && arch === 'ore' && variant0 === 'plain' ? '' : variant0;
  const r = mulberry(hashStr(`${name}#${seed}`));
  // 未指定染色时，按种子对色相 / 亮度做小幅抖动，使同类图标彼此可区分
  const c = tint ?? (seed ? shade(base, (r() - 0.5) * 8, 0, (r() - 0.5) * 16) : base);
  const x: X = {
    c, l: shade(c, 18), d: shade(c, -18),
    o: mix(shade(c, -45, -20), '#16121c', 0.55),
    a: accent ?? (arch === 'blade' || arch === 'bow' ? '#d4a52c' : shade(c, 4, 10, 150)),
    v: variant, r,
  };
  const draw = DRAW[arch as keyof typeof DRAW] ?? DRAW.rune;
  let out: string;
  try { out = draw(x); } catch { out = DRAW.rune(x); }
  if (cache.size > 4000) cache.clear();
  cache.set(k, out);
  return out;
}

/** 完整 SVG 字符串 */
export function iconSvg(name: string, seed = '', tint?: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 68 68" aria-hidden="true">${iconInner(name, seed, tint)}</svg>`;
}

export function hasIcon(name: string): boolean { return name in ICONS; }
