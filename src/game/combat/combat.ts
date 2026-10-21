// 战斗引擎：50ms tick 驱动的自动战斗、特殊攻击、状态效果、屏障、掉落、副本、死亡、Slayer
import type { Game } from '../core/game';
import type { MonsterDef, AttackType, SpecialAttackDef, StatusEffectApply } from '../core/types';
import type { ActiveEffect, EnemyState, CombatLogEntry } from '../core/state';
import { C } from '@/content';
import {
  playerCombatStats, monsterCombatStats, hitChance, triangle, playerMaxHp, healPlayer, tryAutoEat, effectValue,
} from './stats';
import { rollDropTable } from './loot';
import { consumeRunes, spellRunesAvailable, usePotionCharge, stopSkillAction, rollMarks } from '../production/actions';

const RESPAWN_MS = 3000;
const SUMMON_INTERVAL = 3000;
const REGEN_INTERVAL = 10000;
const DOT_INTERVAL = 1000;

function log(g: Game, text: string, kind: CombatLogEntry['kind'] = 'info') {
  if (g.simulating || !g.state.settings.showCombatLog) return;
  const l = g.state.combat.log;
  l.unshift({ t: g.state.clock, text, kind });
  if (l.length > 60) l.length = 60;
}

// ============================================================================ 进入 / 离开
export function areaEntryError(g: Game, kind: 'area' | 'slayer' | 'dungeon', id: string): string | null {
  if (kind === 'dungeon') {
    const d = C.dungeons[id];
    if (!d) return '无效副本';
    for (const r of d.requirements) if (!g.meets(r)) return `需要：${g.describeReq(r)}`;
    return null;
  }
  const a = C.areas[id];
  if (!a) return '无效区域';
  for (const r of a.requirements) if (!g.meets(r)) return `需要：${g.describeReq(r)}`;
  for (const e of a.entryEquipment ?? []) if (!g.meets({ type: 'equipped', id: e })) return `需要装备：${C.items[e].name}`;
  return null;
}

export function startCombat(g: Game, kind: 'area' | 'slayer' | 'dungeon', id: string, monster?: string): string | null {
  const err = areaEntryError(g, kind, id);
  if (err) return err;
  if (kind !== 'dungeon') {
    const a = C.areas[id];
    if (!monster || !a.monsters.includes(monster)) return '请选择怪物';
  }
  const s = g.state;
  if (s.activeAction) stopSkillAction(g, '切换活动');
  const stats = playerCombatStats(g);
  if (stats.problem) return stats.problem;
  const c = s.combat;
  c.active = true;
  c.area = { kind, id, monster };
  c.dungeonIndex = 0;
  c.enemy = null;
  c.spawnTimer = kind === 'dungeon' ? 1000 : RESPAWN_MS / 2;
  c.playerAttackTimer = stats.attackInterval;
  c.playerEffects = [];
  c.summonTimer = SUMMON_INTERVAL;
  c.redemptionUsed = false;
  c.killsThisRun = 0;
  s.player.realm = kind === 'dungeon' ? C.dungeons[id].realm : C.areas[id].realm;
  const name = kind === 'dungeon' ? C.dungeons[id].name : C.areas[id].name;
  log(g, `进入 ${name}`);
  g.invalidate();
  g.events.emit('combatStart', { areaId: id });
  return null;
}

export function stopCombat(g: Game, reason = '玩家停止') {
  const c = g.state.combat;
  if (!c.active) return;
  c.active = false;
  c.enemy = null;
  c.playerEffects = [];
  c.dungeonIndex = 0;
  g.state.prayers = [];
  g.invalidate();
  log(g, `战斗结束：${reason}`);
  if (reason !== '玩家停止' && reason !== '切换活动') {
    g.notify(`战斗已停止：${reason}`, 'warning');
    g.stopReasons.push(`战斗：${reason}`);
  }
  g.events.emit('combatEnd', { reason });
}

// ============================================================================ 敌人生成
function nextMonsterId(g: Game): string | null {
  const area = g.state.combat.area;
  if (!area) return null;
  if (area.kind === 'dungeon') return C.dungeons[area.id].monsters[g.state.combat.dungeonIndex] ?? null;
  return area.monster ?? null;
}

