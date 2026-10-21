// 采集技能内容：伐木、钓鱼、采矿、偷窃、收割
import { addAction, addDropTable, addItem, noteSource } from '../registry';
import { LOGS, logId, FISH, rawFishId, ORES, oreId, GEMS, gemId, ALLOTMENTS, HERBS } from '../items/materials';
import type { ExpansionId, Realm, Requirement } from '@/game/core/types';

// --------------------------------------------------------------------------- 伐木
for (const l of LOGS) {
  addAction({
    id: `wc_${l.id}`, skill: 'woodcutting', name: l.id === 'normal' ? '普通树' : `${l.name.replace('木', '')}树`, icon: '🌳',
    level: l.level, abyssalLevel: l.abyssal, realm: l.realm, interval: l.interval, xp: l.xp, abyssalXp: l.abyssal ? Math.round(l.xp * 0.6) : undefined,
    inputs: [], outputs: [{ id: logId(l.id), qty: 1 }],
    extraDrops: [{ id: 'bird_nest', chance: 0.005 }],
    expansion: l.exp,
  });
}

addDropTable({ id: 'dt_bird_nest', rolls: 1, entries: [
  ...ALLOTMENTS.map((a, i) => ({ id: `seed_${a.id}`, min: 1, max: 4, weight: 12 - i })),
  ...HERBS.filter((h) => h.exp === 'base').map((h, i) => ({ id: `seed_${h.id}`, min: 1, max: 2, weight: 8 - i * 0.7 })),
  { id: 'seed_tree_oak', min: 1, max: 1, weight: 4 }, { id: 'seed_tree_willow', min: 1, max: 1, weight: 3 },
  { id: 'seed_tree_apple', min: 1, max: 1, weight: 2.5 }, { id: 'seed_tree_maple', min: 1, max: 1, weight: 2 },
  { id: 'seed_tree_cherry', min: 1, max: 1, weight: 1.5 }, { id: 'seed_tree_yew', min: 1, max: 1, weight: 1 },
  { id: 'seed_tree_magic', min: 1, max: 1, weight: 0.5 }, { id: 'seed_tree_redwood', min: 1, max: 1, weight: 0.25 },
  { id: 'feather', min: 5, max: 25, weight: 8 },
] });

