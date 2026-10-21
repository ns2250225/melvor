// 战斗内容：特殊攻击、首领独特装备、怪物与掉落表
import { addSpecial, addMonster, addDropTable, addItem } from '../registry';
import type { AttackType, ExpansionId, Realm, Stats, ModifierMap, EquipSlot, SkillId } from '@/game/core/types';

// --------------------------------------------------------------------------- 特殊攻击
const SA: [string, string, string, number, Partial<{ dmg: number; hits: number; life: number; eff: any[]; sure: boolean }>][] = [
  ['sa_double', '双重打击', '连续攻击两次', 20, { hits: 2, dmg: 1 }],
  ['sa_heavy', '重击', '造成 150% 伤害', 15, { dmg: 1.5 }],
  ['sa_crush', '碾压', '造成 200% 伤害', 10, { dmg: 2 }],
  ['sa_triple', '三连击', '连续攻击三次，每次 70% 伤害', 15, { hits: 3, dmg: 0.7 }],
  ['sa_poison', '剧毒之牙', '命中时施加中毒', 25, { dmg: 1, eff: [{ kind: 'poison', chance: 1, turns: 5, value: 0.1 }] }],
  ['sa_burn', '烈焰', '命中时施加燃烧', 25, { dmg: 1, eff: [{ kind: 'burn', chance: 1, turns: 4, value: 0.15 }] }],
  ['sa_bleed', '撕裂', '命中时施加流血', 25, { dmg: 1, eff: [{ kind: 'bleed', chance: 1, turns: 6, value: 0.08 }] }],
  ['sa_stun', '震慑', '命中时击晕目标 1 回合', 15, { dmg: 1, eff: [{ kind: 'stun', chance: 1, turns: 1 }] }],
  ['sa_freeze', '冰封', '命中时冻结目标 1 回合', 15, { dmg: 1.2, eff: [{ kind: 'freeze', chance: 1, turns: 1 }] }],
  ['sa_sleep', '催眠', '使目标沉睡 1 回合', 10, { dmg: 0.5, eff: [{ kind: 'sleep', chance: 1, turns: 1 }] }],
  ['sa_drain', '吸血', '造成伤害并回复 50% 伤害的生命', 20, { dmg: 1, life: 0.5 }],
  ['sa_weaken', '削弱', '降低目标 15% 最大伤害，持续 3 回合', 20, { dmg: 1, eff: [{ kind: 'weaken', chance: 1, turns: 3, value: 15 }] }],
  ['sa_blind', '致盲', '降低目标 20% 命中，持续 3 回合', 20, { dmg: 0.8, eff: [{ kind: 'blind', chance: 1, turns: 3, value: 20 }] }],
  ['sa_slow', '迟缓', '目标攻击间隔 +20%，持续 3 回合', 20, { dmg: 1, eff: [{ kind: 'slow', chance: 1, turns: 3, value: 20 }] }],
  ['sa_dragonfire', '龙息', '必中，造成 140% 伤害并燃烧', 20, { dmg: 1.4, sure: true, eff: [{ kind: 'burn', chance: 1, turns: 3, value: 0.2 }] }],
  ['sa_frostbreath', '寒冰吐息', '必中，造成 120% 伤害并减速', 20, { dmg: 1.2, sure: true, eff: [{ kind: 'slow', chance: 1, turns: 3, value: 25 }] }],
  ['sa_regen', '再生', '为自身施加持续回复', 15, { dmg: 0.6, eff: [{ kind: 'regen', chance: 1, turns: 5, value: 0.05, target: 'self' }] }],
  ['sa_shield', '石肤', '自身伤害减免 +20%，持续 3 回合', 15, { dmg: 0.7, eff: [{ kind: 'shield', chance: 1, turns: 3, value: 20, target: 'self' }] }],
  ['sa_curse', '诅咒', '目标闪避 -25%，持续 4 回合', 20, { dmg: 0.8, eff: [{ kind: 'curse', chance: 1, turns: 4, value: 25 }] }],
  ['sa_vuln', '破绽', '目标受到伤害 +20%，持续 3 回合', 20, { dmg: 1, eff: [{ kind: 'vulnerable', chance: 1, turns: 3, value: 20 }] }],
  ['sa_void', '虚空打击', '必中，造成 160% 伤害', 20, { dmg: 1.6, sure: true }],
  ['sa_corrupt', '腐化侵蚀', '施加腐化：每回合损失生命并降低命中', 20, { dmg: 1, eff: [{ kind: 'corruption', chance: 1, turns: 4, value: 0.12 }] }],
  ['sa_annihilate', '湮灭', '造成 250% 伤害', 8, { dmg: 2.5 }],
  // 玩家武器特殊攻击
  ['ps_lifesteal', '噬魂', '25% 几率吸取 30% 伤害', 25, { dmg: 1, life: 0.3 }],
  ['ps_double', '疾风连斩', '20% 几率攻击两次', 20, { hits: 2, dmg: 1 }],
  ['ps_freeze', '霜冻新星', '15% 几率冻结敌人', 15, { dmg: 1.1, eff: [{ kind: 'freeze', chance: 1, turns: 1 }] }],
  ['ps_burn', '炎爆', '25% 几率燃烧敌人', 25, { dmg: 1, eff: [{ kind: 'burn', chance: 1, turns: 4, value: 0.15 }] }],
  ['ps_bleed', '血刃', '25% 几率使敌人流血', 25, { dmg: 1, eff: [{ kind: 'bleed', chance: 1, turns: 6, value: 0.1 }] }],
  ['ps_execute', '处决', '10% 几率造成 300% 伤害', 10, { dmg: 3 }],
  ['ps_stun', '雷霆一击', '15% 几率击晕敌人', 15, { dmg: 1.2, eff: [{ kind: 'stun', chance: 1, turns: 1 }] }],
  ['ps_triple', '三重射击', '15% 几率连射三箭', 15, { hits: 3, dmg: 0.8 }],
];
for (const [id, name, description, chance, o] of SA) {
  addSpecial({ id, name, description, chance, damageMultiplier: o.dmg ?? 1, hits: o.hits, lifesteal: o.life, minAccuracyBoost: o.sure, effects: o.eff });
}

