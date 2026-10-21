// GameFacade：游戏服务接口。持有状态、随机数、事件与修饰符缓存，统一推进时间。
// 所有资源增减均通过此处的统一接口完成；UI 只能调用命令，不直接修改状态。
import { C } from '@/content';
import type { GameState, Notification } from './state';
import { Rng } from './rng';
import { EventBus } from './events';
import type { ItemQty, Requirement, SkillId, Realm, ItemDef } from './types';
import { levelForXp, abyssalLevelForXp, MAX_MASTERY_LEVEL, baseMasteryXp, masteryPoolCap, xpForLevel, MASTERY_CHECKPOINTS } from './xp';
import { computeModifiers, type Modifiers } from '../effects/modifiers';
import { handlers, startSkillAction, stopSkillAction } from '../production/actions';
import { tickCombat, tickRegen } from '../combat/combat';
import { tickFarming } from '../production/farming';
import { tickTownship } from '../production/township';
import { initQuestTracking } from '../quests/quests';
import { checkAchievements } from '../achievements/achievements';

export const TICK_MS = 50;
export const BASE_BANK_SLOTS = 24;
export const MAX_OFFLINE_MS = 24 * 60 * 60 * 1000;
export const MAX_XP = 2_000_000_000;

export class Game {
  state: GameState;
  rng: Rng;
  events = new EventBus();
  private _mods: Modifiers | null = null;
  notifications: Notification[] = [];
  private notifId = 1;
  /** 离线模拟模式：抑制通知与日志 */
  simulating = false;
  /** 用于离线报告的活动终止原因 */
  stopReasons: string[] = [];
  private achievementTimer = 0;

  constructor(state: GameState) {
    this.state = state;
    this.rng = new Rng(state.rngState);
    initQuestTracking(this);
  }

  // ------------------------------------------------------------------ 修饰符
  get mods(): Modifiers {
    if (!this._mods) this._mods = computeModifiers(this);
    return this._mods;
  }
  invalidate() { this._mods = null; }

  // ------------------------------------------------------------------ 时间推进
  /** 推进任意毫秒（内部按 50ms tick 拆分，在线与离线共享） */
  advance(ms: number, onProgress?: (done: number) => void, shouldCancel?: () => boolean) {
    let remaining = ms;
    let n = 0;
    while (remaining > 0) {
      const step = Math.min(TICK_MS, remaining);
      this.tick(step);
      remaining -= step;
      if (onProgress && ++n % 20000 === 0) {
        onProgress(ms - remaining);
        if (shouldCancel?.()) break;
      }
    }
    this.state.rngState = this.rng.getState();
  }

  tick(ms: number) {
    const s = this.state;
    if (s.player.dead) return;
    s.clock += ms;
    s.playTime += ms;
    if (s.combat.active) tickCombat(this, ms);
    else {
      tickRegen(this, ms);
      if (s.activeAction) {
        const h = handlers[s.activeAction.skill];
        if (h) h.tick(this, ms);
      }
    }
    tickFarming(this);
    tickTownship(this, ms);
    this.achievementTimer += ms;
    if (this.achievementTimer >= 2000) { this.achievementTimer = 0; checkAchievements(this); }
  }

  // ------------------------------------------------------------------ 通知
  notify(text: string, kind: Notification['kind'] = 'info', icon?: string) {
    if (this.simulating) return;
    this.notifications.push({ id: this.notifId++, text, kind, icon, t: Date.now() });
    if (this.notifications.length > 6) this.notifications.splice(0, this.notifications.length - 6);
    this.events.emit('notify', { text, kind: kind as any, icon });
  }

  stat(key: string, amount = 1) { this.state.stats[key] = (this.state.stats[key] || 0) + amount; }
  skillStat(skill: string, key: string, amount = 1) {
    const s = (this.state.skillStats[skill] ||= {});
    s[key] = (s[key] || 0) + amount;
  }

