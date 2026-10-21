// 综合技能内容：农业、敏捷、占星、召唤、城镇、制图、考古、深渊技能树、腐化
import {
  addAction, addItem, addCrop, addObstacle, addConstellation, addFamiliar, addBuilding, addTownResource,
  addDigSite, addPoi, addTreeNode, addCorruption, C,
} from '../registry';
import { ALLOTMENTS, HERBS, TREES, shardId } from '../items/materials';
import type { ExpansionId, ModifierMap, SkillId, ItemQty, ArtifactSize, Realm } from '@/game/core/types';

const MIN = 60 * 1000;

// --------------------------------------------------------------------------- 农业
for (const a of ALLOTMENTS) addCrop({ id: `crop_${a.id}`, seed: `seed_${a.id}`, seedQty: 3, produce: `crop_${a.id}`, plotType: 'allotment', level: a.level, growTime: a.growMin * MIN, xp: a.xp, baseYield: 6, expansion: 'base' });
for (const h of HERBS) {
  if (h.id === 'voidroot') continue;
  addCrop({ id: `crop_herb_${h.id}`, seed: `seed_${h.id}`, seedQty: 2, produce: `herb_${h.id}`, plotType: 'herb', level: h.level, growTime: h.growMin * MIN, xp: h.xp, baseYield: 4, expansion: h.exp });
}
addCrop({ id: 'crop_herb_voidroot', seed: 'seed_voidroot', seedQty: 2, produce: 'herb_voidroot', plotType: 'herb', level: 99, growTime: 24 * MIN, xp: 380, baseYield: 3, expansion: 'ita' });
for (const t of TREES) addCrop({ id: `crop_tree_${t.id}`, seed: `seed_tree_${t.id}`, seedQty: 1, produce: t.log, plotType: 'tree', level: t.level, growTime: t.growMin * MIN, xp: t.xp, baseYield: 15, expansion: 'base' });

for (const c of Object.values(C.crops)) {
  addAction({ id: c.id, skill: 'farming', name: C.items[c.produce]?.name ?? c.id, icon: c.plotType === 'tree' ? '🌳' : c.plotType === 'herb' ? '🌿' : '🌱', category: c.plotType,
    level: c.level, realm: c.expansion === 'ita' ? 'abyssal' : 'melvor', interval: c.growTime, xp: c.xp, inputs: [{ id: c.seed, qty: c.seedQty }], outputs: [{ id: c.produce, qty: c.baseYield }],
    data: { crop: c.id }, expansion: c.expansion });
}
export const FARMING_PLOTS: { id: string; type: 'allotment' | 'herb' | 'tree'; level: number; cost: number }[] = [];
const plotCfg = { allotment: [[1, 0], [1, 0], [10, 1000], [20, 5000], [35, 20000], [50, 60000], [65, 150000], [80, 400000]], herb: [[9, 0], [9, 0], [20, 3000], [35, 15000], [50, 50000], [65, 120000], [80, 300000]], tree: [[15, 0], [25, 10000], [40, 50000], [55, 150000], [70, 400000], [85, 1000000]] };
for (const [type, list] of Object.entries(plotCfg)) list.forEach(([level, cost], i) => FARMING_PLOTS.push({ id: `${type}_${i}`, type: type as any, level, cost }));