function spawnEnemy(g: Game) {
  const id = nextMonsterId(g);
  if (!id) return;
  const m = C.monsters[id];
  const corruption: string[] = [];
  if (m.realm === 'abyssal') {
    const lvl = g.level('corruption');
    for (const cid of g.state.corruption.enabled) if ((C.corruptionEffects[cid]?.level ?? 999) <= lvl) corruption.push(cid);
  }
  const enemy: EnemyState = { monsterId: id, hp: 0, maxHp: 0, barrier: 0, maxBarrier: 0, attackTimer: 0, effects: [], corruption };
  const ms = monsterCombatStats(g, m, enemy);
  enemy.hp = enemy.maxHp = ms.maxHp;
  const barrierMult = 1 + corruption.reduce((a, c) => a + (C.corruptionEffects[c].enemyModifiers.barrier || 0), 0) / 100;
  enemy.barrier = enemy.maxBarrier = Math.round((m.barrier ?? 0) * 10 * barrierMult);
  enemy.attackTimer = ms.attackInterval;
  g.state.combat.enemy = enemy;
  log(g, `${m.name}（等级 ${m.level}）出现了`, 'info');
}

// ============================================================================ 主循环
export function tickCombat(g: Game, ms: number) {
  const c = g.state.combat;
  if (!c.active) return;
  tickRegen(g, ms);
  if (!c.enemy) {
    c.spawnTimer -= ms;
    if (c.spawnTimer <= 0) spawnEnemy(g);
    return;
  }
  // 持续效果（DoT、回复）
  tickEffects(g, ms);
  if (!c.active || !c.enemy) return;
  // 召唤兽
  c.summonTimer -= ms;
  if (c.summonTimer <= 0) {
    c.summonTimer += SUMMON_INTERVAL;
    const summonMaxHit = playerCombatStats(g, C.monsters[c.enemy.monsterId]).summonMaxHit;
    if (summonMaxHit > 0) { summonAttack(g, summonMaxHit); if (!c.enemy) return; }
  }
  c.playerAttackTimer -= ms;
  if (c.playerAttackTimer <= 0) {
    playerAttack(g);
    if (!c.active) return;
    c.playerAttackTimer += playerCombatStats(g).attackInterval;
    if (!c.enemy) return;
  }
  const enemy = c.enemy;
  enemy.attackTimer -= ms;
  if (enemy.attackTimer <= 0) {
    enemyAttack(g);
    if (c.enemy === enemy) enemy.attackTimer += monsterCombatStats(g, C.monsters[enemy.monsterId], enemy).attackInterval;
  }
}

export function tickRegen(g: Game, ms: number) {
  const c = g.state.combat;
  c.regenTimer += ms;
  if (c.regenTimer >= REGEN_INTERVAL) {
    c.regenTimer -= REGEN_INTERVAL;
    const max = playerMaxHp(g);
    if (g.state.hp < max) {
      const mult = Math.max(0, 1 + g.mods.get('hpRegen') / 100 + areaPlayerMod(g, 'hpRegen') / 100);
      healPlayer(g, Math.max(1, max * 0.01) * mult);
    }
  }
}

function areaPlayerMod(g: Game, key: string): number {
  const area = g.state.combat.area;
  if (!g.state.combat.active || !area || area.kind === 'dungeon') return 0;
  const ae = C.areas[area.id]?.areaEffect;
  return ae?.target === 'player' ? ae.modifiers[key] || 0 : 0;
}

function tickEffects(g: Game, ms: number) {
  const c = g.state.combat;
  const process = (effects: ActiveEffect[], onDamage: (d: number, kind: string) => void, onHeal: (pct: number) => void) => {
    for (const e of effects) {
      if (!['poison', 'burn', 'bleed', 'corruption', 'regen', 'decay'].includes(e.kind)) continue;
      e.tickTimer = (e.tickTimer ?? 0) + ms;
      while (e.tickTimer >= DOT_INTERVAL && e.turns > 0) {
        e.tickTimer -= DOT_INTERVAL;
        e.turns--;
        if (e.kind === 'regen') onHeal(e.value); else onDamage(e.value, e.kind);
      }
    }
    for (let i = effects.length - 1; i >= 0; i--) if (effects[i].turns <= 0) effects.splice(i, 1);
  };
  process(c.playerEffects, (d, kind) => {
    g.state.hp = Math.max(0, g.state.hp - d);
    log(g, `你受到 ${d} 点${effectName(kind)}伤害`, 'danger');
    afterPlayerDamaged(g);
  }, (pct) => healPlayer(g, playerMaxHp(g) * pct));
  if (!c.active || !c.enemy) return;
  const enemy = c.enemy;
  process(enemy.effects, (d, kind) => {
    const dmg = kind === 'decay' ? Math.max(1, Math.round(enemy.hp * d / 100)) : d;
    enemy.hp = Math.max(0, enemy.hp - dmg);
    log(g, `${C.monsters[enemy.monsterId].name} 受到 ${dmg} 点${effectName(kind)}伤害`, 'player');
    if (enemy.hp <= 0) monsterKilled(g);
  }, (pct) => { enemy.hp = Math.min(enemy.maxHp, enemy.hp + Math.round(enemy.maxHp * pct)); });
}