  // ------------------------------------------------------------------ 银行
  bankCapacity(): number { return BASE_BANK_SLOTS + (this.state.shop['bank_slot'] || 0); }
  bankUsed(): number { return Object.keys(this.state.bank).length; }
  qty(id: string): number { return this.state.bank[id] || 0; }
  hasItems(items: ItemQty[], mult = 1): boolean {
    for (const i of items) if (this.qty(i.id) < i.qty * mult) return false;
    return true;
  }
  canAddItem(id: string): boolean {
    return this.state.bank[id] !== undefined || this.bankUsed() < this.bankCapacity();
  }
  /** 统一入库。返回实际入库数量（银行满时为 0） */
  addItem(id: string, qty: number, source = 'unknown'): number {
    if (qty <= 0) return 0;
    if (id === '$gp') { this.addGp(qty, source); return qty; }
    if (!C.items[id]) { console.warn(`[content] 未知物品 ID：${id}（来源 ${source}）`); return 0; }
    const s = this.state;
    if (s.bank[id] === undefined) {
      if (this.bankUsed() >= this.bankCapacity()) return 0;
      s.bank[id] = 0;
      if (!s.bankOrder.includes(id)) s.bankOrder.push(id);
    }
    s.bank[id] += qty;
    s.itemsFound[id] = (s.itemsFound[id] || 0) + qty;
    if (!this.simulating) {
      s.recent.items.unshift({ id, qty, t: s.clock });
      if (s.recent.items.length > 12) s.recent.items.length = 12;
    }
    this.events.emit('itemGained', { id, qty, source });
    return qty;
  }
  /** 统一出库：数量不足时不做任何修改并返回 false（不允许负库存） */
  removeItem(id: string, qty: number, source = 'unknown'): boolean {
    if (qty <= 0) return true;
    const s = this.state;
    const have = s.bank[id] || 0;
    if (have < qty) return false;
    const left = have - qty;
    if (left <= 0) {
      delete s.bank[id];
      // 若该物品被选为药水等仍保留 bankOrder 便于排序
    } else s.bank[id] = left;
    this.events.emit('itemConsumed', { id, qty, source });
    return true;
  }
  /** 原子性扣除多个物品 */
  removeItems(items: ItemQty[], source: string, mult = 1): boolean {
    if (!this.hasItems(items, mult)) return false;
    for (const i of items) this.removeItem(i.id, i.qty * mult, source);
    return true;
  }
  addGp(amount: number, source = 'unknown') {
    if (amount === 0) return;
    const s = this.state;
    s.currencies.gp = Math.max(0, s.currencies.gp + amount);
    if (amount > 0) this.stat('gpEarned', amount);
    this.events.emit('gpChanged', { amount, source });
  }
  spendCurrency(cost: { gp?: number; slayerCoins?: number; abyssalPieces?: number; abyssalSlayerCoins?: number }): boolean {
    const c = this.state.currencies;
    if ((cost.gp || 0) > c.gp || (cost.slayerCoins || 0) > c.slayerCoins || (cost.abyssalPieces || 0) > c.abyssalPieces || (cost.abyssalSlayerCoins || 0) > c.abyssalSlayerCoins) return false;
    c.gp -= cost.gp || 0;
    c.slayerCoins -= cost.slayerCoins || 0;
    c.abyssalPieces -= cost.abyssalPieces || 0;
    c.abyssalSlayerCoins -= cost.abyssalSlayerCoins || 0;
    if (cost.gp) { this.stat('gpSpent', cost.gp); this.events.emit('gpChanged', { amount: -cost.gp, source: 'spend' }); }
    return true;
  }
  sellPrice(id: string): number {
    const it = C.items[id];
    if (!it || it.noSell) return 0;
    return Math.floor(it.sellPrice * (1 + this.mods.get('sellPrice') / 100));
  }
  sellItem(id: string, qty: number): boolean {
    const it = C.items[id];
    if (!it || it.noSell || this.state.bankLocked[id]) return false;
    qty = Math.min(qty, this.qty(id));
    if (qty <= 0) return false;
    const gp = this.sellPrice(id) * qty;
    if (!this.removeItem(id, qty, 'sell')) return false;
    this.addGp(gp, 'sell');
    this.stat('itemsSold', qty);
    this.stat('gpFromSales', gp);
    return true;
  }

