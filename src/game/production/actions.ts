// 统一动作引擎：所有技能活动的生命周期（前置检查 → 耗时 → 产出与经验 → 掌握度 → 事件 → 下一次动作）
import type { Game } from '../core/game';
import type { ActiveAction } from '../core/state';
import type { SkillActionDef, SkillId, ItemQty, ArtifactSize } from '../core/types';
import { C } from '@/content';
import { FISHING_AREAS } from '@/content/recipes/gathering';
import { ARTIFACT_BASE_CHANCE, ASTRO_STANDARD_COST, MARK_LEVELS, surveyXpForHex } from '@/content/recipes/support';
import { BARS } from '@/content/items/materials';
import { playerMaxHp, damagePlayerRaw, tryAutoEat } from '../combat/stats';
import { rollDropTable } from '../combat/loot';
import { hexDist, hexKey, onHexSurveyed, nextSurveyTarget } from './cartography';
import { stopCombat } from '../combat/combat';

export interface SkillHandler {
  /** 完整的开始条件检查（等级、需求、材料） */
  canStart(g: Game, actionId: string, target?: string): string | null;
  interval(g: Game, actionId: string, aa?: ActiveAction): number;
  /** 完成一次动作，返回停止原因或 null（继续） */
  complete(g: Game, aa: ActiveAction): string | null;
  tick(g: Game, ms: number): void;
}

// ============================================================================ 通用工具
export function scaledInterval(g: Game, skill: SkillId, base: number): number {
  const pct = g.mods.get('skillInterval', skill);
  const flat = g.mods.get('skillIntervalFlat', skill);
  return Math.max(250, Math.round(base * (1 + pct / 100) + flat));
}

const GATHERING: SkillId[] = ['woodcutting', 'fishing', 'mining', 'thieving', 'harvesting', 'archaeology', 'astrology'];

export function doubleChance(g: Game, skill: SkillId, actionId: string): number {
  const mastery = g.masteryLevel(actionId);
  const fromMastery = GATHERING.includes(skill) ? mastery / 4 : mastery / 8;
  return Math.min(100, g.mods.get('doubleItems', skill) + fromMastery);
}

export function preservationChance(g: Game, skill: SkillId, actionId: string): number {
  const mastery = g.masteryLevel(actionId);
  return Math.min(80, g.mods.get('preservation', skill) + Math.floor(mastery / 20) * 5);
}

/** 选择可用的输入组合：优先选择 target 指定的替代组，其次主配方，最后任意可用的替代组 */
export function pickInputs(g: Game, a: SkillActionDef, target?: string): ItemQty[] | null {
  const sets: ItemQty[][] = [a.inputs, ...(a.altInputs ?? [])];
  if (target !== undefined && target !== '' && !isNaN(Number(target))) {
    const set = sets[Number(target)];
    if (set && g.hasItems(set)) return set;
    return null;
  }
  for (const set of sets) if (g.hasItems(set)) return set;
  return null;
}

function outputsFit(g: Game, outputs: ItemQty[]): boolean {
  return outputs.every((o) => g.canAddItem(o.id));
}

/** 动作完成后的通用收尾：经验、掌握度、宠物、印记、药水/手套/召唤兽充能、统计与事件 */
export function finishAction(g: Game, a: SkillActionDef, interval: number, xpMult = 1, count = 1) {
  const skill = a.skill;
  g.addXp(skill, a.xp * xpMult);
  if (a.abyssalXp) g.addAbyssalXp(skill, a.abyssalXp * xpMult);
  if (a.masteryEnabled !== false && C.skills[skill].masteryEnabled) g.addMasteryXp(skill, a.id, interval);
  const lvl = g.level(skill);
  g.rollPet(`pet_${skill}`, (interval / 1000 / 100000) * (1 + lvl / 100));
  rollMarks(g, skill, interval);
  consumeSkillCharges(g, skill);
  g.skillStat(skill, 'actions', count);
  g.skillStat(skill, 'timeSpent', interval);
  g.stat('skillActions', count);
  g.events.emit('actionComplete', { skill, actionId: a.id, count });
}

