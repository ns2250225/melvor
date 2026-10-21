// UI 辅助：战斗 / 装备 / 商店页面共用的显示文本与派生数据（只读，不修改状态）
import { C } from '@/content';
import type { AttackType, EquipSlot, ModifierMap, SpecialAttackDef } from '@/game/core/types';

export const SLOT_NAMES: Record<EquipSlot, string> = {
  helmet: '头盔', body: '身体', legs: '腿部', boots: '靴子', gloves: '手套', cape: '披风', amulet: '项链', ring: '戒指',
  weapon: '武器', shield: '副手', quiver: '箭袋', passive: '被动', summon1: '召唤 1', summon2: '召唤 2', consumable: '消耗品', gem: '宝石',
};
export const SLOT_ICONS: Record<EquipSlot, string> = {
  helmet: '⛑️', body: '🥋', legs: '👖', boots: '🥾', gloves: '🧤', cape: '🧣', amulet: '📿', ring: '💍',
  weapon: '⚔️', shield: '🛡️', quiver: '🏹', passive: '✨', summon1: '🐾', summon2: '🐾', consumable: '🧪', gem: '💎',
};

export const ATTACK_TYPE_NAMES: Record<AttackType, string> = { melee: '近战', ranged: '远程', magic: '魔法' };
export const ATTACK_TYPE_ICONS: Record<AttackType, string> = { melee: '⚔️', ranged: '🏹', magic: '🪄' };

export const MOD_NAMES: Record<string, string> = {
  gpGlobal: '全局金币', maxHit: '最大伤害', accuracy: '命中', summonChargePreservation: '召唤充能节省', slayerCoins: '猎杀币',
  rareDropChance: '稀有掉落几率', potionCharges: '药水充能', cookingXP: '烹饪经验', cookingSuccess: '烹饪成功率', abyssalPieces: '深渊碎片',
  stunImmunity: '击晕免疫', poisonImmunity: '中毒免疫', burnImmunity: '燃烧免疫', townshipProduction: '城镇产出', thievingStealth: '偷窃隐匿',
  slayerTaskDamage: '猎杀目标伤害', slayerTaskAccuracy: '猎杀目标命中', skillXP: '技能经验', skillIntervalFlat: '技能耗时(固定ms)',
  skillInterval: '技能耗时', sellPrice: '出售价格', runePreservation: '符文节省', reflectDamage: '反伤', redemption: '救赎',
  rangedMaxHit: '远程最大伤害', rangedEvasion: '远程闪避', rangedAccuracy: '远程命中', protectItem: '死亡保护装备', protectFrom: '守护',
  preservation: '材料节省', prayerPreservation: '祈祷点节省', prayerPointsGain: '祈祷点获取', petChance: '宠物几率', miningGemChance: '采矿宝石几率',
  meleeMaxHit: '近战最大伤害', meleeEvasion: '近战闪避', meleeAccuracy: '近战命中', maxHP: '最大生命', masteryXP: '掌握度经验',
  magicMaxHit: '魔法最大伤害', magicEvasion: '魔法闪避', magicAccuracy: '魔法命中', lifesteal: '生命偷取', levelCap: '等级上限',
  hpRegen: '生命回复', harvestIntensity: '收获强度', foodHealing: '食物治疗量', flatMaxHP: '最大生命(固定)', fishingSpecialChance: '钓鱼特殊物品几率',
  farmingYield: '农业产量', farmingGrowth: '农业生长速度', evasion: '闪避', doubleItems: '双倍产出', damageReductionFlat: '伤害减免',
  combatGP: '战斗金币', autoEatThreshold: '自动进食阈值', autoEatLimit: '自动进食上限', autoEatEfficiency: '自动进食效率',
  attackInterval: '攻击间隔', artifactChance: '文物几率', ammoPreservation: '弹药节省', agilityObstacleCost: '障碍建造费用',
  additionalItem: '额外产出', abyssalXP: '深渊经验', abyssalResistanceFlat: '深渊抗性', abyssalLevelCap: '深渊等级上限',
  barrier: '屏障', maxHPEnemy: '敌人生命',
};

const FLAT_KEYS = new Set(['flatMaxHP', 'damageReductionFlat', 'abyssalResistanceFlat', 'levelCap', 'abyssalLevelCap', 'potionCharges', 'skillIntervalFlat', 'protectFrom', 'protectItem', 'redemption', 'stunImmunity', 'poisonImmunity', 'burnImmunity', 'additionalItem']);

/** 将修饰符 key（可带 :scope）与数值格式化为中文描述 */
export function formatModifier(key: string, value: number): string {
  const [base, scope] = key.split(':');
  let scopeName = '';
  if (scope) scopeName = (C.skills as Record<string, { name: string }>)[scope]?.name ?? C.items[scope]?.name ?? scope;
  const name = MOD_NAMES[base] ?? base;
  const label = scopeName ? `${scopeName}${name}` : name;
  if (['stunImmunity', 'poisonImmunity', 'burnImmunity', 'protectItem'].includes(base)) return label;
  const sign = value > 0 ? '+' : '';
  const unit = FLAT_KEYS.has(base) ? '' : '%';
  return `${label} ${sign}${Number.isInteger(value) ? value : value.toFixed(2)}${unit}`;
}

export function formatModifiers(m: ModifierMap | undefined): string[] {
  if (!m) return [];
  return Object.entries(m).filter(([, v]) => v !== 0).map(([k, v]) => formatModifier(k, v));
}

export interface DropRow { id: string; min: number; max: number; chance: number; rolls: number }

/** 掉落表条目及每次掷骰的概率（权重 / 总权重 × 表触发概率） */
export function dropTableRows(tableId: string | null | undefined): DropRow[] {
  if (!tableId) return [];
  const t = C.dropTables[tableId];
  if (!t || !t.entries.length) return [];
  const total = t.entries.reduce((a, e) => a + e.weight, 0) || 1;
  const tc = t.chance ?? 1;
  return t.entries
    .map((e) => ({ id: e.id, min: e.min, max: e.max, chance: (e.weight / total) * tc, rolls: t.rolls ?? 1 }))
    .sort((a, b) => b.chance - a.chance);
}

export function fmtChance(p: number): string {
  if (p >= 0.1) return `${(p * 100).toFixed(1).replace(/\.0$/, '')}%`;
  if (p >= 0.001) return `${(p * 100).toFixed(2)}%`;
  if (p <= 0) return '0%';
  return `1/${Math.round(1 / p).toLocaleString('zh-CN')}`;
}

export function specialAttacksOf(ids: string[] | undefined): SpecialAttackDef[] {
  return (ids ?? []).map((id) => C.specialAttacks[id]).filter((x): x is SpecialAttackDef => !!x);
}

export const CURRENCY_LABELS: Record<string, string> = {
  gp: '🪙 金币', slayerCoins: '💀 猎杀币', abyssalPieces: '🟣 深渊碎片', abyssalSlayerCoins: '🟪 深渊猎杀币',
  prayerPoints: '🙏 祈祷点', soulPoints: '⚱️ 灵魂点',
};

export const EXPANSION_SHORT: Record<string, string> = { base: '', toth: 'TotH', aod: 'AoD', ita: 'ItA' };