// --------------------------------------------------------------------------- 敏捷
const OBSTACLES: [string, string, number, number, number, number, ModifierMap, ItemQty[], number][] = [
  // [name, icon, slot, level, interval(s), xp, mods, items, gp]
  ['绳索秋千', '🪢', 0, 1, 5, 8, { 'skillInterval:woodcutting': -2 }, [{ id: 'log_normal', qty: 50 }], 1000],
  ['独木桥', '🪵', 0, 1, 6, 10, { 'skillXP:fishing': 3 }, [{ id: 'log_oak', qty: 50 }], 1000],
  ['攀岩墙', '🧗', 0, 1, 6, 10, { 'doubleItems:mining': 2 }, [{ id: 'ore_copper', qty: 50 }], 1000],
  ['泥潭', '🟤', 1, 10, 7, 14, { 'skillXP:cooking': 3, 'skillXP:firemaking': 3 }, [{ id: 'log_willow', qty: 50 }], 5000],
  ['钢丝绳', '〰️', 1, 10, 7, 15, { thievingStealth: 15 }, [{ id: 'bar_iron', qty: 20 }], 5000],
  ['跨栏', '🚧', 1, 10, 6, 13, { 'skillInterval:agility': -3 }, [{ id: 'log_oak', qty: 100 }], 5000],
  ['平衡木', '📏', 2, 20, 8, 20, { meleeAccuracy: 3, 'skillXP:smithing': 2 }, [{ id: 'bar_steel', qty: 30 }], 15000],
  ['火圈', '⭕', 2, 20, 8, 22, { 'skillXP:firemaking': 5, 'doubleItems:cooking': -2 }, [{ id: 'log_teak', qty: 80 }], 15000],
  ['湍流泳道', '🌊', 2, 20, 9, 22, { 'doubleItems:fishing': 3 }, [{ id: 'raw_trout', qty: 60 }], 15000],
  ['荆棘丛', '🌵', 3, 30, 9, 28, { 'skillXP:farming': 5, 'skillXP:herblore': 3 }, [{ id: 'crop_cabbage', qty: 80 }], 30000],
  ['悬崖攀爬', '🏔️', 3, 30, 10, 30, { evasion: 3 }, [{ id: 'bar_silver', qty: 40 }], 30000],
  ['摆锤阵', '🕰️', 3, 30, 10, 30, { 'gpGlobal:thieving': 6, 'skillInterval:thieving': -2 }, [{ id: 'bar_gold', qty: 40 }], 30000],
  ['冰面滑道', '🧊', 4, 40, 11, 38, { 'skillInterval:mining': -3 }, [{ id: 'bar_mithril', qty: 40 }], 60000],
  ['刀锋走廊', '🔪', 4, 40, 11, 40, { meleeMaxHit: 2, damageReductionFlat: -1 }, [{ id: 'bar_mithril', qty: 50 }], 60000],
  ['藤蔓迷宫', '🌿', 4, 40, 12, 40, { 'preservation:herblore': 4 }, [{ id: 'herb_flamemoss', qty: 40 }], 60000],
  ['熔岩跳石', '🌋', 5, 50, 12, 50, { 'skillXP:smithing': 5, 'preservation:smithing': 2 }, [{ id: 'bar_adamant', qty: 40 }], 120000],
  ['飞索', '🪂', 5, 50, 12, 52, { rangedAccuracy: 4, 'skillXP:fletching': 4 }, [{ id: 'log_mahogany', qty: 100 }], 120000],
  ['符文阶梯', '🌀', 5, 50, 13, 52, { 'doubleItems:runecrafting': 4 }, [{ id: 'rune_chaos', qty: 300 }], 120000],
  ['幻影回廊', '👻', 6, 60, 14, 65, { magicAccuracy: 4, 'skillXP:magic': 3 }, [{ id: 'rune_death', qty: 300 }], 250000],
  ['蜂巢峭壁', '🐝', 6, 60, 13, 63, { farmingYield: 8 }, [{ id: 'crop_strawberry', qty: 150 }], 250000],
  ['重力室', '🌐', 6, 60, 14, 66, { 'skillInterval': -1, 'gpGlobal': -3 }, [{ id: 'bar_rune', qty: 30 }], 250000],
  ['星光索道', '🌠', 7, 70, 15, 80, { 'doubleItems:astrology': 4, 'skillXP:astrology': 4 }, [{ id: 'stardust', qty: 200 }], 500000],
  ['龙脊', '🐉', 7, 70, 15, 82, { maxHit: 2 }, [{ id: 'dragon_bones', qty: 100 }], 500000],
  ['宝石坑道', '💎', 7, 70, 16, 82, { miningGemChance: 3, 'skillXP:crafting': 4 }, [{ id: 'gem_ruby', qty: 30 }], 500000],
  ['风暴之门', '⛈️', 8, 80, 16, 98, { 'skillXP': 2 }, [{ id: 'bar_dragon', qty: 20 }], 1000000],
  ['影之跃', '🌘', 8, 80, 16, 96, { lifesteal: 1, evasion: 2 }, [{ id: 'hide_black', qty: 60 }], 1000000],
  ['召唤祭坛', '🔯', 8, 80, 17, 98, { 'preservation:summoning': 5, 'skillXP:summoning': 4 }, [{ id: 'shard_gold', qty: 300 }], 1000000],
  ['天空之梯', '🪜', 9, 90, 18, 120, { masteryXP: 3 }, [{ id: 'log_redwood', qty: 200 }], 2000000],
  ['时间裂隙', '⏳', 9, 90, 18, 118, { skillInterval: -2 }, [{ id: 'rune_ancient', qty: 500 }], 2000000],
  ['勇者试炼', '🏆', 9, 90, 18, 120, { maxHit: 3, damageReductionFlat: 2 }, [{ id: 'bar_dragon', qty: 40 }], 2000000],
];
OBSTACLES.forEach(([name, icon, slot, level, sec, xp, mods, items, gp], i) => {
  addObstacle({ id: `obs_${i}`, name, icon, slot, level, interval: sec * 1000, xp, gp: Math.round(5 + level * 1.2), cost: { gp, items }, modifiers: mods, realm: 'melvor', expansion: 'base' });
});
const PILLARS: [string, ModifierMap, number][] = [
  ['疾行立柱', { 'skillInterval:agility': -5, skillXP: 2 }, 5000000],
  ['财富立柱', { gpGlobal: 5 }, 5000000],
  ['熟练立柱', { masteryXP: 5 }, 5000000],
  ['使者立柱', { skillXP: 3, masteryXP: 3, skillInterval: -2 }, 15000000],
];
PILLARS.forEach(([name, mods, gp], i) => addObstacle({ id: `pillar_${i}`, name, icon: '🏛️', slot: 10, level: i === 3 ? 105 : 99, interval: 0, xp: 0, gp: 0, cost: { gp, items: [{ id: i === 3 ? 'bar_celestium' : 'bar_dragon', qty: 50 }] }, modifiers: mods, isPillar: true, realm: 'melvor', expansion: i === 3 ? 'toth' : 'base' }));
const ABYSS_OBS: [string, number, ModifierMap][] = [
  ['虚空吊桥', 1, { abyssalXP: 3 }], ['暗影长廊', 1, { 'skillInterval:thieving': -3 }],
  ['腐化沼泽', 15, { abyssalResistanceFlat: 2 }], ['灵魂阶梯', 15, { 'doubleItems:harvesting': 4 }],
  ['冥铁隘口', 30, { maxHit: 3 }], ['星裂断崖', 30, { 'doubleItems:astrology': 5 }],
  ['终焉回廊', 45, { abyssalXP: 5, skillInterval: -2 }],
];
ABYSS_OBS.forEach(([name, ab, mods], i) => addObstacle({ id: `aobs_${i}`, name, icon: '🌑', slot: 11 + Math.floor(i / 2), level: 99, abyssalLevel: ab, interval: (16 + i) * 1000, xp: 200 + i * 60, gp: 0, cost: { gp: 3000000 + i * 1000000, items: [{ id: 'bar_void', qty: 30 + i * 10 }, { id: 'abyssal_shard', qty: 50 }] }, modifiers: mods, realm: 'abyssal', expansion: 'ita' }));
for (const o of Object.values(C.obstacles)) {
  if (o.isPillar) continue;
  addAction({ id: o.id, skill: 'agility', name: o.name, icon: o.icon, category: `slot${o.slot}`, level: o.level, abyssalLevel: o.abyssalLevel, realm: o.realm,
    interval: o.interval, xp: o.xp, abyssalXp: o.abyssalLevel ? Math.round(o.xp * 0.6) : undefined, gp: o.gp, inputs: [], outputs: [], data: { obstacle: o.id }, expansion: o.expansion });
}
export const AGILITY_SLOTS = [1, 10, 20, 30, 40, 50, 60, 70, 80, 90];
export const AGILITY_PILLAR_SLOT = 10;
export const ABYSSAL_AGILITY_SLOTS = [11, 12, 13, 14];

// --------------------------------------------------------------------------- 占星
const CONS: [string, string, number, SkillId[]][] = [
  ['牧羊座', '♈', 1, ['woodcutting', 'firemaking', 'fletching']],
  ['金鱼座', '🐠', 10, ['fishing', 'cooking', 'herblore']],
  ['熔炉座', '⚒️', 20, ['mining', 'smithing', 'crafting']],
  ['暗影座', '🌑', 30, ['thieving', 'agility', 'slayer']],
  ['丰饶座', '🌾', 40, ['farming', 'township', 'herblore']],
  ['奥术座', '🔮', 50, ['magic', 'runecrafting', 'summoning']],
  ['战神座', '⚔️', 60, ['attack', 'strength', 'defence']],
  ['猎户座', '🏹', 70, ['ranged', 'hitpoints', 'prayer']],
  ['天枢座', '🧭', 80, ['cartography', 'archaeology', 'astrology']],
  ['终末座', '🌌', 90, ['agility', 'summoning', 'slayer']],
];
CONS.forEach(([name, icon, level, skills], i) => {
  addConstellation({ id: `cons_${i}`, name, icon, level, xp: Math.round(12 + level * 2.2), skills, realm: 'melvor', expansion: 'base',
    standard: [
      { key: `skillXP:${skills[0]}`, perLevel: 1, maxLevel: 5, description: `${skills[0]} 经验 +1%/级` },
      { key: `skillXP:${skills[1]}`, perLevel: 1, maxLevel: 5, description: `${skills[1]} 经验 +1%/级` },
      { key: `masteryXP:${skills[2]}`, perLevel: 1, maxLevel: 5, description: `${skills[2]} 掌握度经验 +1%/级` },
    ],
    unique: [
      { key: `skillInterval:${skills[0]}`, perLevel: -1, maxLevel: 5, description: `${skills[0]} 耗时 -1%/级` },
      { key: skills[1] === 'attack' || skills[1] === 'strength' || skills[1] === 'defence' || skills[1] === 'hitpoints' ? 'maxHit' : `doubleItems:${skills[1]}`, perLevel: 1, maxLevel: 5, description: `${skills[1]} 双倍/伤害 +1%/级` },
    ] });
});
const ACONS: [string, number, SkillId[]][] = [['虚空之眼', 1, ['woodcutting', 'mining', 'fishing']], ['腐化之心', 20, ['corruption', 'harvesting', 'thieving']], ['灵魂之环', 40, ['summoning', 'runecrafting', 'smithing']]];
ACONS.forEach(([name, ab, skills], i) => addConstellation({ id: `acons_${i}`, name, icon: '🌌', level: 99, abyssalLevel: ab, xp: 300 + i * 120, skills, realm: 'abyssal', expansion: 'ita',
  standard: skills.map((s) => ({ key: `abyssalXP:${s}`, perLevel: 1, maxLevel: 5, description: `${s} 深渊经验 +1%/级` })),
  unique: [{ key: 'abyssalXP', perLevel: 1, maxLevel: 5, description: '全部深渊经验 +1%/级' }, { key: 'abyssalResistanceFlat', perLevel: 1, maxLevel: 5, description: '深渊抗性 +1/级' }] }));
