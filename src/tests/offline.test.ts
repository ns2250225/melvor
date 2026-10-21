import { describe, it, expect } from 'vitest';
import { newGame } from './helpers';
import { simulateOffline, computeOfflineWindow } from '@/game/offline/offline';
import { MAX_OFFLINE_MS } from '@/game/core/game';

const meta = { capped: false, anomaly: 'none' as const, requested: 0 };
const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x));

describe('离线结算', () => {
  for (const [label, ms] of [['1 分钟', 60_000], ['1 小时', 3_600_000], ['24 小时', 86_400_000]] as const) {
    it(`离线 ${label} 伐木`, () => {
      const g = newGame(11);
      g.startAction('woodcutting', 'wc_normal');
      const { state, report } = simulateOffline(clone(g.state), ms, { ...meta, requested: ms });
      expect(report.simulatedMs).toBe(ms);
      expect(state.bank.log_normal ?? 0).toBeGreaterThan(0);
      expect(state.lastSettledAt).toBe(state.clock);
    });
  }
  it('离线期间连续升级', () => {
    const g = newGame(12);
    g.startAction('woodcutting', 'wc_normal');
    const { report } = simulateOffline(clone(g.state), 3_600_000, meta);
    expect(report.xp.find((x) => x.skill === 'woodcutting')!.levelsGained).toBeGreaterThan(5);
  });
  it('一次性推进与分段推进结果一致（固定种子）', () => {
    const a = newGame(77), b = newGame(77);
    a.startAction('fishing', 'fish_shrimp'); b.startAction('fishing', 'fish_shrimp');
    a.advance(600_000);
    for (let i = 0; i < 60; i++) b.advance(10_000);
    expect(a.state.bank).toEqual(b.state.bank);
    expect(a.state.skills.fishing.xp).toBeCloseTo(b.state.skills.fishing.xp);
  });
  it('离线期间资源耗尽停止并记录原因', () => {
    const g = newGame(13);
    g.addItem('log_normal', 5);
    g.startAction('firemaking', 'fm_normal');
    const { state, report } = simulateOffline(clone(g.state), 600_000, meta);
    expect(state.activeAction).toBeNull();
    expect(report.stopReasons.length).toBeGreaterThan(0);
  });
  it('系统时间倒退与超长离线', () => {
    const g = newGame(14);
    expect(computeOfflineWindow(g.state, g.state.lastSettledAt - 5000).anomaly).toBe('rollback');
    const w = computeOfflineWindow(g.state, g.state.lastSettledAt + MAX_OFFLINE_MS * 3);
    expect(w.capped).toBe(true);
    expect(w.ms).toBe(MAX_OFFLINE_MS);
  });
  it('结算号递增防止重复结算', () => {
    const g = newGame(15);
    const { state } = simulateOffline(clone(g.state), 60_000, meta);
    expect(state.settlementId).toBe(g.state.settlementId + 1);
  });
});