// --------------------------------------------------------------------------- 首领独特装备
interface UniqueCfg { id: string; name: string; icon: string; slot: EquipSlot; type?: 'weapon'; attackType?: AttackType; twoHanded?: boolean; ammoType?: any; lvl: number; skill: SkillId; abyssal?: number; stats: Stats; mods?: ModifierMap; specials?: string[]; desc: string; exp: ExpansionId; realm?: Realm; rarity?: 1 | 2 | 3; providesRunes?: string[] }
export const UNIQUES: UniqueCfg[] = [
  { id: 'golden_egg', name: '金蛋', icon: '🥚', slot: 'passive', lvl: 1, skill: 'attack', stats: {}, mods: { gpGlobal: 3 }, desc: '全局金币 +3%', exp: 'base' },
  { id: 'grave_scythe', name: '亡灵镰刀', icon: '🪦', slot: 'weapon', type: 'weapon', attackType: 'melee', twoHanded: true, lvl: 30, skill: 'attack', stats: { attackSpeed: 3000, slashAttack: 70, stabAttack: 30, blockAttack: 20, meleeStrength: 72 }, specials: ['ps_lifesteal'], desc: '25% 几率吸取生命', exp: 'base' },
  { id: 'silk_gloves', name: '蛛丝手套', icon: '🧤', slot: 'gloves', lvl: 25, skill: 'defence', stats: { stabAttack: 12, slashAttack: 12, rangedAttack: 12, meleeDefence: 8, rangedDefence: 8 }, mods: { meleeAccuracy: 3, rangedAccuracy: 3 }, desc: '命中 +3%', exp: 'base' },
  { id: 'frost_staff', name: '霜冻法杖', icon: '❄️', slot: 'weapon', type: 'weapon', attackType: 'magic', twoHanded: true, lvl: 45, skill: 'magic', stats: { attackSpeed: 2400, magicAttack: 60, magicDamage: 12, magicDefence: 15 }, specials: ['ps_freeze'], providesRunes: ['rune_water'], desc: '提供无限水之符文，15% 几率冻结', exp: 'base' },
  { id: 'ghost_cutlass', name: '幽灵弯刀', icon: '👻', slot: 'weapon', type: 'weapon', attackType: 'melee', lvl: 40, skill: 'attack', stats: { attackSpeed: 2400, slashAttack: 62, stabAttack: 30, meleeStrength: 58 }, specials: ['ps_double'], desc: '20% 几率攻击两次', exp: 'base' },
  { id: 'bandit_ring', name: '盗贼王之戒', icon: '💍', slot: 'ring', lvl: 40, skill: 'defence', stats: { meleeStrength: 6, rangedStrength: 6 }, mods: { combatGP: 25, 'gpGlobal:thieving': 10 }, desc: '战斗金币 +25%，偷窃金币 +10%', exp: 'base' },
  { id: 'flame_bow', name: '烈焰长弓', icon: '🏹', slot: 'weapon', type: 'weapon', attackType: 'ranged', twoHanded: true, ammoType: 'arrow', lvl: 55, skill: 'ranged', stats: { attackSpeed: 2600, rangedAttack: 95, rangedStrength: 20 }, specials: ['ps_burn'], desc: '25% 几率燃烧敌人', exp: 'base' },
  { id: 'archmage_hat', name: '大法师之帽', icon: '🎩', slot: 'helmet', lvl: 60, skill: 'magic', stats: { magicAttack: 25, magicDamage: 8, magicDefence: 25 }, mods: { runePreservation: 10 }, desc: '魔法伤害 +8%，符文节省 +10%', exp: 'base' },
  { id: 'dragon_scale_shield', name: '龙鳞盾', icon: '🛡️', slot: 'shield', lvl: 65, skill: 'defence', stats: { meleeDefence: 90, rangedDefence: 90, magicDefence: 60, damageReduction: 8 }, mods: { burnImmunity: 1 }, desc: '免疫燃烧', exp: 'base' },
  { id: 'dragon_claws', name: '龙爪', icon: '🐾', slot: 'weapon', type: 'weapon', attackType: 'melee', lvl: 65, skill: 'attack', stats: { attackSpeed: 2200, slashAttack: 105, stabAttack: 80, meleeStrength: 95 }, specials: ['ps_triple'], desc: '15% 几率三连击', exp: 'base' },
  { id: 'crystal_platebody', name: '晶核板甲', icon: '💠', slot: 'body', lvl: 70, skill: 'defence', stats: { meleeDefence: 120, rangedDefence: 120, magicDefence: 60, damageReduction: 12 }, mods: { reflectDamage: 5 }, desc: '反弹 5% 伤害', exp: 'base' },
  { id: 'infernal_cape', name: '炼狱披风', icon: '🧣', slot: 'cape', lvl: 75, skill: 'defence', stats: { meleeStrength: 20, meleeDefence: 25, rangedDefence: 25, magicDefence: 25, damageReduction: 4 }, mods: { meleeMaxHit: 5 }, desc: '近战伤害 +5%', exp: 'base' },
  { id: 'air_god_boots', name: '风神之靴', icon: '🥾', slot: 'boots', lvl: 80, skill: 'defence', stats: { meleeDefence: 30, rangedDefence: 30, magicDefence: 30, damageReduction: 3 }, mods: { attackInterval: -5 }, desc: '攻击间隔 -5%', exp: 'base' },
  { id: 'water_god_amulet', name: '水神护符', icon: '📿', slot: 'amulet', lvl: 80, skill: 'magic', stats: { magicAttack: 30, magicDamage: 10, magicDefence: 20 }, mods: { hpRegen: 100 }, desc: '生命回复 +100%', exp: 'base' },
  { id: 'earth_god_shield', name: '地神之盾', icon: '🛡️', slot: 'shield', lvl: 80, skill: 'defence', stats: { meleeDefence: 130, rangedDefence: 130, magicDefence: 90, damageReduction: 10 }, desc: '高额伤害减免', exp: 'base' },
  { id: 'fire_god_sword', name: '火神之剑', icon: '🗡️', slot: 'weapon', type: 'weapon', attackType: 'melee', twoHanded: true, lvl: 80, skill: 'attack', stats: { attackSpeed: 3200, slashAttack: 160, stabAttack: 80, meleeStrength: 170 }, specials: ['ps_burn'], desc: '25% 几率燃烧', exp: 'base' },
  { id: 'chaos_blade', name: '混沌之刃', icon: '⚔️', slot: 'weapon', type: 'weapon', attackType: 'melee', lvl: 90, skill: 'attack', stats: { attackSpeed: 2400, slashAttack: 165, stabAttack: 140, meleeStrength: 160 }, specials: ['ps_execute', 'ps_bleed'], desc: '处决与血刃特殊攻击', exp: 'base', rarity: 3 },
  { id: 'chaos_bow', name: '混沌之弓', icon: '🏹', slot: 'weapon', type: 'weapon', attackType: 'ranged', twoHanded: true, ammoType: 'arrow', lvl: 90, skill: 'ranged', stats: { attackSpeed: 2400, rangedAttack: 175, rangedStrength: 35 }, specials: ['ps_triple'], desc: '15% 几率三重射击', exp: 'base', rarity: 3 },
  { id: 'chaos_wand', name: '混沌魔杖', icon: '🪄', slot: 'weapon', type: 'weapon', attackType: 'magic', lvl: 90, skill: 'magic', stats: { attackSpeed: 2200, magicAttack: 120, magicDamage: 30 }, specials: ['ps_stun'], desc: '15% 几率击晕', exp: 'base', rarity: 3 },
  { id: 'chaos_helm', name: '混沌战盔', icon: '⛑️', slot: 'helmet', lvl: 90, skill: 'defence', stats: { meleeDefence: 70, rangedDefence: 70, magicDefence: 70, damageReduction: 6 }, mods: { maxHit: 3 }, desc: '最大伤害 +3%', exp: 'base', rarity: 3 },
  { id: 'basilisk_scale', name: '蛇怪鳞片', icon: '🐍', slot: 'passive', lvl: 1, skill: 'slayer', stats: {}, mods: { poisonImmunity: 1, damageReductionFlat: 2 }, desc: '免疫中毒，伤害减免 +2%', exp: 'base' },
  { id: 'shadow_fang', name: '暗影獠牙', icon: '🦷', slot: 'weapon', type: 'weapon', attackType: 'melee', lvl: 55, skill: 'attack', stats: { attackSpeed: 2000, stabAttack: 85, slashAttack: 40, meleeStrength: 70 }, specials: ['ps_bleed'], desc: '25% 几率流血', exp: 'base' },
  // Throne of the Herald
  { id: 'herald_greatsword', name: '使者巨剑', icon: '🗡️', slot: 'weapon', type: 'weapon', attackType: 'melee', twoHanded: true, lvl: 105, skill: 'attack', stats: { attackSpeed: 3200, slashAttack: 240, stabAttack: 120, meleeStrength: 250 }, specials: ['ps_execute'], desc: '10% 几率处决', exp: 'toth', rarity: 3 },
  { id: 'sky_bow', name: '天穹之弓', icon: '🏹', slot: 'weapon', type: 'weapon', attackType: 'ranged', twoHanded: true, ammoType: 'arrow', lvl: 105, skill: 'ranged', stats: { attackSpeed: 2400, rangedAttack: 250, rangedStrength: 50 }, specials: ['ps_triple'], desc: '15% 三重射击', exp: 'toth', rarity: 3 },
  { id: 'starlight_scepter', name: '星光权杖', icon: '🪄', slot: 'weapon', type: 'weapon', attackType: 'magic', twoHanded: true, lvl: 105, skill: 'magic', stats: { attackSpeed: 2400, magicAttack: 200, magicDamage: 45 }, specials: ['ps_freeze'], providesRunes: ['rune_air', 'rune_fire'], desc: '提供空气与火焰符文', exp: 'toth', rarity: 3 },
  { id: 'lost_world_tooth', name: '远古巨兽之牙', icon: '🦖', slot: 'amulet', lvl: 110, skill: 'strength', stats: { meleeStrength: 25, rangedStrength: 25, magicDamage: 10 }, mods: { maxHit: 4 }, desc: '最大伤害 +4%', exp: 'toth', rarity: 2 },
  { id: 'herald_crown', name: '使者王冠', icon: '👑', slot: 'helmet', lvl: 115, skill: 'defence', stats: { meleeDefence: 110, rangedDefence: 110, magicDefence: 110, damageReduction: 8 }, mods: { skillXP: 3, maxHit: 3 }, desc: '全技能经验 +3%，最大伤害 +3%', exp: 'toth', rarity: 3 },
  { id: 'herald_wings', name: '使者羽翼', icon: '🪽', slot: 'cape', lvl: 115, skill: 'defence', stats: { meleeDefence: 45, rangedDefence: 45, magicDefence: 45, damageReduction: 5 }, mods: { attackInterval: -6, evasion: 5 }, desc: '攻击间隔 -6%，闪避 +5%', exp: 'toth', rarity: 3 },
  // Into the Abyss
  { id: 'void_reaper', name: '虚空收割者', icon: '⚰️', slot: 'weapon', type: 'weapon', attackType: 'melee', twoHanded: true, lvl: 99, abyssal: 20, skill: 'attack', realm: 'abyssal', stats: { attackSpeed: 3000, slashAttack: 380, stabAttack: 200, meleeStrength: 400, abyssalResistance: 5 }, specials: ['ps_lifesteal', 'ps_execute'], desc: '深渊巨镰', exp: 'ita', rarity: 3 },
  { id: 'shadow_longbow', name: '暗影长弓', icon: '🏹', slot: 'weapon', type: 'weapon', attackType: 'ranged', twoHanded: true, ammoType: 'arrow', lvl: 99, abyssal: 20, skill: 'ranged', realm: 'abyssal', stats: { attackSpeed: 2400, rangedAttack: 400, rangedStrength: 80, abyssalResistance: 5 }, specials: ['ps_triple'], desc: '深渊长弓', exp: 'ita', rarity: 3 },
  { id: 'abyss_crown', name: '深渊王冠', icon: '👑', slot: 'helmet', lvl: 99, abyssal: 40, skill: 'defence', realm: 'abyssal', stats: { meleeDefence: 180, rangedDefence: 180, magicDefence: 180, damageReduction: 6, abyssalResistance: 12 }, mods: { abyssalXP: 5, maxHit: 4 }, desc: '深渊经验 +5%', exp: 'ita', rarity: 3 },
  { id: 'heart_of_abyss', name: '深渊之心', icon: '🖤', slot: 'passive', lvl: 99, abyssal: 50, skill: 'hitpoints', realm: 'abyssal', stats: { abyssalResistance: 10 }, mods: { maxHit: 5, lifesteal: 2, abyssalXP: 5 }, desc: '终局被动：最大伤害 +5%，生命偷取 +2%', exp: 'ita', rarity: 3 },
];
for (const u of UNIQUES) {
  const reqs: { skill: SkillId; level: number; abyssal?: boolean }[] = [{ skill: u.skill, level: u.lvl }];
  if (u.abyssal) reqs.push({ skill: u.skill, level: u.abyssal, abyssal: true });
  addItem({ id: u.id, name: u.name, type: u.type ?? 'equipment', icon: u.icon, color: '#f5b041', sellPrice: Math.round(500 * Math.pow(u.lvl + (u.abyssal ?? 0), 1.5)), category: '装备', expansion: u.exp, rarity: u.rarity ?? 2, description: u.desc,
    equipment: { slot: u.slot, attackType: u.attackType, twoHanded: u.twoHanded, ammoType: u.ammoType, requirements: reqs, stats: u.stats, modifiers: u.mods, specialAttacks: u.specials, realm: u.realm, providesRunes: u.providesRunes } });
}
// Slayer 装备（Slayer 商店出售）
addItem({ id: 'slayer_helmet', name: '猎杀头盔', type: 'equipment', icon: '🪖', sellPrice: 0, noSell: true, category: '装备', description: '猎杀任务目标伤害与命中 +8%',
  equipment: { slot: 'helmet', requirements: [{ skill: 'slayer', level: 10 }], stats: { meleeDefence: 25, rangedDefence: 25, magicDefence: 25, damageReduction: 2 }, modifiers: { slayerTaskDamage: 8, slayerTaskAccuracy: 8 } } });