for (const c of Object.values(C.constellations)) {
  addAction({ id: `astro_${c.id}`, skill: 'astrology', name: c.name, icon: c.icon, level: c.level, abyssalLevel: c.abyssalLevel, realm: c.realm, interval: 3000, xp: c.xp, abyssalXp: c.abyssalLevel ? Math.round(c.xp * 0.6) : undefined,
    inputs: [], outputs: [], data: { constellation: c.id }, expansion: c.expansion });
}
export const ASTRO_STANDARD_COST = (lvl: number) => 50 * Math.pow(2, lvl);
export const ASTRO_UNIQUE_COST = (lvl: number) => 25 * Math.pow(2, lvl);

// --------------------------------------------------------------------------- 召唤
const FAMS: { id: string; name: string; icon: string; level: number; marks: SkillId[]; combat?: number; mods: ModifierMap; shards: [string, number][]; alts: string[]; exp: ExpansionId; realm: Realm }[] = [
  { id: 'wolf', name: '灵狼', icon: '🐺', level: 1, marks: ['attack', 'strength', 'defence'], combat: 60, mods: { meleeMaxHit: 2 }, shards: [['green', 6], ['blue', 2]], alts: ['bones', 'raw_beef', 'raw_chicken'], exp: 'base', realm: 'melvor' },
  { id: 'ent', name: '树精', icon: '🌲', level: 5, marks: ['woodcutting'], mods: { 'doubleItems:woodcutting': 5 }, shards: [['green', 8]], alts: ['log_normal', 'log_oak', 'log_willow'], exp: 'base', realm: 'melvor' },
  { id: 'mole', name: '鼹鼠', icon: '🦫', level: 10, marks: ['mining'], mods: { 'doubleItems:mining': 5 }, shards: [['green', 10]], alts: ['ore_copper', 'ore_tin', 'ore_iron'], exp: 'base', realm: 'melvor' },
  { id: 'octopus', name: '章鱼', icon: '🐙', level: 15, marks: ['fishing'], mods: { 'doubleItems:fishing': 5 }, shards: [['green', 8], ['blue', 4]], alts: ['raw_shrimp', 'raw_sardine', 'raw_herring'], exp: 'base', realm: 'melvor' },
  { id: 'minotaur', name: '牛头人', icon: '🐂', level: 20, marks: ['attack', 'strength', 'defence'], combat: 120, mods: { meleeAccuracy: 4 }, shards: [['blue', 8], ['red', 2]], alts: ['big_bones', 'cowhide'], exp: 'base', realm: 'melvor' },
  { id: 'centaur', name: '半人马', icon: '🐎', level: 25, marks: ['ranged'], combat: 140, mods: { rangedMaxHit: 3 }, shards: [['blue', 10], ['red', 3]], alts: ['bronze_arrows', 'iron_arrows', 'feather'], exp: 'base', realm: 'melvor' },
  { id: 'witch', name: '女巫', icon: '🧹', level: 30, marks: ['runecrafting', 'magic'], mods: { 'doubleItems:runecrafting': 6 }, shards: [['blue', 12], ['red', 4]], alts: ['rune_air', 'rune_water', 'rune_earth', 'rune_fire'], exp: 'base', realm: 'melvor' },
  { id: 'pyro', name: '火精灵', icon: '🔥', level: 35, marks: ['firemaking'], mods: { 'skillXP:firemaking': 8 }, shards: [['red', 10]], alts: ['ash', 'log_teak', 'log_maple'], exp: 'base', realm: 'melvor' },
  { id: 'monkey', name: '灵猴', icon: '🐒', level: 40, marks: ['agility'], mods: { 'gpGlobal:agility': 10 }, shards: [['red', 12], ['silver', 2]], alts: ['fruit_apple', 'crop_watermelon', 'crop_strawberry'], exp: 'base', realm: 'melvor' },
  { id: 'leprechaun', name: '小妖精', icon: '🍀', level: 45, marks: ['thieving'], mods: { 'gpGlobal:thieving': 10 }, shards: [['red', 12], ['silver', 4]], alts: ['coin_pouch', 'gem_topaz'], exp: 'base', realm: 'melvor' },
  { id: 'cyclops', name: '独眼巨人', icon: '👁️', level: 50, marks: ['attack', 'strength', 'defence'], combat: 240, mods: { maxHit: 2 }, shards: [['silver', 10], ['gold', 2]], alts: ['dragon_bones', 'bar_mithril'], exp: 'base', realm: 'melvor' },
  { id: 'yak', name: '牦牛', icon: '🐃', level: 55, marks: ['smithing'], mods: { 'preservation:smithing': 6 }, shards: [['silver', 12]], alts: ['bar_steel', 'bar_mithril', 'ore_coal'], exp: 'base', realm: 'melvor' },
  { id: 'unicorn', name: '独角兽', icon: '🦄', level: 60, marks: ['herblore'], mods: { 'preservation:herblore': 5, hpRegen: 50 }, shards: [['silver', 12], ['gold', 3]], alts: ['herb_frostleaf', 'herb_dragonroot', 'herb_sunbloom'], exp: 'base', realm: 'melvor' },
  { id: 'devil', name: '小恶魔', icon: '😈', level: 65, marks: ['attack', 'strength', 'defence', 'magic'], combat: 300, mods: { lifesteal: 1 }, shards: [['gold', 10], ['black', 2]], alts: ['rune_blood', 'rune_death'], exp: 'base', realm: 'melvor' },
  { id: 'bear', name: '巨熊', icon: '🐻', level: 70, marks: ['farming'], mods: { farmingYield: 10 }, shards: [['gold', 12]], alts: ['crop_carrot', 'crop_sweetcorn', 'compost'], exp: 'base', realm: 'melvor' },
  { id: 'crow', name: '渡鸦', icon: '🐦‍⬛', level: 75, marks: ['fletching'], mods: { 'preservation:fletching': 6 }, shards: [['gold', 12], ['black', 3]], alts: ['feather', 'arrow_shafts'], exp: 'base', realm: 'melvor' },
  { id: 'salamander', name: '蝾螈', icon: '🦎', level: 80, marks: ['crafting', 'cooking'], mods: { 'doubleItems:crafting': 6, 'skillXP:cooking': 4 }, shards: [['gold', 14], ['black', 4]], alts: ['leather', 'dleather_blue', 'gem_emerald'], exp: 'base', realm: 'melvor' },
  { id: 'dragon', name: '幼龙', icon: '🐲', level: 90, marks: ['attack', 'strength', 'defence', 'ranged', 'magic'], combat: 400, mods: { maxHit: 3 }, shards: [['black', 14]], alts: ['dragon_bones', 'hide_black', 'bar_dragon'], exp: 'base', realm: 'melvor' },
  { id: 'starling', name: '星灵', icon: '🌟', level: 95, marks: ['astrology'], mods: { 'doubleItems:astrology': 6 }, shards: [['black', 10], ['gold', 10]], alts: ['stardust', 'golden_stardust'], exp: 'base', realm: 'melvor' },
  { id: 'hawk', name: '探路鹰', icon: '🦅', level: 100, marks: ['cartography', 'archaeology'], mods: { artifactChance: 8, 'skillInterval:cartography': -4 }, shards: [['black', 16]], alts: ['paper', 'map_fragment'], exp: 'aod', realm: 'melvor' },
  { id: 'golem', name: '天河魔像', icon: '🗿', level: 105, marks: ['attack', 'strength', 'defence', 'ranged', 'magic'], combat: 520, mods: { damageReductionFlat: 3 }, shards: [['black', 20]], alts: ['bar_starfall', 'ore_celestium'], exp: 'toth', realm: 'melvor' },
  { id: 'voidling', name: '虚空魔', icon: '👾', level: 99, marks: ['attack', 'strength', 'defence', 'ranged', 'magic', 'corruption'], combat: 700, mods: { abyssalResistanceFlat: 2 }, shards: [['void', 12], ['black', 10]], alts: ['void_ashes', 'abyssal_shard'], exp: 'ita', realm: 'abyssal' },
  { id: 'worm', name: '深渊蠕虫', icon: '🪱', level: 99, marks: ['harvesting'], mods: { harvestIntensity: 3 }, shards: [['void', 14]], alts: ['herb_voidroot', 'abyssal_shard'], exp: 'ita', realm: 'abyssal' },
];
for (const f of FAMS) {
  const tabletId = `tablet_${f.id}`;
  addItem({ id: tabletId, name: `${f.name}召唤石板`, type: 'tablet', icon: f.icon, color: '#bb8fce', sellPrice: Math.max(1, Math.round(f.level / 5)), category: '召唤', expansion: f.exp, tablet: { familiarId: f.id },
    equipment: { slot: 'summon1', realm: f.realm, requirements: [{ skill: 'summoning', level: f.level }], stats: f.combat ? { summoningMaxHit: f.combat } : {}, modifiers: f.mods },
    description: f.combat ? `战斗召唤兽，最大伤害 ${f.combat}` : `生产召唤兽` });
  addFamiliar({ id: f.id, name: f.name, icon: f.icon, level: f.level, tabletId, markSkills: f.marks, combat: f.combat ? { maxHit: f.combat } : undefined, modifiers: f.mods, expansion: f.exp, realm: f.realm });
  const abyss = f.realm === 'abyssal';
  addAction({ id: `summon_${f.id}`, skill: 'summoning', name: `${f.name}召唤石板`, icon: f.icon, level: f.level, abyssalLevel: abyss ? (f.id === 'voidling' ? 10 : 20) : undefined, realm: f.realm,
    interval: 5000, xp: Math.round(5 + f.level * 1.6), abyssalXp: abyss ? 260 : undefined,
    inputs: f.shards.map(([s, q]) => ({ id: shardId(s), qty: q })), outputs: [{ id: tabletId, qty: 25 }],
    altInputs: f.alts.map((a) => [...f.shards.map(([s, q]) => ({ id: shardId(s), qty: q })), { id: a, qty: Math.max(1, Math.round(20 - f.level / 8)) }]),
    data: { familiar: f.id, requiresMark: true }, expansion: f.exp });
}
export const MARK_LEVELS = [1, 6, 16, 31, 46, 61];
const SYN: [string, string, string, ModifierMap][] = [
  ['wolf', 'minotaur', '近战命中 +5%，近战伤害 +3%', { meleeAccuracy: 5, meleeMaxHit: 3 }],
  ['wolf', 'ent', '伐木时获得 +3% 经验', { 'skillXP:woodcutting': 3 }],
  ['ent', 'pyro', '燃烧木材时 10% 几率返还木材', { 'preservation:firemaking': 10 }],
  ['ent', 'crow', '制箭材料节省 +8%', { 'preservation:fletching': 8 }],
  ['mole', 'yak', '锻造材料节省 +8%', { 'preservation:smithing': 8 }],
  ['mole', 'salamander', '宝石几率 +3%', { miningGemChance: 3 }],
  ['octopus', 'salamander', '烹饪成功率 +10%', { cookingSuccess: 10 }],
  ['octopus', 'pyro', '钓鱼耗时 -5%', { 'skillInterval:fishing': -5 }],
  ['centaur', 'crow', '弹药节省 +10%', { ammoPreservation: 10 }],
  ['witch', 'devil', '符文节省 +10%，魔法伤害 +3%', { runePreservation: 10, magicMaxHit: 3 }],
  ['witch', 'starling', '符文双倍产出 +6%', { 'doubleItems:runecrafting': 6 }],
  ['monkey', 'leprechaun', '敏捷与偷窃金币 +10%', { 'gpGlobal:agility': 10, 'gpGlobal:thieving': 10 }],
  ['leprechaun', 'devil', '战斗金币 +15%', { combatGP: 15 }],
  ['cyclops', 'dragon', '最大伤害 +4%', { maxHit: 4 }],
  ['unicorn', 'bear', '药剂与农业经验 +5%', { 'skillXP:herblore': 5, 'skillXP:farming': 5 }],
  ['unicorn', 'dragon', '生命回复 +100%', { hpRegen: 100 }],
  ['bear', 'monkey', '农业收成 +10%', { farmingYield: 10 }],
  ['starling', 'hawk', '占星与考古经验 +5%', { 'skillXP:astrology': 5, 'skillXP:archaeology': 5 }],
  ['golem', 'dragon', '伤害减免 +4%', { damageReductionFlat: 4 }],
  ['voidling', 'worm', '深渊经验 +5%', { abyssalXP: 5 }],
  ['voidling', 'golem', '深渊抗性 +4', { abyssalResistanceFlat: 4 }],
];
for (const [a, b, description, modifiers] of SYN) C.synergies.push({ a, b, description, modifiers });

