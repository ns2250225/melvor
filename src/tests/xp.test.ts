import { describe, it, expect } from 'vitest';
import { xpForLevel, levelForXp, levelProgress, masteryPoolCap, baseMasteryXp, abyssalXpForLevel, abyssalLevelForXp } from '@/game/core/xp';

describe('经验曲线', () => {
  it('目标版本检查点', () => {
    expect(xpForLevel(1)).toBe(0);
    expect(xpForLevel(2)).toBe(83);
    expect(xpForLevel(10)).toBe(1154);
    expect(xpForLevel(99)).toBe(13034431);
    expect(xpForLevel(120)).toBe(104273167);
  });
  it('等级与经验互逆、上限生效', () => {
    for (let l = 1; l <= 120; l++) expect(levelForXp(xpForLevel(l), 120)).toBe(l);
    expect(levelForXp(xpForLevel(50) - 1, 120)).toBe(49);
    expect(levelForXp(2e9, 99)).toBe(99);
  });
  it('多级连续升级', () => { expect(levelForXp(xpForLevel(40))).toBe(40); });
  it('进度 0..1', () => {
    expect(levelProgress(xpForLevel(10), 10, 99)).toBe(0);
    expect(levelProgress(xpForLevel(99), 99, 99)).toBe(1);
  });
  it('深渊曲线单调递增', () => {
    for (let l = 2; l <= 60; l++) expect(abyssalXpForLevel(l)).toBeGreaterThan(abyssalXpForLevel(l - 1));
    expect(abyssalLevelForXp(abyssalXpForLevel(20))).toBe(20);
  });
  it('掌握度池上限与基础掌握度经验', () => {
    expect(masteryPoolCap(10)).toBe(5_000_000);
    expect(baseMasteryXp(10, 10, 1, 2000)).toBeCloseTo((1 + 1) * 2 * 0.5);
  });
});