  // ------------------------------------------------------------------ 技能与经验
  levelCap(skill: SkillId): number {
    const base = C.gameModes[this.state.player.mode].levelCapBase;
    if (skill === 'township') return 99;
    return Math.min(120, base + this.mods.get('levelCap'));
  }
  abyssalLevelCap(): number {
    if (!this.state.shop['abyss_gate']) return 1;
    return Math.min(60, 20 + this.mods.get('abyssalLevelCap'));
  }
  level(skill: SkillId): number { return this.state.skills[skill].level; }
  abyssalLevel(skill: SkillId): number { return this.state.skills[skill].abyssalLevel; }
  totalLevel(): number { return C.skillOrder.reduce((a, s) => a + this.state.skills[s].level, 0); }
  inAbyss(): boolean { return (this.state.shop['abyss_gate'] || 0) > 0; }

  addXp(skill: SkillId, amount: number, applyMods = true): number {
    const s = this.state.skills[skill];
    if (!s.unlocked || amount <= 0) return 0;
    if (applyMods) amount *= Math.max(0, 1 + (this.mods.get('skillXP', skill)) / 100);
    if (skill === 'firemaking' && this.state.bonfire.endsAt > this.state.clock && applyMods) amount *= 1 + this.state.bonfire.bonus / 100;
    const cap = this.levelCap(skill);
    // 经验可超过等级上限继续累积（上限提升后直接生效）
    s.xp = Math.min(s.xp + amount, MAX_XP);
    const newLevel = levelForXp(s.xp, cap);
    if (newLevel > s.level) {
      const old = s.level;
      s.level = newLevel;
      this.onLevelUp(skill, old, newLevel, false);
    }
    this.events.emit('xpGained', { skill, amount, abyssal: false });
    return amount;
  }

  addAbyssalXp(skill: SkillId, amount: number): number {
    const s = this.state.skills[skill];
    if (!s.unlocked || amount <= 0 || !this.inAbyss()) return 0;
    amount *= Math.max(0, 1 + this.mods.get('abyssalXP', skill) / 100);
    const cap = this.abyssalLevelCap();
    s.abyssalXp = Math.min(s.abyssalXp + amount, MAX_XP);
    const newLevel = abyssalLevelForXp(s.abyssalXp, cap);
    if (newLevel > s.abyssalLevel) {
      const old = s.abyssalLevel;
      s.abyssalLevel = newLevel;
      s.treePoints += newLevel - old;
      this.onLevelUp(skill, old, newLevel, true);
    }
    this.events.emit('xpGained', { skill, amount, abyssal: true });
    return amount;
  }

  /** 等级上限变化后重新计算所有技能等级 */
  recalcLevels() {
    for (const sid of C.skillOrder) {
      const s = this.state.skills[sid];
      const lvl = levelForXp(s.xp, this.levelCap(sid));
      if (lvl > s.level) { const old = s.level; s.level = lvl; this.onLevelUp(sid, old, lvl, false); }
      const al = abyssalLevelForXp(s.abyssalXp, this.abyssalLevelCap());
      if (al > s.abyssalLevel && this.inAbyss()) { const old = s.abyssalLevel; s.abyssalLevel = al; s.treePoints += al - old; this.onLevelUp(sid, old, al, true); }
    }
  }

  private onLevelUp(skill: SkillId, old: number, level: number, abyssal: boolean) {
    const name = C.skills[skill].name;
    this.state.recent.levels.unshift({ skill, level, t: this.state.clock, abyssal });
    if (this.state.recent.levels.length > 10) this.state.recent.levels.length = 10;
    this.notify(`${name}${abyssal ? '深渊等级' : ''}提升至 ${level} 级！`, 'level', C.skills[skill].icon);
    for (let l = old + 1; l <= level; l++) this.events.emit('levelUp', { skill, level: l, abyssal });
    if (skill === 'hitpoints' && !abyssal) this.invalidate();
  }