addItem({ id: 'slayer_helmet_elite', name: '精英猎杀头盔', type: 'equipment', icon: '🪖', color: '#c0392b', sellPrice: 0, noSell: true, category: '装备', description: '猎杀任务目标伤害与命中 +15%，猎杀币 +10%',
  equipment: { slot: 'helmet', requirements: [{ skill: 'slayer', level: 70 }], stats: { meleeDefence: 60, rangedDefence: 60, magicDefence: 60, damageReduction: 5 }, modifiers: { slayerTaskDamage: 15, slayerTaskAccuracy: 15, slayerCoins: 10 } } });
addItem({ id: 'mirror_shield', name: '镜盾', type: 'equipment', icon: '🪞', sellPrice: 0, noSell: true, category: '装备', description: '进入「镜之洞窟」所需',
  equipment: { slot: 'shield', requirements: [{ skill: 'slayer', level: 50 }, { skill: 'defence', level: 40 }], stats: { meleeDefence: 50, rangedDefence: 50, magicDefence: 40, damageReduction: 4 }, modifiers: { stunImmunity: 1 } } });
addItem({ id: 'fire_cloak', name: '防火斗篷', type: 'equipment', icon: '🧥', sellPrice: 0, noSell: true, category: '装备', description: '进入「灼热荒原」所需，免疫燃烧',
  equipment: { slot: 'cape', requirements: [{ skill: 'slayer', level: 65 }], stats: { meleeDefence: 20, rangedDefence: 20, magicDefence: 30, damageReduction: 2 }, modifiers: { burnImmunity: 1 } } });
