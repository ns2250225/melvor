import { describe, it, expect } from 'vitest';
import { newGame } from './helpers';
import { migrate, validateState, serializeState, parseImport, exportSave } from '@/game/persistence/save';
import { SCHEMA_VERSION } from '@/game/core/state';

describe('存档', () => {
  it('序列化往返一致', () => {
    const g = newGame();
    g.startAction('woodcutting', 'wc_normal'); g.advance(30_000);
    const back = migrate(JSON.parse(serializeState(g.state)));
    expect(back.bank).toEqual(g.state.bank);
    expect(back.skills.woodcutting.xp).toBe(g.state.skills.woodcutting.xp);
  });
  it('旧版本存档迁移', () => {
    const g = newGame();
    const old: any = JSON.parse(serializeState(g.state));
    old.schemaVersion = 1;
    delete old.cartography; delete old.harvesting;
    for (const s of Object.values<any>(old.skills)) { delete s.abyssalXp; delete s.treeNodes; }
    const m = migrate(old);
    expect(m.schemaVersion).toBe(SCHEMA_VERSION);
    expect(m.cartography.surveyed).toContain('0,0');
    expect(m.skills.attack.treeNodes).toEqual([]);
  });
  it('拒绝更高版本存档', () => {
    const g = newGame();
    const s: any = JSON.parse(serializeState(g.state));
    s.schemaVersion = SCHEMA_VERSION + 1;
    expect(() => migrate(s)).toThrow();
  });
  it('校验非法数值', () => {
    const g = newGame();
    const s: any = JSON.parse(serializeState(g.state));
    s.bank.food_shrimp = -5;
    s.bank.unknown_item = 3;
    const v = validateState(s);
    expect(v.ok).toBe(false);
    expect(v.warnings.some((w) => w.includes('unknown_item'))).toBe(true);
  });
  it('导出后导入状态一致', async () => {
    const g = newGame();
    g.addGp(12345);
    const text = await exportSave(g.state);
    const r = await parseImport(text);
    expect(r.checksumOk).toBe(true);
    expect(r.state.currencies.gp).toBe(12345);
  });
});