const EFFECT_NAMES: Record<string, string> = { poison: '中毒', burn: '燃烧', bleed: '流血', corruption: '腐化', decay: '衰败', stun: '击晕', freeze: '冰冻', sleep: '沉睡', slow: '迟缓', weaken: '虚弱', blind: '致盲', curse: '诅咒', vulnerable: '破绽', regen: '回复', shield: '护盾' };
export const effectName = (k: string) => EFFECT_NAMES[k] ?? k;

function applyEffect(g: Game, target: 'player' | 'enemy', eff: StatusEffectApply, sourceMaxHit: number) {
  if (!g.rng.chance(eff.chance)) return;
  const c = g.state.combat;
  const list = target === 'player' ? c.playerEffects : c.enemy?.effects;
  if (!list) return;
  if (target === 'player') {
    if ((eff.kind === 'poison' && g.mods.has('poisonImmunity')) || (eff.kind === 'burn' && g.mods.has('burnImmunity'))) return;
    if (['stun', 'freeze', 'sleep'].includes(eff.kind) && g.mods.has('stunImmunity')) return;
  }
  const isDot = ['poison', 'burn', 'bleed', 'corruption'].includes(eff.kind);
  const value = isDot ? Math.max(1, Math.round((eff.value ?? 0.1) * sourceMaxHit)) : (eff.value ?? 0);
  const existing = list.find((e) => e.kind === eff.kind);
  if (existing) { existing.turns = Math.max(existing.turns, eff.turns ?? 1); existing.value = Math.max(existing.value, value); }
  else list.push({ kind: eff.kind, turns: eff.turns ?? 1, value, tickTimer: 0 });
  if (target === 'player' && eff.kind === 'corruption') list.push({ kind: 'blind', turns: eff.turns ?? 3, value: 10 });
}

/** 行动前检查控制效果（返回 true 表示本回合被跳过），并消耗基于回合的效果 */
function consumeTurn(effects: ActiveEffect[]): boolean {
  let skipped = false;
  for (const e of effects) {
    if (['stun', 'freeze', 'sleep'].includes(e.kind) && e.turns > 0) { e.turns--; skipped = true; }
    else if (['slow', 'weaken', 'blind', 'curse', 'vulnerable', 'shield'].includes(e.kind)) e.turns--;
  }
  for (let i = effects.length - 1; i >= 0; i--) if (effects[i].turns <= 0 && !['poison', 'burn', 'bleed', 'corruption', 'regen', 'decay'].includes(effects[i].kind)) effects.splice(i, 1);
  return skipped;
}

function pickSpecial(g: Game, ids: string[] | undefined): SpecialAttackDef | null {
  if (!ids?.length) return null;
  for (const id of ids) {
    const sp = C.specialAttacks[id];
    if (sp && g.rng.percent(sp.chance)) return sp;
  }
  return null;
}

