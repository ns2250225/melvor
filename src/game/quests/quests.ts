// 任务系统：前置依赖、事件驱动的进度、原子化领奖（不可重复）
import type { Game } from '../core/game';
import type { ObjectiveDef, QuestReward } from '../core/types';
import { C } from '@/content';

export type QuestStatus = 'locked' | 'available' | 'active' | 'completed';

export function questStatus(g: Game, id: string): QuestStatus {
  const q = C.quests[id];
  const st = g.state.quests[id];
  if (st?.status === 'completed') return 'completed';
  if (st?.status === 'active') return 'active';
  if (!q.prerequisites.every((p) => g.state.quests[p]?.status === 'completed')) return 'locked';
  if (!g.meetsAll(q.requirements)) return 'locked';
  return 'available';
}

export function startQuest(g: Game, id: string): string | null {
  if (questStatus(g, id) !== 'available') return '任务不可接取';
  g.state.quests[id] = { status: 'active', progress: C.quests[id].objectives.map(() => 0), startedAt: g.state.clock };
  g.notify(`接受任务：${C.quests[id].name}`, 'info', '📜');
  return null;
}

/** 目标进度（计数类来自事件累计，状态类实时计算） */
export function objectiveProgress(g: Game, o: ObjectiveDef, counter = 0): { cur: number; target: number } {
  const s = g.state;
  switch (o.type) {
    case 'skillLevel': return { cur: s.skills[o.skill].level, target: o.level };
    case 'abyssalLevel': return { cur: g.inAbyss() ? s.skills[o.skill].abyssalLevel : 0, target: o.level };
    case 'kill': case 'craft': case 'actions': return { cur: counter, target: o.count };
    case 'collect': return { cur: g.qty(o.item), target: o.count };
    case 'dungeon': return { cur: s.dungeonCompletions[o.id] || 0, target: o.count };
    case 'gp': return { cur: s.currencies.gp, target: o.amount };
    case 'totalLevel': return { cur: g.totalLevel(), target: o.level };
    case 'pet': return { cur: Object.keys(s.pets).length, target: o.count };
    case 'poi': return { cur: s.cartography.discovered.length, target: o.count };
    case 'township': return { cur: g.level('township'), target: o.level };
  }
}

export function questProgress(g: Game, id: string) {
  const q = C.quests[id];
  const st = g.state.quests[id];
  return q.objectives.map((o, i) => objectiveProgress(g, o, st?.progress[i] ?? 0));
}

export function canCompleteQuest(g: Game, id: string): boolean {
  if (questStatus(g, id) !== 'active') return false;
  return questProgress(g, id).every((p) => p.cur >= p.target);
}

export function grantReward(g: Game, r: QuestReward | undefined, source: string) {
  if (!r) return;
  if (r.gp) g.addGp(r.gp, source);
  if (r.slayerCoins) g.state.currencies.slayerCoins += r.slayerCoins;
  if (r.abyssalPieces) g.state.currencies.abyssalPieces += r.abyssalPieces;
  for (const i of r.items ?? []) {
    if (g.addItem(i.id, i.qty, source) === 0) {
      // 银行已满时放入战利品栏，避免奖励丢失
      g.state.combat.loot.push({ id: i.id, qty: i.qty });
    }
  }
  for (const x of r.xp ?? []) g.addXp(x.skill, x.amount, false);
  if (r.unlockFlag) g.state.flags[r.unlockFlag] = 1;
}

export function completeQuest(g: Game, id: string): string | null {
  if (!canCompleteQuest(g, id)) return '任务目标尚未完成';
  const q = C.quests[id];
  // 上交物品（原子）
  const turnIn = q.objectives.filter((o): o is Extract<ObjectiveDef, { type: 'collect' }> => o.type === 'collect' && !!o.consume).map((o) => ({ id: o.item, qty: o.count }));
  if (turnIn.length && !g.removeItems(turnIn, 'quest')) return '上交物品不足';
  g.state.quests[id].status = 'completed';
  grantReward(g, q.rewards, 'quest');
  g.stat('questsCompleted');
  g.notify(`任务完成：${q.name}`, 'success', '📜');
  g.events.emit('questCompleted', { questId: id });
  return null;
}

export function initQuestTracking(g: Game) {
  const bump = (match: (o: ObjectiveDef) => number) => {
    for (const [id, st] of Object.entries(g.state.quests)) {
      if (st.status !== 'active') continue;
      const q = C.quests[id];
      if (!q) continue;
      q.objectives.forEach((o, i) => {
        const add = match(o);
        if (add > 0) { st.progress[i] = Math.min((st.progress[i] || 0) + add, 1e12); g.events.emit('questProgress', { questId: id }); }
      });
    }
  };
  g.events.on('monsterKilled', (e) => bump((o) => (o.type === 'kill' && (!o.monster || o.monster === e.monsterId) && (!o.realm || o.realm === e.realm) ? 1 : 0)));
  g.events.on('itemCrafted', (e) => bump((o) => (o.type === 'craft' && o.item === e.id ? e.qty : 0)));
  g.events.on('actionComplete', (e) => bump((o) => (o.type === 'actions' && o.skill === e.skill ? e.count : 0)));
}
