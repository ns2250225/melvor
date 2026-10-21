// 综合技能命令：敏捷建造、占星修饰、考古工具与博物馆、深渊技能树、篝火、被动烹饪
import type { Game } from '../core/game';
import type { ArtifactSize, SkillId } from '../core/types';
import { C } from '@/content';
import { ARCH_TOOLS, AGILITY_SLOTS, ABYSSAL_AGILITY_SLOTS } from '@/content/recipes/support';
import { astroMaxLevel, astroCost } from './actions';
import { stopSkillAction } from './actions';

// --------------------------------------------------------------------------- 敏捷
export function obstacleCost(g: Game, obsId: string) {
  const o = C.obstacles[obsId];
  const built = g.state.agility.buildCounts[obsId] || 0;
  const reduction = Math.min(75, built * 4) - g.mods.get('agilityObstacleCost');
  const mult = Math.max(0.1, 1 - reduction / 100);
  return { gp: Math.round(o.cost.gp * mult), items: o.cost.items.map((i) => ({ id: i.id, qty: Math.max(1, Math.round(i.qty * mult)) })) };
}

export function slotUnlocked(g: Game, slot: number): boolean {
  if (slot === 10) return g.level('agility') >= 99;
  if (ABYSSAL_AGILITY_SLOTS.includes(slot)) return g.inAbyss() && g.abyssalLevel('agility') >= (slot - 11) * 15 + 1;
  return g.level('agility') >= AGILITY_SLOTS[slot];
}

export function buildObstacle(g: Game, obsId: string): string | null {
  const o = C.obstacles[obsId];
  if (!o) return '无效障碍';
  if (!g.state.skills.agility.unlocked) return '敏捷尚未解锁';
  if (!slotUnlocked(g, o.slot)) return '该障碍位未解锁';
  if (g.level('agility') < o.level) return `需要敏捷 ${o.level} 级`;
  if (o.abyssalLevel && g.abyssalLevel('agility') < o.abyssalLevel) return `需要敏捷深渊 ${o.abyssalLevel} 级`;
  if (g.state.agility.built[o.slot] === obsId) return '已建造';
  const cost = obstacleCost(g, obsId);
  if (g.state.currencies.gp < cost.gp) return '金币不足';
  if (!g.hasItems(cost.items)) return '材料不足';
  const wasRunning = g.state.activeAction?.skill === 'agility';
  if (wasRunning) stopSkillAction(g, '切换活动');
  g.spendCurrency({ gp: cost.gp });
  g.removeItems(cost.items, 'agility');
  g.state.agility.built[o.slot] = obsId;
  g.state.agility.buildCounts[obsId] = (g.state.agility.buildCounts[obsId] || 0) + 1;
  g.state.agility.currentSlot = 0;
  g.invalidate();
  g.skillStat('agility', 'obstaclesBuilt');
  return null;
}

export function destroyObstacle(g: Game, slot: number): string | null {
  if (!g.state.agility.built[slot]) return '该位置没有障碍';
  if (g.state.activeAction?.skill === 'agility') stopSkillAction(g, '切换活动');
  g.state.agility.built[slot] = null;
  g.state.agility.currentSlot = 0;
  g.invalidate();
  return null;
}

// --------------------------------------------------------------------------- 占星
export function buyAstroModifier(g: Game, consId: string, unique: boolean, idx: number): string | null {
  const c = C.constellations[consId];
  const lv = g.state.astrology[consId];
  if (!c || !lv) return '无效星座';
  const list = unique ? c.unique : c.standard;
  const levels = unique ? lv.uniq : lv.std;
  if (!list[idx]) return '无效修饰';
  const cur = levels[idx] || 0;
  if (cur >= list[idx].maxLevel) return '已达最高等级';
  if (cur >= astroMaxLevel(g, consId, unique)) return '需要更高的星座掌握度';
  const currency = c.realm === 'abyssal' ? 'abyssal_stardust' : unique ? 'golden_stardust' : 'stardust';
  const cost = c.realm === 'abyssal' ? Math.ceil(astroCost(cur, unique) / 10) : astroCost(cur, unique);
  if (!g.removeItem(currency, cost, 'astrology')) return `${C.items[currency].name}不足`;
  levels[idx] = cur + 1;
  g.invalidate();
  return null;
}

// --------------------------------------------------------------------------- 考古
export function toolUpgradeCost(g: Game, size: ArtifactSize) {
  const t = ARCH_TOOLS.find((x) => x.id === size)!;
  return t.costs[g.state.archaeology.tools[size]] ?? null;
}
export function upgradeTool(g: Game, size: ArtifactSize): string | null {
  const cost = toolUpgradeCost(g, size);
  if (!cost) return '工具已满级';
  const lvlReq = (g.state.archaeology.tools[size] + 1) * 15;
  if (g.level('archaeology') < lvlReq) return `需要考古 ${lvlReq} 级`;
  if (g.state.currencies.gp < cost.gp || !g.hasItems(cost.items)) return '材料或金币不足';
  g.spendCurrency({ gp: cost.gp });
  g.removeItems(cost.items, 'archaeology');
  g.state.archaeology.tools[size]++;
  return null;
}