export function rollMarks(g: Game, skill: SkillId, interval: number) {
  const sumLvl = g.level('summoning');
  for (const f of Object.values(C.familiars)) {
    if (!f.markSkills.includes(skill) || f.level > sumLvl) continue;
    if (f.realm === 'abyssal' && !g.inAbyss()) continue;
    const marks = g.state.summoning.marks[f.id] || 0;
    if (marks >= MARK_LEVELS[MARK_LEVELS.length - 1]) continue;
    const chance = (interval / 1000) / (250 * (1 + f.level / 20));
    if (g.rng.chance(chance)) {
      g.state.summoning.marks[f.id] = marks + 1;
      const lv = g.markLevel(f.id);
      if (MARK_LEVELS.includes(marks + 1)) g.notify(`发现 ${f.name} 印记（印记等级 ${lv}）`, 'success', f.icon);
      if (lv >= 3) g.invalidate();
    }
  }
}

export function consumeSkillCharges(g: Game, skill: SkillId) {
  const s = g.state;
  // 药水
  const pot = s.potions[skill];
  if (pot) usePotionCharge(g, skill);
  // 手套
  const gloves = s.equipmentSets[s.activeSet].gloves;
  if (gloves && C.shop[`buy_${gloves.id}`]?.charges) {
    const glovesSkill: Record<string, SkillId> = { gloves_cooking: 'cooking', gloves_mining: 'mining', gloves_smithing: 'smithing', gloves_thieving: 'thieving', gloves_gem: 'mining' };
    if (glovesSkill[gloves.id] === skill && (s.glovesCharges[gloves.id] || 0) > 0) {
      s.glovesCharges[gloves.id]--;
      if (s.glovesCharges[gloves.id] <= 0) { g.invalidate(); g.notify(`${C.items[gloves.id].name}充能耗尽`, 'warning'); }
    }
  }
  // 非战斗召唤兽
  for (const slot of ['summon1', 'summon2'] as const) {
    const st = s.equipmentSets[s.activeSet][slot];
    if (!st || st.qty <= 0) continue;
    const fam = C.familiars[C.items[st.id]?.tablet?.familiarId ?? ''];
    if (!fam || fam.combat || !fam.markSkills.includes(skill)) continue;
    if (g.rng.percent(g.mods.get('summonChargePreservation'))) continue;
    st.qty--;
    g.addXp('summoning', Math.max(1, fam.level / 5));
    if (st.qty <= 0) { s.equipmentSets[s.activeSet][slot] = null; g.invalidate(); g.notify(`${fam.name}召唤石板耗尽`, 'warning'); }
  }
}

export function usePotionCharge(g: Game, key: string) {
  const s = g.state;
  const pot = s.potions[key];
  if (!pot) return;
  pot.charges--;
  if (pot.charges <= 0) {
    // 自动使用银行中同款药水
    if (g.removeItem(pot.itemId, 1, 'potion')) {
      pot.charges = C.items[pot.itemId].potion!.charges + g.mods.get('potionCharges');
      g.stat('potionsUsed');
    } else {
      delete s.potions[key];
      g.invalidate();
      g.notify(`${C.items[pot.itemId].name}已耗尽`, 'warning');
    }
  }
}

/** 默认计时循环 */
function timedTick(h: SkillHandler) {
  return (g: Game, ms: number) => {
    const aa = g.state.activeAction;
    if (!aa) return;
    aa.progress += ms;
    let guard = 0;
    while (g.state.activeAction === aa && aa.progress >= aa.interval && guard++ < 1000) {
      aa.progress -= aa.interval;
      const stop = h.complete(g, aa);
      if (stop) { stopSkillAction(g, stop); return; }
      aa.completed++;
      const err = h.canStart(g, aa.actionId, aa.target);
      if (err) { stopSkillAction(g, err); return; }
      aa.interval = h.interval(g, aa.actionId, aa);
    }
  };
}

// ============================================================================ 通用生产 / 采集
interface ProductionOptions {
  /** 修改产出（例如烹饪烧焦、药剂品阶） */
  produce?: (g: Game, a: SkillActionDef, aa: ActiveAction) => { outputs: ItemQty[]; xpMult?: number; noDouble?: boolean; failed?: boolean } | string;
  extraCheck?: (g: Game, a: SkillActionDef, target?: string) => string | null;
  afterComplete?: (g: Game, a: SkillActionDef, aa: ActiveAction) => void;
  intervalOf?: (g: Game, a: SkillActionDef) => number;
}