// ============================================================================ 玩家攻击
function playerAttack(g: Game) {
  const s = g.state;
  const c = s.combat;
  const enemy = c.enemy!;
  const m = C.monsters[enemy.monsterId];
  const stats = playerCombatStats(g, m);
  if (stats.problem) { stopCombat(g, stats.problem); return; }
  if (consumeTurn(c.playerEffects)) { log(g, '你无法行动！', 'danger'); return; }
  const set = s.equipmentSets[s.activeSet];
  // 弹药与符文
  if (stats.attackType === 'ranged') {
    const q = set.quiver;
    if (!q || q.qty <= 0) { stopCombat(g, '弹药耗尽'); return; }
    if (!g.rng.percent(Math.min(80, g.mods.get('ammoPreservation')))) {
      q.qty--;
      if (q.qty <= 0) { set.quiver = null; g.invalidate(); }
    }
  }
  if (stats.attackType === 'magic' && stats.spell) {
    if (!spellRunesAvailable(g, stats.spell.runes)) { stopCombat(g, '符文不足'); return; }
    consumeRunes(g, stats.spell.runes);
  }
  // 诅咒
  const curse = s.magic.curse ? C.spells[s.magic.curse] : null;
  if (curse?.curse && g.level('magic') >= curse.level && spellRunesAvailable(g, curse.runes) && !enemy.effects.some((e) => e.turns > 0 && e.kind === curseKind(curse.curse!.kind))) {
    consumeRunes(g, curse.runes);
    enemy.effects.push({ kind: curseKind(curse.curse.kind), turns: curse.curse.turns, value: curse.curse.value, tickTimer: 0 });
  }
  // 光环：每次攻击消耗符文，符文不足时自动关闭
  const aura = s.magic.aura ? C.spells[s.magic.aura] : null;
  if (aura) {
    if (g.level('magic') >= aura.level && spellRunesAvailable(g, aura.runes)) consumeRunes(g, aura.runes);
    else { s.magic.aura = null; g.invalidate(); g.notify('光环因符文不足或等级不足而关闭', 'warning'); }
  }
  // 祈祷消耗
  drainPrayer(g, 'player');
  if (s.potions['combat']) usePotionCharge(g, 'combat');
  // 特殊攻击：武器特殊攻击 / 法术附带特殊攻击
  const weaponSpecials = set.weapon ? C.items[set.weapon.id]?.equipment?.specialAttacks : undefined;
  let spec = pickSpecial(g, weaponSpecials);
  if (!spec && stats.spell?.specialAttack) { const sa = C.specialAttacks[stats.spell.specialAttack]; if (sa && g.rng.percent(35)) spec = sa; }
  const hits = spec?.hits ?? 1;
  const mstats = monsterCombatStats(g, m, enemy);
  const tri = triangle(g, stats.attackType, m.attackType);
  let total = 0;
  for (let i = 0; i < hits && c.enemy === enemy; i++) {
    const chance = spec?.minAccuracyBoost ? 1 : hitChance(stats.accuracy, mstats.evasion[stats.attackType]);
    if (!g.rng.chance(chance)) { log(g, `你的攻击未命中`, 'player'); continue; }
    let dmg = g.rng.int(stats.minHit, stats.maxHit) * (spec?.damageMultiplier ?? 1) * tri.dmg;
    dmg *= 1 + effectValue(enemy.effects, 'vulnerable') / 100;
    dmg = Math.max(1, Math.floor(dmg * (1 - mstats.damageReduction / 100)));
    total += dealDamageToEnemy(g, dmg, false, stats.attackType);
    if (spec?.effects) for (const e of spec.effects) applyEffect(g, e.target === 'self' ? 'player' : 'enemy', e, stats.maxHit);
  }
  if (total > 0) {
    const lifesteal = (g.mods.get('lifesteal') + (spec?.lifesteal ?? 0) * 100) / 100;
    if (lifesteal > 0) healPlayer(g, total * lifesteal);
    log(g, `${spec ? `【${spec.name}】` : ''}你造成 ${total} 点伤害`, 'player');
  }
}

function curseKind(k: string): string {
  return ({ accuracy: 'blind', evasion: 'curse', damage: 'vulnerable', maxhit: 'weaken', decay: 'decay' } as Record<string, string>)[k] ?? k;
}

/** 对敌人造成伤害（处理屏障与经验），返回实际造成伤害 */
function dealDamageToEnemy(g: Game, dmg: number, fromSummon: boolean, type: AttackType): number {
  const c = g.state.combat;
  const enemy = c.enemy;
  if (!enemy) return 0;
  const m = C.monsters[enemy.monsterId];
  let dealt = 0;
  if (enemy.barrier > 0) {
    const toBarrier = fromSummon ? dmg : Math.max(1, Math.floor(dmg * 0.25));
    enemy.barrier = Math.max(0, enemy.barrier - toBarrier);
    dealt = toBarrier;
  } else {
    dealt = Math.min(enemy.hp, dmg);
    enemy.hp -= dealt;
  }
  g.stat('damageDealt', dealt);
  if (!fromSummon) grantCombatXp(g, dealt, type, m);
  else g.addXp('summoning', dealt * 0.04);
  if (enemy.hp <= 0) monsterKilled(g);
  return dealt;
}

function grantCombatXp(g: Game, dmg: number, type: AttackType, m: MonsterDef) {
  const c = g.state.combat;
  const xp = dmg * 0.4;
  const abyss = m.realm === 'abyssal';
  const give = (skill: 'attack' | 'strength' | 'defence' | 'ranged' | 'magic', amt: number) => { g.addXp(skill, amt); if (abyss) g.addAbyssalXp(skill, amt * 0.25); };
  if (type === 'melee') give(c.meleeStyle === 'stab' ? 'attack' : c.meleeStyle === 'slash' ? 'strength' : 'defence', xp);
  else if (type === 'ranged') { if (c.rangedStyle === 'longrange') { give('ranged', xp / 2); give('defence', xp / 2); } else give('ranged', xp); }
  else { if (c.magicStyle === 'defensive') { give('magic', xp / 2); give('defence', xp / 2); } else give('magic', xp); }
  g.addXp('hitpoints', dmg * 0.133);
  if (abyss) {
    g.addAbyssalXp('hitpoints', dmg * 0.033);
    const effects = c.enemy?.corruption.length ?? 0;
    g.addXp('corruption', dmg * 0.3 * (1 + effects * 0.2));
    g.addAbyssalXp('corruption', dmg * 0.05 * (1 + effects * 0.2));
  }
}