  // ------------------------------------------------------------------ 掌握度
  masteryXp(actionId: string): number { return this.state.mastery[actionId] || 0; }
  masteryLevel(actionId: string): number { return levelForXp(this.masteryXp(actionId), MAX_MASTERY_LEVEL); }
  skillMasteryActions(skill: SkillId): string[] { return C.skills[skill].actions.filter((a) => C.actions[a].masteryEnabled !== false); }
  totalMasteryLevels(skill: SkillId): number {
    let t = 0;
    for (const a of this.skillMasteryActions(skill)) t += this.masteryLevel(a);
    return t;
  }
  poolCap(skill: SkillId): number { return masteryPoolCap(this.skillMasteryActions(skill).length); }

  addMasteryXp(skill: SkillId, actionId: string, intervalMs: number) {
    if (!C.skills[skill].masteryEnabled) return;
    const total = this.skillMasteryActions(skill).length;
    if (!total) return;
    const lvl = this.masteryLevel(actionId);
    let xp = baseMasteryXp(this.totalMasteryLevels(skill), total, lvl, intervalMs);
    xp *= Math.max(0, 1 + this.mods.get('masteryXP', skill) / 100);
    const before = lvl;
    if (lvl < MAX_MASTERY_LEVEL) {
      this.state.mastery[actionId] = Math.min(xpForLevel(MAX_MASTERY_LEVEL), this.masteryXp(actionId) + xp);
      const after = this.masteryLevel(actionId);
      if (after > before) {
        this.events.emit('masteryLevelUp', { skill, actionId, level: after });
        if (after === 99) this.notify(`${C.actions[actionId]?.name ?? actionId} 掌握度达到 99！`, 'success', '🎖️');
      }
    }
    this.addPoolXp(skill, xp * 0.25);
  }

  addPoolXp(skill: SkillId, xp: number) {
    const s = this.state.skills[skill];
    const cap = this.poolCap(skill);
    const beforePct = s.masteryPoolXp / cap;
    s.masteryPoolXp = Math.min(cap, s.masteryPoolXp + xp);
    const afterPct = s.masteryPoolXp / cap;
    if (MASTERY_CHECKPOINTS.some((c) => beforePct < c && afterPct >= c)) this.invalidate();
  }

  /** 使用掌握度池经验提升某动作的掌握等级 */
  spendPoolXp(actionId: string, levels = 1): boolean {
    const a = C.actions[actionId];
    if (!a) return false;
    const s = this.state.skills[a.skill];
    const cur = this.masteryLevel(actionId);
    const target = Math.min(MAX_MASTERY_LEVEL, cur + levels);
    if (target <= cur) return false;
    const need = xpForLevel(target) - this.masteryXp(actionId);
    if (need > s.masteryPoolXp) return false;
    const cap = this.poolCap(a.skill);
    const beforePct = s.masteryPoolXp / cap;
    s.masteryPoolXp -= need;
    this.state.mastery[actionId] = xpForLevel(target);
    if (MASTERY_CHECKPOINTS.some((c) => beforePct >= c && s.masteryPoolXp / cap < c)) this.invalidate();
    this.events.emit('masteryLevelUp', { skill: a.skill, actionId, level: target });
    return true;
  }

  // ------------------------------------------------------------------ 召唤印记
  markLevel(familiarId: string): number {
    const marks = this.state.summoning.marks[familiarId] || 0;
    const levels = [1, 6, 16, 31, 46, 61];
    let l = 0;
    for (const req of levels) if (marks >= req) l++;
    return l;
  }

