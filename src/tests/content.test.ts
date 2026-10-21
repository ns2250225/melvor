import { describe, it, expect } from 'vitest';
import '@/content';
import { checkContent } from '@/game/core/contentCheck';
import { C } from '@/content';

describe('内容完整性', () => {
  const report = checkContent();
  it('没有引用错误或重复 ID', () => { expect(report.errors).toEqual([]); });
  it('全部目标技能均已注册', () => { expect(C.skillOrder.length).toBe(28); });
  it('所有副本都有敌人序列与奖励', () => {
    for (const d of Object.values(C.dungeons)) { expect(d.monsters.length).toBeGreaterThan(0); expect(d.rewards.length + (d.rewardTable ? 1 : 0)).toBeGreaterThan(0); }
  });
  it('所有扩展都有内容', () => {
    for (const exp of ['toth', 'aod', 'ita']) expect(Object.values(C.items).some((i) => i.expansion === exp)).toBe(true);
  });
});