// --------------------------------------------------------------------------- 钓鱼
export interface FishingAreaDef { id: string; name: string; icon: string; junkChance: number; specialChance: number; specialTable: string; requirements: Requirement[]; realm: Realm; expansion: ExpansionId }
export const FISHING_AREAS: FishingAreaDef[] = [
  { id: 'shallows', name: '浅滩', icon: '🏖️', junkChance: 0.2, specialChance: 0.005, specialTable: 'dt_fish_special', requirements: [], realm: 'melvor', expansion: 'base' },
  { id: 'river', name: '林间河流', icon: '🏞️', junkChance: 0.15, specialChance: 0.01, specialTable: 'dt_fish_special', requirements: [], realm: 'melvor', expansion: 'base' },
  { id: 'coast', name: '礁石海岸', icon: '🌊', junkChance: 0.1, specialChance: 0.01, specialTable: 'dt_fish_special', requirements: [], realm: 'melvor', expansion: 'base' },
  { id: 'deep', name: '深海渔场', icon: '🐋', junkChance: 0.05, specialChance: 0.015, specialTable: 'dt_fish_special', requirements: [{ type: 'skill', skill: 'fishing', level: 60 }], realm: 'melvor', expansion: 'base' },
  { id: 'cave', name: '幽暗洞穴湖', icon: '🕳️', junkChance: 0.05, specialChance: 0.02, specialTable: 'dt_fish_special', requirements: [{ type: 'dungeon', id: 'dg_frozen_cove' }], realm: 'melvor', expansion: 'base' },
  { id: 'glacier', name: '永冻冰河', icon: '🧊', junkChance: 0.03, specialChance: 0.02, specialTable: 'dt_fish_glacier', requirements: [{ type: 'skill', skill: 'fishing', level: 100 }], realm: 'melvor', expansion: 'toth' },
  { id: 'abyss_sea', name: '深渊之海', icon: '🌑', junkChance: 0.02, specialChance: 0.02, specialTable: 'dt_fish_abyss', requirements: [{ type: 'realm', realm: 'abyssal' }], realm: 'abyssal', expansion: 'ita' },
];
for (const f of FISH) {
  addAction({
    id: `fish_${f.id}`, skill: 'fishing', name: f.name, icon: '🐟', category: f.area,
    level: f.level, abyssalLevel: f.abyssal, realm: f.realm, interval: f.min, intervalMax: f.max, xp: f.xp, abyssalXp: f.abyssal ? Math.round(f.xp * 0.6) : undefined,
    inputs: [], outputs: [{ id: rawFishId(f.id), qty: 1 }], expansion: f.exp,
  });
}
addDropTable({ id: 'dt_fish_junk', entries: [
  { id: 'old_boot', min: 1, max: 1, weight: 25 }, { id: 'seaweed', min: 1, max: 1, weight: 30 },
  { id: 'rusty_can', min: 1, max: 1, weight: 25 }, { id: 'driftwood', min: 1, max: 1, weight: 20 },
] });
addDropTable({ id: 'dt_fish_special', entries: [
  { id: 'treasure_chest', min: 1, max: 1, weight: 20 }, { id: gemId('topaz'), min: 1, max: 1, weight: 25 },
  { id: gemId('sapphire'), min: 1, max: 1, weight: 15 }, { id: gemId('ruby'), min: 1, max: 1, weight: 12 },
  { id: gemId('emerald'), min: 1, max: 1, weight: 8 }, { id: gemId('diamond'), min: 1, max: 1, weight: 4 },
  { id: 'mysterious_stone', min: 1, max: 1, weight: 1 },
] });
addDropTable({ id: 'dt_fish_glacier', entries: [
  { id: 'frozen_pearl', min: 1, max: 1, weight: 20 }, { id: 'treasure_chest', min: 1, max: 2, weight: 40 }, { id: gemId('onyx'), min: 1, max: 1, weight: 5 },
] });
addDropTable({ id: 'dt_fish_abyss', entries: [
  { id: 'abyssal_shard', min: 1, max: 3, weight: 40 }, { id: gemId('voidgem'), min: 1, max: 1, weight: 4 }, { id: 'treasure_chest', min: 1, max: 3, weight: 30 },
] });
addDropTable({ id: 'dt_treasure_chest', rolls: 2, entries: [
  { id: 'coin_pouch', min: 1, max: 3, weight: 30 }, { id: gemId('sapphire'), min: 1, max: 2, weight: 15 }, { id: gemId('ruby'), min: 1, max: 2, weight: 12 },
  { id: gemId('emerald'), min: 1, max: 1, weight: 8 }, { id: gemId('diamond'), min: 1, max: 1, weight: 4 }, { id: 'rune_nature', min: 10, max: 40, weight: 15 },
  { id: 'rune_death', min: 5, max: 20, weight: 8 }, { id: 'bar_mithril', min: 2, max: 6, weight: 10 }, { id: 'bar_adamant', min: 1, max: 4, weight: 6 },
  { id: 'weird_gloop', min: 1, max: 1, weight: 2 }, { id: 'herb_sack', min: 1, max: 2, weight: 10 },
] });
addDropTable({ id: 'dt_coin_pouch', entries: [{ id: '$gp', min: 50, max: 500, weight: 1 }] });
addDropTable({ id: 'dt_herb_sack', rolls: 2, entries: HERBS.filter((h) => h.exp === 'base').map((h, i) => ({ id: `herb_${h.id}`, min: 1, max: 3, weight: 10 - i })) });
addDropTable({ id: 'dt_gem_pouch', entries: GEMS.filter((g) => g.weight > 0).map((g) => ({ id: gemId(g.id), min: 1, max: 1, weight: g.weight })) });

// --------------------------------------------------------------------------- 采矿
for (const o of ORES) {
  addAction({
    id: `mine_${o.id}`, skill: 'mining', name: o.isEssence ? `${o.name}矿脉` : `${o.name}`, icon: o.isEssence ? '💠' : '⛰️',
    level: o.level, abyssalLevel: o.abyssal, realm: o.realm, interval: o.interval, xp: o.xp, abyssalXp: o.abyssal ? Math.round(o.xp * 0.6) : undefined,
    inputs: [], outputs: [{ id: oreId(o.id), qty: 1 }],
    data: { rockHp: o.rockHp, respawn: o.respawn, isEssence: !!o.isEssence },
    requirements: o.id === 'dragonite' ? [{ type: 'dungeon', id: 'dg_dragon_den' }] : o.id === 'starfall' ? [{ type: 'dungeon', id: 'dg_herald_gate' }] : [],
    extraDrops: [{ id: 'mysterious_stone', chance: 0.0002 }],
    expansion: o.exp,
  });
}