// --------------------------------------------------------------------------- 城镇
const RES: [string, string, string, string?, number?, string[]?][] = [
  ['food', '食物', '🍞', 'bread', 50, ['raw_shrimp', 'raw_sardine', 'crop_potato', 'crop_cabbage']],
  ['wood', '木材', '🪵', 'log_oak', 20, ['log_normal', 'log_oak', 'log_willow']],
  ['stone', '石料', '🪨', undefined, undefined, []],
  ['ore', '矿石', '⛰️', 'ore_iron', 25, ['ore_copper', 'ore_tin', 'ore_iron']],
  ['coal', '煤炭', '⬛', 'ore_coal', 25, ['ore_coal', 'charcoal']],
  ['bar', '金属锭', '🧱', 'bar_steel', 40, ['bar_bronze', 'bar_iron', 'bar_steel']],
  ['herbs', '草药', '🌿', 'herb_greenleaf', 30, ['herb_greenleaf', 'herb_moonwort']],
  ['essence', '符文精华', '💠', 'rune_essence', 10, ['rune_essence']],
  ['leather', '皮革', '🟫', 'leather', 25, ['leather', 'cowhide']],
  ['potions', '药水', '🧪', 'potion_healing_1', 60, []],
  ['planks', '木板', '🪚', undefined, undefined, []],
  ['clothing', '衣物', '👕', undefined, undefined, []],
  ['gp', '城镇金库', '🪙', undefined, undefined, []],
];
for (const [id, name, icon, convertsTo, convertRatio, fromItems] of RES) addTownResource({ id, name, icon, convertsTo, convertRatio, fromItems });
export const BIOMES = [
  { id: 'grass', name: '草原', icon: '🌾', level: 1, landCost: 500 },
  { id: 'forest', name: '森林', icon: '🌲', level: 1, landCost: 800 },
  { id: 'mountain', name: '山地', icon: '⛰️', level: 15, landCost: 1500 },
  { id: 'water', name: '水域', icon: '🌊', level: 20, landCost: 2000 },
  { id: 'desert', name: '沙漠', icon: '🏜️', level: 35, landCost: 4000 },
  { id: 'swamp', name: '沼泽', icon: '🪷', level: 50, landCost: 6000 },
  { id: 'snow', name: '雪原', icon: '❄️', level: 70, landCost: 10000 },
];
const B: [string, string, string, string[], number, Record<string, number>, number, any, number][] = [
  ['shelter', '简易住所', '🛖', ['grass', 'forest', 'mountain', 'desert', 'swamp', 'snow'], 1, { wood: 20, gp: 200 }, 50, { population: 6, happiness: -1 }, 20],
  ['house', '民居', '🏠', ['grass', 'forest', 'mountain', 'desert', 'swamp', 'snow'], 15, { wood: 60, stone: 40, gp: 1500 }, 40, { population: 14, happiness: 0 }, 60],
  ['manor', '庄园', '🏡', ['grass', 'forest', 'snow'], 45, { planks: 120, stone: 120, bar: 30, gp: 15000 }, 20, { population: 30, happiness: 2 }, 200],
  ['farmland', '农田', '🌾', ['grass', 'swamp'], 1, { wood: 15, gp: 150 }, 60, { production: { food: 12 } }, 15],
  ['fishery', '渔场', '🎣', ['water'], 20, { wood: 40, gp: 1200 }, 40, { production: { food: 20 } }, 40],
  ['lumber', '伐木场', '🪓', ['forest'], 1, { gp: 200 }, 50, { production: { wood: 10 } }, 15],
  ['sawmill', '锯木厂', '🪚', ['forest', 'grass'], 10, { wood: 50, stone: 20, gp: 1000 }, 30, { production: { planks: 6 }, consumption: { wood: 8 } }, 35],
  ['quarry', '采石场', '🪨', ['mountain', 'desert'], 5, { wood: 30, gp: 500 }, 40, { production: { stone: 10 } }, 20],
  ['mine', '矿井', '⛏️', ['mountain'], 15, { wood: 60, stone: 40, gp: 2000 }, 40, { production: { ore: 8, coal: 4 } }, 45],
  ['smithy', '铁匠铺', '⚒️', ['mountain', 'grass', 'desert'], 25, { stone: 80, planks: 40, gp: 5000 }, 25, { production: { bar: 4 }, consumption: { ore: 6, coal: 4 } }, 80],
  ['herbalist', '草药园', '🌿', ['swamp', 'forest'], 20, { wood: 40, gp: 2000 }, 30, { production: { herbs: 6 } }, 40],
  ['apothecary', '药剂坊', '⚗️', ['swamp', 'grass'], 40, { planks: 60, stone: 40, gp: 8000 }, 20, { production: { potions: 2 }, consumption: { herbs: 4 } }, 100],
  ['tannery', '制革厂', '🟫', ['grass', 'desert'], 30, { planks: 40, stone: 30, gp: 4000 }, 20, { production: { leather: 5, clothing: 2 } }, 70],
  ['essence_mine', '精华矿坑', '💠', ['snow', 'mountain'], 35, { stone: 100, bar: 20, gp: 9000 }, 20, { production: { essence: 15 } }, 90],
  ['market', '市场', '🏪', ['grass', 'desert', 'water'], 10, { planks: 30, stone: 30, gp: 3000 }, 20, { taxGp: 40, happiness: 3 }, 50],
  ['tavern', '酒馆', '🍺', ['grass', 'forest', 'snow'], 10, { planks: 40, gp: 2500 }, 15, { happiness: 8, consumption: { food: 4 } }, 40],
  ['school', '学校', '🏫', ['grass', 'forest', 'mountain'], 20, { planks: 60, stone: 60, gp: 6000 }, 15, { education: 10 }, 70],
  ['hospital', '医院', '🏥', ['grass', 'water', 'snow'], 25, { planks: 60, stone: 80, potions: 10, gp: 8000 }, 15, { health: 10, consumption: { potions: 1 } }, 80],
  ['storehouse', '仓库', '📦', ['grass', 'forest', 'mountain', 'desert', 'swamp', 'snow', 'water'], 5, { wood: 80, stone: 40, gp: 1500 }, 30, { storage: 2000 }, 30],
  ['temple', '神殿', '⛩️', ['mountain', 'snow', 'desert'], 50, { stone: 300, bar: 60, planks: 120, gp: 50000 }, 5, { worship: 20, happiness: 5 }, 300],
  ['statue', '英雄雕像', '🗽', ['grass', 'desert', 'snow'], 60, { stone: 500, bar: 100, gp: 120000 }, 5, { happiness: 15, education: 5 }, 500],
];
for (const [id, name, icon, biomes, level, cost, maxCount, provides, xp] of B) addBuilding({ id, name, icon, biomes, level, cost, maxCount, provides, xp, expansion: 'base' });
export const TOWNSHIP_TICK_MS = 5 * 60 * 1000;
export const SEASONS = [
  { id: 'spring', name: '春季', icon: '🌸', mods: { food: 1.2, herbs: 1.2 } as Record<string, number> },
  { id: 'summer', name: '夏季', icon: '☀️', mods: { food: 1.1, wood: 1.1, stone: 1.1 } as Record<string, number> },
  { id: 'autumn', name: '秋季', icon: '🍂', mods: { food: 1.3, leather: 1.1 } as Record<string, number> },
  { id: 'winter', name: '冬季', icon: '❄️', mods: { food: 0.6, wood: 0.9, essence: 1.3 } as Record<string, number> },
];
export const SEASON_TICKS = 72;
export const DEITIES = [
  { id: 'none', name: '无信仰', mods: {} as ModifierMap, town: {} as Record<string, number> },
  { id: 'sun', name: '太阳神', mods: { 'skillXP:farming': 5, farmingYield: 5 } as ModifierMap, town: { food: 1.15 } as Record<string, number> },
  { id: 'forge', name: '熔炉之神', mods: { 'skillXP:smithing': 5, 'skillXP:mining': 3 } as ModifierMap, town: { bar: 1.2, ore: 1.1 } as Record<string, number> },
  { id: 'sea', name: '海洋女神', mods: { 'skillXP:fishing': 5, 'doubleItems:fishing': 3 } as ModifierMap, town: { food: 1.1 } as Record<string, number> },
  { id: 'war', name: '战争之神', mods: { maxHit: 2, meleeAccuracy: 3 } as ModifierMap, town: { bar: 1.1 } as Record<string, number> },
];
export const TOWNSHIP_TASKS: { id: string; name: string; requires: ItemQty[]; reward: { gp?: number; xp?: number; items?: ItemQty[]; resources?: Record<string, number> } }[] = [
  { id: 'tt_1', name: '城镇补给：木材', requires: [{ id: 'log_normal', qty: 200 }], reward: { gp: 2000, xp: 500, resources: { wood: 200 } } },
  { id: 'tt_2', name: '城镇补给：鱼', requires: [{ id: 'food_shrimp', qty: 100 }], reward: { gp: 2000, xp: 500, resources: { food: 300 } } },
  { id: 'tt_3', name: '工具锻造', requires: [{ id: 'bar_iron', qty: 100 }], reward: { gp: 5000, xp: 1200, resources: { bar: 50 } } },
  { id: 'tt_4', name: '石料储备', requires: [{ id: 'ore_iron', qty: 300 }], reward: { gp: 6000, xp: 1500, resources: { stone: 400 } } },
  { id: 'tt_5', name: '医疗物资', requires: [{ id: 'herb_moonwort', qty: 50 }], reward: { xp: 2000, resources: { potions: 30 } } },
  { id: 'tt_6', name: '皮革订单', requires: [{ id: 'leather', qty: 100 }], reward: { gp: 8000, xp: 2000, resources: { clothing: 60 } } },
  { id: 'tt_7', name: '王城盛宴', requires: [{ id: 'food_swordfish', qty: 200 }], reward: { gp: 20000, xp: 5000, items: [{ id: 'weird_gloop', qty: 2 }] } },
  { id: 'tt_8', name: '宝石贡品', requires: [{ id: 'gem_ruby', qty: 20 }], reward: { gp: 30000, xp: 8000 } },
  { id: 'tt_9', name: '符文供应', requires: [{ id: 'rune_nature', qty: 500 }], reward: { gp: 40000, xp: 10000, resources: { essence: 1000 } } },
  { id: 'tt_10', name: '龙骨收藏', requires: [{ id: 'dragon_bones', qty: 100 }], reward: { gp: 80000, xp: 20000, items: [{ id: 'golden_stardust', qty: 20 }] } },
];

