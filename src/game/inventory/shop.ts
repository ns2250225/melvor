// 商店与交易：购买前检查、失败不改变资源、成功时扣款与入库原子完成
import type { Game } from '../core/game';
import type { ShopItemDef } from '../core/types';
import { C } from '@/content';
import { adventureUnlockCost } from '@/content/skills';
import type { SkillId } from '../core/types';

export function bankSlotCost(g: Game, offset = 0): number {
  const n = (g.state.shop['bank_slot'] || 0) + offset;
  return Math.min(4000000, Math.floor(2000 * Math.pow(1.045, n)));
}

export function shopCost(g: Game, def: ShopItemDef, qty = 1) {
  const c = def.cost;
  let gp = (c.gp ?? 0) * qty;
  if (c.scaling === 'bankSlot') { gp = 0; for (let i = 0; i < qty; i++) gp += bankSlotCost(g, i); }
  return {
    gp, slayerCoins: (c.slayerCoins ?? 0) * qty, abyssalPieces: (c.abyssalPieces ?? 0) * qty, abyssalSlayerCoins: (c.abyssalSlayerCoins ?? 0) * qty,
    items: (c.items ?? []).map((i) => ({ id: i.id, qty: i.qty * qty })),
  };
}

export function canBuy(g: Game, def: ShopItemDef, qty = 1): string | null {
  const s = g.state;
  if (qty <= 0) return '数量无效';
  const owned = s.shop[def.id] || 0;
  if (def.buyLimit > 0 && owned + qty > def.buyLimit) return '已达购买上限';
  for (const r of def.requirements) if (!g.meets(r)) return `需要：${g.describeReq(r)}`;
  const cost = shopCost(g, def, qty);
  const c = s.currencies;
  if (cost.gp > c.gp) return '金币不足';
  if (cost.slayerCoins > c.slayerCoins) return '猎杀币不足';
  if (cost.abyssalPieces > c.abyssalPieces) return '深渊碎片不足';
  if (cost.abyssalSlayerCoins > c.abyssalSlayerCoins) return '深渊猎杀币不足';
  if (!g.hasItems(cost.items)) return '所需物品不足';
  for (const gr of def.grants ?? []) if (!g.canAddItem(gr.id)) return '银行已满';
  return null;
}

export function buy(g: Game, shopId: string, qty = 1): string | null {
  const def = C.shop[shopId];
  if (!def) return '无效商品';
  const err = canBuy(g, def, qty);
  if (err) return err;
  const cost = shopCost(g, def, qty);
  // 原子交易：检查已全部通过，依次扣除并发放
  g.spendCurrency(cost);
  g.removeItems(cost.items, 'shop');
  for (const gr of def.grants ?? []) g.addItem(gr.id, gr.qty * qty, 'shop');
  if (def.charges) for (const gr of def.grants ?? []) g.state.glovesCharges[gr.id] = (g.state.glovesCharges[gr.id] || 0) + def.charges * qty;
  g.state.shop[def.id] = (g.state.shop[def.id] || 0) + qty;
  if (def.upgrade) {
    g.invalidate();
    if (def.upgrade.modifiers?.levelCap || def.upgrade.modifiers?.abyssalLevelCap || def.upgrade.flag === 'realm_abyssal') g.recalcLevels();
    if (def.upgrade.flag === 'autoSlayer') g.state.slayer.autoSlayer = true;
  }
  g.stat('shopPurchases', qty);
  if (cost.gp) g.stat('gpSpentShop', cost.gp);
  g.notify(`购买了 ${def.name}${qty > 1 ? ` ×${qty}` : ''}`, 'success', def.icon);
  return null;
}

/** 冒险模式：解锁技能 */
export function unlockSkill(g: Game, skill: SkillId): string | null {
  const s = g.state;
  if (s.skills[skill].unlocked) return '技能已解锁';
  const unlocked = C.skillOrder.filter((x) => s.skills[x].unlocked).length;
  const cost = adventureUnlockCost(unlocked);
  if (!g.spendCurrency({ gp: cost })) return '金币不足';
  s.skills[skill].unlocked = true;
  g.notify(`解锁技能：${C.skills[skill].name}`, 'success', C.skills[skill].icon);
  return null;
}
