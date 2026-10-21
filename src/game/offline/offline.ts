// 离线结算：保存状态 + 时间差 + 逐 tick 重放模拟（与在线共享同一规则引擎）
import { Game, MAX_OFFLINE_MS } from '../core/game';
import type { GameState } from '../core/state';
import type { SkillId } from '../core/types';
import { C } from '@/content';

export interface OfflineReport {
  requestedMs: number;
  simulatedMs: number;
  capped: boolean;
  anomaly: 'none' | 'rollback' | 'jump';
  cancelled: boolean;
  activity: string;
  actions: number;
  xp: { skill: SkillId; xp: number; abyssalXp: number; levelsGained: number; fromLevel: number; toLevel: number; abyssalLevelsGained: number }[];
  mastery: { skill: SkillId; levels: number }[];
  itemsGained: { id: string; qty: number }[];
  itemsLost: { id: string; qty: number }[];
  currencies: Record<string, number>;
  kills: number;
  deaths: number;
  dungeons: { id: string; count: number }[];
  quests: string[];
  achievements: string[];
  pets: string[];
  stopReasons: string[];
  hpEnd: number;
}

interface Snapshot {
  skills: Record<string, { xp: number; level: number; axp: number; alevel: number }>;
  masteryLevels: Record<string, number>;
  bank: Record<string, number>;
  currencies: Record<string, number>;
  kills: number;
  deaths: number;
  actions: number;
  dungeons: Record<string, number>;
  questsDone: string[];
  achievements: string[];
  pets: string[];
}

function snapshot(g: Game): Snapshot {
  const s = g.state;
  const skills: Snapshot['skills'] = {};
  const masteryLevels: Record<string, number> = {};
  for (const id of C.skillOrder) {
    skills[id] = { xp: s.skills[id].xp, level: s.skills[id].level, axp: s.skills[id].abyssalXp, alevel: s.skills[id].abyssalLevel };
    if (C.skills[id].masteryEnabled) masteryLevels[id] = g.totalMasteryLevels(id);
  }
  // 银行快照包含装备栏中的可消耗堆叠（弹药、召唤石板、食物）以统计消耗
  const bank: Record<string, number> = { ...s.bank };
  const set = s.equipmentSets[s.activeSet];
  for (const st of Object.values(set)) if (st) bank[st.id] = (bank[st.id] || 0) + st.qty;
  for (const f of s.food) if (f) bank[f.id] = (bank[f.id] || 0) + f.qty;
  for (const l of s.combat.loot) bank[l.id] = (bank[l.id] || 0) + l.qty;
  return {
    skills, masteryLevels, bank, currencies: { ...s.currencies }, kills: s.stats.monstersKilled || 0, deaths: s.stats.deaths || 0,
    actions: s.stats.skillActions || 0, dungeons: { ...s.dungeonCompletions },
    questsDone: Object.entries(s.quests).filter(([, q]) => q.status === 'completed').map(([k]) => k),
    achievements: Object.keys(s.achievements), pets: Object.keys(s.pets),
  };
}

function diff(g: Game, a: Snapshot, b: Snapshot, base: Omit<OfflineReport, 'xp' | 'mastery' | 'itemsGained' | 'itemsLost' | 'currencies' | 'kills' | 'deaths' | 'dungeons' | 'quests' | 'achievements' | 'pets' | 'actions' | 'hpEnd'>): OfflineReport {
  const xp: OfflineReport['xp'] = [];
  for (const id of C.skillOrder) {
    const x = a.skills[id], y = b.skills[id];
    if (y.xp > x.xp || y.axp > x.axp) xp.push({ skill: id, xp: y.xp - x.xp, abyssalXp: y.axp - x.axp, levelsGained: y.level - x.level, fromLevel: x.level, toLevel: y.level, abyssalLevelsGained: y.alevel - x.alevel });
  }
  const mastery: OfflineReport['mastery'] = [];
  for (const [k, v] of Object.entries(b.masteryLevels)) if (v > (a.masteryLevels[k] || 0)) mastery.push({ skill: k as SkillId, levels: v - (a.masteryLevels[k] || 0) });
  const itemsGained: OfflineReport['itemsGained'] = [];
  const itemsLost: OfflineReport['itemsLost'] = [];
  const ids = new Set([...Object.keys(a.bank), ...Object.keys(b.bank)]);
  for (const id of ids) {
    const d = (b.bank[id] || 0) - (a.bank[id] || 0);
    if (d > 0) itemsGained.push({ id, qty: d }); else if (d < 0) itemsLost.push({ id, qty: -d });
  }
  const currencies: Record<string, number> = {};
  for (const k of Object.keys(b.currencies)) { const d = (b.currencies as any)[k] - ((a.currencies as any)[k] || 0); if (d) currencies[k] = d; }
  const dungeons: OfflineReport['dungeons'] = [];
  for (const [k, v] of Object.entries(b.dungeons)) if (v > (a.dungeons[k] || 0)) dungeons.push({ id: k, count: v - (a.dungeons[k] || 0) });
  return {
    ...base, xp, mastery, itemsGained: itemsGained.sort((x, y) => y.qty - x.qty), itemsLost: itemsLost.sort((x, y) => y.qty - x.qty), currencies,
    kills: b.kills - a.kills, deaths: b.deaths - a.deaths, actions: b.actions - a.actions, dungeons,
    quests: b.questsDone.filter((q) => !a.questsDone.includes(q)), achievements: b.achievements.filter((x) => !a.achievements.includes(x)),
    pets: b.pets.filter((p) => !a.pets.includes(p)), hpEnd: g.state.hp,
  };
}