// --------------------------------------------------------------------------- 偷窃
interface NpcCfg { id: string; name: string; icon: string; level: number; abyssal?: number; perception: number; xp: number; maxHit: number; gp: number; area: string; table: [string, number, number, number][]; unique: { id: string; name: string; icon: string; chance: number; desc: string; equip?: any }; exp: ExpansionId; realm: Realm }
export const THIEVING_AREAS = [
  { id: 'village', name: '宁静村庄', icon: '🏡', unique: { id: 'lucky_clover', chance: 1 / 4000 }, exp: 'base' as ExpansionId },
  { id: 'market', name: '繁华集市', icon: '🏪', unique: { id: 'merchants_ledger', chance: 1 / 4000 }, exp: 'base' as ExpansionId },
  { id: 'castle', name: '王城', icon: '🏰', unique: { id: 'royal_signet', chance: 1 / 5000 }, exp: 'base' as ExpansionId },
  { id: 'towers', name: '法师之塔', icon: '🗼', unique: { id: 'arcane_lens', chance: 1 / 5000 }, exp: 'base' as ExpansionId },
  { id: 'heraldry', name: '使者圣殿', icon: '⛪', unique: { id: 'herald_relic', chance: 1 / 6000 }, exp: 'toth' as ExpansionId },
  { id: 'abyss_bazaar', name: '深渊黑市', icon: '🌒', unique: { id: 'void_charm', chance: 1 / 6000 }, exp: 'ita' as ExpansionId },
];
addItem({ id: 'lucky_clover', name: '幸运四叶草', type: 'equipment', icon: '☘️', color: '#27ae60', sellPrice: 2000, category: '装备', rarity: 2, description: '全局金币 +3%，稀有掉落几率 +5%',
  equipment: { slot: 'passive', requirements: [], stats: {}, modifiers: { gpGlobal: 3, rareDropChance: 5 } } });
addItem({ id: 'merchants_ledger', name: '商人账本', type: 'equipment', icon: '📒', color: '#d4ac0d', sellPrice: 3000, category: '装备', rarity: 2, description: '出售物品价格 +5%',
  equipment: { slot: 'passive', requirements: [], stats: {}, modifiers: { sellPrice: 5 } } });
addItem({ id: 'royal_signet', name: '王室印戒', type: 'equipment', icon: '💍', color: '#f1c40f', sellPrice: 8000, category: '装备', rarity: 2, description: '偷窃金币 +15%，潜行 +40',
  equipment: { slot: 'ring', requirements: [{ skill: 'thieving', level: 45 }], stats: { magicDefence: 5 }, modifiers: { 'gpGlobal:thieving': 15, thievingStealth: 40 } } });
addItem({ id: 'arcane_lens', name: '奥术透镜', type: 'equipment', icon: '🔍', color: '#5dade2', sellPrice: 9000, category: '装备', rarity: 2, description: '符文节省 +10%，魔法命中 +5%',
  equipment: { slot: 'passive', requirements: [], stats: {}, modifiers: { runePreservation: 10, magicAccuracy: 5 } } });
addItem({ id: 'herald_relic', name: '使者圣物', type: 'equipment', icon: '🏺', color: '#f5b041', sellPrice: 20000, category: '装备', expansion: 'toth', rarity: 3, description: '全技能经验 +4%',
  equipment: { slot: 'passive', requirements: [], stats: {}, modifiers: { skillXP: 4 } } });
addItem({ id: 'void_charm', name: '虚空护符', type: 'equipment', icon: '🧿', color: '#6c3483', sellPrice: 40000, category: '装备', expansion: 'ita', rarity: 3, description: '深渊经验 +6%，深渊抗性 +3',
  equipment: { slot: 'amulet', realm: 'abyssal', requirements: [{ skill: 'thieving', level: 99 }], stats: { abyssalResistance: 3, magicAttack: 20 }, modifiers: { abyssalXP: 6 } } });