function productionHandler(skill: SkillId, opts: ProductionOptions = {}): SkillHandler {
  const h: SkillHandler = {
    canStart(g, actionId, target) {
      const a = C.actions[actionId];
      if (!a || a.skill !== skill) return '无效动作';
      const locked = g.actionUnlocked(actionId);
      if (locked) return locked;
      if ((a.inputs.length || a.altInputs?.length) && !pickInputs(g, a, target)) return '材料不足';
      if (opts.extraCheck) { const e = opts.extraCheck(g, a, target); if (e) return e; }
      if (!outputsFit(g, a.outputs)) return '银行已满';
      return null;
    },
    interval(g, actionId) {
      const a = C.actions[actionId];
      return scaledInterval(g, skill, opts.intervalOf ? opts.intervalOf(g, a) : a.interval);
    },
    complete(g, aa) {
      const a = C.actions[aa.actionId];
      const inputs = (a.inputs.length || a.altInputs?.length) ? pickInputs(g, a, aa.target) : [];
      if (!inputs) return '材料不足';
      let outputs = a.outputs;
      let xpMult = 1;
      let noDouble = false;
      let failed = false;
      if (opts.produce) {
        const r = opts.produce(g, a, aa);
        if (typeof r === 'string') return r;
        outputs = r.outputs; xpMult = r.xpMult ?? 1; noDouble = !!r.noDouble; failed = !!r.failed;
      }
      if (!outputsFit(g, outputs)) return '银行已满';
      // 材料消耗（节省判定）
      if (inputs.length && !g.rng.percent(preservationChance(g, skill, a.id))) g.removeItems(inputs, skill);
      else if (inputs.length) g.skillStat(skill, 'itemsPreserved');
      // 产出（双倍与额外产出）
      const dbl = !noDouble && !failed && g.rng.percent(doubleChance(g, skill, a.id)) ? 2 : 1;
      const extra = failed ? 0 : g.mods.get('additionalItem', skill);
      for (const o of outputs) {
        const qty = o.qty * dbl + (failed ? 0 : extra);
        const added = g.addItem(o.id, qty, skill);
        if (added > 0 && !failed) g.events.emit('itemCrafted', { id: o.id, qty: added, skill });
        g.skillStat(skill, 'itemsProduced', added);
      }
      if (a.gp) g.addGp(Math.round(a.gp * (1 + g.mods.get('gpGlobal', skill) / 100)), skill);
      for (const e of a.extraDrops ?? []) if (g.rng.chance(e.chance)) g.addItem(e.id, e.qty ?? 1, skill);
      finishAction(g, a, aa.interval, failed ? 0 : xpMult);
      opts.afterComplete?.(g, a, aa);
      return null;
    },
    tick: undefined as any,
  };
  h.tick = timedTick(h);
  return h;
}

// ============================================================================ 各技能
const woodcutting = productionHandler('woodcutting');
// 双树伐木：第二棵树拥有独立计时
woodcutting.tick = ((base) => (g: Game, ms: number) => {
  const aa = g.state.activeAction;
  if (!aa) return;
  if (aa.secondaryId && g.state.shop['multi_tree']) {
    aa.secondaryProgress = (aa.secondaryProgress || 0) + ms;
    const b = C.actions[aa.secondaryId];
    aa.secondaryInterval = aa.secondaryInterval || scaledInterval(g, 'woodcutting', b.interval);
    if (aa.secondaryProgress >= aa.secondaryInterval) {
      aa.secondaryProgress -= aa.secondaryInterval;
      if (!g.actionUnlocked(b.id) && outputsFit(g, b.outputs)) {
        const dbl = g.rng.percent(doubleChance(g, 'woodcutting', b.id)) ? 2 : 1;
        g.addItem(b.outputs[0].id, b.outputs[0].qty * dbl, 'woodcutting');
        for (const e of b.extraDrops ?? []) if (g.rng.chance(e.chance)) g.addItem(e.id, 1, 'woodcutting');
        finishAction(g, b, aa.secondaryInterval);
      }
      aa.secondaryInterval = scaledInterval(g, 'woodcutting', b.interval);
    }
  }
  base(g, ms);
})(woodcutting.tick);

const fishing = productionHandler('fishing', {
  extraCheck(g, a) {
    const area = FISHING_AREAS.find((x) => x.id === a.category);
    if (area && !g.meetsAll(area.requirements)) return `钓区「${area.name}」未解锁`;
    return null;
  },
  intervalOf(g, a) { return g.rng.int(a.interval, a.intervalMax ?? a.interval); },
  produce(g, a) {
    const area = FISHING_AREAS.find((x) => x.id === a.category)!;
    const mastery = g.masteryLevel(a.id);
    const junk = area.junkChance * Math.max(0, 1 - mastery / 66);
    const special = area.specialChance + g.mods.get('fishingSpecialChance') / 100;
    const r = g.rng.next();
    if (r < special) {
      const drop = rollDropTable(g, area.specialTable);
      if (drop.length) { g.skillStat('fishing', 'specials'); return { outputs: drop, noDouble: true }; }
    } else if (r < special + junk) {
      g.skillStat('fishing', 'junk');
      return { outputs: rollDropTable(g, 'dt_fish_junk'), noDouble: true, xpMult: 0.5 };
    }
    return { outputs: a.outputs };
  },
});