export interface OfflineOptions { onProgress?: (done: number, total: number) => void; shouldCancel?: () => boolean }

/** 计算离线时长与时间异常 */
export function computeOfflineWindow(state: GameState, now: number) {
  const delta = now - state.lastSettledAt;
  if (delta < 0) return { ms: 0, capped: false, anomaly: 'rollback' as const, requested: delta };
  const capped = delta > MAX_OFFLINE_MS;
  return { ms: Math.min(delta, MAX_OFFLINE_MS), capped, anomaly: capped ? 'jump' as const : 'none' as const, requested: delta };
}

/** 在给定状态上模拟 ms 毫秒（Worker 与测试共用） */
export function simulateOffline(state: GameState, ms: number, meta: { capped: boolean; anomaly: OfflineReport['anomaly']; requested: number }, opts: OfflineOptions = {}): { state: GameState; report: OfflineReport } {
  const g = new Game(state);
  g.simulating = true;
  const before = snapshot(g);
  const activity = g.activityLabel();
  const startClock = g.state.clock;
  let cancelled = false;
  g.advance(ms, (done) => opts.onProgress?.(done, ms), () => { cancelled = !!opts.shouldCancel?.(); return cancelled; });
  const simulated = g.state.clock - startClock;
  g.state.lastSettledAt = g.state.clock;
  g.state.settlementId = (g.state.settlementId || 0) + 1;
  const after = snapshot(g);
  const report = diff(g, before, after, { requestedMs: meta.requested, simulatedMs: simulated, capped: meta.capped, anomaly: meta.anomaly, cancelled, activity, stopReasons: [...g.stopReasons] });
  return { state: g.state, report };
}

/** 异步分块模拟：每块之间让出线程，以便响应取消并汇报进度 */
export async function simulateOfflineAsync(state: GameState, ms: number, meta: { capped: boolean; anomaly: OfflineReport['anomaly']; requested: number }, opts: OfflineOptions = {}): Promise<{ state: GameState; report: OfflineReport }> {
  const g = new Game(state);
  g.simulating = true;
  const before = snapshot(g);
  const activity = g.activityLabel();
  const startClock = g.state.clock;
  const CHUNK = 5 * 60 * 1000;
  let done = 0;
  let cancelled = false;
  while (done < ms) {
    const step = Math.min(CHUNK, ms - done);
    g.advance(step);
    done += step;
    opts.onProgress?.(done, ms);
    await new Promise((r) => setTimeout(r, 0));
    if (opts.shouldCancel?.()) { cancelled = true; break; }
  }
  const simulated = g.state.clock - startClock;
  g.state.lastSettledAt = g.state.clock;
  g.state.settlementId = (g.state.settlementId || 0) + 1;
  const after = snapshot(g);
  const report = diff(g, before, after, { requestedMs: meta.requested, simulatedMs: simulated, capped: meta.capped, anomaly: meta.anomaly, cancelled, activity, stopReasons: [...g.stopReasons] });
  return { state: g.state, report };
}

/** 结算结果合法性校验（防止异常数值写入存档） */
export function verifyResult(state: GameState): string | null {
  for (const [id, q] of Object.entries(state.bank)) if (!Number.isFinite(q) || q < 0) return `物品数量异常：${id}`;
  for (const [k, v] of Object.entries(state.currencies)) if (!Number.isFinite(v) || v < 0) return `货币异常：${k}`;
  for (const id of C.skillOrder) if (!Number.isFinite(state.skills[id].xp)) return `经验异常：${id}`;
  if (!Number.isFinite(state.hp)) return '生命值异常';
  return null;
}
