// 城镇：土地、建筑、人口、幸福度、教育、健康、信仰、季节、资源产出与消耗、税收、城镇任务
import type { Game } from '../core/game';
import { C } from '@/content';
import { BIOMES, TOWNSHIP_TICK_MS, SEASONS, SEASON_TICKS, DEITIES, TOWNSHIP_TASKS } from '@/content/recipes/support';

export function buildingCount(g: Game, bid: string): number {
  let n = 0;
  for (const b of Object.values(g.state.township.buildings)) n += b[bid] || 0;
  return n;
}
export function biomeUsed(g: Game, biome: string): number {
  return Object.values(g.state.township.buildings[biome] ?? {}).reduce((a, b) => a + b, 0);
}
export function landCost(g: Game, biome: string): number {
  const b = BIOMES.find((x) => x.id === biome)!;
  const owned = g.state.township.land[biome] || 0;
  return Math.round(b.landCost * Math.pow(1.15, owned));
}

export function buyLand(g: Game, biome: string): string | null {
  const b = BIOMES.find((x) => x.id === biome);
  if (!b) return '无效地形';
  if (!g.state.skills.township.unlocked) return '城镇尚未解锁';
  if (g.level('township') < b.level) return `需要城镇 ${b.level} 级`;
  if (!g.spendCurrency({ gp: landCost(g, biome) })) return '金币不足';
  g.state.township.land[biome] = (g.state.township.land[biome] || 0) + 1;
  g.addXp('township', 20);
  return null;
}

export function buildCheck(g: Game, biome: string, bid: string): string | null {
  const t = g.state.township;
  const def = C.townshipBuildings[bid];
  if (!def) return '无效建筑';
  if (!g.state.skills.township.unlocked) return '城镇尚未解锁';
  if (!def.biomes.includes(biome)) return '该地形无法建造此建筑';
  if (g.level('township') < def.level) return `需要城镇 ${def.level} 级`;
  if (biomeUsed(g, biome) >= (t.land[biome] || 0)) return '该地形没有空闲土地';
  if (buildingCount(g, bid) >= def.maxCount) return '已达到建造上限';
  for (const [res, amt] of Object.entries(def.cost)) {
    if (res === 'gp') { if (g.state.currencies.gp < (amt ?? 0)) return '金币不足'; }
    else if ((t.resources[res] || 0) < (amt ?? 0)) return `${C.townshipResources[res]?.name ?? res}不足`;
  }
  return null;
}

export function build(g: Game, biome: string, bid: string): string | null {
  const err = buildCheck(g, biome, bid);
  if (err) return err;
  const t = g.state.township;
  const def = C.townshipBuildings[bid];
  for (const [res, amt] of Object.entries(def.cost)) {
    if (res === 'gp') g.spendCurrency({ gp: amt ?? 0 });
    else t.resources[res] -= amt ?? 0;
  }
  const b = (t.buildings[biome] ||= {});
  b[bid] = (b[bid] || 0) + 1;
  g.addXp('township', def.xp);
  g.skillStat('township', 'buildingsBuilt');
  recompute(g);
  return null;
}

export function demolish(g: Game, biome: string, bid: string): string | null {
  const b = g.state.township.buildings[biome];
  if (!b || !b[bid]) return '没有该建筑';
  b[bid]--;
  if (b[bid] <= 0) delete b[bid];
  // 返还 50% 资源（不含金币）
  for (const [res, amt] of Object.entries(C.townshipBuildings[bid].cost)) if (res !== 'gp') g.state.township.resources[res] = (g.state.township.resources[res] || 0) + Math.floor((amt ?? 0) / 2);
  recompute(g);
  return null;
}

interface TownTotals { population: number; storage: number; happiness: number; education: number; health: number; worship: number; jobs: number; taxGp: number; production: Record<string, number>; consumption: Record<string, number> }
export function totals(g: Game): TownTotals {
  const t: TownTotals = { population: 0, storage: 5000, happiness: 0, education: 0, health: 0, worship: 0, jobs: 0, taxGp: 0, production: {}, consumption: {} };
  for (const biome of Object.values(g.state.township.buildings)) {
    for (const [bid, count] of Object.entries(biome)) {
      const p = C.townshipBuildings[bid]?.provides;
      if (!p) continue;
      t.population += (p.population || 0) * count;
      t.storage += (p.storage || 0) * count;
      t.happiness += (p.happiness || 0) * count;
      t.education += (p.education || 0) * count;
      t.health += (p.health || 0) * count;
      t.worship += (p.worship || 0) * count;
      t.taxGp += (p.taxGp || 0) * count;
      if (p.production) { t.jobs += 5 * count; for (const [r, v] of Object.entries(p.production)) t.production[r] = (t.production[r] || 0) + (v ?? 0) * count; }
      if (p.consumption) for (const [r, v] of Object.entries(p.consumption)) t.consumption[r] = (t.consumption[r] || 0) + (v ?? 0) * count;
    }
  }
  return t;
}

function recompute(g: Game) {
  const t = g.state.township;
  const tot = totals(g);
  t.storage = tot.storage;
  t.education = tot.education;
  t.worship = tot.worship;
  t.health = Math.min(100, 50 + tot.health);
  t.level = g.level('township');
  g.invalidate();
}

