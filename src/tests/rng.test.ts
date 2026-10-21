import { describe, it, expect } from 'vitest';
import { Rng, seedFromNumber } from '@/game/core/rng';

describe('随机数接口', () => {
  it('固定种子可重放', () => {
    const a = new Rng(seedFromNumber(42)), b = new Rng(seedFromNumber(42));
    for (let i = 0; i < 1000; i++) expect(a.next()).toBe(b.next());
  });
  it('状态可序列化恢复', () => {
    const a = new Rng(seedFromNumber(7));
    a.next(); a.next();
    const b = new Rng(a.getState());
    expect(b.next()).toBe(a.next());
  });
  it('区间与概率', () => {
    const r = new Rng(seedFromNumber(1));
    let hits = 0;
    for (let i = 0; i < 20000; i++) {
      const v = r.int(3, 7);
      expect(v).toBeGreaterThanOrEqual(3); expect(v).toBeLessThanOrEqual(7);
      if (r.chance(0.25)) hits++;
    }
    expect(hits / 20000).toBeGreaterThan(0.23);
    expect(hits / 20000).toBeLessThan(0.27);
  });
  it('权重抽样符合比例', () => {
    const r = new Rng(seedFromNumber(3));
    const counts: Record<string, number> = { a: 0, b: 0 };
    for (let i = 0; i < 30000; i++) counts[r.weighted([{ k: 'a', weight: 3 }, { k: 'b', weight: 1 }])!.k]++;
    expect(counts.a / 30000).toBeCloseTo(0.75, 1);
  });
});