  // ------------------------------------------------------------------ 需求检查
  meets(req: Requirement): boolean {
    const s = this.state;
    switch (req.type) {
      case 'skill': return s.skills[req.skill].level >= req.level && s.skills[req.skill].unlocked;
      case 'abyssal': return this.inAbyss() && s.skills[req.skill].abyssalLevel >= req.level;
      case 'dungeon': return (s.dungeonCompletions[req.id] || 0) >= (req.count ?? 1);
      case 'quest': return s.quests[req.id]?.status === 'completed';
      case 'shop': return (s.shop[req.id] || 0) >= (req.count ?? 1);
      case 'monster': return (s.monsterKills[req.id] || 0) >= req.count;
      case 'equipped': return Object.values(s.equipmentSets[s.activeSet]).some((e) => e?.id === req.id);
      case 'item': return this.qty(req.id) >= (req.qty ?? 1);
      case 'poi': return s.cartography.discovered.includes(req.id);
      case 'realm': return req.realm === 'melvor' || this.inAbyss();
      case 'township': return s.township.level >= req.level;
      case 'gameMode': return s.player.mode === req.mode;
      case 'totalLevel': return this.totalLevel() >= req.level;
    }
  }
  meetsAll(reqs: Requirement[] | undefined): boolean { return !reqs || reqs.every((r) => this.meets(r)); }
  describeReq(req: Requirement): string {
    switch (req.type) {
      case 'skill': return `${C.skills[req.skill].name} ${req.level} 级`;
      case 'abyssal': return `${C.skills[req.skill].name} 深渊 ${req.level} 级`;
      case 'dungeon': return `通关「${C.dungeons[req.id]?.name}」${req.count && req.count > 1 ? ` ${req.count} 次` : ''}`;
      case 'quest': return `完成任务「${C.quests[req.id]?.name}」`;
      case 'shop': return `购买「${C.shop[req.id]?.name}」`;
      case 'monster': return `击败 ${C.monsters[req.id]?.name} ${req.count} 次`;
      case 'equipped': return `装备 ${C.items[req.id]?.name}`;
      case 'item': return `持有 ${C.items[req.id]?.name} ×${req.qty ?? 1}`;
      case 'poi': return `发现「${C.pois[req.id]?.name}」`;
      case 'realm': return req.realm === 'abyssal' ? '开启深渊之门' : '';
      case 'township': return `城镇 ${req.level} 级`;
      case 'gameMode': return `${C.gameModes[req.mode].name}`;
      case 'totalLevel': return `总等级 ${req.level}`;
    }
  }
  /** 检查技能动作的等级与需求 */
  actionUnlocked(actionId: string): string | null {
    const a = C.actions[actionId];
    if (!a) return '未知动作';
    const sk = this.state.skills[a.skill];
    if (!sk.unlocked) return `${C.skills[a.skill].name}尚未解锁`;
    if (sk.level < a.level) return `需要 ${C.skills[a.skill].name} ${a.level} 级`;
    if (a.abyssalLevel) {
      if (!this.inAbyss()) return '需要开启深渊之门';
      if (sk.abyssalLevel < a.abyssalLevel) return `需要 ${C.skills[a.skill].name} 深渊 ${a.abyssalLevel} 级`;
    }
    if (a.realm === 'abyssal' && !this.inAbyss()) return '需要开启深渊之门';
    for (const r of a.requirements ?? []) if (!this.meets(r)) return `需要：${this.describeReq(r)}`;
    return null;
  }

  // ------------------------------------------------------------------ 活动
  startAction(skill: SkillId, actionId: string, target?: string): string | null {
    return startSkillAction(this, skill, actionId, target);
  }
  stopAction(reason = '玩家停止') {
    stopSkillAction(this, reason);
  }
  activityLabel(): string {
    const s = this.state;
    if (s.combat.active) {
      const area = s.combat.area;
      if (!area) return '战斗中';
      const name = area.kind === 'dungeon' ? C.dungeons[area.id]?.name : C.areas[area.id]?.name;
      return `战斗：${name}`;
    }
    if (s.activeAction) return `${C.skills[s.activeAction.skill].name}：${C.actions[s.activeAction.actionId]?.name ?? C.spells[s.activeAction.actionId]?.name ?? ''}`;
    return '空闲';
  }

  // ------------------------------------------------------------------ 宠物
  rollPet(petId: string, chance: number) {
    if (this.state.pets[petId]) return;
    const mult = 1 + this.mods.get('petChance') / 100;
    if (this.rng.chance(chance * mult)) this.unlockPet(petId);
  }
  unlockPet(petId: string) {
    if (this.state.pets[petId] || !C.pets[petId]) return;
    this.state.pets[petId] = this.state.clock;
    this.invalidate();
    this.notify(`获得宠物：${C.pets[petId].name}！`, 'success', C.pets[petId].icon);
    this.events.emit('petUnlocked', { petId });
  }

  item(id: string): ItemDef { return C.items[id]; }
  realm(): Realm { return this.state.player.realm; }
}