addItem({ id: 'gas_mask', name: '防毒面罩', type: 'equipment', icon: '😷', sellPrice: 0, noSell: true, category: '装备', description: '进入「毒雾峡谷」所需，免疫中毒',
  equipment: { slot: 'helmet', requirements: [{ skill: 'slayer', level: 80 }], stats: { meleeDefence: 35, rangedDefence: 35, magicDefence: 35, damageReduction: 3 }, modifiers: { poisonImmunity: 1 } } });
addItem({ id: 'void_lantern', name: '虚空提灯', type: 'equipment', icon: '🏮', sellPrice: 0, noSell: true, category: '装备', expansion: 'ita', description: '进入深渊猎杀区域「无光深穴」所需',
  equipment: { slot: 'passive', realm: 'abyssal', requirements: [{ skill: 'slayer', level: 99 }], stats: { abyssalResistance: 4 }, modifiers: { abyssalXP: 2 } } });
// 消耗品槽（Throne of the Herald）
for (const [id, name, mods, desc] of [
  ['charm_fury', '狂怒符咒', { maxHit: 5 }, '最大伤害 +5%（每击杀消耗 1）'],
  ['charm_ward', '守护符咒', { damageReductionFlat: 4 }, '伤害减免 +4%（每击杀消耗 1）'],
  ['charm_fortune', '财运符咒', { combatGP: 30, rareDropChance: 10 }, '战斗金币 +30%，稀有掉落 +10%（每击杀消耗 1）'],
] as [string, string, ModifierMap, string][]) {
  addItem({ id, name, type: 'consumable', icon: '🧿', color: '#f5b041', sellPrice: 50, category: '消耗品', expansion: 'toth', description: desc,
    equipment: { slot: 'consumable', requirements: [], stats: {}, modifiers: mods } });
}

