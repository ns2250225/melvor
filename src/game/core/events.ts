// 统一事件系统：任务、成就、统计与 UI 通知都通过事件更新
import type { ItemQty, SkillId } from './types';

export interface GameEvents {
  actionStart: { skill: SkillId; actionId: string };
  actionComplete: { skill: SkillId; actionId: string; count: number };
  xpGained: { skill: SkillId; amount: number; abyssal: boolean };
  levelUp: { skill: SkillId; level: number; abyssal: boolean };
  masteryLevelUp: { skill: SkillId; actionId: string; level: number };
  itemGained: { id: string; qty: number; source: string };
  itemConsumed: { id: string; qty: number; source: string };
  itemCrafted: { id: string; qty: number; skill: SkillId };
  gpChanged: { amount: number; source: string };
  combatStart: { areaId: string };
  combatEnd: { reason: string };
  playerHit: { damage: number };
  enemyHit: { damage: number };
  playerDeath: { monsterId: string | null };
  monsterKilled: { monsterId: string; areaId: string | null; realm: string };
  dropGenerated: { items: ItemQty[] };
  dungeonCompleted: { dungeonId: string; count: number };
  questProgress: { questId: string };
  questCompleted: { questId: string };
  achievementCompleted: { achievementId: string };
  petUnlocked: { petId: string };
  poiDiscovered: { poiId: string };
  offlineSettled: { ms: number };
  notify: { text: string; kind: 'info' | 'success' | 'warning' | 'error' | 'item' | 'level'; icon?: string };
  stateChanged: { reason: string };
  activityStopped: { reason: string };
}

type Handler<T> = (payload: T) => void;

export class EventBus {
  private handlers: { [K in keyof GameEvents]?: Handler<GameEvents[K]>[] } = {};
  muted = false;
  on<K extends keyof GameEvents>(type: K, handler: Handler<GameEvents[K]>): () => void {
    const list = (this.handlers[type] ||= []) as Handler<GameEvents[K]>[];
    list.push(handler);
    return () => { const i = list.indexOf(handler); if (i >= 0) list.splice(i, 1); };
  }
  emit<K extends keyof GameEvents>(type: K, payload: GameEvents[K]): void {
    const list = this.handlers[type] as Handler<GameEvents[K]>[] | undefined;
    if (!list) return;
    for (const h of list) h(payload);
  }
  clear() { this.handlers = {}; }
}
