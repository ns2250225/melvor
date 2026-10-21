// 战斗属性计算：装备汇总、命中/闪避/最大伤害、战斗三角、玩家生命与进食
import type { Game } from '../core/game';
import type { AttackType, MonsterDef, Stats, StatKey, SpellDef } from '../core/types';
import type { ActiveEffect, EnemyState } from '../core/state';
import { C } from '@/content';
import { usePotionCharge } from '../production/actions';

export const STAT_KEYS: StatKey[] = ['attackSpeed', 'stabAttack', 'slashAttack', 'blockAttack', 'meleeStrength', 'rangedAttack', 'rangedStrength', 'magicAttack', 'magicDamage', 'meleeDefence', 'rangedDefence', 'magicDefence', 'damageReduction', 'abyssalResistance', 'summoningMaxHit'];
export const STAT_NAMES: Record<StatKey, string> = {
  attackSpeed: '攻击间隔', stabAttack: '刺击加成', slashAttack: '劈砍加成', blockAttack: '钝击加成', meleeStrength: '近战力量',
  rangedAttack: '远程攻击', rangedStrength: '远程力量', magicAttack: '魔法攻击', magicDamage: '魔法伤害%', meleeDefence: '近战防御',
  rangedDefence: '远程防御', magicDefence: '魔法防御', damageReduction: '伤害减免%', abyssalResistance: '深渊抗性', summoningMaxHit: '召唤最大伤害',
};

export function gearStats(g: Game): Stats {
  const set = g.state.equipmentSets[g.state.activeSet];
  const out: Stats = {};
  for (const [slot, st] of Object.entries(set)) {
    if (!st || st.qty <= 0) continue;
    if (slot === 'consumable') continue;
    const eq = C.items[st.id]?.equipment;
    if (!eq) continue;
    for (const [k, v] of Object.entries(eq.stats)) {
      if (k === 'attackSpeed' && slot !== 'weapon') continue;
      if (k === 'summoningMaxHit') continue;
      out[k as StatKey] = (out[k as StatKey] || 0) + (v as number);
    }
  }
  return out;
}

export function playerMaxHp(g: Game): number {
  const base = g.level('hitpoints') * 10 + g.mods.get('flatMaxHP');
  return Math.max(10, Math.floor(base * (1 + g.mods.get('maxHP') / 100)));
}

export function healPlayer(g: Game, amount: number) {
  g.state.hp = Math.min(playerMaxHp(g), g.state.hp + Math.max(0, Math.round(amount)));
}
export function damagePlayerRaw(g: Game, dmg: number) {
  g.state.hp = Math.max(0, g.state.hp - Math.max(0, Math.round(dmg)));
}

export function foodHeal(g: Game, foodId: string): number {
  return Math.round((C.items[foodId]?.healsFor ?? 0) * (1 + g.mods.get('foodHealing') / 100));
}

/** 手动进食（满效率） */
export function eatFood(g: Game, slotIdx = g.state.selectedFood): boolean {
  const f = g.state.food[slotIdx];
  if (!f || f.qty <= 0) return false;
  if (g.state.hp >= playerMaxHp(g)) return false;
  healPlayer(g, foodHeal(g, f.id));
  f.qty--;
  g.stat('foodEaten');
  if (f.qty <= 0) g.state.food[slotIdx] = null;
  return true;
}

/** 自动进食：生命低于阈值时持续进食至上限 */
export function tryAutoEat(g: Game, force = false): boolean {
  const threshold = g.mods.get('autoEatThreshold');
  const max = playerMaxHp(g);
  let ate = false;
  // 治疗药水
  const pot = g.state.potions['combat'];
  if (pot && C.items[pot.itemId]?.potion?.healPercent && g.state.hp < max * 0.2) {
    healPlayer(g, (max * C.items[pot.itemId].potion!.healPercent!) / 100);
    usePotionCharge(g, 'combat');
    ate = true;
  }
  if (threshold <= 0 && !force) return ate;
  if (g.state.hp >= max * (threshold / 100) && !force) return ate;
  const limit = Math.max(threshold, g.mods.get('autoEatLimit')) || 100;
  const eff = (g.mods.get('autoEatEfficiency') || 100) / 100;
  let guard = 0;
  while (g.state.hp < max * (limit / 100) && guard++ < 50) {
    let idx = g.state.selectedFood;
    if (!g.state.food[idx]?.qty) idx = g.state.food.findIndex((f) => f && f.qty > 0);
    if (idx < 0) break;
    const f = g.state.food[idx]!;
    if (threshold <= 0 && force) { healPlayer(g, foodHeal(g, f.id)); }
    else healPlayer(g, foodHeal(g, f.id) * eff);
    f.qty--;
    g.stat('foodEaten');
    if (f.qty <= 0) g.state.food[idx] = null;
    ate = true;
    if (threshold <= 0) break;
  }
  return ate;
}