// --------------------------------------------------------------------------- 怪物
type DropCfg = [string, number, number, number];
interface MonCfg {
  id: string; name: string; icon: string; L: number; type: AttackType; hp?: number; speed?: number; bonus?: number;
  drops?: DropCfg[]; dropChance?: number; bones?: string | null; gp?: [number, number]; sa?: string[]; boss?: boolean;
  exp?: ExpansionId; realm?: Realm; barrier?: number; slayer?: boolean; passives?: ModifierMap; pet?: { id: string; chance: number };
}
export function defineMonster(m: MonCfg) {
  const L = m.L;
  const b = (m.bonus ?? 1) * (m.boss ? 1.3 : 1);
  const realm = m.realm ?? 'melvor';
  const attackStat = { melee: [L, L, 1, 1], ranged: [1, 1, L, 1], magic: [1, 1, 1, L] }[m.type];
  const bonuses: Stats = {
    stabAttack: m.type === 'melee' ? Math.round(L * 0.9 * b) : 0,
    meleeStrength: m.type === 'melee' ? Math.round(L * 0.8 * b) : 0,
    rangedAttack: m.type === 'ranged' ? Math.round(L * 0.9 * b) : 0,
    rangedStrength: m.type === 'ranged' ? Math.round(L * 0.8 * b) : 0,
    magicAttack: m.type === 'magic' ? Math.round(L * 0.9 * b) : 0,
    magicDamage: m.type === 'magic' ? Math.round(L * 0.25 * b) : 0,
    meleeDefence: Math.round(L * 0.8 * b), rangedDefence: Math.round(L * 0.8 * b), magicDefence: Math.round(L * 0.7 * b),
    damageReduction: m.boss ? Math.min(40, Math.round(L / 10)) : Math.min(25, Math.round(L / 20)),
  };
  if (m.drops?.length) addDropTable({ id: `dt_mon_${m.id}`, chance: m.dropChance ?? 0.7, entries: m.drops.map(([id, min, max, weight]) => ({ id, min, max, weight })) });
  const hp = m.hp ?? Math.round(L * (m.boss ? 1.8 : 1));
  const cl = Math.floor(0.25 * (L + hp) + Math.max(0.325 * (attackStat[0] + attackStat[1]), 0.4875 * attackStat[2], 0.4875 * attackStat[3]));
  return addMonster({
    id: m.id, name: m.name, icon: m.icon, level: cl, hitpoints: hp, attack: attackStat[0], strength: attackStat[1], defence: L, ranged: attackStat[2], magic: attackStat[3],
    attackType: m.type, attackSpeed: m.speed ?? (m.boss ? 2600 : 2400), bonuses, specialAttacks: m.sa, passives: m.passives,
    drops: m.drops?.length ? `dt_mon_${m.id}` : null, bones: m.bones === undefined ? (realm === 'abyssal' ? 'void_ashes' : 'bones') : m.bones,
    gp: m.gp ?? [Math.round(L * 0.5), Math.round(L * 3)], isBoss: m.boss, slayerTaskable: m.slayer ?? !m.boss, realm,
    damageType: realm === 'abyssal' ? 'abyssal' : 'normal', barrier: m.barrier, expansion: m.exp ?? (realm === 'abyssal' ? 'ita' : 'base'), pet: m.pet,
  });
}