const TOKEN_VALUE: Record<ArtifactSize, number> = { tiny: 1, small: 2, medium: 4, large: 8 };
export const MUSEUM_MILESTONES = [
  { count: 10, reward: { gp: 100000, items: [{ id: 'golden_stardust', qty: 10 }] } },
  { count: 20, reward: { gp: 500000, items: [{ id: 'weird_gloop', qty: 5 }] } },
  { count: 30, reward: { gp: 2000000 }, pet: 'pet_museum' },
  { count: 45, reward: { gp: 10000000, items: [{ id: 'abyssal_stardust', qty: 10 }] } },
];
export function donateArtifact(g: Game, itemId: string): string | null {
  const it = C.items[itemId];
  if (!it?.artifact) return '该物品不是文物';
  if (g.state.archaeology.museum[itemId]) return '博物馆已收藏该文物';
  if (!g.removeItem(itemId, 1, 'museum')) return '数量不足';
  g.state.archaeology.museum[itemId] = true;
  g.addItem('museum_token', TOKEN_VALUE[it.artifact.size], 'museum');
  g.stat('museumDonations');
  g.addXp('archaeology', 50 * TOKEN_VALUE[it.artifact.size]);
  const n = Object.keys(g.state.archaeology.museum).length;
  for (const [i, m] of MUSEUM_MILESTONES.entries()) {
    if (n >= m.count && g.state.archaeology.museumRewards <= i) {
      g.state.archaeology.museumRewards = i + 1;
      if (m.reward.gp) g.addGp(m.reward.gp, 'museum');
      for (const r of m.reward.items ?? []) g.addItem(r.id, r.qty, 'museum');
      if (m.pet) g.unlockPet(m.pet);
      g.notify(`博物馆里程碑：${m.count} 件藏品`, 'success', '🏛️');
    }
  }
  return null;
}
/** 博物馆代币兑换 */
export const MUSEUM_SHOP = [
  { id: 'ms_gloop', name: '奇异粘液', cost: 5, grants: { id: 'weird_gloop', qty: 1 } },
  { id: 'ms_map', name: '地图碎片 ×10', cost: 3, grants: { id: 'map_fragment', qty: 10 } },
  { id: 'ms_stardust', name: '金星尘 ×5', cost: 6, grants: { id: 'golden_stardust', qty: 5 } },
  { id: 'ms_gems', name: '宝石袋 ×5', cost: 4, grants: { id: 'gem_pouch', qty: 5 } },
];
export function museumBuy(g: Game, id: string): string | null {
  const it = MUSEUM_SHOP.find((x) => x.id === id);
  if (!it) return '无效商品';
  if (!g.canAddItem(it.grants.id)) return '银行已满';
  if (!g.removeItem('museum_token', it.cost, 'museum')) return '博物馆代币不足';
  g.addItem(it.grants.id, it.grants.qty, 'museum');
  return null;
}

// --------------------------------------------------------------------------- 深渊技能树
export function treeNodeAvailable(g: Game, nodeId: string): string | null {
  const n = C.skillTree[nodeId];
  if (!n) return '无效节点';
  const s = g.state.skills[n.skill];
  if (s.treeNodes.includes(nodeId)) return '已解锁';
  if (!n.parents.every((p) => s.treeNodes.includes(p))) return '需要先解锁前置节点';
  if (s.treePoints < n.cost) return '技能点不足';
  return null;
}
export function unlockTreeNode(g: Game, nodeId: string): string | null {
  const err = treeNodeAvailable(g, nodeId);
  if (err) return err;
  const n = C.skillTree[nodeId];
  const s = g.state.skills[n.skill];
  s.treePoints -= n.cost;
  s.treeNodes.push(nodeId);
  g.invalidate();
  return null;
}
export function resetTree(g: Game, skill: SkillId): string | null {
  const s = g.state.skills[skill];
  if (!s.treeNodes.length) return '没有已解锁节点';
  const cost = 1000000;
  if (!g.spendCurrency({ gp: cost })) return '重置需要 1,000,000 金币';
  for (const id of s.treeNodes) s.treePoints += C.skillTree[id].cost;
  s.treeNodes = [];
  g.invalidate();
  return null;
}

// --------------------------------------------------------------------------- 生火：篝火
export function lightBonfire(g: Game, actionId: string): string | null {
  const a = C.actions[actionId];
  if (!a || a.skill !== 'firemaking') return '无效木材';
  const err = g.actionUnlocked(actionId);
  if (err) return err;
  if (g.state.bonfire.endsAt > g.state.clock) return '篝火仍在燃烧';
  const logs = a.inputs[0].id;
  const n = a.data?.bonfireLogs ?? 10;
  if (!g.removeItem(logs, n, 'bonfire')) return `需要 ${n} 个${C.items[logs].name}`;
  g.state.bonfire = { endsAt: g.state.clock + (a.data?.bonfireDuration ?? 600000), bonus: a.data?.bonfireBonus ?? 5, logsBurnt: 0 };
  g.addXp('firemaking', a.xp * 2);
  g.notify(`篝火点燃：生火经验 +${g.state.bonfire.bonus}%`, 'success', '🔥');
  return null;
}

// --------------------------------------------------------------------------- 被动烹饪
export function setPassiveCooking(g: Game, category: string, actionId: string | null): string | null {
  if (actionId) {
    const a = C.actions[actionId];
    if (!a || a.skill !== 'cooking' || a.category !== category) return '无效配方';
    const err = g.actionUnlocked(actionId);
    if (err) return err;
  }
  g.state.cooking.passive[category] = actionId;
  g.state.cooking.timers[category] = 0;
  return null;
}