function summonAttack(g: Game, maxHit: number) {
  const c = g.state.combat;
  const enemy = c.enemy;
  if (!enemy) return;
  const s = g.state;
  // 消耗召唤石板
  for (const slot of ['summon1', 'summon2'] as const) {
    const st = s.equipmentSets[s.activeSet][slot];
    if (!st || st.qty <= 0) continue;
    const fam = C.familiars[C.items[st.id]?.tablet?.familiarId ?? ''];
    if (!fam?.combat) continue;
    if (!g.rng.percent(g.mods.get('summonChargePreservation'))) {
      st.qty--;
      if (st.qty <= 0) { s.equipmentSets[s.activeSet][slot] = null; g.invalidate(); g.notify(`${fam.name}召唤石板耗尽`, 'warning'); }
    }
    g.addXp('summoning', Math.max(1, fam.level / 5));
    rollMarks(g, 'attack', SUMMON_INTERVAL);
  }
  const dmg = g.rng.int(1, maxHit);
  const dealt = dealDamageToEnemy(g, dmg, true, 'melee');
  log(g, `召唤兽造成 ${dealt} 点${enemy.barrier > 0 || enemy.maxBarrier > 0 ? '（屏障）' : ''}伤害`, 'player');
}

// ============================================================================ 敌人攻击
function enemyAttack(g: Game) {
  const s = g.state;
  const c = s.combat;
  const enemy = c.enemy!;
  const m = C.monsters[enemy.monsterId];
  if (consumeTurn(enemy.effects)) { log(g, `${m.name} 无法行动`, 'info'); return; }
  const mstats = monsterCombatStats(g, m, enemy);
  const pstats = playerCombatStats(g, m);
  const spec = pickSpecial(g, m.specialAttacks);
  const hits = spec?.hits ?? 1;
  const tri = triangle(g, pstats.attackType, m.attackType);
  const protect = { melee: 1, ranged: 2, magic: 3 }[m.attackType];
  const protectActive = g.mods.get('protectFrom') > 0 && s.prayers.some((p) => C.prayers[p]?.modifiers.protectFrom === protect);
  drainPrayer(g, 'enemy');
  let total = 0;
  for (let i = 0; i < hits; i++) {
    let chance = spec?.minAccuracyBoost ? 1 : hitChance(mstats.accuracy, pstats.evasion[m.attackType]);
    if (protectActive) chance *= 0.2;
    chance *= 1 - effectValue(c.playerEffects, 'curse') / 200;
    if (!g.rng.chance(chance)) continue;
    let dmg = g.rng.int(1, mstats.maxHit) * (spec?.damageMultiplier ?? 1);
    dmg *= 1 + effectValue(c.playerEffects, 'vulnerable') / 100;
    if (m.damageType === 'abyssal') dmg *= 1 - pstats.abyssalResistance / 100;
    else dmg *= 1 - Math.min(95, pstats.damageReduction * tri.dr) / 100;
    dmg = Math.max(1, Math.floor(dmg));
    total += dmg;
    if (spec?.effects) for (const e of spec.effects) applyEffect(g, e.target === 'self' ? 'enemy' : 'player', e, mstats.maxHit);
  }
  if (total > 0) {
    s.hp = Math.max(0, s.hp - total);
    g.stat('damageTaken', total);
    if (spec?.lifesteal) enemy.hp = Math.min(enemy.maxHp, enemy.hp + Math.round(total * spec.lifesteal));
    const reflect = g.mods.get('reflectDamage');
    if (reflect > 0) {
      const r = Math.max(1, Math.floor(total * reflect / 100));
      enemy.hp = Math.max(0, enemy.hp - r);
      if (enemy.hp <= 0) { log(g, `${m.name}${spec ? `使用【${spec.name}】` : ''}对你造成 ${total} 点伤害`, 'enemy'); monsterKilled(g); afterPlayerDamaged(g); return; }
    }
    log(g, `${m.name}${spec ? `使用【${spec.name}】` : ''}对你造成 ${total} 点伤害`, 'enemy');
    g.events.emit('playerHit', { damage: total });
  } else log(g, `${m.name}${spec ? `的【${spec.name}】` : '的攻击'}被你闪避`, 'info');
  afterPlayerDamaged(g);
}

function afterPlayerDamaged(g: Game) {
  const s = g.state;
  const max = playerMaxHp(g);
  if (s.hp > 0 && s.hp < max * 0.1 && !s.combat.redemptionUsed && g.mods.get('redemption') > 0) {
    s.combat.redemptionUsed = true;
    healPlayer(g, max * 0.25);
    log(g, '【救赎】恢复了 25% 生命', 'info');
  }
  if (s.hp > 0) tryAutoEat(g);
  if (s.hp <= 0) playerDeath(g);
}