const H = (id: string, min: number, max: number, w: number): DropCfg => [id, min, max, w];
const herbSeeds = (tier: number): DropCfg[] => [H(`seed_${['greenleaf', 'moonwort', 'sunbloom', 'flamemoss', 'frostleaf', 'dragonroot', 'ghostcap', 'starherb', 'holyherb'][Math.min(8, tier)]}`, 1, 2, 6)];

export const MONSTERS: MonCfg[] = [
  // 农场
  { id: 'chicken', name: '鸡', icon: '🐔', L: 2, type: 'melee', drops: [H('feather', 3, 12, 50), H('raw_chicken', 1, 1, 30), H('egg', 1, 2, 20)], dropChance: 1 },
  { id: 'cow', name: '奶牛', icon: '🐄', L: 4, type: 'melee', drops: [H('cowhide', 1, 1, 50), H('raw_beef', 1, 1, 35), H('milk', 1, 1, 15)], dropChance: 1, bones: 'big_bones' },
  { id: 'boar', name: '野猪', icon: '🐗', L: 8, type: 'melee', drops: [H('raw_boar', 1, 1, 60), H('cowhide', 1, 1, 20), H('seed_potato', 1, 3, 20)], dropChance: 1, bones: 'big_bones' },
  { id: 'farmhand', name: '暴躁农工', icon: '🧑‍🌾', L: 10, type: 'melee', drops: [H('seed_onion', 1, 3, 20), H('seed_cabbage', 1, 3, 20), H('seed_wheat', 1, 3, 20), H('seed_tomato', 1, 2, 15), H('compost', 1, 3, 25)] },
  // 林间小径
  { id: 'goblin', name: '哥布林', icon: '👺', L: 6, type: 'melee', drops: [H('bronze_sword', 1, 1, 10), H('bronze_helmet', 1, 1, 10), H('rune_air', 3, 10, 40), H('rune_mind', 3, 10, 40)] },
  { id: 'wolf', name: '野狼', icon: '🐺', L: 12, type: 'melee', drops: [H('cowhide', 1, 2, 40), H('raw_beef', 1, 2, 40)], bones: 'big_bones' },
  { id: 'bandit', name: '强盗', icon: '🥷', L: 16, type: 'melee', drops: [H('coin_pouch', 1, 1, 40), H('iron_dagger', 1, 1, 15), H('iron_arrows', 5, 15, 30), H('seed_sweetcorn', 1, 2, 15)] },
  { id: 'treant', name: '树人', icon: '🌳', L: 20, type: 'melee', speed: 3000, drops: [H('log_oak', 3, 10, 40), H('log_willow', 2, 6, 30), H('seed_tree_oak', 1, 1, 15), H('seed_tree_willow', 1, 1, 10), H('bird_nest', 1, 1, 5)], bones: null },
  // 沼泽
  { id: 'giant_frog', name: '巨蛙', icon: '🐸', L: 14, type: 'melee', drops: [H('herb_greenleaf', 1, 2, 40), ...herbSeeds(0), H('seed_strawberry', 1, 2, 10)] },
  { id: 'leech', name: '巨型水蛭', icon: '🪱', L: 18, type: 'melee', sa: ['sa_drain'], drops: [H('herb_moonwort', 1, 2, 40), ...herbSeeds(1)] },
  { id: 'bog_beast', name: '沼泽巨兽', icon: '🦎', L: 24, type: 'melee', sa: ['sa_poison'], drops: [H('herb_sunbloom', 1, 2, 30), ...herbSeeds(2), H('seed_carrot', 1, 2, 15)], bones: 'big_bones' },
  // 墓地
  { id: 'skeleton', name: '骷髅战士', icon: '💀', L: 22, type: 'melee', drops: [H('steel_sword', 1, 1, 10), H('steel_helmet', 1, 1, 10), H('rune_chaos', 2, 8, 40), H('bar_iron', 1, 3, 40)] },
  { id: 'zombie', name: '僵尸', icon: '🧟', L: 26, type: 'melee', speed: 3000, drops: [H('rune_body', 5, 15, 40), H('herb_flamemoss', 1, 1, 20), ...herbSeeds(3)] },
  { id: 'ghost', name: '游魂', icon: '👻', L: 30, type: 'magic', drops: [H('rune_death', 2, 6, 30), H('rune_chaos', 3, 10, 40), H('rune_essence', 10, 30, 30)], bones: null },
  // 山岭洞穴
  { id: 'cave_spider', name: '洞穴蜘蛛', icon: '🕷️', L: 28, type: 'melee', sa: ['sa_poison'], drops: [H('ore_iron', 2, 6, 40), H('ore_coal', 2, 6, 40)] },
  { id: 'troll', name: '山岭巨魔', icon: '🧌', L: 38, type: 'melee', speed: 3000, sa: ['sa_heavy'], drops: [H('ore_mithril', 1, 3, 30), H('bar_steel', 1, 3, 30), H('mithril_platelegs', 1, 1, 5)], bones: 'big_bones' },
  { id: 'gargoyle', name: '石像鬼', icon: '🗿', L: 48, type: 'melee', sa: ['sa_shield'], drops: [H('ore_adamantite', 1, 3, 30), H('gem_pouch', 1, 1, 15), H('adamant_helmet', 1, 1, 5)], bones: null },
  // 海盗湾
  { id: 'pirate', name: '海盗', icon: '🏴‍☠️', L: 26, type: 'ranged', drops: [H('coin_pouch', 1, 2, 40), H('steel_arrows', 10, 25, 30), H('raw_lobster', 1, 3, 30)] },
  { id: 'pirate_gunner', name: '海盗炮手', icon: '💣', L: 40, type: 'ranged', sa: ['sa_heavy'], drops: [H('mithril_arrows', 10, 25, 30), H('treasure_chest', 1, 1, 5), H('raw_swordfish', 1, 3, 30)] },
  { id: 'sea_serpent', name: '海蛇', icon: '🐍', L: 55, type: 'magic', sa: ['sa_poison'], drops: [H('raw_shark', 1, 3, 40), H('rune_water', 20, 60, 40), H('treasure_chest', 1, 1, 8)], bones: 'big_bones' },
  // 法师之塔
  { id: 'apprentice', name: '学徒法师', icon: '🧑‍🎓', L: 30, type: 'magic', drops: [H('rune_air', 10, 40, 30), H('rune_fire', 10, 40, 30), H('robe_acolyte_hat', 1, 1, 5), H('staff_basic_air', 1, 1, 5)], bones: 'bones' },
  { id: 'dark_wizard', name: '暗黑巫师', icon: '🧙‍♂️', L: 50, type: 'magic', sa: ['sa_curse'], drops: [H('rune_death', 5, 15, 30), H('rune_blood', 3, 10, 20), H('robe_adept_robe', 1, 1, 3), H('staff_battle_fire', 1, 1, 2)] },
  { id: 'archmage_guard', name: '奥术守卫', icon: '🔮', L: 70, type: 'magic', sa: ['sa_stun'], drops: [H('rune_blood', 5, 15, 30), H('rune_spirit', 3, 10, 20), H('robe_expert_hat', 1, 1, 2), H('gem_diamond', 1, 1, 5)] },
  // 冰原
  { id: 'ice_wolf', name: '冰原狼', icon: '🐺', L: 42, type: 'melee', sa: ['sa_slow'], drops: [H('raw_salmon', 2, 5, 40), ...herbSeeds(4), H('herb_frostleaf', 1, 2, 30)], bones: 'big_bones' },
  { id: 'yeti', name: '雪人', icon: '🦍', L: 52, type: 'melee', sa: ['sa_crush'], drops: [H('raw_cavefish', 1, 2, 20), H('ore_mithril', 2, 5, 40)], bones: 'big_bones' },
  { id: 'ice_giant', name: '冰霜巨人', icon: '🧊', L: 60, type: 'melee', speed: 3200, sa: ['sa_frostbreath'], drops: [H('bar_adamant', 1, 3, 30), H('adamant_platebody', 1, 1, 3), H('rune_water', 30, 80, 40)], bones: 'big_bones' },
  // 火山
  { id: 'fire_elemental', name: '火元素', icon: '🔥', L: 62, type: 'magic', sa: ['sa_burn'], drops: [H('rune_fire', 40, 120, 50), H('ash', 5, 20, 30), H('charcoal', 3, 10, 20)], bones: null },
  { id: 'lava_serpent', name: '熔岩巨蛇', icon: '🐉', L: 68, type: 'ranged', sa: ['sa_burn'], drops: [H('ore_runite', 1, 2, 30), H('bar_rune', 1, 1, 10), H('rune_lava', 10, 40, 40)], bones: 'big_bones' },
  { id: 'demon', name: '恶魔', icon: '👹', L: 78, type: 'melee', sa: ['sa_burn', 'sa_heavy'], drops: [H('rune_blood', 10, 30, 30), H('rune_death', 10, 30, 30), H('rune_platebody', 1, 1, 2), ...herbSeeds(6)], bones: 'magic_bones' },
  // 龙谷
  { id: 'green_dragon', name: '绿龙', icon: '🐲', L: 72, type: 'magic', sa: ['sa_dragonfire'], drops: [H('hide_green', 1, 2, 70), H('rune_platelegs', 1, 1, 3)], dropChance: 1, bones: 'dragon_bones' },
  { id: 'blue_dragon', name: '蓝龙', icon: '🐉', L: 82, type: 'magic', sa: ['sa_dragonfire'], drops: [H('hide_blue', 1, 2, 70), H('rune_helmet', 1, 1, 3)], dropChance: 1, bones: 'dragon_bones' },
  { id: 'red_dragon', name: '红龙', icon: '🐉', L: 92, type: 'magic', sa: ['sa_dragonfire'], drops: [H('hide_red', 1, 2, 70), H('dragon_helmet', 1, 1, 2), H('ore_dragonite', 1, 1, 10)], dropChance: 1, bones: 'dragon_bones' },
  { id: 'black_dragon', name: '黑龙', icon: '🐉', L: 102, type: 'magic', sa: ['sa_dragonfire', 'sa_heavy'], drops: [H('hide_black', 1, 2, 70), H('dragon_platelegs', 1, 1, 2), H('ore_dragonite', 1, 2, 10)], dropChance: 1, bones: 'dragon_bones' },
  // Slayer 区域怪物
  { id: 'venom_toad', name: '剧毒蟾蜍', icon: '🐸', L: 34, type: 'melee', sa: ['sa_poison'], drops: [H('herb_flamemoss', 1, 3, 40), ...herbSeeds(3), H('basilisk_scale', 1, 1, 0.2)] },
  { id: 'swamp_viper', name: '沼泽毒蛇', icon: '🐍', L: 40, type: 'melee', sa: ['sa_poison'], drops: [H('herb_frostleaf', 1, 3, 40), ...herbSeeds(4), H('basilisk_scale', 1, 1, 0.3)] },
  { id: 'shadow_wolf', name: '暗影狼', icon: '🐺', L: 54, type: 'melee', sa: ['sa_bleed'], drops: [H('shadow_fang', 1, 1, 0.5), H('herb_dragonroot', 1, 2, 30), ...herbSeeds(5)], bones: 'big_bones' },
  { id: 'vampire_bat', name: '吸血蝙蝠', icon: '🦇', L: 58, type: 'melee', speed: 1800, sa: ['sa_drain'], drops: [H('rune_blood', 5, 20, 50), ...herbSeeds(6)] },
  { id: 'medusa', name: '石化魔女', icon: '🐍', L: 75, type: 'magic', sa: ['sa_stun'], drops: [H('gem_emerald', 1, 1, 20), H('gem_diamond', 1, 1, 10), H('herb_ghostcap', 1, 3, 40), ...herbSeeds(7)], bones: 'magic_bones' },
  { id: 'basilisk', name: '蛇怪', icon: '🦎', L: 82, type: 'melee', sa: ['sa_stun', 'sa_poison'], drops: [H('basilisk_scale', 1, 1, 1), H('herb_starherb', 1, 2, 40), ...herbSeeds(7)], bones: 'dragon_bones' },
  { id: 'magma_hound', name: '熔岩猎犬', icon: '🐕', L: 88, type: 'melee', sa: ['sa_burn'], drops: [H('ore_runite', 2, 4, 40), H('bar_rune', 1, 2, 20)], bones: 'dragon_bones' },
  { id: 'ash_wraith', name: '灰烬怨灵', icon: '👤', L: 94, type: 'magic', sa: ['sa_burn', 'sa_curse'], drops: [H('rune_ancient', 3, 10, 40), H('robe_expert_robe', 1, 1, 2)], bones: 'magic_bones' },
  { id: 'plague_rat', name: '瘟疫巨鼠', icon: '🐀', L: 98, type: 'melee', sa: ['sa_poison'], drops: [H('herb_holyherb', 1, 3, 40), ...herbSeeds(8)], bones: 'big_bones' },
  { id: 'toxic_horror', name: '剧毒恐魔', icon: '🦠', L: 110, type: 'ranged', sa: ['sa_poison', 'sa_weaken'], drops: [H('herb_holyherb', 2, 4, 40), H('weird_gloop', 1, 1, 3), H('gem_diamond', 1, 2, 10)], bones: 'magic_bones' },
  { id: 'rift_stalker', name: '裂隙潜伏者', icon: '👁️', L: 118, type: 'magic', sa: ['sa_blind', 'sa_vuln'], drops: [H('rune_ancient', 10, 25, 40), H('golden_stardust', 1, 3, 10), H('mysterious_stone', 1, 1, 0.5)], bones: 'magic_bones' },
];
for (const m of MONSTERS) defineMonster(m);