const mining = productionHandler('mining', {
  produce(g, a) {
    const out: ItemQty[] = [...a.outputs];
    if (!a.data?.isEssence && g.rng.percent(1 + g.mods.get('miningGemChance'))) {
      const gem = rollDropTable(g, 'dt_gem_pouch');
      out.push(...gem);
    }
    return { outputs: out };
  },
  afterComplete(g, a) {
    if (a.data?.isEssence) return;
    const maxHp = (a.data?.rockHp ?? 5) + g.masteryLevel(a.id);
    const rock = (g.state.mining.rocks[a.id] ||= { hp: maxHp, respawnAt: 0 });
    rock.hp--;
    if (rock.hp <= 0) {
      rock.respawnAt = g.state.clock + Math.round((a.data?.respawn ?? 5000) * Math.max(0.2, 1 - g.masteryLevel(a.id) / 200));
      g.skillStat('mining', 'rocksDepleted');
    }
  },
});
// 矿脉耗尽时暂停计时，恢复后满血
mining.tick = ((base) => (g: Game, ms: number) => {
  const aa = g.state.activeAction;
  if (!aa) return;
  const rock = g.state.mining.rocks[aa.actionId];
  if (rock && rock.hp <= 0) {
    if (rock.respawnAt > g.state.clock) return;
    rock.hp = (C.actions[aa.actionId].data?.rockHp ?? 5) + g.masteryLevel(aa.actionId);
    aa.progress = 0;
  }
  base(g, ms);
})(mining.tick);

const firemaking = productionHandler('firemaking', {
  produce(g, a) { g.state.bonfire.logsBurnt++; return { outputs: a.outputs }; },
});

const cookingProduce = (g: Game, a: SkillActionDef, passive = false) => {
  const mastery = g.masteryLevel(a.id);
  const cat = a.category ?? 'fire';
  let success = 70 + mastery * 0.6 + g.mods.get('cookingSuccess', cat) + g.mods.get('cookingSuccess');
  if (passive) success -= 10;
  if (g.rng.percent(Math.min(100, success))) {
    if (g.rng.percent(mastery / 4) && a.data?.perfect) return { outputs: [{ id: a.data.perfect, qty: 1 }], xpMult: 1 + g.mods.get('cookingXP', cat) / 100 };
    return { outputs: a.outputs, xpMult: 1 + g.mods.get('cookingXP', cat) / 100 };
  }
  g.stat('foodBurnt');
  return { outputs: [{ id: a.data?.burnt, qty: 1 }], noDouble: true, failed: true };
};
const cooking = productionHandler('cooking', { produce: (g, a) => cookingProduce(g, a) });
// 被动烹饪：在其他两个烹饪设施中以 5 倍耗时同时烹饪
cooking.tick = ((base) => (g: Game, ms: number) => {
  const aa = g.state.activeAction;
  if (!aa) return;
  const activeCat = C.actions[aa.actionId]?.category;
  for (const [cat, recipe] of Object.entries(g.state.cooking.passive)) {
    if (!recipe || cat === activeCat) continue;
    const a = C.actions[recipe];
    if (!a || g.actionUnlocked(recipe)) continue;
    g.state.cooking.timers[cat] = (g.state.cooking.timers[cat] || 0) + ms;
    const iv = scaledInterval(g, 'cooking', a.interval) * 5;
    if (g.state.cooking.timers[cat] >= iv) {
      g.state.cooking.timers[cat] -= iv;
      if (!g.hasItems(a.inputs)) { g.state.cooking.passive[cat] = null; g.notify(`被动烹饪「${a.name}」材料耗尽`, 'warning'); continue; }
      const r = cookingProduce(g, a, true);
      if (!outputsFit(g, r.outputs)) continue;
      g.removeItems(a.inputs, 'cooking');
      for (const o of r.outputs) g.addItem(o.id, o.qty, 'cooking');
      if (!r.failed) g.addXp('cooking', a.xp * (r.xpMult ?? 1));
    }
  }
  base(g, ms);
})(cooking.tick);