function drainPrayer(g: Game, who: 'player' | 'enemy') {
  const s = g.state;
  if (!s.prayers.length) return;
  let cost = 0, soul = 0;
  for (const pid of s.prayers) {
    const p = C.prayers[pid];
    if (!p) continue;
    const pts = who === 'player' ? p.pointsPerPlayer : p.pointsPerEnemy;
    if (p.book === 'abyssal') soul += pts; else cost += pts;
  }
  const pres = Math.min(90, g.mods.get('prayerPreservation'));
  if (cost > 0 && !g.rng.percent(pres)) {
    if (s.currencies.prayerPoints < cost) { s.prayers = s.prayers.filter((p) => C.prayers[p].book === 'abyssal'); g.invalidate(); g.notify('祈祷点耗尽', 'warning'); }
    else { s.currencies.prayerPoints -= cost; g.addXp('prayer', cost * 2); }
  }
  if (soul > 0 && !g.rng.percent(pres)) {
    if (s.currencies.soulPoints < soul) { s.prayers = s.prayers.filter((p) => C.prayers[p].book !== 'abyssal'); g.invalidate(); g.notify('灵魂点耗尽', 'warning'); }
    else { s.currencies.soulPoints -= soul; g.addXp('prayer', soul * 3); g.addAbyssalXp('prayer', soul * 2); }
  }
}

// ============================================================================ 击杀、掉落、副本
function giveLoot(g: Game, id: string, qty: number) {
  const s = g.state;
  if (s.settings.autoLoot && g.addItem(id, qty, 'combat') > 0) return;
  const ex = s.combat.loot.find((l) => l.id === id);
  if (ex) ex.qty += qty;
  else if (s.combat.loot.length < 100) s.combat.loot.push({ id, qty });
}

export function lootAll(g: Game) {
  const loot = g.state.combat.loot;
  for (let i = loot.length - 1; i >= 0; i--) {
    if (g.addItem(loot[i].id, loot[i].qty, 'loot') > 0) loot.splice(i, 1);
  }
}

function monsterKilled(g: Game) {
  const s = g.state;
  const c = s.combat;
  const enemy = c.enemy;
  if (!enemy) return;
  const m = C.monsters[enemy.monsterId];
  c.enemy = null;
  c.spawnTimer = RESPAWN_MS;
  c.killsThisRun++;
  s.monsterKills[m.id] = (s.monsterKills[m.id] || 0) + 1;
  g.stat('monstersKilled');
  const area = c.area!;
  log(g, `击败了 ${m.name}`, 'loot');
  // 金币 / 深渊碎片
  const gpMult = 1 + (g.mods.get('combatGP') + g.mods.get('gpGlobal')) / 100;
  const base = g.rng.int(m.gp[0], m.gp[1]);
  if (m.realm === 'abyssal') s.currencies.abyssalPieces += Math.round(base * (1 + g.mods.get('abyssalPieces') / 100));
  else g.addGp(Math.round(base * gpMult), 'combat');
  if (m.bones) giveLoot(g, m.bones, 1);
  for (const d of rollDropTable(g, m.drops)) giveLoot(g, d.id, d.qty);
  if (m.pet) g.rollPet(m.pet.id, m.pet.chance);
  // Slayer
  const task = s.slayer.task;
  const inSlayerArea = area.kind !== 'dungeon' && C.areas[area.id]?.type === 'slayer';
  const onTask = task?.monsterId === m.id;
  if (onTask || inSlayerArea) {
    const sx = (enemy.maxHp / 10) * (onTask ? 1 : 0.5);
    g.addXp('slayer', sx);
    if (m.realm === 'abyssal') g.addAbyssalXp('slayer', sx * 0.25);
  }
  if (onTask && task) {
    const coins = Math.max(1, Math.round((enemy.maxHp / 100) * (1 + g.mods.get('slayerCoins') / 100)));
    if (task.realm === 'abyssal') s.currencies.abyssalSlayerCoins += coins; else s.currencies.slayerCoins += coins;
    task.remaining--;
    if (task.remaining <= 0) completeSlayerTask(g);
  }
  // 消耗品槽
  const cons = s.equipmentSets[s.activeSet].consumable;
  if (cons && cons.qty > 0) { cons.qty--; if (cons.qty <= 0) { s.equipmentSets[s.activeSet].consumable = null; g.invalidate(); } }
  g.events.emit('monsterKilled', { monsterId: m.id, areaId: area.id, realm: m.realm ?? 'melvor' });
  // 副本推进
  if (area.kind === 'dungeon') {
    const d = C.dungeons[area.id];
    c.dungeonIndex++;
    c.spawnTimer = 1500;
    if (c.dungeonIndex >= d.monsters.length) dungeonCompleted(g);
    else log(g, `副本进度 ${c.dungeonIndex}/${d.monsters.length}`);
  }
}