// ============================================================================ 战斗三角
const ADV: Record<AttackType, AttackType> = { melee: 'ranged', ranged: 'magic', magic: 'melee' };
export function triangle(g: Game, player: AttackType, enemy: AttackType): { dmg: number; dr: number } {
  const hardcore = C.gameModes[g.state.player.mode].combatTriangle === 'hardcore';
  if (ADV[player] === enemy) return { dmg: 1.1, dr: 1.25 };
  if (ADV[enemy] === player) return hardcore ? { dmg: 0.75, dr: 0.25 } : { dmg: 0.85, dr: 0.5 };
  return { dmg: 1, dr: 1 };
}

export function hitChance(acc: number, eva: number): number {
  if (acc <= 0) return 0;
  if (eva <= 0) return 1;
  return acc < eva ? (0.5 * acc) / eva : 1 - (0.5 * eva) / acc;
}

export function strengthMaxHit(effLevel: number, bonus: number): number {
  return Math.floor(10 * (1.3 + effLevel / 10 + bonus / 80 + (effLevel * bonus) / 640));
}

// ============================================================================ 玩家战斗属性
export interface PlayerCombatStats {
  attackType: AttackType;
  attackInterval: number;
  accuracy: number;
  maxHit: number;
  minHit: number;
  evasion: Record<AttackType, number>;
  damageReduction: number;
  abyssalResistance: number;
  maxHp: number;
  summonMaxHit: number;
  spell: SpellDef | null;
  ammoId: string | null;
  usesThrown: boolean;
  problem: string | null;
  gear: Stats;
}

export function selectedCombatSpell(g: Game): SpellDef | null {
  const id = g.state.magic.spell;
  const sp = id ? C.spells[id] : null;
  if (!sp || !['standard', 'ancient', 'archaic', 'abyssal'].includes(sp.book)) return null;
  return sp;
}