const smithing = productionHandler('smithing');
const fletching = productionHandler('fletching');
const crafting = productionHandler('crafting');
const runecrafting = productionHandler('runecrafting', {
  produce(g, a) {
    const lv = g.level('runecrafting');
    const mult = 1 + ((a.data?.multiplierLevels as number[] | undefined)?.filter((l) => lv >= l).length ?? 0);
    return { outputs: a.outputs.map((o) => ({ id: o.id, qty: o.qty * mult })) };
  },
});
const herblore = productionHandler('herblore', {
  produce(g, a) {
    const tiers = a.data?.tiers as string[];
    const req = a.data?.tierMastery as number[];
    const m = g.masteryLevel(a.id);
    let t = 0;
    for (let i = 0; i < req.length; i++) if (m >= req[i]) t = i;
    return { outputs: [{ id: tiers[t], qty: 1 }] };
  },
});
const summoning = productionHandler('summoning', {
  extraCheck(g, a) {
    const fam = a.data?.familiar as string;
    if (g.markLevel(fam) < 1) return `尚未发现 ${C.familiars[fam].name} 的印记`;
    return null;
  },
  produce(g, a) {
    const bonus = Math.floor(g.level('summoning') / 10);
    return { outputs: a.outputs.map((o) => ({ id: o.id, qty: o.qty + bonus })) };
  },
});
const cartographyCraft = productionHandler('cartography');

const harvesting = productionHandler('harvesting', {
  produce(g, a) {
    const max = a.data?.maxIntensity ?? 10000;
    const cur = g.state.harvesting.intensity[a.id] || 0;
    const qty = 1 + Math.floor(cur / 2500);
    const out: ItemQty[] = a.outputs.map((o) => ({ id: o.id, qty: o.qty * qty }));
    const rare = a.data?.rare;
    if (rare && g.rng.chance(Math.min(1, rare.weight * (0.05 + cur / max * 0.3)))) out.push({ id: rare.id, qty: 1 });
    g.state.harvesting.intensity[a.id] = Math.min(max, cur + 25 * (1 + g.mods.get('harvestIntensity') / 10));
    return { outputs: out };
  },
});

// --------------------------------------------------------------------------- 偷窃
const thieving: SkillHandler = {
  canStart(g, actionId) {
    const a = C.actions[actionId];
    if (!a || a.skill !== 'thieving') return '无效动作';
    const locked = g.actionUnlocked(actionId);
    if (locked) return locked;
    if (g.state.hp <= Math.min(a.data!.maxHit, playerMaxHp(g) * 0.1) && !tryAutoEat(g, true)) return '生命值过低，无法继续偷窃';
    return null;
  },
  interval(g, actionId) { return scaledInterval(g, 'thieving', C.actions[actionId].interval); },
  complete(g, aa) {
    const a = C.actions[aa.actionId];
    const d = a.data!;
    const stealth = g.level('thieving') + g.masteryLevel(a.id) + g.mods.get('thievingStealth') + (a.abyssalLevel ? g.abyssalLevel('thieving') * 5 : 0);
    const success = Math.min(100, (100 * (100 + stealth)) / (100 + d.perception));
    if (g.rng.percent(success)) {
      const gpMult = 1 + (g.mods.get('gpGlobal', 'thieving')) / 100;
      if (d.gpMax > 0) g.addGp(Math.round(g.rng.int(1, d.gpMax) * gpMult), 'thieving');
      if (d.abyssalPiecesMax > 0) g.state.currencies.abyssalPieces += Math.round(g.rng.int(1, d.abyssalPiecesMax) * (1 + g.mods.get('abyssalPieces') / 100));
      if (g.rng.chance(0.75)) {
        const drop = rollDropTable(g, d.table);
        const dbl = g.rng.percent(doubleChance(g, 'thieving', a.id)) ? 2 : 1;
        for (const it of drop) g.addItem(it.id, it.qty * dbl, 'thieving');
      }
      const rareMult = 1 + g.mods.get('rareDropChance') / 100;
      if (g.rng.chance(d.unique.chance * rareMult)) { g.addItem(d.unique.id, 1, 'thieving'); g.notify(`偷到稀有物品：${C.items[d.unique.id].name}！`, 'success'); }
      if (d.areaUnique && g.rng.chance(d.areaUnique.chance * rareMult)) { g.addItem(d.areaUnique.id, 1, 'thieving'); g.notify(`发现区域珍宝：${C.items[d.areaUnique.id].name}！`, 'success'); }
      finishAction(g, a, aa.interval);
      g.skillStat('thieving', 'successes');
    } else {
      // 失败：受到伤害并被击晕 3 秒
      g.stat('thievingFails');
      g.skillStat('thieving', 'fails');
      damagePlayerRaw(g, g.rng.int(1, d.maxHit));
      aa.progress -= 3000;
      if (g.state.hp <= 0) { g.state.hp = 1; return '偷窃失败导致重伤，已停止'; }
      tryAutoEat(g);
    }
    return null;
  },
  tick: undefined as any,
};
thieving.tick = timedTick(thieving);

