// 技能页面 UI 辅助：修饰符中文描述、分类名称、只读派生计算（不修改状态）
import type { Game } from '../core/game';
import type { ModifierMap, SkillActionDef, SynergyDef } from '../core/types';
import { C } from '@/content';
import { METAL_TIERS } from '@/content/items/equipment';
import { FISHING_AREAS, THIEVING_AREAS } from '@/content/recipes/gathering';

/** 修饰符名称；pct 表示数值为百分比 */
const MOD_NAMES: Record<string, { name: string; pct: boolean }> = {
  skillInterval: { name: '耗时', pct: true },
  skillIntervalFlat: { name: '耗时（固定，毫秒）', pct: false },
  skillXP: { name: '经验', pct: true },
  abyssalXP: { name: '深渊经验', pct: true },
  masteryXP: { name: '掌握度经验', pct: true },
  doubleItems: { name: '双倍产出几率', pct: true },
  preservation: { name: '材料节省几率', pct: true },
  additionalItem: { name: '额外产出', pct: false },
  gpGlobal: { name: '金币获取', pct: true },
  thievingStealth: { name: '偷窃潜行', pct: false },
  meleeAccuracy: { name: '近战命中', pct: true },
  rangedAccuracy: { name: '远程命中', pct: true },
  magicAccuracy: { name: '魔法命中', pct: true },
  accuracy: { name: '命中', pct: true },
  meleeMaxHit: { name: '近战最大伤害', pct: true },
  rangedMaxHit: { name: '远程最大伤害', pct: true },
  magicMaxHit: { name: '魔法最大伤害', pct: true },
  maxHit: { name: '最大伤害', pct: true },
  evasion: { name: '闪避', pct: true },
  damageReductionFlat: { name: '伤害减免', pct: true },
  abyssalResistanceFlat: { name: '深渊抗性', pct: false },
  lifesteal: { name: '生命偷取', pct: true },
  hpRegen: { name: '生命回复', pct: true },
  farmingYield: { name: '农业收成', pct: true },
  farmingGrowth: { name: '作物生长时间', pct: true },
  miningGemChance: { name: '采矿宝石几率', pct: true },
  cookingSuccess: { name: '烹饪成功率', pct: true },
  cookingXP: { name: '烹饪经验', pct: true },
  ammoPreservation: { name: '弹药节省', pct: true },
  runePreservation: { name: '符文节省', pct: true },
  prayerPreservation: { name: '祈祷点节省', pct: true },
  combatGP: { name: '战斗金币', pct: true },
  artifactChance: { name: '文物几率', pct: true },
  harvestIntensity: { name: '收割强度增长', pct: false },
  rareDropChance: { name: '稀有掉落几率', pct: true },
  sellPrice: { name: '出售价格', pct: true },
  fishingSpecialChance: { name: '钓鱼特殊物品几率', pct: true },
  abyssalPieces: { name: '深渊碎片获取', pct: true },
  summonChargePreservation: { name: '召唤石板节省', pct: true },
  potionCharges: { name: '药水次数', pct: false },
  agilityObstacleCost: { name: '障碍建造费用减免', pct: true },
  levelCap: { name: '等级上限', pct: false },
  townshipProduction: { name: '城镇产出', pct: true },
  petChance: { name: '宠物几率', pct: true },
  maxHP: { name: '最大生命', pct: true },
  flatMaxHP: { name: '最大生命', pct: false },
  attackInterval: { name: '攻击间隔', pct: true },
  barrier: { name: '屏障', pct: true },
  slayerCoins: { name: '猎杀币获取', pct: true },
};

export function modLabel(key: string): string {
  const [base, scope] = key.split(':');
  const def = MOD_NAMES[base];
  const scopeName = scope ? (C.skills[scope as keyof typeof C.skills]?.name ?? (CATEGORY_NAMES[scope] ?? scope)) : '';
  return `${scopeName}${def?.name ?? base}`;
}

export function describeMod(key: string, value: number): string {
  const base = key.split(':')[0];
  const def = MOD_NAMES[base];
  const sign = value > 0 ? '+' : '';
  return `${modLabel(key)} ${sign}${Number.isInteger(value) ? value : value.toFixed(2)}${def?.pct === false ? '' : '%'}`;
}

export function describeMods(mods: ModifierMap | undefined): string[] {
  if (!mods) return [];
  return Object.entries(mods).map(([k, v]) => describeMod(k, v));
}

/** 动作分类中文名 */
export const CATEGORY_NAMES: Record<string, string> = {
  fire: '明火', furnace: '烤炉', pot: '汤锅',
  bars: '金属锭', shafts: '箭杆', bows: '弓', arrows: '箭矢', bolts: '弩箭', javelins: '标枪', crossbows: '弩',
  leather: '皮革', dragonhide: '龙皮', jewelry: '首饰',
  runes: '符文', combo: '复合符文', staves: '法杖', robes: '法袍',
  combat: '战斗药水', skill: '技能药水',
  paper: '纸墨', survey: '勘测',
  allotment: '菜地', herb: '草药', tree: '树木',
};
for (const t of METAL_TIERS) CATEGORY_NAMES[t.id] = `${t.name}装备`;
for (const a of FISHING_AREAS) CATEGORY_NAMES[a.id] = a.name;
for (const a of THIEVING_AREAS) if (!CATEGORY_NAMES[a.id]) CATEGORY_NAMES[a.id] = a.name;

export function categoryName(cat: string): string { return CATEGORY_NAMES[cat] ?? cat; }

/** 偷窃成功率（与引擎公式一致） */
export function thievingSuccess(g: Game, a: SkillActionDef): number {
  const stealth = g.level('thieving') + g.masteryLevel(a.id) + g.mods.get('thievingStealth') + (a.abyssalLevel ? g.abyssalLevel('thieving') * 5 : 0);
  return Math.min(100, (100 * (100 + stealth)) / (100 + (a.data?.perception ?? 0)));
}

/** 药剂当前会产出的品阶索引 */
export function herbloreTier(g: Game, a: SkillActionDef): number {
  const req = (a.data?.tierMastery as number[] | undefined) ?? [];
  const m = g.masteryLevel(a.id);
  let t = 0;
  for (let i = 0; i < req.length; i++) if (m >= req[i]) t = i;
  return t;
}

/** 符文倍率 */
export function runeMultiplier(g: Game, a: SkillActionDef): number {
  const lv = g.level('runecrafting');
  return 1 + ((a.data?.multiplierLevels as number[] | undefined)?.filter((l) => lv >= l).length ?? 0);
}

/** 当前装备的召唤兽 ID */
export function equippedFamiliars(g: Game): string[] {
  const set = g.state.equipmentSets[g.state.activeSet];
  const out: string[] = [];
  for (const slot of ['summon1', 'summon2'] as const) {
    const st = set[slot];
    const fam = st && st.qty > 0 ? C.items[st.id]?.tablet?.familiarId : undefined;
    if (fam) out.push(fam);
  }
  return out;
}

/** 协同效果是否生效：两只召唤兽均已装备且印记等级 ≥ 3 */
export function synergyActive(g: Game, syn: SynergyDef): boolean {
  const eq = equippedFamiliars(g);
  return eq.includes(syn.a) && eq.includes(syn.b) && g.markLevel(syn.a) >= 3 && g.markLevel(syn.b) >= 3;
}
