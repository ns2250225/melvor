import { C } from '../registry';
import type { SkillDefinition, SkillId, GameModeDef } from '@/game/core/types';

const defs: Omit<SkillDefinition, 'actions' | 'xpCurveId'>[] = [
  { id: 'attack', name: '攻击', icon: 'dagger', color: '#d9534f', category: 'combat', maxLevel: 99, masteryEnabled: false, abyssalEnabled: true, offlinePolicy: 'simulate', description: '提高近战命中率，解锁更高阶近战武器。' },
  { id: 'strength', name: '力量', icon: 'strength', color: '#5cb85c', category: 'combat', maxLevel: 99, masteryEnabled: false, abyssalEnabled: true, offlinePolicy: 'simulate', description: '提高近战最大伤害。' },
  { id: 'defence', name: '防御', icon: 'shield', color: '#5bc0de', category: 'combat', maxLevel: 99, masteryEnabled: false, abyssalEnabled: true, offlinePolicy: 'simulate', description: '提高闪避，解锁更高阶护甲。' },
  { id: 'hitpoints', name: '生命', icon: 'heart', color: '#e74c3c', category: 'combat', maxLevel: 99, masteryEnabled: false, abyssalEnabled: true, offlinePolicy: 'simulate', description: '每级提供 10 点最大生命值。' },
  { id: 'ranged', name: '远程', icon: 'bow', color: '#27ae60', category: 'combat', maxLevel: 99, masteryEnabled: false, abyssalEnabled: true, offlinePolicy: 'simulate', description: '远程命中与伤害。' },
  { id: 'magic', name: '魔法', icon: 'crystal_ball', color: '#8e44ad', category: 'combat', maxLevel: 99, masteryEnabled: false, abyssalEnabled: true, offlinePolicy: 'simulate', description: '战斗法术、诅咒、光环与替代魔法。' },
  { id: 'prayer', name: '祈祷', icon: 'pray', color: '#f1c40f', category: 'combat', maxLevel: 99, masteryEnabled: false, abyssalEnabled: true, offlinePolicy: 'simulate', description: '埋葬骨头获得祈祷点，激活祈祷获得战斗增益。' },
  { id: 'slayer', name: '猎杀', icon: 'skull', color: '#7f8c8d', category: 'combat', maxLevel: 99, masteryEnabled: false, abyssalEnabled: true, offlinePolicy: 'simulate', description: '完成猎杀任务获得猎杀币，解锁猎杀区域。' },
  { id: 'woodcutting', name: '伐木', icon: 'axe', color: '#7c5a2e', category: 'gathering', maxLevel: 99, masteryEnabled: true, abyssalEnabled: true, offlinePolicy: 'simulate', description: '砍伐树木获得木材。' },
  { id: 'fishing', name: '钓鱼', icon: 'fishing_rod', color: '#3498db', category: 'gathering', maxLevel: 99, masteryEnabled: true, abyssalEnabled: true, offlinePolicy: 'simulate', description: '在各钓区捕获鱼类与特殊物品。' },
  { id: 'firemaking', name: '生火', icon: 'fire', color: '#e67e22', category: 'artisan', maxLevel: 99, masteryEnabled: true, abyssalEnabled: true, offlinePolicy: 'simulate', description: '燃烧木材，点燃篝火获得经验加成。' },
  { id: 'cooking', name: '烹饪', icon: 'frying_pan', color: '#c0392b', category: 'artisan', maxLevel: 99, masteryEnabled: true, abyssalEnabled: true, offlinePolicy: 'simulate', description: '使用篝火、熔炉与锅制作食物。' },
  { id: 'mining', name: '采矿', icon: 'pickaxe', color: '#95a5a6', category: 'gathering', maxLevel: 99, masteryEnabled: true, abyssalEnabled: true, offlinePolicy: 'simulate', description: '开采矿石与宝石。矿脉会枯竭并恢复。' },
  { id: 'smithing', name: '锻造', icon: 'hammer_pick', color: '#34495e', category: 'artisan', maxLevel: 99, masteryEnabled: true, abyssalEnabled: true, offlinePolicy: 'simulate', description: '冶炼金属锭并锻造装备。' },
  { id: 'thieving', name: '偷窃', icon: 'ninja', color: '#6c3483', category: 'gathering', maxLevel: 99, masteryEnabled: true, abyssalEnabled: true, offlinePolicy: 'simulate', description: '扒窃 NPC 获得金币与稀有物品，失败会被击晕。' },
  { id: 'farming', name: '农业', icon: 'sprout', color: '#2ecc71', category: 'gathering', maxLevel: 99, masteryEnabled: true, abyssalEnabled: true, offlinePolicy: 'passive', description: '在地块种植作物、草药与树木，随真实时间成长。' },
  { id: 'fletching', name: '制箭', icon: 'feather', color: '#16a085', category: 'artisan', maxLevel: 99, masteryEnabled: true, abyssalEnabled: true, offlinePolicy: 'simulate', description: '制作箭矢、弓、弩与标枪。' },
  { id: 'crafting', name: '制作', icon: 'thread', color: '#d35400', category: 'artisan', maxLevel: 99, masteryEnabled: true, abyssalEnabled: true, offlinePolicy: 'simulate', description: '制作皮甲、龙皮甲与珠宝。' },
  { id: 'runecrafting', name: '符文', icon: 'vortex', color: '#2980b9', category: 'artisan', maxLevel: 99, masteryEnabled: true, abyssalEnabled: true, offlinePolicy: 'simulate', description: '用符文精华制作符文、法杖与法师长袍。' },
  { id: 'herblore', name: '药剂', icon: 'alembic', color: '#1abc9c', category: 'artisan', maxLevel: 99, masteryEnabled: true, abyssalEnabled: true, offlinePolicy: 'simulate', description: '调配四个品阶的药水。' },
  { id: 'agility', name: '敏捷', icon: 'runner', color: '#8d6e63', category: 'support', maxLevel: 99, masteryEnabled: true, abyssalEnabled: true, offlinePolicy: 'simulate', description: '建造障碍路线，完成障碍获得金币与全局加成。' },
  { id: 'summoning', name: '召唤', icon: 'paw', color: '#9b59b6', category: 'artisan', maxLevel: 99, masteryEnabled: true, abyssalEnabled: true, offlinePolicy: 'simulate', description: '发现印记、制作召唤石板，召唤兽协同作战与生产。' },
  { id: 'astrology', name: '占星', icon: 'sparkles', color: '#5d6d7e', category: 'support', maxLevel: 99, masteryEnabled: true, abyssalEnabled: true, offlinePolicy: 'simulate', description: '研究星座获得星尘，购买技能修饰。' },
  { id: 'township', name: '城镇', icon: 'village', color: '#a04000', category: 'passive', maxLevel: 99, masteryEnabled: false, abyssalEnabled: false, offlinePolicy: 'passive', description: '建设城镇、管理人口与资源，按时间结算产出。' },
  { id: 'cartography', name: '制图', icon: 'map', color: '#b7950b', category: 'support', maxLevel: 99, masteryEnabled: false, abyssalEnabled: true, offlinePolicy: 'simulate', description: '勘测地图六角格、发现兴趣点、制作发掘地图。', expansionId: 'aod' },
  { id: 'archaeology', name: '考古', icon: 'amphora', color: '#a1887f', category: 'gathering', maxLevel: 99, masteryEnabled: true, abyssalEnabled: true, offlinePolicy: 'simulate', description: '在发掘点挖掘文物并向博物馆捐赠。', expansionId: 'aod' },
  { id: 'corruption', name: '腐化', icon: 'blood', color: '#922b21', category: 'combat', maxLevel: 99, masteryEnabled: false, abyssalEnabled: true, offlinePolicy: 'simulate', description: '在深渊战斗中解锁腐化效果，削弱深渊敌人。', expansionId: 'ita' },
  { id: 'harvesting', name: '收割', icon: 'wheat', color: '#6e2c00', category: 'gathering', maxLevel: 99, masteryEnabled: true, abyssalEnabled: true, offlinePolicy: 'simulate', description: '收割深渊矿脉，强度越高稀有产出越多。', expansionId: 'ita' },
];