// --------------------------------------------------------------------------- 敏捷
export function builtCourse(g: Game): string[] {
  const out: string[] = [];
  const keys = Object.keys(g.state.agility.built).map(Number).filter((k) => k !== 10).sort((a, b) => a - b);
  for (const k of keys) { const id = g.state.agility.built[k]; if (id) out.push(id); }
  return out;
}
const agility: SkillHandler = {
  canStart(g) {
    if (!g.state.skills.agility.unlocked) return '敏捷尚未解锁';
    if (!builtCourse(g).length) return '尚未建造任何障碍';
    return null;
  },
  interval(g) {
    const course = builtCourse(g);
    const id = course[g.state.agility.currentSlot % course.length];
    return scaledInterval(g, 'agility', C.obstacles[id].interval);
  },
  complete(g, aa) {
    const course = builtCourse(g);
    const idx = g.state.agility.currentSlot % course.length;
    const id = course[idx];
    const a = C.actions[id];
    aa.actionId = id;
    g.addGp(Math.round(a.gp! * (1 + g.mods.get('gpGlobal', 'agility') / 100)), 'agility');
    finishAction(g, a, aa.interval);
    g.state.agility.currentSlot = (idx + 1) % course.length;
    if (g.state.agility.currentSlot === 0) g.skillStat('agility', 'coursesCompleted');
    const next = course[g.state.agility.currentSlot];
    aa.actionId = next;
    return null;
  },
  tick: undefined as any,
};
agility.tick = timedTick(agility);

// --------------------------------------------------------------------------- 占星
const astrology = productionHandler('astrology', {
  produce(g, a) {
    const out: ItemQty[] = [];
    const m = g.masteryLevel(a.id);
    if (a.realm === 'abyssal') { if (g.rng.percent(5 + m / 10)) out.push({ id: 'abyssal_stardust', qty: 1 }); }
    else {
      if (g.rng.percent(30 + m / 5)) out.push({ id: 'stardust', qty: 1 });
      if (g.rng.percent(2 + m / 20)) out.push({ id: 'golden_stardust', qty: 1 });
    }
    return { outputs: out };
  },
});
export function astroMaxLevel(g: Game, constellationId: string, unique: boolean): number {
  const m = g.masteryLevel(`astro_${constellationId}`);
  return unique ? (m >= 50 ? Math.min(5, 1 + Math.floor((m - 50) / 10)) : 0) : Math.min(5, 1 + Math.floor(m / 20));
}
export function astroCost(level: number, unique: boolean) { return unique ? 25 * Math.pow(2, level) : ASTRO_STANDARD_COST(level); }

// --------------------------------------------------------------------------- 考古
const archaeology: SkillHandler = {
  canStart(g, actionId) {
    const a = C.actions[actionId];
    if (!a || a.skill !== 'archaeology') return '无效动作';
    const locked = g.actionUnlocked(actionId);
    if (locked) return locked;
    const site = a.data!.digSite as string;
    if ((g.state.cartography.maps[site]?.charges || 0) <= 0) return '需要该发掘点的地图（在制图技能中制作）';
    if (g.bankUsed() >= g.bankCapacity()) return '银行已满';
    return null;
  },
  interval(g, actionId) { return scaledInterval(g, 'archaeology', C.actions[actionId].interval); },
  complete(g, aa) {
    const a = C.actions[aa.actionId];
    const site = C.digSites[a.data!.digSite];
    const map = g.state.cartography.maps[site.id];
    const tools = g.state.archaeology.tools;
    const bonus = (g.mods.get('artifactChance') + mapBonus(map?.tier ?? 1)) / 100 + g.masteryLevel(a.id) / 400;
    let found: string | null = null;
    for (const size of ['large', 'medium', 'small', 'tiny'] as ArtifactSize[]) {
      const chance = ARTIFACT_BASE_CHANCE[size] * (1 + tools[size] * 0.25) * (1 + bonus);
      if (g.rng.chance(chance)) { found = g.rng.pick(site.artifacts[size]); break; }
    }
    if (found) {
      if (!g.canAddItem(found)) return '银行已满';
      const dbl = g.rng.percent(doubleChance(g, 'archaeology', a.id)) ? 2 : 1;
      g.addItem(found, dbl, 'archaeology');
      g.skillStat('archaeology', 'artifacts');
    }
    map.charges--;
    finishAction(g, a, aa.interval);
    if (map.charges <= 0) return `「${site.name}」地图已耗尽`;
    return null;
  },
  tick: undefined as any,
};
archaeology.tick = timedTick(archaeology);
export function mapBonus(tier: number) { return [0, 0, 5, 10, 20][tier] ?? 0; }