// --------------------------------------------------------------------------- 制图与考古（Atlas of Discovery）
export const MAP_RADIUS = 8;
const SITES: { id: string; name: string; icon: string; level: number; hex: [number, number]; theme: string[]; exp: ExpansionId; realm: Realm; abyssal?: number }[] = [
  { id: 'farmstead', name: '荒废农庄', icon: '🏚️', level: 1, hex: [1, 0], theme: ['陶碗碎片', '铜纽扣', '旧镰刀', '石磨盘', '农神雕像'], exp: 'aod', realm: 'melvor' },
  { id: 'barrow', name: '古冢', icon: '⚰️', level: 10, hex: [-2, 1], theme: ['骨制护符', '青铜胸针', '殉葬陶俑', '石棺碎片', '古王权杖'], exp: 'aod', realm: 'melvor' },
  { id: 'harbor', name: '沉没港口', icon: '⚓', level: 20, hex: [3, -2], theme: ['珍珠纽扣', '航海星盘', '船锚残片', '商船货箱', '海王三叉戟'], exp: 'aod', realm: 'melvor' },
  { id: 'temple', name: '日神殿遗址', icon: '🛕', level: 35, hex: [-3, -2], theme: ['金箔残片', '祭祀香炉', '神官面具', '太阳石碑', '日神冠冕'], exp: 'aod', realm: 'melvor' },
  { id: 'forge', name: '矮人熔炉', icon: '🔨', level: 50, hex: [4, 2], theme: ['铁铆钉', '符文铁砧', '矮人战锤', '熔炉核心', '锻造之王手套'], exp: 'aod', realm: 'melvor' },
  { id: 'library', name: '失落图书馆', icon: '📚', level: 65, hex: [-5, 3], theme: ['羊皮纸卷', '水晶墨瓶', '星象图', '禁书残页', '贤者之书'], exp: 'aod', realm: 'melvor' },
  { id: 'citadel', name: '龙族要塞', icon: '🏯', level: 80, hex: [6, -4], theme: ['龙鳞碎片', '龙骑徽章', '龙牙战旗', '龙蛋化石', '龙皇之冠'], exp: 'aod', realm: 'melvor' },
  { id: 'observatory', name: '天穹观星台', icon: '🔭', level: 95, hex: [-6, -1], theme: ['铜制星规', '陨石碎片', '天文仪', '星图穹顶', '观星者之眼'], exp: 'aod', realm: 'melvor' },
  { id: 'void_ruins', name: '虚空废墟', icon: '🕳️', level: 99, abyssal: 1, hex: [7, 1], theme: ['虚空尘埃', '扭曲指环', '虚空祭坛', '裂隙核心', '虚空之心'], exp: 'ita', realm: 'abyssal' },
  { id: 'shadow_vault', name: '暗影宝库', icon: '🗝️', level: 99, abyssal: 25, hex: [-7, 4], theme: ['暗影硬币', '幽冥钥匙', '暗影甲片', '封印石', '暗影王座残骸'], exp: 'ita', realm: 'abyssal' },
];
const SIZES: ArtifactSize[] = ['tiny', 'small', 'medium', 'large'];
const SIZE_NAMES: Record<ArtifactSize, string> = { tiny: '微小', small: '小型', medium: '中型', large: '大型' };
for (const s of SITES) {
  const artifacts: Record<ArtifactSize, string[]> = { tiny: [], small: [], medium: [], large: [] };
  s.theme.forEach((name, i) => {
    const size = SIZES[Math.min(3, i === 0 ? 0 : i === 1 ? 1 : i === 2 ? 1 : i === 3 ? 2 : 3)];
    const id = `artifact_${s.id}_${i}`;
    const isLarge = i === 4;
    addItem({ id, name, type: 'artifact', icon: ['🏺', '🪙', '🗿', '📜', '👑'][i], color: '#a1887f', sellPrice: Math.round((50 + s.level * 20) * (i + 1)), category: '文物', expansion: s.exp, rarity: isLarge ? 2 : i >= 3 ? 1 : 0,
      artifact: { digSite: s.id, size }, description: `${s.name}出土的${SIZE_NAMES[size]}文物。`,
      equipment: isLarge ? { slot: 'passive', realm: s.realm, requirements: [{ skill: 'archaeology', level: s.level }], stats: {}, modifiers: { skillXP: 1 + Math.floor(s.level / 25), artifactChance: 2 } } : undefined });
    artifacts[size].push(id);
  });
  // 每个发掘点额外的微小与中型文物
  const extraTiny = `artifact_${s.id}_t2`;
  addItem({ id: extraTiny, name: `${s.name}陶片`, type: 'artifact', icon: '🧱', color: '#a1887f', sellPrice: 20 + s.level * 5, category: '文物', expansion: s.exp, artifact: { digSite: s.id, size: 'tiny' } });
  artifacts.tiny.push(extraTiny);
  const extraMed = `artifact_${s.id}_m2`;
  addItem({ id: extraMed, name: `${s.name}遗宝箱`, type: 'artifact', icon: '🧰', color: '#a1887f', sellPrice: 300 + s.level * 40, category: '文物', expansion: s.exp, rarity: 1, artifact: { digSite: s.id, size: 'medium' } });
  artifacts.medium.push(extraMed);
  addDigSite({ id: s.id, name: s.name, icon: s.icon, level: s.realm === 'abyssal' ? 99 : s.level, abyssalLevel: s.abyssal, hex: s.hex, artifacts, xp: Math.round(15 + s.level * 2.5), realm: s.realm, expansion: s.exp });
  addPoi({ id: `poi_${s.id}`, name: s.name, icon: s.icon, hex: s.hex, kind: 'digSite', digSite: s.id, description: `发掘点：${s.name}（考古 ${s.level} 级）` });
  addAction({ id: `dig_${s.id}`, skill: 'archaeology', name: s.name, icon: s.icon, level: s.realm === 'abyssal' ? 99 : s.level, abyssalLevel: s.abyssal, realm: s.realm,
    interval: 4000, xp: Math.round(15 + s.level * 2.5), abyssalXp: s.abyssal ? 300 : undefined, inputs: [], outputs: [], data: { digSite: s.id }, expansion: s.exp,
    requirements: [{ type: 'poi', id: `poi_${s.id}` }] });
}
export const ARTIFACT_BASE_CHANCE: Record<ArtifactSize, number> = { tiny: 0.35, small: 0.15, medium: 0.05, large: 0.008 };
export const ARCH_TOOLS: { id: ArtifactSize; name: string; tool: string; icon: string; costs: { gp: number; items: ItemQty[] }[] }[] = [
  { id: 'tiny', name: '筛子', tool: 'sieve', icon: '🥅', costs: [] },
  { id: 'small', name: '小铲', tool: 'trowel', icon: '🧹', costs: [] },
  { id: 'medium', name: '刷子', tool: 'brush', icon: '🖌️', costs: [] },
  { id: 'large', name: '铁锹', tool: 'shovel', icon: '🪏', costs: [] },
];
const TOOL_BARS = ['bar_bronze', 'bar_iron', 'bar_steel', 'bar_mithril', 'bar_adamant', 'bar_rune', 'bar_dragon'];
for (const t of ARCH_TOOLS) for (let lvl = 0; lvl < 6; lvl++) t.costs.push({ gp: Math.round(2000 * Math.pow(3, lvl)), items: [{ id: TOOL_BARS[lvl + 1], qty: 20 + lvl * 10 }] });
// 制图：其他兴趣点
const OTHER_POIS: { id: string; name: string; icon: string; hex: [number, number]; kind: 'watchtower' | 'portal' | 'treasure' | 'landmark' | 'hiddenHole'; reward?: any; modifiers?: ModifierMap; description: string }[] = [
  { id: 'poi_tower_n', name: '北方瞭望塔', icon: '🗼', hex: [0, -4], kind: 'watchtower', description: '发现后揭示周围 2 格范围的地形。' },
  { id: 'poi_tower_s', name: '南方瞭望塔', icon: '🗼', hex: [0, 4], kind: 'watchtower', description: '发现后揭示周围 2 格范围的地形。' },
  { id: 'poi_tower_e', name: '东方瞭望塔', icon: '🗼', hex: [5, -1], kind: 'watchtower', description: '发现后揭示周围 2 格范围的地形。' },
  { id: 'poi_tower_w', name: '西方瞭望塔', icon: '🗼', hex: [-5, 0], kind: 'watchtower', description: '发现后揭示周围 2 格范围的地形。' },
  { id: 'poi_chest_1', name: '海盗藏宝点', icon: '💰', hex: [2, 3], kind: 'treasure', reward: { gp: 25000, items: [{ id: 'treasure_chest', qty: 3 }] }, description: '埋藏的海盗宝藏。' },
  { id: 'poi_chest_2', name: '巨人遗骸', icon: '🦴', hex: [-4, 5], kind: 'treasure', reward: { items: [{ id: 'magic_bones', qty: 30 }, { id: 'gem_diamond', qty: 2 }] }, description: '远古巨人的骨骸。' },
  { id: 'poi_chest_3', name: '冰封宝库', icon: '🧊', hex: [-1, -7], kind: 'treasure', reward: { gp: 150000, items: [{ id: 'golden_stardust', qty: 25 }] }, description: '冰层下的宝库。' },
  { id: 'poi_lm_1', name: '巨石阵', icon: '🗿', hex: [-3, 6], kind: 'landmark', modifiers: { 'skillXP:astrology': 3 }, description: '永久：占星经验 +3%。' },
  { id: 'poi_lm_2', name: '世界之树', icon: '🌳', hex: [5, 3], kind: 'landmark', modifiers: { 'doubleItems:woodcutting': 3 }, description: '永久：伐木双倍 +3%。' },
  { id: 'poi_lm_3', name: '彩虹瀑布', icon: '🌈', hex: [-6, 2], kind: 'landmark', modifiers: { 'doubleItems:fishing': 3 }, description: '永久：钓鱼双倍 +3%。' },
  { id: 'poi_lm_4', name: '巨龙骸骨', icon: '🐉', hex: [6, -6], kind: 'landmark', modifiers: { maxHit: 2 }, description: '永久：最大伤害 +2%。' },
  { id: 'poi_lm_5', name: '星陨坑', icon: '☄️', hex: [3, 5], kind: 'landmark', modifiers: { 'doubleItems:mining': 3 }, description: '永久：采矿双倍 +3%。' },
  { id: 'poi_hole_1', name: '神秘洞穴', icon: '🕳️', hex: [-2, -5], kind: 'hiddenHole', reward: { items: [{ id: 'mysterious_stone', qty: 1 }] }, description: '洞穴深处藏着一块神秘石。' },
  { id: 'poi_portal', name: '深渊裂隙', icon: '🌀', hex: [8, -3], kind: 'portal', reward: { items: [{ id: 'abyssal_shard', qty: 50 }] }, description: '通往深渊的裂隙（Into the Abyss）。' },
];
for (const p of OTHER_POIS) addPoi({ ...p });
export const SURVEY_INTERVAL = 5000;
export const surveyXpForHex = (dist: number) => 100 + dist * 60;
export const MAP_TIERS = [
  { tier: 1, name: '粗略地图', paper: 5, ink: 0, charges: 20, bonus: 0 },
  { tier: 2, name: '详细地图', paper: 15, ink: 2, charges: 40, bonus: 5 },
  { tier: 3, name: '精确地图', paper: 40, ink: 5, charges: 70, bonus: 10 },
  { tier: 4, name: '大师地图', paper: 100, ink: 12, charges: 120, bonus: 20 },
];
addAction({ id: 'carto_paper', skill: 'cartography', name: '制作纸张', icon: '📜', category: 'paper', level: 1, interval: 3000, xp: 6, inputs: [{ id: 'log_normal', qty: 2 }], outputs: [{ id: 'paper', qty: 5 }],
  altInputs: [[{ id: 'log_oak', qty: 1 }], [{ id: 'log_willow', qty: 1 }], [{ id: 'log_teak', qty: 1 }]], expansion: 'aod' });