/** 预估一次结算的净产出（供 UI 显示） */
export function estimate(g: Game) {
  const t = g.state.township;
  const tot = totals(g);
  const employment = tot.jobs ? Math.min(1, t.population / tot.jobs) : 0;
  const season = SEASONS[t.season % SEASONS.length];
  const deity = DEITIES.find((d) => d.id === t.deity);
  const prodMult = (1 + g.mods.get('townshipProduction') / 100) * (0.5 + t.happiness / 100) * (t.health / 100 + 0.5);
  const net: Record<string, number> = {};
  for (const [r, v] of Object.entries(tot.production)) {
    const m = (season.mods[r] ?? 1) * (t.worship >= 20 ? deity?.town[r] ?? 1 : 1);
    net[r] = (net[r] || 0) + v * employment * prodMult * m;
  }
  for (const [r, v] of Object.entries(tot.consumption)) net[r] = (net[r] || 0) - v;
  net.food = (net.food || 0) - t.population * 0.5;
  const tax = Math.round((tot.taxGp + t.population * 0.5) * (1 + t.education / 200));
  return { net, tax, employment, totals: tot, season };
}

export function townTick(g: Game) {
  const t = g.state.township;
  recompute(g);
  const est = estimate(g);
  const tot = est.totals;
  // 资源变化（结果夹在 0 与仓库上限之间）
  for (const [r, v] of Object.entries(est.net)) {
    const cur = t.resources[r] || 0;
    t.resources[r] = Math.max(0, Math.min(t.storage, cur + v));
  }
  const starving = (t.resources.food || 0) <= 0 && t.population > 0;
  // 人口增长
  if (!starving && t.happiness >= 30 && t.population < tot.population) t.population = Math.min(tot.population, t.population + Math.max(1, Math.ceil(tot.population * 0.1)));
  if (starving) t.population = Math.max(0, Math.floor(t.population * 0.95));
  if (t.population > tot.population) t.population = tot.population;
  // 幸福度
  const crowding = tot.population > 0 ? t.population / tot.population : 0;
  t.happiness = Math.max(0, Math.min(100, 50 + tot.happiness + t.education / 10 - (starving ? 30 : 0) - (crowding > 0.95 ? 5 : 0)));
  // 税收
  if (est.tax > 0) { g.addGp(est.tax, 'township'); g.skillStat('township', 'taxCollected', est.tax); }
  g.addXp('township', 10 + t.population * 0.5);
  t.ticks++;
  if (t.ticks % SEASON_TICKS === 0) {
    t.season = (t.season + 1) % SEASONS.length;
    g.notify(`城镇进入${SEASONS[t.season].name}`, 'info', SEASONS[t.season].icon);
  }
  g.skillStat('township', 'ticks');
}

export function tickTownship(g: Game, ms: number) {
  if (!g.state.skills.township.unlocked) return;
  const t = g.state.township;
  const hasBuildings = Object.keys(t.buildings).length > 0;
  if (!hasBuildings) return;
  t.tickTimer += ms;
  while (t.tickTimer >= TOWNSHIP_TICK_MS) {
    t.tickTimer -= TOWNSHIP_TICK_MS;
    townTick(g);
  }
}

export function donate(g: Game, itemId: string, qty: number): string | null {
  const res = Object.values(C.townshipResources).find((r) => r.fromItems?.includes(itemId));
  if (!res) return '该物品无法捐献';
  qty = Math.min(qty, g.qty(itemId));
  if (qty <= 0) return '数量不足';
  const t = g.state.township;
  const space = t.storage - (t.resources[res.id] || 0);
  qty = Math.min(qty, Math.max(0, space));
  if (qty <= 0) return '城镇仓库已满';
  g.removeItem(itemId, qty, 'township');
  t.resources[res.id] = (t.resources[res.id] || 0) + qty;
  return null;
}

export function convert(g: Game, resId: string, units: number): string | null {
  const res = C.townshipResources[resId];
  if (!res?.convertsTo || !res.convertRatio) return '该资源无法兑换';
  const t = g.state.township;
  const items = Math.floor(Math.min(units, t.resources[resId] || 0) / res.convertRatio);
  if (items <= 0) return '资源不足';
  if (!g.canAddItem(res.convertsTo)) return '银行已满';
  t.resources[resId] -= items * res.convertRatio;
  g.addItem(res.convertsTo, items, 'township');
  return null;
}

export function completeTask(g: Game, taskId: string): string | null {
  const task = TOWNSHIP_TASKS.find((x) => x.id === taskId);
  const t = g.state.township;
  if (!task) return '无效任务';
  if (t.tasksCompleted.includes(taskId)) return '任务已完成';
  if (!g.removeItems(task.requires, 'townshipTask')) return '物品不足';
  t.tasksCompleted.push(taskId);
  if (task.reward.gp) g.addGp(task.reward.gp, 'townshipTask');
  if (task.reward.xp) g.addXp('township', task.reward.xp);
  for (const i of task.reward.items ?? []) g.addItem(i.id, i.qty, 'townshipTask');
  for (const [r, v] of Object.entries(task.reward.resources ?? {})) t.resources[r] = Math.min(t.storage, (t.resources[r] || 0) + v);
  g.notify(`完成城镇任务：${task.name}`, 'success', '🏘️');
  return null;
}

export function setDeity(g: Game, deity: string): string | null {
  if (!DEITIES.some((d) => d.id === deity)) return '无效信仰';
  g.state.township.deity = deity;
  g.invalidate();
  return null;
}
