// 元信息页面（总览 / 任务 / 成就 / 图鉴等）共用的纯展示辅助函数
import { C } from '@/content';
import type { ObjectiveDef, QuestReward, SkillId, Realm } from '@/game/core/types';
import type { PageId } from '@/stores/game';
import { fmt } from '@/app/format';

/** 技能对应的页面：战斗类技能跳转至专属页面 */
export function skillPage(id: SkillId): { page: PageId; skill?: SkillId } {
  switch (id) {
    case 'attack': case 'strength': case 'defence': case 'hitpoints': case 'ranged': return { page: 'combat' };
    case 'magic': return { page: 'magic' };
    case 'prayer': return { page: 'prayer' };
    case 'slayer': return { page: 'slayer' };
    case 'summoning': return { page: 'summoning', skill: 'summoning' };
    default: return { page: 'skill', skill: id };
  }
}

const realmName = (r?: Realm) => (r === 'abyssal' ? '深渊' : r === 'melvor' ? '梅尔沃' : '');

/** 任务 / 成就目标的中文描述 */
export function describeObjective(o: ObjectiveDef | { type: string; [k: string]: any }): string {
  const x = o as any;
  const sk = (id: SkillId) => C.skills[id]?.name ?? id;
  switch (o.type) {
    case 'skillLevel': return `${sk(x.skill)}达到 ${x.level} 级`;
    case 'abyssalLevel': return `${sk(x.skill)}深渊等级达到 ${x.level} 级`;
    case 'kill': return x.monster ? `击败 ${C.monsters[x.monster]?.name ?? x.monster} ×${fmt(x.count)}` : `击败${realmName(x.realm)}任意怪物 ×${fmt(x.count)}`;
    case 'craft': return `制作 ${C.items[x.item]?.name ?? x.item} ×${fmt(x.count)}`;
    case 'collect': return `${x.consume ? '上交' : '持有'} ${C.items[x.item]?.name ?? x.item} ×${fmt(x.count)}`;
    case 'dungeon': return `通关「${C.dungeons[x.id]?.name ?? x.id}」×${fmt(x.count)}`;
    case 'actions': return `完成 ${sk(x.skill)} 动作 ×${fmt(x.count)}`;
    case 'gp': return `持有 ${fmt(x.amount)} 金币`;
    case 'totalLevel': return `总等级达到 ${x.level}`;
    case 'pet': return `收集 ${x.count} 只宠物`;
    case 'poi': return `发现 ${x.count} 个兴趣点`;
    case 'township': return `城镇达到 ${x.level} 级`;
    case 'stat': return `统计「${STAT_LABELS[x.stat] ?? x.stat}」达到 ${fmt(x.value)}`;
    case 'completion': return `总完成度达到 ${x.percent}%`;
    case 'mastery99': return `${x.skill ? sk(x.skill) : '任意技能'} ${x.count} 个动作掌握度达到 99`;
    default: return o.type;
  }
}

/** 奖励的文字部分（物品另由 ItemList 显示） */
export function rewardParts(r: QuestReward | undefined): string[] {
  if (!r) return [];
  const out: string[] = [];
  if (r.gp) out.push(`🪙 ${fmt(r.gp)} 金币`);
  if (r.slayerCoins) out.push(`💀 ${fmt(r.slayerCoins)} 猎杀币`);
  if (r.abyssalPieces) out.push(`🟣 ${fmt(r.abyssalPieces)} 深渊碎片`);
  for (const x of r.xp ?? []) out.push(`${C.skills[x.skill]?.icon ?? ''} ${C.skills[x.skill]?.name ?? x.skill} ${fmt(x.amount)} 经验`);
  if (r.unlockFlag) out.push('🔓 解锁新内容');
  return out;
}

export const STAT_LABELS: Record<string, string> = {
  monstersKilled: '击败怪物', damageDealt: '造成伤害', damageTaken: '受到伤害', deaths: '死亡次数', foodEaten: '进食次数',
  gpEarned: '获得金币', gpSpent: '花费金币', gpFromSales: '出售所得金币', itemsSold: '出售物品数', skillActions: '技能动作次数',
  dungeonsCompleted: '副本通关', slayerTasks: '完成猎杀任务', questsCompleted: '完成任务', chestsOpened: '开启宝箱',
  bonesBuried: '埋葬骨头', potionsUsed: '使用药水', foodBurnt: '烧焦食物', thievingFails: '偷窃失败', museumDonations: '博物馆捐赠',
  shopPurchases: '商店购买', itemsLostOnDeath: '死亡丢失物品',
};

export const SKILL_STAT_LABELS: Record<string, string> = {
  actions: '完成动作', timeSpent: '累计耗时', itemsProduced: '产出物品', itemsPreserved: '材料节省', successes: '成功', fails: '失败',
  specials: '特殊物品', junk: '杂物', rocksDepleted: '矿脉耗尽', harvested: '收获', planted: '种植', cropsDied: '作物枯萎',
  coursesCompleted: '完成路线', obstaclesBuilt: '建造障碍', artifacts: '发现文物', mapsCreated: '制作地图', altCasts: '替代魔法施放',
  buildingsBuilt: '建造建筑', ticks: '城镇结算', taxCollected: '税收',
};

export const CURRENCY_LABELS: Record<string, string> = {
  gp: '🪙 金币', slayerCoins: '💀 猎杀币', abyssalPieces: '🟣 深渊碎片', abyssalSlayerCoins: '🟪 深渊猎杀币', prayerPoints: '🙏 祈祷点', soulPoints: '⚱️ 灵魂点',
};

export const QUEST_STATUS_LABELS = { locked: '未解锁', available: '可接受', active: '进行中', completed: '已完成' } as const;