export function playerCombatStats(g: Game, enemy?: MonsterDef | null): PlayerCombatStats {
  const s = g.state;
  const set = s.equipmentSets[s.activeSet];
  const gear = gearStats(g);
  const mods = g.mods;
  const weapon = set.weapon ? C.items[set.weapon.id]?.equipment : undefined;
  const quiver = set.quiver ? C.items[set.quiver.id]?.equipment : undefined;
  let attackType: AttackType = weapon?.attackType ?? 'melee';
  let usesThrown = false;
  let problem: string | null = null;
  let ammoId: string | null = null;
  if (!weapon && quiver?.ammoType === 'javelin' && (set.quiver?.qty ?? 0) > 0) { attackType = 'ranged'; usesThrown = true; ammoId = set.quiver!.id; }
  if (attackType === 'ranged' && !usesThrown) {
    if (!quiver || quiver.ammoType !== weapon?.ammoType || (set.quiver?.qty ?? 0) <= 0) problem = '缺少匹配的弹药';
    else ammoId = set.quiver!.id;
  }
  const spell = attackType === 'magic' ? selectedCombatSpell(g) : null;
  if (attackType === 'magic' && !spell) problem = '未选择战斗法术';
  if (attackType === 'magic' && spell && g.level('magic') < spell.level) problem = `需要魔法 ${spell.level} 级`;

  let interval = weapon?.stats.attackSpeed ?? (usesThrown ? 2400 : 2400);
  if (attackType === 'ranged' && s.combat.rangedStyle === 'rapid') interval -= 400;
  interval = Math.max(500, Math.round(interval * (1 + mods.get('attackInterval') / 100)));

  const lv = (k: 'attack' | 'strength' | 'defence' | 'ranged' | 'magic' | 'hitpoints') => g.level(k);
  const onTask = !!enemy && s.slayer.task?.monsterId === enemy.id;
  let accuracy = 0, maxHit = 0;
  if (attackType === 'melee') {
    const bonus = s.combat.meleeStyle === 'stab' ? gear.stabAttack ?? 0 : s.combat.meleeStyle === 'slash' ? gear.slashAttack ?? 0 : gear.blockAttack ?? 0;
    accuracy = (lv('attack') + 9) * (bonus + 64) * (1 + (mods.get('meleeAccuracy') + mods.get('accuracy')) / 100);
    maxHit = strengthMaxHit(lv('strength') + 9, gear.meleeStrength ?? 0) * (1 + (mods.get('meleeMaxHit') + mods.get('maxHit')) / 100);
  } else if (attackType === 'ranged') {
    const styleBonus = s.combat.rangedStyle === 'accurate' ? 3 : 0;
    accuracy = (lv('ranged') + 9 + styleBonus) * ((gear.rangedAttack ?? 0) + 64) * (1 + (mods.get('rangedAccuracy') + mods.get('accuracy')) / 100);
    maxHit = strengthMaxHit(lv('ranged') + 9, gear.rangedStrength ?? 0) * (1 + (mods.get('rangedMaxHit') + mods.get('maxHit')) / 100);
  } else {
    accuracy = (lv('magic') + 9) * ((gear.magicAttack ?? 0) + 64) * (1 + (mods.get('magicAccuracy') + mods.get('accuracy')) / 100);
    const base = spell?.maxHit ?? 0;
    maxHit = base * (1 + (gear.magicDamage ?? 0) / 100) * (1 + (lv('magic') + 1) / 200) * (1 + (mods.get('magicMaxHit') + mods.get('maxHit')) / 100);
  }
  if (onTask) { accuracy *= 1 + mods.get('slayerTaskAccuracy') / 100; maxHit *= 1 + mods.get('slayerTaskDamage') / 100; }
  // 深渊：普通等级 99 以上时每个深渊等级 +1% 伤害与命中
  if (enemy?.realm === 'abyssal') {
    const al = attackType === 'melee' ? g.abyssalLevel('strength') : g.abyssalLevel(attackType === 'ranged' ? 'ranged' : 'magic');
    maxHit *= 1 + al / 100;
    accuracy *= 1 + g.abyssalLevel(attackType === 'melee' ? 'attack' : attackType) / 100;
  }
  const defStyle = (attackType === 'melee' && s.combat.meleeStyle === 'block') || (attackType === 'ranged' && s.combat.rangedStyle === 'longrange') || (attackType === 'magic' && s.combat.magicStyle === 'defensive') ? 3 : 0;
  const evaMult = 1 + mods.get('evasion') / 100;
  const def = lv('defence') + 9 + defStyle;
  const abyssDef = enemy?.realm === 'abyssal' ? 1 + g.abyssalLevel('defence') / 100 : 1;
  const evasion = {
    melee: def * ((gear.meleeDefence ?? 0) + 64) * (1 + mods.get('meleeEvasion') / 100) * evaMult * abyssDef,
    ranged: def * ((gear.rangedDefence ?? 0) + 64) * (1 + mods.get('rangedEvasion') / 100) * evaMult * abyssDef,
    magic: (0.7 * lv('magic') + 0.3 * lv('defence') + 9 + defStyle) * ((gear.magicDefence ?? 0) + 64) * (1 + mods.get('magicEvasion') / 100) * evaMult * abyssDef,
  };
  const dr = Math.max(0, Math.min(95, (gear.damageReduction ?? 0) + mods.get('damageReductionFlat')));
  const ar = Math.max(0, Math.min(95, (gear.abyssalResistance ?? 0) + mods.get('abyssalResistanceFlat')));
  let summonMaxHit = 0;
  for (const slot of ['summon1', 'summon2'] as const) {
    const st = set[slot];
    if (!st || st.qty <= 0) continue;
    const fam = C.familiars[C.items[st.id]?.tablet?.familiarId ?? ''];
    if (fam?.combat) summonMaxHit = Math.max(summonMaxHit, Math.round(fam.combat.maxHit * (1 + g.level('summoning') / 200)));
  }
  return {
    attackType, attackInterval: interval, accuracy: Math.round(accuracy), maxHit: Math.max(1, Math.floor(maxHit)), minHit: 1,
    evasion: { melee: Math.round(evasion.melee), ranged: Math.round(evasion.ranged), magic: Math.round(evasion.magic) },
    damageReduction: dr, abyssalResistance: ar, maxHp: playerMaxHp(g), summonMaxHit, spell, ammoId, usesThrown, problem, gear,
  };
}