const NPCS: NpcCfg[] = [
  { id: 'farmer', name: '农夫', icon: '👨‍🌾', level: 1, perception: 10, xp: 5, maxHit: 10, gp: 10, area: 'village', exp: 'base', realm: 'melvor',
    table: [['seed_potato', 1, 4, 30], ['seed_onion', 1, 4, 25], ['seed_cabbage', 1, 3, 20], ['seed_wheat', 1, 3, 15], ['seed_tomato', 1, 2, 10]], unique: { id: 'farmers_hat', name: '农夫草帽', icon: '👒', chance: 1 / 500, desc: '农业经验 +5%', equip: { slot: 'helmet', mods: { 'skillXP:farming': 5 } } } },
  { id: 'villager', name: '村民', icon: '🧑', level: 5, perception: 20, xp: 8, maxHit: 15, gp: 25, area: 'village', exp: 'base', realm: 'melvor',
    table: [['egg', 1, 3, 30], ['milk', 1, 2, 25], ['bread', 1, 2, 20], ['feather', 5, 15, 25]], unique: { id: 'villager_scarf', name: '村民围巾', icon: '🧣', chance: 1 / 500, desc: '偷窃耗时 -3%', equip: { slot: 'cape', mods: { 'skillInterval:thieving': -3 } } } },
  { id: 'fisher', name: '渔夫', icon: '🎣', level: 12, perception: 35, xp: 12, maxHit: 25, gp: 40, area: 'village', exp: 'base', realm: 'melvor',
    table: [['raw_trout', 1, 3, 40], ['raw_salmon', 1, 2, 30], ['feather', 10, 30, 30]], unique: { id: 'old_fishing_hat', name: '老渔夫帽', icon: '🎩', chance: 1 / 600, desc: '钓鱼特殊物品几率 +2%', equip: { slot: 'helmet', mods: { fishingSpecialChance: 2 } } } },
  { id: 'pickpocket', name: '扒手', icon: '🦹', level: 20, perception: 55, xp: 18, maxHit: 35, gp: 70, area: 'market', exp: 'base', realm: 'melvor',
    table: [['coin_pouch', 1, 1, 40], [gemId('topaz'), 1, 1, 10], ['rune_mind', 5, 20, 30], ['rune_body', 3, 10, 20]], unique: { id: 'thief_mask', name: '盗贼面罩', icon: '🎭', chance: 1 / 800, desc: '潜行 +20', equip: { slot: 'helmet', mods: { thievingStealth: 20 } } } },
  { id: 'guard', name: '集市卫兵', icon: '💂', level: 30, perception: 80, xp: 26, maxHit: 50, gp: 100, area: 'market', exp: 'base', realm: 'melvor',
    table: [['bar_iron', 1, 3, 30], ['bar_steel', 1, 2, 25], ['steel_arrows', 5, 20, 25], ['food_lobster', 1, 2, 20]], unique: { id: 'guard_badge', name: '卫兵徽章', icon: '📛', chance: 1 / 800, desc: '伤害减免 +1%', equip: { slot: 'passive', mods: { damageReductionFlat: 1 } } } },
  { id: 'merchant', name: '商人', icon: '🧔', level: 40, perception: 110, xp: 35, maxHit: 45, gp: 200, area: 'market', exp: 'base', realm: 'melvor',
    table: [['coin_pouch', 1, 3, 40], ['gem_pouch', 1, 1, 15], [gemId('sapphire'), 1, 1, 15], ['leather', 2, 6, 30]], unique: { id: 'merchant_purse', name: '商人钱囊', icon: '👛', chance: 1 / 1000, desc: '全局金币 +2%', equip: { slot: 'passive', mods: { gpGlobal: 2 } } } },
  { id: 'knight', name: '骑士', icon: '🤺', level: 50, perception: 150, xp: 45, maxHit: 80, gp: 260, area: 'castle', exp: 'base', realm: 'melvor',
    table: [['bar_mithril', 1, 3, 30], ['mithril_arrows', 5, 20, 25], ['food_swordfish', 1, 2, 25], [gemId('ruby'), 1, 1, 20]], unique: { id: 'knight_sigil', name: '骑士纹章', icon: '🛡️', chance: 1 / 1000, desc: '近战命中 +4%', equip: { slot: 'passive', mods: { meleeAccuracy: 4 } } } },
  { id: 'wizard', name: '巫师', icon: '🧙', level: 55, perception: 170, xp: 52, maxHit: 70, gp: 220, area: 'towers', exp: 'base', realm: 'melvor',
    table: [['rune_chaos', 5, 25, 30], ['rune_nature', 5, 20, 25], ['rune_death', 3, 12, 20], ['rune_blood', 2, 8, 15], ['rune_essence', 20, 60, 10]], unique: { id: 'wizard_tome', name: '巫师典籍', icon: '📕', chance: 1 / 1000, desc: '魔法最大伤害 +3%', equip: { slot: 'passive', mods: { magicMaxHit: 3 } } } },
  { id: 'priest', name: '牧师', icon: '⛪', level: 60, perception: 200, xp: 60, maxHit: 60, gp: 240, area: 'towers', exp: 'base', realm: 'melvor',
    table: [['herb_sack', 1, 1, 30], ['seed_starherb', 1, 2, 15], ['seed_ghostcap', 1, 2, 20], ['big_bones', 3, 8, 25], ['dragon_bones', 1, 3, 10]], unique: { id: 'priest_rosary', name: '牧师念珠', icon: '📿', chance: 1 / 1200, desc: '祈祷点节省 +10%', equip: { slot: 'passive', mods: { prayerPreservation: 10 } } } },
  { id: 'noble', name: '贵族', icon: '🤴', level: 70, perception: 260, xp: 75, maxHit: 90, gp: 500, area: 'castle', exp: 'base', realm: 'melvor',
    table: [['gem_pouch', 1, 2, 30], [gemId('emerald'), 1, 1, 20], [gemId('diamond'), 1, 1, 10], ['coin_pouch', 2, 5, 40]], unique: { id: 'noble_monocle', name: '贵族单片镜', icon: '🧐', chance: 1 / 1500, desc: '稀有掉落几率 +5%', equip: { slot: 'helmet', mods: { rareDropChance: 5 } } } },
  { id: 'royal_guard', name: '王室侍卫', icon: '👮', level: 80, perception: 320, xp: 90, maxHit: 130, gp: 600, area: 'castle', exp: 'base', realm: 'melvor',
    table: [['bar_rune', 1, 2, 30], ['rune_arrows', 5, 15, 25], ['food_shark', 1, 3, 25], ['bar_adamant', 1, 3, 20]], unique: { id: 'royal_cape', name: '王室披风', icon: '🧣', chance: 1 / 2000, desc: '全部伤害 +3%', equip: { slot: 'cape', mods: { maxHit: 3 } } } },
  { id: 'dragon_scholar', name: '龙族学者', icon: '🐲', level: 90, perception: 400, xp: 115, maxHit: 150, gp: 900, area: 'towers', exp: 'base', realm: 'melvor',
    table: [['hide_black', 1, 2, 25], ['dragon_bones', 2, 5, 30], ['rune_ancient', 3, 10, 25], ['ore_dragonite', 1, 2, 20]], unique: { id: 'dragon_codex', name: '龙语法典', icon: '📘', chance: 1 / 2500, desc: '对龙类伤害 +5%（全部伤害 +2%）、魔法命中 +5%', equip: { slot: 'passive', mods: { maxHit: 2, magicAccuracy: 5 } } } },
  { id: 'herald_priest', name: '使者祭司', icon: '🧝', level: 105, perception: 550, xp: 160, maxHit: 220, gp: 1500, area: 'heraldry', exp: 'toth', realm: 'melvor',
    table: [['herb_heraldbloom', 1, 2, 30], ['seed_heraldbloom', 1, 1, 15], ['rune_havoc', 5, 15, 30], ['ore_starfall', 1, 3, 25]], unique: { id: 'herald_vestment', name: '使者圣袍', icon: '🥻', chance: 1 / 3000, desc: '全技能掌握度经验 +5%', equip: { slot: 'body', mods: { masteryXP: 5 } } } },
  { id: 'sky_warden', name: '天穹守卫', icon: '🦅', level: 115, perception: 680, xp: 200, maxHit: 280, gp: 2200, area: 'heraldry', exp: 'toth', realm: 'melvor',
    table: [['bar_starfall', 1, 2, 35], ['ore_celestium', 1, 2, 25], [gemId('onyx'), 1, 1, 10], ['elder_bones', 1, 3, 30]], unique: { id: 'warden_wings', name: '守卫之翼', icon: '🪽', chance: 1 / 3500, desc: '技能耗时 -2%', equip: { slot: 'cape', mods: { skillInterval: -2 } } } },
  { id: 'abyss_wanderer', name: '深渊流浪者', icon: '🧟', level: 99, abyssal: 1, perception: 800, xp: 260, maxHit: 350, gp: 0, area: 'abyss_bazaar', exp: 'ita', realm: 'abyssal',
    table: [['abyssal_shard', 1, 3, 40], ['rune_void', 5, 15, 30], ['void_ashes', 1, 2, 30]], unique: { id: 'wanderer_hood', name: '流浪者兜帽', icon: '🥷', chance: 1 / 4000, desc: '深渊潜行 +50', equip: { slot: 'helmet', mods: { thievingStealth: 50 } } } },
  { id: 'void_trader', name: '虚空商人', icon: '🧞', level: 99, abyssal: 20, perception: 1000, xp: 360, maxHit: 450, gp: 0, area: 'abyss_bazaar', exp: 'ita', realm: 'abyssal',
    table: [['ore_void', 1, 3, 35], ['bar_void', 1, 2, 25], [gemId('voidgem'), 1, 1, 5], ['abyssal_shard', 2, 5, 35]], unique: { id: 'trader_scale', name: '虚空天平', icon: '⚖️', chance: 1 / 5000, desc: '深渊碎片获取 +10%', equip: { slot: 'passive', mods: { abyssalPieces: 10 } } } },
  { id: 'corrupt_noble', name: '腐化贵族', icon: '🧛', level: 99, abyssal: 40, perception: 1250, xp: 480, maxHit: 600, gp: 0, area: 'abyss_bazaar', exp: 'ita', realm: 'abyssal',
    table: [['bar_abyssal', 1, 2, 30], ['abyssal_ashes', 1, 2, 30], ['rune_abyssal', 5, 15, 40]], unique: { id: 'noble_bloodgem', name: '血色宝珠', icon: '🩸', chance: 1 / 6000, desc: '生命偷取 +2%', equip: { slot: 'gem', mods: { lifesteal: 2 } } } },
];

