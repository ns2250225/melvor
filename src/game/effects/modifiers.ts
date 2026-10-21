// 统一效果系统：汇总所有来源的修饰符。
// 运算规则：同名修饰符加法叠加；百分比修饰符最终以 (1 + Σ/100) 乘算；
// 技能耗时 = 基础 × (1 + Σ%/100) + Σ固定；概率类数值封顶。
import type { Game } from '../core/game';
import type { ModifierMap, SkillId } from '../core/types';
import { C } from '@/content';
import { MASTERY_CHECKPOINTS, masteryPoolCap } from '../core/xp';
import { DEITIES } from '@/content/recipes/support';

export interface ModifierSource { name: string; modifiers: ModifierMap }

export class Modifiers {
  map: Record<string, number> = {};
  sources: ModifierSource[] = [];
  /** 取值：全局 + 指定作用域 */
  get(key: string, scope?: string): number {
    const base = this.map[key] || 0;
    return scope ? base + (this.map[`${key}:${scope}`] || 0) : base;
  }
  has(key: string): boolean { return (this.map[key] || 0) > 0; }
  add(mods: ModifierMap | undefined, name: string, mult = 1) {
    if (!mods) return;
    for (const [k, v] of Object.entries(mods)) this.map[k] = (this.map[k] || 0) + v * mult;
    this.sources.push({ name, modifiers: mods });
  }
}

/** 掌握度池检查点奖励 */
export function poolCheckpointMods(skill: SkillId, pct: number): ModifierMap {
  const m: ModifierMap = {};
  if (pct >= MASTERY_CHECKPOINTS[0]) m[`masteryXP:${skill}`] = 5;
  if (pct >= MASTERY_CHECKPOINTS[1]) m[`skillInterval:${skill}`] = -3;
  if (pct >= MASTERY_CHECKPOINTS[2]) m[`doubleItems:${skill}`] = 5;
  if (pct >= MASTERY_CHECKPOINTS[3]) { m[`skillXP:${skill}`] = 5; m[`preservation:${skill}`] = 5; }
  return m;
}

export const CHECKPOINT_DESCRIPTIONS = ['掌握度经验 +5%', '技能耗时 -3%', '双倍产出 +5%', '技能经验 +5%，材料节省 +5%'];

export function computeModifiers(g: Game): Modifiers {
  const s = g.state;
  const mods = new Modifiers();
  const set = s.equipmentSets[s.activeSet];
  // 装备（召唤石板只在有数量时生效）
  for (const [slot, stack] of Object.entries(set)) {
    if (!stack || stack.qty <= 0) continue;
    const it = C.items[stack.id];
    if (!it?.equipment) continue;
    if (slot === 'gloves' && C.shop[`buy_${stack.id}`]?.charges && (s.glovesCharges[stack.id] || 0) <= 0) continue;
    mods.add(it.equipment.modifiers, it.name);
  }
  // 召唤协同
  const f1 = set.summon1 && set.summon1.qty > 0 ? C.items[set.summon1.id]?.tablet?.familiarId : undefined;
  const f2 = set.summon2 && set.summon2.qty > 0 ? C.items[set.summon2.id]?.tablet?.familiarId : undefined;
  if (f1 && f2) {
    const syn = C.synergies.find((x) => (x.a === f1 && x.b === f2) || (x.a === f2 && x.b === f1));
    if (syn && g.markLevel(f1) >= 3 && g.markLevel(f2) >= 3) mods.add(syn.modifiers, `协同：${syn.description}`);
  }
  // 药水
  for (const p of Object.values(s.potions)) {
    const it = C.items[p.itemId];
    if (it?.potion && p.charges > 0) mods.add(it.potion.modifiers, it.name);
  }
  // 商店永久升级（被替代的低档不再生效）
  for (const [id, count] of Object.entries(s.shop)) {
    const def = C.shop[id];
    if (!def?.upgrade?.modifiers || count <= 0) continue;
    const replacedBy = Object.values(C.shop).find((x) => x.replaces === id && (s.shop[x.id] || 0) > 0);
    if (replacedBy) continue;
    mods.add(def.upgrade.modifiers, def.name, count);
  }
  // 宠物
  for (const id of Object.keys(s.pets)) mods.add(C.pets[id]?.modifiers, C.pets[id]?.name ?? id);
  // 敏捷障碍
  for (const obsId of Object.values(s.agility.built)) {
    if (!obsId) continue;
    const o = C.obstacles[obsId];
    if (!o) continue;
    const mastery = g.masteryLevel(obsId);
    // 掌握度 99 时负面效果减半
    const m: ModifierMap = {};
    for (const [k, v] of Object.entries(o.modifiers)) m[k] = v < 0 && mastery >= 99 ? v / 2 : v;
    mods.add(m, `障碍：${o.name}`);
  }
  // 占星
  for (const [cid, lv] of Object.entries(s.astrology)) {
    const c = C.constellations[cid];
    if (!c) continue;
    c.standard.forEach((m, i) => { if (lv.std[i] > 0) mods.add({ [m.key]: m.perLevel * lv.std[i] }, `${c.name}`); });
    c.unique.forEach((m, i) => { if (lv.uniq[i] > 0) mods.add({ [m.key]: m.perLevel * lv.uniq[i] }, `${c.name}（独特）`); });
  }
  // 战斗：祈祷与光环
  for (const pid of s.prayers) mods.add(C.prayers[pid]?.modifiers, C.prayers[pid]?.name ?? pid);
  if (s.magic.aura && s.combat.active) mods.add(C.spells[s.magic.aura]?.modifiers, C.spells[s.magic.aura]?.name ?? '');
  // 掌握度池检查点
  for (const sid of C.skillOrder) {
    const sk = C.skills[sid];
    if (!sk.masteryEnabled) continue;
    const count = sk.actions.filter((a) => C.actions[a].masteryEnabled !== false).length;
    if (!count) continue;
    const pct = s.skills[sid].masteryPoolXp / masteryPoolCap(count);
    if (pct >= MASTERY_CHECKPOINTS[0]) mods.add(poolCheckpointMods(sid, pct), `${sk.name}掌握度池`);
  }
  // 技能树
  for (const sid of C.skillOrder) for (const node of s.skills[sid].treeNodes) mods.add(C.skillTree[node]?.modifiers, C.skillTree[node]?.name ?? node);
  // 制图地标
  for (const pid of s.cartography.discovered) mods.add(C.pois[pid]?.modifiers, C.pois[pid]?.name ?? pid);
  // 城镇信仰
  const deity = DEITIES.find((d) => d.id === s.township.deity);
  if (deity && s.township.worship >= 20) mods.add(deity.mods, `信仰：${deity.name}`);
  return mods;
}