// --------------------------------------------------------------------------- 制图（勘测）
const cartography: SkillHandler = {
  canStart(g, actionId, target) {
    if (actionId !== 'carto_survey') return cartographyCraft.canStart(g, actionId, target);
    if (!g.state.skills.cartography.unlocked) return '制图尚未解锁';
    if (!nextSurveyTarget(g)) return '没有可勘测的区域';
    return null;
  },
  interval(g, actionId, aa) { return actionId === 'carto_survey' ? scaledInterval(g, 'cartography', C.actions[actionId].interval) : cartographyCraft.interval(g, actionId, aa); },
  complete(g, aa) {
    if (aa.actionId !== 'carto_survey') return cartographyCraft.complete(g, aa);
    const target = nextSurveyTarget(g);
    if (!target) return '地图已全部勘测';
    const key = hexKey(target);
    const dist = hexDist(target, [0, 0]);
    const gain = 10 * (1 + g.level('cartography') / 25);
    g.state.cartography.hexes[key] = (g.state.cartography.hexes[key] || 0) + gain;
    const a = C.actions['carto_survey'];
    if (g.state.cartography.hexes[key] >= surveyXpForHex(dist)) {
      g.state.cartography.surveyed.push(key);
      g.state.cartography.target = null;
      onHexSurveyed(g, key);
    }
    for (const e of a.extraDrops ?? []) if (g.rng.chance(e.chance)) g.addItem(e.id, 1, 'cartography');
    finishAction(g, a, aa.interval, 1 + dist / 8);
    return null;
  },
  tick: undefined as any,
};
cartography.tick = timedTick(cartography);

// --------------------------------------------------------------------------- 替代魔法
export function spellRunesAvailable(g: Game, runes: ItemQty[], mult = 1): boolean {
  const provided = providedRunes(g);
  return runes.every((r) => provided.has(r.id) || g.qty(r.id) >= r.qty * mult);
}
export function providedRunes(g: Game): Set<string> {
  const w = g.state.equipmentSets[g.state.activeSet].weapon;
  return new Set(w ? C.items[w.id]?.equipment?.providesRunes ?? [] : []);
}
export function consumeRunes(g: Game, runes: ItemQty[]) {
  const provided = providedRunes(g);
  if (g.rng.percent(Math.min(80, g.mods.get('runePreservation')))) return;
  for (const r of runes) if (!provided.has(r.id)) g.removeItem(r.id, r.qty, 'magic');
}
export function superheatRecipe(g: Game, spellId: string, barId: string) {
  const sp = C.spells[spellId];
  const bar = BARS.find((b) => `bar_${b.id}` === barId);
  if (!bar || !sp.alt) return null;
  const maxIdx = BARS.findIndex((b) => `bar_${b.id}` === sp.alt!.target);
  if (BARS.indexOf(bar) > maxIdx || bar.realm === 'abyssal') return null;
  return bar;
}
const altMagic: SkillHandler = {
  canStart(g, spellId, target) {
    const sp = C.spells[spellId];
    if (!sp || sp.book !== 'alt') return '无效法术';
    if (g.level('magic') < sp.level) return `需要魔法 ${sp.level} 级`;
    if (!g.meetsAll(sp.requirements)) return '法术未解锁';
    if (!spellRunesAvailable(g, sp.runes)) return '符文不足';
    const alt = sp.alt!;
    if (alt.kind === 'alch') {
      if (!target || g.qty(target) <= 0) return '请选择要炼金的物品';
      if (C.items[target]?.noSell || g.state.bankLocked[target]) return '该物品无法炼金';
    } else if (alt.kind === 'superheat') {
      if (!target) return '请选择要冶炼的金属锭';
      const bar = superheatRecipe(g, spellId, target);
      if (!bar) return '该法术无法冶炼此金属锭';
      if (g.level('smithing') < bar.level) return `需要锻造 ${bar.level} 级`;
      if (!g.hasItems(bar.ores)) return '矿石不足';
      if (!g.canAddItem(target)) return '银行已满';
    } else if (alt.kind === 'convert') {
      if (!g.hasItems(alt.consumes ?? [])) return '材料不足';
      if (!(alt.produces ?? []).every((p) => g.canAddItem(p.id))) return '银行已满';
    }
    return null;
  },
  interval(g, spellId) { return scaledInterval(g, 'magic', C.spells[spellId].interval ?? 2000); },
  complete(g, aa) {
    const sp = C.spells[aa.actionId];
    const alt = sp.alt!;
    const err = altMagic.canStart(g, aa.actionId, aa.target);
    if (err) return err;
    consumeRunes(g, sp.runes);
    if (alt.kind === 'alch') {
      const gp = Math.floor(g.sellPrice(aa.target!) * (alt.ratio ?? 1));
      g.removeItem(aa.target!, 1, 'alch');
      g.addGp(gp, 'alch');
    } else if (alt.kind === 'superheat') {
      const bar = superheatRecipe(g, aa.actionId, aa.target!)!;
      g.removeItems(bar.ores, 'superheat');
      g.addItem(aa.target!, alt.ratio ?? 1, 'superheat');
      g.addXp('smithing', bar.xp);
    } else if (alt.kind === 'convert') {
      g.removeItems(alt.consumes ?? [], 'altMagic');
      for (const p of alt.produces ?? []) g.addItem(p.id, p.qty, 'altMagic');
    }
    g.addXp('magic', sp.xp ?? 0);
    if (sp.expansion === 'ita') g.addAbyssalXp('magic', (sp.xp ?? 0) * 0.5);
    g.skillStat('magic', 'altCasts');
    g.events.emit('actionComplete', { skill: 'magic', actionId: aa.actionId, count: 1 });
    return null;
  },
  tick: undefined as any,
};
altMagic.tick = timedTick(altMagic);