function dungeonCompleted(g: Game) {
  const s = g.state;
  const c = s.combat;
  const d = C.dungeons[c.area!.id];
  const count = (s.dungeonCompletions[d.id] = (s.dungeonCompletions[d.id] || 0) + 1);
  for (const r of d.rewards) giveLoot(g, r.id, r.qty);
  for (const r of rollDropTable(g, d.rewardTable)) giveLoot(g, r.id, r.qty);
  if (d.pet) {
    if (count >= d.pet.completions) g.unlockPet(d.pet.id);
    else g.rollPet(d.pet.id, 1 / d.pet.completions);
  }
  g.stat('dungeonsCompleted');
  g.notify(`通关副本「${d.name}」（第 ${count} 次）`, 'success', d.icon);
  log(g, `通关副本「${d.name}」！`, 'loot');
  g.events.emit('dungeonCompleted', { dungeonId: d.id, count });
  c.dungeonIndex = 0;
  c.redemptionUsed = false;
  if (!s.settings.autoRestartDungeon) stopCombat(g, '副本完成');
}

function playerDeath(g: Game) {
  const s = g.state;
  const enemyId = s.combat.enemy?.monsterId ?? null;
  g.stat('deaths');
  g.events.emit('playerDeath', { monsterId: enemyId });
  const mode = C.gameModes[s.player.mode];
  if (mode.permadeath) {
    s.player.dead = true;
    stopCombat(g, '角色死亡（硬核模式）');
    g.notify('你的硬核角色已经死亡……', 'error', '💀');
    return;
  }
  // 死亡惩罚：随机失去一件已装备物品
  if (!(g.mods.get('protectItem') > 0)) {
    const set = s.equipmentSets[s.activeSet];
    const slots = Object.entries(set).filter(([, st]) => st && st.qty > 0).map(([k]) => k);
    if (slots.length) {
      const slot = g.rng.pick(slots) as keyof typeof set;
      const lost = set[slot]!;
      set[slot] = null;
      g.notify(`你死亡了，失去了 ${C.items[lost.id].name}${lost.qty > 1 ? ` ×${lost.qty}` : ''}`, 'error', '💀');
      g.stat('itemsLostOnDeath');
      g.invalidate();
    } else g.notify('你死亡了', 'error', '💀');
  } else g.notify('你死亡了，护佑祈祷保护了你的装备', 'error', '💀');
  s.hp = playerMaxHp(g);
  stopCombat(g, '玩家死亡');
}

// ============================================================================ Slayer
export function slayerCandidates(g: Game, tierId: string): string[] {
  const tier = C.slayerTiers.find((t) => t.id === tierId);
  if (!tier) return [];
  const out: string[] = [];
  for (const a of Object.values(C.areas)) {
    if (a.realm !== tier.realm || !g.meetsAll(a.requirements)) continue;
    for (const mid of a.monsters) {
      const m = C.monsters[mid];
      if (!m.slayerTaskable || (m.level ?? 0) < tier.minLevel || (m.level ?? 0) > tier.maxLevel) continue;
      if (!out.includes(mid)) out.push(mid);
    }
  }
  return out;
}

export function assignSlayerTask(g: Game, tierId: string): string | null {
  const tier = C.slayerTiers.find((t) => t.id === tierId);
  if (!tier) return '无效档位';
  if (g.level('slayer') < tier.slayerLevel) return `需要猎杀 ${tier.slayerLevel} 级`;
  if (tier.realm === 'abyssal' && !g.inAbyss()) return '需要开启深渊之门';
  const cands = slayerCandidates(g, tierId);
  if (!cands.length) return '没有可分配的目标（需要解锁更多区域）';
  const cost = tier.currency === 'slayerCoins' ? { slayerCoins: tier.cost } : { abyssalSlayerCoins: tier.cost };
  if (!g.spendCurrency(cost)) return tier.currency === 'slayerCoins' ? '猎杀币不足' : '深渊猎杀币不足';
  const monsterId = g.rng.pick(cands);
  const total = g.rng.int(tier.killsMin, tier.killsMax);
  g.state.slayer.task = { monsterId, total, remaining: total, tier: tierId, realm: tier.realm };
  g.notify(`新猎杀任务：击败 ${C.monsters[monsterId].name} ×${total}`, 'info', '💀');
  return null;
}

