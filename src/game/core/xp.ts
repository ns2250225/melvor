// 经验曲线：标准曲线（等级 L 所需经验 = floor(Σ_{x=1}^{L-1} floor(x + 300·2^(x/7)) / 4)）
// 该曲线与目标版本一致：99 级 = 13,034,431 XP，120 级 = 104,273,167 XP。
// 深渊等级（Into the Abyss）使用独立曲线，最高 60 级。

export const MAX_STANDARD_LEVEL = 120;
export const MAX_MASTERY_LEVEL = 99;
export const MAX_ABYSSAL_LEVEL = 60;

const table: number[] = [0, 0];
{
  let points = 0;
  for (let lvl = 1; lvl < 200; lvl++) {
    points += Math.floor(lvl + 300 * Math.pow(2, lvl / 7));
    table[lvl + 1] = Math.floor(points / 4);
  }
}

/** 到达某等级所需的总经验 */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return table[Math.min(level, table.length - 1)];
}

/** 由经验求等级（带上限） */
export function levelForXp(xp: number, cap = MAX_STANDARD_LEVEL): number {
  let lo = 1, hi = cap;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (table[mid] <= xp) lo = mid; else hi = mid - 1;
  }
  return lo;
}

/** 深渊经验曲线：等级 L 所需深渊经验，增长倍率高于标准曲线 */
const abyssTable: number[] = [0, 0];
{
  let points = 0;
  for (let lvl = 1; lvl < 80; lvl++) {
    points += Math.floor(lvl * 50 + 2000 * Math.pow(2, lvl / 6));
    abyssTable[lvl + 1] = Math.floor(points / 2);
  }
}

export function abyssalXpForLevel(level: number): number {
  if (level <= 1) return 0;
  return abyssTable[Math.min(level, abyssTable.length - 1)];
}

export function abyssalLevelForXp(xp: number, cap = MAX_ABYSSAL_LEVEL): number {
  let lo = 1, hi = cap;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (abyssTable[mid] <= xp) lo = mid; else hi = mid - 1;
  }
  return lo;
}

/** 当前等级进度 0..1 */
export function levelProgress(xp: number, level: number, cap: number, abyssal = false): number {
  if (level >= cap) return 1;
  const f = abyssal ? abyssalXpForLevel : xpForLevel;
  const cur = f(level);
  const next = f(level + 1);
  return Math.max(0, Math.min(1, (xp - cur) / (next - cur)));
}

/** 掌握度池上限：每个动作 500,000 */
export function masteryPoolCap(actionCount: number): number {
  return actionCount * 500000;
}

/** 掌握度池检查点（百分比）及其奖励描述由技能内容定义 */
export const MASTERY_CHECKPOINTS = [0.1, 0.25, 0.5, 0.95];

/**
 * 基础掌握度经验（每次动作）
 *  = ((已解锁动作掌握等级总和 / 技能动作总数) + 当前掌握等级 × (技能动作总数 / 10)) × 动作秒数 × 0.5
 */
export function baseMasteryXp(totalMasteryLevels: number, totalActions: number, actionMasteryLevel: number, intervalMs: number): number {
  if (totalActions <= 0) return 0;
  const base = totalMasteryLevels / totalActions + actionMasteryLevel * (totalActions / 10);
  return base * (intervalMs / 1000) * 0.5;
}
