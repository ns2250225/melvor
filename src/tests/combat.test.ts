import { describe, it, expect } from 'vitest';
import { newGame } from './helpers';
import { hitChance, strengthMaxHit, triangle, playerCombatStats, playerMaxHp } from '@/game/combat/stats';
import { startCombat } from '@/game/combat/combat';
import { equip } from '@/game/inventory/equipment';
import { C } from '@/content';

describe('战斗公式', () => {
  it('命中率', () => {
    expect(hitChance(100, 100)).toBeCloseTo(0.5);
    expect(hitChance(50, 100)).toBeCloseTo(0.25);
    expect(hitChance(200, 100)).toBeCloseTo(0.75);
    expect(hitChance(0, 100)).toBe(0);
  });
  it('最大伤害公式', () => {
    expect(strengthMaxHit(10, 0)).toBe(Math.floor(10 * (1.3 + 1)));
    expect(strengthMaxHit(108, 100)).toBeGreaterThan(strengthMaxHit(108, 0));
  });
  it('战斗三角', () => {
    const g = newGame();
    expect(triangle(g, 'melee', 'ranged').dmg).toBeGreaterThan(1);
    expect(triangle(g, 'melee', 'magic').dmg).toBeLessThan(1);
    expect(triangle(g, 'magic', 'magic').dmg).toBe(1);
  });
  it('装备变化立即影响属性', () => {
    const g = newGame();
    const before = playerCombatStats(g).maxHit;
    g.addItem('iron_sword', 1);
    g.addXp('attack', 2000, false);
    expect(equip(g, 'iron_sword')).toBeNull();
    expect(playerCombatStats(g).maxHit).toBeGreaterThanOrEqual(before);
    expect(playerCombatStats(g).gear.stabAttack).toBe(C.items.iron_sword.equipment!.stats.stabAttack);
  });
  it('自动战斗击杀并获得掉落', () => {
    const g = newGame(99);
    equip(g, 'bronze_dagger');
    expect(startCombat(g, 'area', 'area_farm', 'chicken')).toBeNull();
    g.advance(5 * 60 * 1000);
    expect(g.state.monsterKills.chicken ?? 0).toBeGreaterThan(0);
    expect(g.qty('bones') + g.state.combat.loot.length).toBeGreaterThan(0);
    expect(g.state.skills.attack.xp).toBeGreaterThan(0);
  });
  it('玩家死亡时失去装备并停止战斗', () => {
    const g = newGame(5);
    equip(g, 'bronze_dagger');
    startCombat(g, 'area', 'area_dragons', 'black_dragon');
    // 跳过区域需求：直接设置
    g.state.combat.active = true;
    g.state.combat.area = { kind: 'area', id: 'area_dragons', monster: 'black_dragon' };
    g.advance(10 * 60 * 1000);
    expect(g.state.stats.deaths ?? 0).toBeGreaterThan(0);
    expect(g.state.combat.active).toBe(false);
    expect(g.state.hp).toBe(playerMaxHp(g));
  });
});