addItem({ id: 'bread', name: '面包', type: 'food', icon: '🍞', sellPrice: 6, category: '食物', healsFor: 60 });

for (const n of NPCS) {
  const u = n.unique;
  addItem({ id: u.id, name: u.name, type: 'equipment', icon: u.icon, sellPrice: 500 + n.level * 50, category: '装备', expansion: n.exp, rarity: 2, description: u.desc,
    equipment: { slot: u.equip.slot, realm: n.realm, requirements: [], stats: {}, modifiers: u.equip.mods } });
  addDropTable({ id: `dt_thieve_${n.id}`, entries: n.table.map(([id, min, max, w]) => ({ id, min, max, weight: w })) });
  const area = THIEVING_AREAS.find((a) => a.id === n.area)!;
  addAction({
    id: `thieve_${n.id}`, skill: 'thieving', name: n.name, icon: n.icon, category: n.area,
    level: n.level, abyssalLevel: n.abyssal, realm: n.realm, interval: 3000, xp: n.xp, abyssalXp: n.abyssal ? Math.round(n.xp * 0.6) : undefined,
    inputs: [], outputs: [], expansion: n.exp,
    data: { perception: n.perception, maxHit: n.maxHit, gpMax: n.gp, table: `dt_thieve_${n.id}`, unique: { id: u.id, chance: u.chance }, areaUnique: area.unique, abyssalPiecesMax: n.realm === 'abyssal' ? Math.round(n.xp / 20) : 0 },
  });
  noteSource(u.id, `偷窃：${n.name}`);
}