// ============================================================================ 怪物属性
export interface MonsterCombatStats { accuracy: number; maxHit: number; evasion: Record<AttackType, number>; damageReduction: number; attackInterval: number; maxHp: number }

export function effectValue(effects: ActiveEffect[], kind: string): number {
  let v = 0;
  for (const e of effects) if (e.kind === kind && e.turns > 0) v = Math.max(v, e.value);
  return v;
}

export function enemyModifiers(g: Game, enemy: EnemyState | null): Record<string, number> {
  const out: Record<string, number> = {};
  const add = (m?: Record<string, number>) => { if (m) for (const [k, v] of Object.entries(m)) out[k] = (out[k] || 0) + v; };
  const area = g.state.combat.area;
  if (area && area.kind !== 'dungeon') {
    const ae = C.areas[area.id]?.areaEffect;
    if (ae?.target === 'enemy') add(ae.modifiers);
  }
  if (enemy) {
    add(C.monsters[enemy.monsterId]?.passives);
    for (const cid of enemy.corruption) add(C.corruptionEffects[cid]?.enemyModifiers);
  }
  return out;
}

export function monsterCombatStats(g: Game, m: MonsterDef, enemy: EnemyState | null = null): MonsterCombatStats {
  const b = m.bonuses;
  const em = enemyModifiers(g, enemy);
  const pct = (k: string) => 1 + (em[k] || 0) / 100;
  let accuracy = 0, maxHit = 0;
  if (m.attackType === 'melee') { accuracy = (m.attack + 9) * ((b.stabAttack ?? 0) + 64); maxHit = strengthMaxHit(m.strength + 9, b.meleeStrength ?? 0); }
  else if (m.attackType === 'ranged') { accuracy = (m.ranged + 9) * ((b.rangedAttack ?? 0) + 64); maxHit = strengthMaxHit(m.ranged + 9, b.rangedStrength ?? 0); }
  else { accuracy = (m.magic + 9) * ((b.magicAttack ?? 0) + 64); maxHit = m.maxHitOverride ?? strengthMaxHit(m.magic + 9, (b.magicDamage ?? 0) * 3); }
  const effects = enemy?.effects ?? [];
  accuracy *= pct('accuracy') * (1 - effectValue(effects, 'blind') / 100);
  maxHit *= pct('maxHit') * (1 - effectValue(effects, 'weaken') / 100);
  const evaMult = pct('evasion') * (1 - effectValue(effects, 'curse') / 100);
  const evasion = {
    melee: (m.defence + 9) * ((b.meleeDefence ?? 0) + 64) * evaMult,
    ranged: (m.defence + 9) * ((b.rangedDefence ?? 0) + 64) * evaMult,
    magic: (0.7 * m.magic + 0.3 * m.defence + 9) * ((b.magicDefence ?? 0) + 64) * evaMult,
  };
  const dr = Math.max(0, Math.min(95, (b.damageReduction ?? 0) + (em.damageReductionFlat || 0) + effectValue(effects, 'shield')));
  const interval = Math.round(m.attackSpeed * pct('attackInterval') * (1 + effectValue(effects, 'slow') / 100));
  const maxHp = Math.round(m.hitpoints * 10 * pct('maxHP'));
  return { accuracy: Math.round(accuracy), maxHit: Math.max(1, Math.floor(maxHit)), evasion, damageReduction: dr, attackInterval: interval, maxHp };
}

export function combatLevel(g: Game): number {
  const l = (k: 'attack' | 'strength' | 'defence' | 'hitpoints' | 'ranged' | 'magic' | 'prayer') => g.level(k);
  const base = 0.25 * (l('defence') + l('hitpoints') + Math.floor(l('prayer') / 2));
  const melee = 0.325 * (l('attack') + l('strength'));
  const ranged = 0.325 * Math.floor(1.5 * l('ranged'));
  const magic = 0.325 * Math.floor(1.5 * l('magic'));
  return Math.floor(base + Math.max(melee, ranged, magic));
}