function completeSlayerTask(g: Game) {
  const s = g.state;
  const task = s.slayer.task!;
  const tierIdx = C.slayerTiers.findIndex((t) => t.id === task.tier);
  const bonus = Math.round(task.total * (5 + tierIdx * 5) * (1 + g.mods.get('slayerCoins') / 100));
  if (task.realm === 'abyssal') s.currencies.abyssalSlayerCoins += bonus; else s.currencies.slayerCoins += bonus;
  s.slayer.tasksCompleted[task.tier] = (s.slayer.tasksCompleted[task.tier] || 0) + 1;
  g.stat('slayerTasks');
  g.notify(`猎杀任务完成！奖励 ${bonus} 猎杀币`, 'success', '💀');
  s.slayer.task = null;
  if (s.slayer.autoSlayer && s.shop['auto_slayer']) {
    if (!assignSlayerTask(g, task.tier)) goToSlayerTarget(g);
  }
}

/** 前往当前猎杀目标所在区域 */
export function goToSlayerTarget(g: Game): string | null {
  const task = g.state.slayer.task;
  if (!task) return '没有猎杀任务';
  const area = Object.values(C.areas).find((a) => a.monsters.includes(task.monsterId) && !areaEntryError(g, a.type === 'slayer' ? 'slayer' : 'area', a.id));
  if (!area) return '无法进入目标所在区域';
  const kind = area.type === 'slayer' ? 'slayer' : 'area';
  if (g.state.combat.active) stopCombat(g, '切换活动');
  return startCombat(g, kind, area.id, task.monsterId);
}

// ============================================================================ 战斗相关命令
export function togglePrayer(g: Game, prayerId: string): string | null {
  const p = C.prayers[prayerId];
  const s = g.state;
  if (!p) return '无效祈祷';
  const idx = s.prayers.indexOf(prayerId);
  if (idx >= 0) { s.prayers.splice(idx, 1); g.invalidate(); return null; }
  if (g.level('prayer') < p.level) return `需要祈祷 ${p.level} 级`;
  if (!g.meetsAll(p.requirements)) return '祈祷未解锁';
  if (p.book === 'abyssal' ? s.currencies.soulPoints <= 0 : s.currencies.prayerPoints <= 0) return p.book === 'abyssal' ? '没有灵魂点' : '没有祈祷点';
  // 守护类互斥；最多同时启用 3 个
  const next = p.modifiers.protectFrom ? s.prayers.filter((x) => !C.prayers[x].modifiers.protectFrom) : [...s.prayers];
  if (next.length >= 3) return '最多同时启用 3 个祈祷';
  next.push(prayerId);
  s.prayers = next;
  g.invalidate();
  return null;
}

export function buryBones(g: Game, itemId: string, qty: number): string | null {
  const it = C.items[itemId];
  if (!it?.prayerPoints && !it?.soulPoints) return '该物品无法埋葬';
  qty = Math.min(qty, g.qty(itemId));
  if (qty <= 0) return '数量不足';
  if (it.soulPoints && !g.inAbyss()) return '需要开启深渊之门';
  g.removeItem(itemId, qty, 'prayer');
  const mult = 1 + g.mods.get('prayerPointsGain') / 100;
  if (it.prayerPoints) { g.state.currencies.prayerPoints += Math.round(it.prayerPoints * qty * mult); g.addXp('prayer', it.prayerPoints * qty * 3); }
  if (it.soulPoints) { g.state.currencies.soulPoints += Math.round(it.soulPoints * qty * mult); g.addXp('prayer', it.soulPoints * qty * 4); g.addAbyssalXp('prayer', it.soulPoints * qty * 3); }
  g.stat('bonesBuried', qty);
  return null;
}

export function selectSpell(g: Game, spellId: string | null, kind: 'spell' | 'curse' | 'aura'): string | null {
  const s = g.state;
  if (!spellId) { s.magic[kind] = null; g.invalidate(); return null; }
  const sp = C.spells[spellId];
  if (!sp) return '无效法术';
  if (g.level('magic') < sp.level) return `需要魔法 ${sp.level} 级`;
  if (!g.meetsAll(sp.requirements)) return '法术未解锁';
  s.magic[kind] = spellId;
  g.invalidate();
  return null;
}

export function toggleCorruption(g: Game, id: string): string | null {
  const e = C.corruptionEffects[id];
  if (!e) return '无效效果';
  if (g.level('corruption') < e.level) return `需要腐化 ${e.level} 级`;
  const list = g.state.corruption.enabled;
  const i = list.indexOf(id);
  if (i >= 0) list.splice(i, 1); else list.push(id);
  return null;
}