export const handlers: Partial<Record<SkillId, SkillHandler>> = {
  woodcutting, fishing, mining, firemaking, cooking, smithing, fletching, crafting, runecrafting, herblore,
  summoning, harvesting, thieving, agility, astrology, archaeology, cartography, magic: altMagic,
};

// ============================================================================ 启动 / 停止
export function startSkillAction(g: Game, skill: SkillId, actionId: string, target?: string): string | null {
  const h = handlers[skill];
  if (!h) return '该技能没有可执行动作';
  const err = h.canStart(g, actionId, target);
  if (err) return err;
  const s = g.state;
  if (s.combat.active) stopCombat(g, '切换活动');
  const prev = s.activeAction;
  const keepSecondary = skill === 'woodcutting' && prev?.skill === 'woodcutting' && prev.actionId !== actionId && s.shop['multi_tree'] ? prev.actionId : undefined;
  s.activeAction = {
    skill, actionId, progress: 0, interval: 0, startedAt: s.clock, completed: 0, target,
    secondaryId: keepSecondary, secondaryProgress: 0, secondaryInterval: 0,
  };
  s.activeAction.interval = h.interval(g, actionId, s.activeAction);
  g.events.emit('actionStart', { skill, actionId });
  return null;
}

export function stopSkillAction(g: Game, reason = '玩家停止') {
  const s = g.state;
  if (!s.activeAction) return;
  const skill = s.activeAction.skill;
  s.activeAction = null;
  if (reason !== '玩家停止' && reason !== '切换活动') {
    g.notify(`${C.skills[skill].name}已停止：${reason}`, 'warning');
    g.stopReasons.push(`${C.skills[skill].name}：${reason}`);
  }
  g.events.emit('activityStopped', { reason });
}

/** 农业/城镇以外的被动检查，供 UI 显示矿脉状态 */
export function rockState(g: Game, actionId: string) {
  const a = C.actions[actionId];
  const maxHp = (a.data?.rockHp ?? 5) + g.masteryLevel(actionId);
  const rock = g.state.mining.rocks[actionId];
  if (!rock || (rock.hp <= 0 && rock.respawnAt <= g.state.clock)) return { hp: maxHp, maxHp, respawnIn: 0 };
  return { hp: Math.max(0, rock.hp), maxHp, respawnIn: rock.hp <= 0 ? Math.max(0, rock.respawnAt - g.state.clock) : 0 };
}