addAction({ id: 'carto_ink', skill: 'cartography', name: '调制墨水', icon: '🖋️', category: 'paper', level: 15, interval: 3000, xp: 14, inputs: [{ id: 'charcoal', qty: 2 }, { id: 'herb_greenleaf', qty: 1 }], outputs: [{ id: 'ink', qty: 3 }], expansion: 'aod' });
addAction({ id: 'carto_survey', skill: 'cartography', name: '勘测', icon: '🧭', category: 'survey', level: 1, interval: SURVEY_INTERVAL, xp: 12, inputs: [], outputs: [], masteryEnabled: false, expansion: 'aod',
  extraDrops: [{ id: 'map_fragment', chance: 0.03 }] });

// --------------------------------------------------------------------------- 深渊技能树（Into the Abyss）
const TREE_SKILLS = Object.values(C.skills).filter((s) => s.abyssalEnabled).map((s) => s.id);
for (const skill of TREE_SKILLS) {
  const isCombat = ['attack', 'strength', 'defence', 'hitpoints', 'ranged', 'magic', 'prayer', 'slayer', 'corruption'].includes(skill);
  const n = (k: string) => `tree_${skill}_${k}`;
  const nodes: [string, string, number, string[], ModifierMap, string][] = isCombat
    ? [
      ['root', '深渊觉醒', 1, [], { [`abyssalXP:${skill}`]: 5 }, '该技能深渊经验 +5%'],
      ['a1', '锋芒', 2, ['root'], { maxHit: 2 }, '最大伤害 +2%'],
      ['b1', '坚壁', 2, ['root'], { abyssalResistanceFlat: 2 }, '深渊抗性 +2'],
      ['a2', '致命', 3, ['a1'], { meleeAccuracy: 4, rangedAccuracy: 4, magicAccuracy: 4 }, '全部命中 +4%'],
      ['b2', '韧性', 3, ['b1'], { damageReductionFlat: 2 }, '伤害减免 +2%'],
      ['cap', '深渊主宰', 5, ['a2', 'b2'], { maxHit: 4, lifesteal: 1 }, '最大伤害 +4%，生命偷取 +1%'],
    ]
    : [
      ['root', '深渊觉醒', 1, [], { [`abyssalXP:${skill}`]: 5 }, '该技能深渊经验 +5%'],
      ['a1', '迅捷', 2, ['root'], { [`skillInterval:${skill}`]: -3 }, '该技能耗时 -3%'],
      ['b1', '丰收', 2, ['root'], { [`doubleItems:${skill}`]: 4 }, '该技能双倍产出 +4%'],
      ['a2', '精湛', 3, ['a1'], { [`masteryXP:${skill}`]: 6 }, '该技能掌握度经验 +6%'],
      ['b2', '节约', 3, ['b1'], { [`preservation:${skill}`]: 5 }, '该技能材料节省 +5%'],
      ['cap', '深渊大师', 5, ['a2', 'b2'], { [`skillXP:${skill}`]: 8, [`abyssalXP:${skill}`]: 8 }, '该技能经验与深渊经验 +8%'],
    ];
  for (const [k, name, cost, parents, modifiers, description] of nodes) addTreeNode({ id: n(k), skill, name, cost, parents: parents.map(n), modifiers, description });
}

// --------------------------------------------------------------------------- 腐化效果
const CORR: [string, number, string, ModifierMap][] = [
  ['削弱', 1, '深渊敌人命中 -5%', { accuracy: -5 }],
  ['碎甲', 10, '深渊敌人伤害减免 -3%', { damageReductionFlat: -3 }],
  ['迟缓', 20, '深渊敌人攻击间隔 +5%', { attackInterval: 5 }],
  ['腐蚀', 30, '深渊敌人闪避 -6%', { evasion: -6 }],
  ['虚弱', 40, '深渊敌人最大伤害 -5%', { maxHit: -5 }],
  ['血枯', 50, '深渊敌人最大生命 -5%', { maxHP: -5 }],
  ['恐惧', 60, '深渊敌人命中 -8%', { accuracy: -8 }],
  ['瓦解', 70, '深渊敌人屏障 -10%', { barrier: -10 }],
  ['凋零', 80, '深渊敌人最大伤害 -8%', { maxHit: -8 }],
  ['终焉', 90, '深渊敌人全部属性 -5%', { accuracy: -5, evasion: -5, maxHit: -5 }],
];
CORR.forEach(([name, level, description, enemyModifiers], i) => addCorruption({ id: `corr_${i}`, name, level, description, enemyModifiers }));
