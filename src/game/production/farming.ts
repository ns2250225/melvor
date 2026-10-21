// 农业：地块解锁、种植、施肥、随真实（游戏）时间成长与收获
import type { Game } from '../core/game';
import { C } from '@/content';
import { FARMING_PLOTS } from '@/content/recipes/support';

export function plotDef(id: string) { return FARMING_PLOTS.find((p) => p.id === id)!; }

export function growTime(g: Game, cropId: string): number {
  const c = C.crops[cropId];
  return Math.round(c.growTime * Math.max(0.2, 1 + g.mods.get('farmingGrowth') / 100));
}

export function plotStatus(g: Game, plotId: string): { state: 'locked' | 'empty' | 'growing' | 'ready'; remaining: number; progress: number } {
  const p = g.state.farming.plots.find((x) => x.id === plotId);
  if (!p || !p.unlocked) return { state: 'locked', remaining: 0, progress: 0 };
  if (!p.cropId) return { state: 'empty', remaining: 0, progress: 0 };
  const total = growTime(g, p.cropId);
  const elapsed = g.state.clock - p.plantedAt;
  if (elapsed >= total) return { state: 'ready', remaining: 0, progress: 1 };
  return { state: 'growing', remaining: total - elapsed, progress: elapsed / total };
}

export function unlockPlot(g: Game, plotId: string): string | null {
  const def = plotDef(plotId);
  const p = g.state.farming.plots.find((x) => x.id === plotId);
  if (!def || !p || p.unlocked) return '无效地块';
  if (g.level('farming') < def.level) return `需要农业 ${def.level} 级`;
  if (!g.spendCurrency({ gp: def.cost })) return '金币不足';
  p.unlocked = true;
  return null;
}

export function plant(g: Game, plotId: string, cropId: string): string | null {
  const p = g.state.farming.plots.find((x) => x.id === plotId);
  const c = C.crops[cropId];
  if (!p || !c) return '无效操作';
  if (!g.state.skills.farming.unlocked) return '农业尚未解锁';
  if (!p.unlocked) return '地块未解锁';
  if (p.cropId) return '地块已有作物';
  if (plotDef(plotId).type !== c.plotType) return '作物与地块类型不符';
  const err = g.actionUnlocked(cropId);
  if (err) return err;
  if (!g.removeItem(c.seed, c.seedQty, 'farming')) return '种子不足';
  p.cropId = cropId;
  p.plantedAt = g.state.clock;
  g.skillStat('farming', 'planted');
  return null;
}

export function applyCompost(g: Game, plotId: string, gloop = false): string | null {
  const p = g.state.farming.plots.find((x) => x.id === plotId);
  if (!p || !p.unlocked) return '地块未解锁';
  if (gloop) {
    if (p.gloop) return '已施用奇异粘液';
    if (!g.removeItem('weird_gloop', 1, 'farming')) return '没有奇异粘液';
    p.gloop = true;
    return null;
  }
  if (p.compost >= 3) return '堆肥已达上限';
  if (!g.removeItem('compost', 1, 'farming')) return '没有堆肥';
  p.compost++;
  return null;
}

export function harvest(g: Game, plotId: string): string | null {
  const p = g.state.farming.plots.find((x) => x.id === plotId);
  if (!p || !p.cropId) return '没有可收获的作物';
  if (plotStatus(g, plotId).state !== 'ready') return '作物尚未成熟';
  const c = C.crops[p.cropId];
  const mastery = g.masteryLevel(c.id);
  const success = p.gloop ? 100 : Math.min(100, 50 + p.compost * 20 + mastery / 2);
  let qty = 0;
  if (g.rng.percent(success)) {
    qty = Math.max(1, Math.round(c.baseYield * (1 + mastery / 50) * (1 + g.mods.get('farmingYield') / 100) * (p.gloop ? 2 : 1)));
    if (!g.canAddItem(c.produce)) return '银行已满';
    g.addItem(c.produce, qty, 'farming');
    g.events.emit('itemCrafted', { id: c.produce, qty, skill: 'farming' });
    g.addXp('farming', c.xp * (1 + qty / 10));
    g.addMasteryXp('farming', c.id, Math.min(c.growTime, 3600000) / 20);
    g.rollPet('pet_farming', 0.0005);
    g.skillStat('farming', 'harvested', qty);
    g.events.emit('actionComplete', { skill: 'farming', actionId: c.id, count: 1 });
  } else {
    g.skillStat('farming', 'cropsDied');
    g.notify(`${C.items[c.produce].name}枯萎了`, 'warning');
  }
  p.cropId = null; p.compost = 0; p.gloop = false; p.plantedAt = 0;
  return null;
}

/** 收获全部成熟作物并用同种种子补种 */
export function harvestAndReplantAll(g: Game) {
  for (const p of g.state.farming.plots) {
    if (!p.cropId || plotStatus(g, p.id).state !== 'ready') continue;
    const crop = p.cropId;
    if (harvest(g, p.id)) continue;
    if (g.qty('compost') > 0) applyCompost(g, p.id);
    plant(g, p.id, crop);
  }
}

let lastCheck = 0;
const notified = new Set<string>();
export function tickFarming(g: Game) {
  if (g.state.clock - lastCheck < 1000) return;
  lastCheck = g.state.clock;
  if (g.simulating) return;
  for (const p of g.state.farming.plots) {
    if (!p.cropId) { notified.delete(p.id); continue; }
    const key = `${p.id}:${p.plantedAt}`;
    if (!notified.has(key) && plotStatus(g, p.id).state === 'ready') {
      notified.add(key);
      g.notify(`${C.items[C.crops[p.cropId].produce].name}已成熟，可以收获`, 'info', '🌾');
    }
  }
}
