import { describe, it, expect } from 'vitest';
import { newGame } from './helpers';
import { buy } from '@/game/inventory/shop';

describe('生产链与经济', () => {
  it('伐木 → 生火，资源不足时停止', () => {
    const g = newGame(1);
    expect(g.startAction('woodcutting', 'wc_normal')).toBeNull();
    g.advance(60_000);
    const logs = g.qty('log_normal');
    expect(logs).toBeGreaterThanOrEqual(15);
    expect(g.startAction('firemaking', 'fm_normal')).toBeNull();
    g.advance(10 * 60_000);
    expect(g.qty('log_normal')).toBe(0);
    expect(g.state.activeAction).toBeNull();
    expect(g.state.skills.firemaking.xp).toBeGreaterThan(0);
  });
  it('采矿 → 冶炼 → 锻造完整链路', () => {
    const g = newGame(2);
    g.startAction('mining', 'mine_copper'); g.advance(3 * 60_000);
    g.startAction('mining', 'mine_tin'); g.advance(3 * 60_000);
    expect(g.startAction('smithing', 'smelt_bronze')).toBeNull();
    g.advance(2 * 60_000);
    expect(g.qty('bar_bronze')).toBeGreaterThan(0);
    expect(g.startAction('smithing', 'smith_bronze_dagger')).toBeNull();
    g.advance(10_000);
    expect(g.qty('bronze_dagger')).toBeGreaterThan(1);
  });
  it('银行满时停止并且不扣材料', () => {
    const g = newGame(3);
    for (const id of Object.keys(g.state.bank)) delete g.state.bank[id];
    let n = 0;
    for (const id of ['feather', 'egg', 'milk', 'bones', 'ash', 'compost', 'paper', 'ink', 'leather', 'cowhide', 'raw_beef', 'raw_chicken', 'bread', 'seaweed', 'old_boot', 'rusty_can', 'driftwood', 'charcoal', 'stardust', 'gem_topaz', 'gem_ruby', 'gem_sapphire', 'gem_emerald', 'gem_diamond']) { g.addItem(id, 1); n++; }
    expect(g.bankUsed()).toBe(g.bankCapacity());
    expect(g.startAction('woodcutting', 'wc_normal')).not.toBeNull();
  });
  it('交易失败不改变任何资源', () => {
    const g = newGame(4);
    const before = JSON.stringify(g.state.bank) + g.state.currencies.gp;
    expect(buy(g, 'autoeat_1')).not.toBeNull();
    expect(JSON.stringify(g.state.bank) + g.state.currencies.gp).toBe(before);
    g.addGp(1000);
    expect(buy(g, 'buy_feather', 100)).toBeNull();
    expect(g.qty('feather')).toBe(100);
    expect(g.state.currencies.gp).toBe(800);
  });
  it('removeItem 不允许负库存', () => {
    const g = newGame(5);
    expect(g.removeItem('food_shrimp', 999)).toBe(false);
    expect(g.qty('food_shrimp')).toBe(10);
  });
});
