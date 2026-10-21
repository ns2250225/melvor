// 掉落系统：统一掉落表判定（权重、概率、多次掷骰、稀有加成）
import type { Game } from '../core/game';
import type { ItemQty } from '../core/types';
import { C } from '@/content';

/** 稀有条目阈值：占总权重 < 2% 的条目受「稀有掉落几率」加成 */
const RARE_THRESHOLD = 0.02;

export function rollDropTable(g: Game, tableId: string | null | undefined, extraRolls = 0): ItemQty[] {
  if (!tableId) return [];
  const t = C.dropTables[tableId];
  if (!t || !t.entries.length) return [];
  if (t.chance !== undefined && !g.rng.chance(t.chance)) return [];
  const rareMult = 1 + g.mods.get('rareDropChance') / 100;
  const total = t.entries.reduce((a, e) => a + e.weight, 0);
  const entries = rareMult !== 1 ? t.entries.map((e) => ({ ...e, weight: e.weight / total < RARE_THRESHOLD ? e.weight * rareMult : e.weight })) : t.entries;
  const out: ItemQty[] = [];
  const rolls = (t.rolls ?? 1) + extraRolls;
  for (let i = 0; i < rolls; i++) {
    const e = g.rng.weighted(entries);
    if (!e) continue;
    const qty = g.rng.int(e.min, e.max);
    if (qty <= 0) continue;
    const ex = out.find((o) => o.id === e.id);
    if (ex) ex.qty += qty; else out.push({ id: e.id, qty });
  }
  return out;
}

/** 打开宝箱类物品 */
export function openChest(g: Game, itemId: string, count: number): ItemQty[] | string {
  const it = C.items[itemId];
  if (!it?.dropTable) return '该物品无法开启';
  count = Math.min(count, g.qty(itemId));
  if (count <= 0) return '数量不足';
  const got: ItemQty[] = [];
  let opened = 0;
  for (let i = 0; i < count; i++) {
    const drops = rollDropTable(g, it.dropTable);
    if (!drops.every((d) => d.id === '$gp' || g.canAddItem(d.id))) break;
    g.removeItem(itemId, 1, 'open');
    for (const d of drops) {
      g.addItem(d.id, d.qty, 'open');
      const ex = got.find((x) => x.id === d.id);
      if (ex) ex.qty += d.qty; else got.push({ ...d });
    }
    opened++;
  }
  if (!opened) return '银行已满';
  g.stat('chestsOpened', opened);
  return got;
}