for (const d of defs) {
  C.skills[d.id] = { ...d, actions: [], xpCurveId: 'standard' };
  C.skillOrder.push(d.id);
}

export const COMBAT_SKILLS: SkillId[] = ['attack', 'strength', 'defence', 'hitpoints', 'ranged', 'magic', 'prayer', 'slayer', 'corruption'];

const modes: GameModeDef[] = [
  { id: 'standard', name: '标准模式', description: '标准规则。死亡时随机失去一件装备（护佑祈祷可防止）。', permadeath: false, skillUnlockCost: false, startingGp: 0, combatTriangle: 'standard', levelCapBase: 99 },
  { id: 'hardcore', name: '硬核模式', description: '永久死亡：角色死亡后存档将被删除。战斗三角惩罚更重，无法在战斗中自动进食超过阈值。', permadeath: true, skillUnlockCost: false, startingGp: 0, combatTriangle: 'hardcore', levelCapBase: 99 },
  { id: 'adventure', name: '冒险模式', description: '初始只解锁部分技能，其余技能需要用金币逐个解锁。死亡规则同标准模式。', permadeath: false, skillUnlockCost: true, startingGp: 0, combatTriangle: 'standard', levelCapBase: 99 },
];
for (const m of modes) C.gameModes[m.id] = m;

/** 冒险模式初始解锁技能 */
export const ADVENTURE_START_SKILLS: SkillId[] = ['attack', 'strength', 'defence', 'hitpoints', 'woodcutting'];
/** 冒险模式技能解锁价格（按已解锁数量递增） */
export function adventureUnlockCost(unlockedCount: number): number {
  return Math.round(10000 * Math.pow(1.85, Math.max(0, unlockedCount - ADVENTURE_START_SKILLS.length)));
}
