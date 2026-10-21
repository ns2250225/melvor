// 装备、食物栏、药水、手套充能与装备方案
import type { Game } from '../core/game';
import type { EquipSlot } from '../core/types';
import { C } from '@/content';

export function equipRequirementsMet(g: Game, itemId: string): string | null {
  const eq = C.items[itemId]?.equipment;
  if (!eq) return '该物品无法装备';
  for (const r of eq.requirements) {
    if (r.abyssal) { if (!g.inAbyss() || g.abyssalLevel(r.skill) < r.level) return `需要 ${C.skills[r.skill].name} 深渊 ${r.level} 级`; }
    else if (g.level(r.skill) < r.level) return `需要 ${C.skills[r.skill].name} ${r.level} 级`;
  }
  return null;
}

export function slotsFor(itemId: string): EquipSlot[] {
  const eq = C.items[itemId]?.equipment;
  if (!eq) return [];
  if (eq.slot === 'summon1' || eq.slot === 'summon2') return ['summon1', 'summon2'];
  return [eq.slot];
}

export function isStackableSlot(slot: EquipSlot) { return ['quiver', 'summon1', 'summon2', 'consumable'].includes(slot); }

export function equip(g: Game, itemId: string, qty = 1, slotOverride?: EquipSlot): string | null {
  const s = g.state;
  if (s.combat.active && s.combat.area?.kind === 'dungeon') return '副本中无法更换装备';
  const err = equipRequirementsMet(g, itemId);
  if (err) return err;
  const slots = slotsFor(itemId);
  let slot = slotOverride && slots.includes(slotOverride) ? slotOverride : slots[0];
  const set = s.equipmentSets[s.activeSet];
  if (slots.length > 1 && !slotOverride) {
    // 召唤：优先同种石板所在栏，其次空栏
    slot = slots.find((x) => set[x]?.id === itemId) ?? slots.find((x) => !set[x]) ?? slots[0];
    const other = slot === 'summon1' ? 'summon2' : 'summon1';
    if (set[other]?.id === itemId) slot = other;
  }
  const eq = C.items[itemId].equipment!;
  const have = g.qty(itemId);
  if (have <= 0) return '银行中没有该物品';
  const stackable = isStackableSlot(slot);
  const amount = stackable ? Math.min(have, qty === Infinity ? have : qty) : 1;
  if (amount <= 0) return '数量不足';
  // 双手武器与盾牌互斥
  const toUnequip: EquipSlot[] = [];
  if (slot === 'weapon' && eq.twoHanded && set.shield) toUnequip.push('shield');
  if (slot === 'shield' && set.weapon && C.items[set.weapon.id]?.equipment?.twoHanded) toUnequip.push('weapon');
  if (set[slot] && set[slot]!.id !== itemId) toUnequip.push(slot);
  for (const u of toUnequip) {
    const e = unequip(g, u);
    if (e) return e;
  }
  g.removeItem(itemId, amount, 'equip');
  if (set[slot] && set[slot]!.id === itemId) set[slot]!.qty += amount;
  else set[slot] = { id: itemId, qty: amount };
  g.invalidate();
  g.stat('itemsEquipped');
  return null;
}

export function unequip(g: Game, slot: EquipSlot): string | null {
  const s = g.state;
  const set = s.equipmentSets[s.activeSet];
  const st = set[slot];
  if (!st) return null;
  if (s.combat.active && s.combat.area?.kind === 'dungeon') return '副本中无法更换装备';
  if (!g.canAddItem(st.id)) return '银行已满，无法卸下';
  g.addItem(st.id, st.qty, 'unequip');
  set[slot] = null;
  g.invalidate();
  return null;
}

export function equipSetCount(g: Game): number {
  return 1 + (g.state.shop['equip_set_2'] ? 1 : 0) + (g.state.shop['equip_set_3'] ? 1 : 0);
}
export function switchSet(g: Game, idx: number): string | null {
  if (idx < 0 || idx >= equipSetCount(g)) return '装备方案未解锁';
  if (g.state.combat.active && g.state.combat.area?.kind === 'dungeon') return '副本中无法切换';
  g.state.activeSet = idx;
  g.invalidate();
  return null;
}

// --------------------------------------------------------------------------- 食物
export function foodSlotCount(g: Game): number {
  return 1 + (g.state.shop['food_slot_2'] ? 1 : 0) + (g.state.shop['food_slot_3'] ? 1 : 0);
}
export function equipFood(g: Game, itemId: string, qty: number, slotIdx?: number): string | null {
  const it = C.items[itemId];
  if (!it?.healsFor) return '该物品不是食物';
  const s = g.state;
  const n = foodSlotCount(g);
  let idx = slotIdx ?? s.food.findIndex((f, i) => i < n && f?.id === itemId);
  if (idx < 0) idx = s.food.findIndex((f, i) => i < n && !f);
  if (idx < 0) idx = s.selectedFood;
  if (idx >= n) return '食物栏未解锁';
  qty = Math.min(qty, g.qty(itemId));
  if (qty <= 0) return '数量不足';
  const cur = s.food[idx];
  if (cur && cur.id !== itemId) { const e = unequipFood(g, idx); if (e) return e; }
  g.removeItem(itemId, qty, 'food');
  if (s.food[idx]?.id === itemId) s.food[idx]!.qty += qty; else s.food[idx] = { id: itemId, qty };
  s.selectedFood = idx;
  return null;
}
export function unequipFood(g: Game, idx: number): string | null {
  const f = g.state.food[idx];
  if (!f) return null;
  if (!g.canAddItem(f.id)) return '银行已满';
  g.addItem(f.id, f.qty, 'food');
  g.state.food[idx] = null;
  return null;
}

// --------------------------------------------------------------------------- 药水
export function usePotion(g: Game, itemId: string): string | null {
  const it = C.items[itemId];
  if (!it?.potion) return '该物品不是药水';
  const key = it.potion.skill;
  const s = g.state;
  // 替换当前药水时，剩余充能被丢弃
  if (!g.removeItem(itemId, 1, 'potion')) return '数量不足';
  s.potions[key] = { itemId, charges: it.potion.charges + g.mods.get('potionCharges') };
  g.stat('potionsUsed');
  g.invalidate();
  return null;
}
export function removePotion(g: Game, key: string) {
  delete g.state.potions[key];
  g.invalidate();
}