// --------------------------------------------------------------------------- 收割（Into the Abyss）
const VEINS = [
  { id: 'gloomcap', name: '幽暗菌脉', level: 1, xp: 120, items: [['herb_voidroot', 1], ['abyssal_shard', 0.3]] },
  { id: 'voidcrystal', name: '虚空晶脉', level: 10, xp: 180, items: [['ore_void', 1], ['abyssal_shard', 0.5]] },
  { id: 'shadowvine', name: '暗影藤', level: 20, xp: 240, items: [['log_shadowwood', 1], ['seed_voidroot', 0.2]] },
  { id: 'bloodbloom', name: '血色花脉', level: 30, xp: 310, items: [['hide_void', 1], ['abyssal_ashes', 0.2]] },
  { id: 'starvein', name: '星辰矿脉', level: 40, xp: 400, items: [['ore_netherite', 1], ['abyssal_stardust', 0.1]] },
  { id: 'soulspring', name: '灵魂泉眼', level: 50, xp: 520, items: [['rune_soul', 5], [gemId('voidgem'), 0.05]] },
];
for (const v of VEINS) {
  addAction({
    id: `harvest_${v.id}`, skill: 'harvesting', name: v.name, icon: '🌾', level: v.level, realm: 'abyssal',
    interval: 3000, xp: v.xp, inputs: [], outputs: [{ id: v.items[0][0] as string, qty: v.items[0][1] as number }],
    data: { maxIntensity: 10000, rare: { id: v.items[1][0], weight: v.items[1][1] } }, expansion: 'ita',
    requirements: [{ type: 'realm', realm: 'abyssal' }],
  });
}
