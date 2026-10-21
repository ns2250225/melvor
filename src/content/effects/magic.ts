// 魔法（标准、诅咒、光环、远古、古代遗法、深渊、替代魔法）与祈祷
import { addSpell, addPrayer } from '../registry';
import type { ItemQty } from '@/game/core/types';

const R = (pairs: [string, number][]): ItemQty[] => pairs.map(([id, qty]) => ({ id: `rune_${id}`, qty }));

// --------------------------------------------------------------------------- 标准战斗法术
const ELEM = [['air', '风'], ['water', '水'], ['earth', '地'], ['fire', '火']] as const;
const TIERS = [
  { key: 'strike', name: '击', levels: [1, 5, 9, 13], maxHit: [20, 40, 60, 80], cat: 'mind', catQty: 1, elemQty: 1 },
  { key: 'bolt', name: '箭', levels: [17, 23, 29, 35], maxHit: [90, 100, 110, 120], cat: 'chaos', catQty: 1, elemQty: 2 },
  { key: 'blast', name: '爆', levels: [41, 47, 53, 59], maxHit: [130, 140, 150, 160], cat: 'death', catQty: 1, elemQty: 3 },
  { key: 'wave', name: '浪', levels: [62, 65, 70, 75], maxHit: [170, 180, 190, 200], cat: 'blood', catQty: 1, elemQty: 5 },
  { key: 'surge', name: '涌', levels: [80, 85, 90, 95], maxHit: [210, 220, 230, 240], cat: 'spirit', catQty: 1, elemQty: 7 },
];
for (const t of TIERS) {
  ELEM.forEach(([el, cn], i) => {
    addSpell({ id: `sp_${el}_${t.key}`, name: `${cn}${t.name}术`, icon: { air: '🌪️', water: '💧', earth: '🪨', fire: '🔥' }[el], book: 'standard', level: t.levels[i],
      runes: R([[el, t.elemQty + i], [t.cat, t.catQty]]), maxHit: t.maxHit[i], expansion: 'base', description: `基础最大伤害 ${t.maxHit[i]}` });
  });
}
addSpell({ id: 'sp_thunder', name: '雷霆术', icon: '⚡', book: 'standard', level: 105, runes: R([['air', 10], ['havoc', 2]]), maxHit: 280, expansion: 'toth', description: '基础最大伤害 280（Throne of the Herald）' });
addSpell({ id: 'sp_judgement', name: '天罚术', icon: '☄️', book: 'standard', level: 115, runes: R([['fire', 12], ['havoc', 3]]), maxHit: 320, expansion: 'toth', description: '基础最大伤害 320（Throne of the Herald）' });

// --------------------------------------------------------------------------- 诅咒
addSpell({ id: 'cu_blind', name: '致盲诅咒', icon: '🙈', book: 'curse', level: 5, runes: R([['mind', 2], ['body', 1]]), curse: { kind: 'accuracy', value: 15, turns: 3 }, expansion: 'base', description: '敌人命中 -15%，持续 3 回合' });
addSpell({ id: 'cu_soak', name: '浸透诅咒', icon: '💦', book: 'curse', level: 15, runes: R([['water', 3], ['body', 1]]), curse: { kind: 'evasion', value: 10, turns: 3 }, expansion: 'base', description: '敌人闪避 -10%，持续 3 回合' });
addSpell({ id: 'cu_weaken', name: '虚弱诅咒', icon: '🥀', book: 'curse', level: 30, runes: R([['earth', 3], ['chaos', 1]]), curse: { kind: 'maxhit', value: 10, turns: 3 }, expansion: 'base', description: '敌人最大伤害 -10%，持续 3 回合' });
addSpell({ id: 'cu_confuse', name: '混乱诅咒', icon: '😵', book: 'curse', level: 45, runes: R([['air', 5], ['nature', 2]]), curse: { kind: 'damage', value: 10, turns: 3 }, expansion: 'base', description: '敌人受到伤害 +10%，持续 3 回合' });
addSpell({ id: 'cu_decay', name: '衰败诅咒', icon: '☠️', book: 'curse', level: 60, runes: R([['death', 2], ['blood', 1]]), curse: { kind: 'decay', value: 3, turns: 5 }, expansion: 'base', description: '每回合敌人损失 3% 当前生命，持续 5 回合' });
addSpell({ id: 'cu_anguish', name: '痛苦诅咒', icon: '😖', book: 'curse', level: 85, runes: R([['blood', 3], ['spirit', 2]]), curse: { kind: 'evasion', value: 25, turns: 3 }, expansion: 'base', description: '敌人闪避 -25%，持续 3 回合' });

// --------------------------------------------------------------------------- 光环
addSpell({ id: 'au_surge', name: '迅捷光环', icon: '💨', book: 'aura', level: 25, runes: R([['air', 5], ['mind', 2]]), modifiers: { attackInterval: -3 }, expansion: 'base', description: '攻击间隔 -3%' });
addSpell({ id: 'au_fervor', name: '狂热光环', icon: '🔥', book: 'aura', level: 40, runes: R([['fire', 5], ['chaos', 2]]), modifiers: { maxHit: 3 }, expansion: 'base', description: '最大伤害 +3%' });
addSpell({ id: 'au_charged', name: '充能光环', icon: '⚡', book: 'aura', level: 55, runes: R([['air', 6], ['nature', 2]]), modifiers: { meleeAccuracy: 6, rangedAccuracy: 6, magicAccuracy: 6 }, expansion: 'base', description: '全部命中 +6%' });
addSpell({ id: 'au_mirror', name: '镜像光环', icon: '🪞', book: 'aura', level: 70, runes: R([['water', 6], ['death', 2]]), modifiers: { reflectDamage: 6 }, expansion: 'base', description: '反弹 6% 伤害' });
addSpell({ id: 'au_ward', name: '庇护光环', icon: '🛡️', book: 'aura', level: 85, runes: R([['earth', 8], ['blood', 2]]), modifiers: { damageReductionFlat: 4 }, expansion: 'base', description: '伤害减免 +4%' });

// --------------------------------------------------------------------------- 远古魔法（需要通关巫师大厅）
const ANC: [string, string, string, number, number, [string, number][], string, string][] = [
  ['an_shadow', '暗影侵袭', '🌑', 50, 180, [['ancient', 1], ['death', 2]], 'sa_blind', '附带致盲'],
  ['an_blood', '鲜血汲取', '🩸', 60, 200, [['ancient', 1], ['blood', 2]], 'sa_drain', '回复 50% 伤害'],
  ['an_ice', '寒冰风暴', '🧊', 70, 220, [['ancient', 2], ['water', 6]], 'sa_freeze', '附带冰冻'],
  ['an_smoke', '烟雾毒云', '🌫️', 75, 230, [['ancient', 2], ['smoke', 4]], 'sa_poison', '附带中毒'],
  ['an_inferno', '炼狱火焰', '🔥', 85, 250, [['ancient', 2], ['lava', 4]], 'sa_burn', '附带燃烧'],
  ['an_storm', '雷暴', '⛈️', 95, 270, [['ancient', 3], ['steam', 4]], 'sa_stun', '附带击晕'],
];
for (const [id, name, icon, level, maxHit, runes, sp, d] of ANC) addSpell({ id, name, icon, book: 'ancient', level, runes: R(runes), maxHit, specialAttack: sp, requirements: [{ type: 'dungeon', id: 'dg_wizard_hall' }], expansion: 'base', description: `基础最大伤害 ${maxHit}，${d}` });

// --------------------------------------------------------------------------- 古代遗法（Atlas of Discovery，需发现遗迹）
addSpell({ id: 'ar_tremor', name: '大地震颤', icon: '🌋', book: 'archaic', level: 60, runes: R([['earth', 10], ['nature', 3]]), maxHit: 230, specialAttack: 'sa_stun', requirements: [{ type: 'poi', id: 'poi_forge' }], expansion: 'aod', description: '基础最大伤害 230，附带击晕（发现「矮人熔炉」后解锁）' });
addSpell({ id: 'ar_starfall', name: '星辰坠落', icon: '🌠', book: 'archaic', level: 80, runes: R([['air', 10], ['ancient', 2]]), maxHit: 260, specialAttack: 'sa_vuln', requirements: [{ type: 'poi', id: 'poi_observatory' }], expansion: 'aod', description: '基础最大伤害 260，附带破绽（发现「天穹观星台」后解锁）' });
addSpell({ id: 'ar_tome', name: '禁典之怒', icon: '📕', book: 'archaic', level: 90, runes: R([['spirit', 4], ['ancient', 3]]), maxHit: 290, specialAttack: 'sa_curse', requirements: [{ type: 'poi', id: 'poi_library' }], expansion: 'aod', description: '基础最大伤害 290，附带诅咒（发现「失落图书馆」后解锁）' });

// --------------------------------------------------------------------------- 深渊法术（Into the Abyss）
addSpell({ id: 'ab_void_bolt', name: '虚空箭', icon: '🟣', book: 'abyssal', level: 99, runes: R([['void', 3]]), maxHit: 380, specialAttack: 'sa_void', requirements: [{ type: 'abyssal', skill: 'magic', level: 1 }], expansion: 'ita', description: '基础最大伤害 380（深渊魔法 1）' });
addSpell({ id: 'ab_abyss_wave', name: '深渊波涛', icon: '🌊', book: 'abyssal', level: 99, runes: R([['abyssal', 3], ['void', 2]]), maxHit: 460, specialAttack: 'sa_corrupt', requirements: [{ type: 'abyssal', skill: 'magic', level: 20 }], expansion: 'ita', description: '基础最大伤害 460（深渊魔法 20）' });
addSpell({ id: 'ab_soul_rend', name: '灵魂撕裂', icon: '💜', book: 'abyssal', level: 99, runes: R([['soul', 3], ['abyssal', 2]]), maxHit: 560, specialAttack: 'sa_drain', requirements: [{ type: 'abyssal', skill: 'magic', level: 40 }], expansion: 'ita', description: '基础最大伤害 560（深渊魔法 40）' });

// --------------------------------------------------------------------------- 替代魔法（非战斗）
addSpell({ id: 'alt_low_alch', name: '低级炼金', icon: '🪙', book: 'alt', level: 1, runes: R([['fire', 3], ['nature', 1]]), xp: 10, interval: 2000, alt: { kind: 'alch', ratio: 1.1 }, expansion: 'base', description: '将物品转化为 110% 售价的金币' });
addSpell({ id: 'alt_high_alch', name: '高级炼金', icon: '💰', book: 'alt', level: 55, runes: R([['fire', 5], ['nature', 1]]), xp: 35, interval: 2000, alt: { kind: 'alch', ratio: 1.6 }, expansion: 'base', description: '将物品转化为 160% 售价的金币' });
addSpell({ id: 'alt_superheat_1', name: '高温冶炼 I', icon: '🔥', book: 'alt', level: 10, runes: R([['fire', 4], ['nature', 1]]), xp: 12, interval: 2000, alt: { kind: 'superheat', ratio: 1, target: 'bar_steel' }, expansion: 'base', description: '直接冶炼钢锭及以下的金属锭' });
addSpell({ id: 'alt_superheat_2', name: '高温冶炼 II', icon: '🔥', book: 'alt', level: 40, runes: R([['fire', 6], ['nature', 2]]), xp: 25, interval: 2000, alt: { kind: 'superheat', ratio: 1, target: 'bar_rune' }, expansion: 'base', description: '直接冶炼符石锭及以下的金属锭' });
addSpell({ id: 'alt_superheat_3', name: '高温冶炼 III', icon: '🔥', book: 'alt', level: 70, runes: R([['fire', 10], ['nature', 3]]), xp: 45, interval: 2000, alt: { kind: 'superheat', ratio: 2, target: 'bar_celestium' }, expansion: 'base', description: '冶炼任意金属锭，产量翻倍' });
addSpell({ id: 'alt_gem_1', name: '宝石转化', icon: '💎', book: 'alt', level: 30, runes: R([['earth', 5], ['nature', 2]]), xp: 20, interval: 2000, alt: { kind: 'convert', consumes: [{ id: 'gem_topaz', qty: 3 }], produces: [{ id: 'gem_sapphire', qty: 1 }] }, expansion: 'base', description: '3 黄玉 → 1 蓝宝石' });
addSpell({ id: 'alt_gem_2', name: '宝石升华', icon: '💎', book: 'alt', level: 60, runes: R([['earth', 8], ['nature', 3]]), xp: 40, interval: 2000, alt: { kind: 'convert', consumes: [{ id: 'gem_ruby', qty: 2 }], produces: [{ id: 'gem_emerald', qty: 1 }] }, expansion: 'base', description: '2 红宝石 → 1 绿宝石' });
addSpell({ id: 'alt_gem_3', name: '宝石至臻', icon: '💎', book: 'alt', level: 80, runes: R([['earth', 10], ['ancient', 1]]), xp: 60, interval: 2000, alt: { kind: 'convert', consumes: [{ id: 'gem_emerald', qty: 2 }], produces: [{ id: 'gem_diamond', qty: 1 }] }, expansion: 'base', description: '2 绿宝石 → 1 钻石' });
addSpell({ id: 'alt_bones', name: '骨骼升华', icon: '🦴', book: 'alt', level: 50, runes: R([['earth', 4], ['nature', 2]]), xp: 30, interval: 2000, alt: { kind: 'convert', consumes: [{ id: 'bones', qty: 10 }], produces: [{ id: 'big_bones', qty: 3 }] }, expansion: 'base', description: '10 骨头 → 3 大骨头' });
addSpell({ id: 'alt_onyx', name: '缟玛瑙凝聚', icon: '🖤', book: 'alt', level: 105, runes: R([['havoc', 5], ['ancient', 3]]), xp: 120, interval: 3000, alt: { kind: 'convert', consumes: [{ id: 'gem_diamond', qty: 3 }], produces: [{ id: 'gem_onyx', qty: 1 }] }, expansion: 'toth', description: '3 钻石 → 1 缟玛瑙' });
addSpell({ id: 'alt_voidgem', name: '虚空宝石凝聚', icon: '🟣', book: 'alt', level: 99, runes: R([['void', 10], ['soul', 2]]), xp: 300, interval: 3000, alt: { kind: 'convert', consumes: [{ id: 'gem_onyx', qty: 1 }, { id: 'abyssal_shard', qty: 10 }], produces: [{ id: 'gem_voidgem', qty: 1 }] }, requirements: [{ type: 'abyssal', skill: 'magic', level: 10 }], expansion: 'ita', description: '缟玛瑙 + 10 深渊碎晶 → 虚空宝石' });

// --------------------------------------------------------------------------- 祈祷
const P: [string, string, string, number, number, number, Record<string, number>, string, 'normal' | 'unholy' | 'abyssal'][] = [
  ['pr_thick_skin', '坚韧皮肤', '🛡️', 1, 1, 0, { damageReductionFlat: 2 }, '伤害减免 +2%', 'normal'],
  ['pr_burst', '力量爆发', '💪', 4, 2, 0, { meleeMaxHit: 5 }, '近战最大伤害 +5%', 'normal'],
  ['pr_clarity', '清晰思维', '🧠', 7, 2, 0, { meleeAccuracy: 5 }, '近战命中 +5%', 'normal'],
  ['pr_sharp_eye', '锐利之眼', '👁️', 8, 2, 0, { rangedAccuracy: 5, rangedMaxHit: 5 }, '远程命中与伤害 +5%', 'normal'],
  ['pr_mystic_will', '神秘意志', '🔮', 9, 2, 0, { magicAccuracy: 5, magicMaxHit: 5 }, '魔法命中与伤害 +5%', 'normal'],
  ['pr_rapid_heal', '快速治愈', '💗', 15, 0, 1, { hpRegen: 100 }, '生命回复 +100%', 'normal'],
  ['pr_protect_item', '护佑物品', '🔒', 20, 0, 1, { protectItem: 1 }, '死亡时不会失去装备', 'normal'],
  ['pr_rock_skin', '岩石皮肤', '🪨', 22, 2, 1, { damageReductionFlat: 4 }, '伤害减免 +4%', 'normal'],
  ['pr_superhuman', '超凡力量', '🏋️', 25, 3, 0, { meleeMaxHit: 10 }, '近战最大伤害 +10%', 'normal'],
  ['pr_protect_melee', '近战守护', '⚔️', 37, 0, 3, { protectFrom: 1 }, '敌人近战命中率降低 80%', 'normal'],
  ['pr_protect_ranged', '远程守护', '🏹', 40, 0, 3, { protectFrom: 2 }, '敌人远程命中率降低 80%', 'normal'],
  ['pr_protect_magic', '魔法守护', '✨', 43, 0, 3, { protectFrom: 3 }, '敌人魔法命中率降低 80%', 'normal'],
  ['pr_steel_skin', '钢铁皮肤', '🔩', 55, 3, 1, { damageReductionFlat: 6 }, '伤害减免 +6%', 'normal'],
  ['pr_ultimate', '极限力量', '🔥', 60, 4, 0, { meleeMaxHit: 15 }, '近战最大伤害 +15%', 'normal'],
  ['pr_eagle_eye', '鹰眼', '🦅', 61, 4, 0, { rangedAccuracy: 15, rangedMaxHit: 15 }, '远程命中与伤害 +15%', 'normal'],
  ['pr_mystic_might', '神秘之力', '🌌', 62, 4, 0, { magicAccuracy: 15, magicMaxHit: 15 }, '魔法命中与伤害 +15%', 'normal'],
  ['pr_redemption', '救赎', '😇', 70, 0, 2, { redemption: 1 }, '生命低于 10% 时回复 25% 最大生命（每场战斗一次）', 'normal'],
  ['pr_chivalry', '骑士精神', '🤺', 80, 5, 1, { meleeAccuracy: 10, meleeMaxHit: 10, damageReductionFlat: 3 }, '近战命中/伤害 +10%，减伤 +3%', 'normal'],
  ['pr_rigour', '严酷', '🎯', 85, 5, 1, { rangedAccuracy: 15, rangedMaxHit: 12, damageReductionFlat: 3 }, '远程命中 +15%/伤害 +12%，减伤 +3%', 'normal'],
  ['pr_augury', '占卜', '🔯', 90, 5, 1, { magicAccuracy: 15, magicMaxHit: 12, damageReductionFlat: 3 }, '魔法命中 +15%/伤害 +12%，减伤 +3%', 'normal'],
  ['pr_unholy_rage', '亵渎狂怒', '😡', 100, 6, 0, { maxHit: 20, damageReductionFlat: -10 }, '最大伤害 +20%，伤害减免 -10%', 'unholy'],
  ['pr_unholy_ward', '亵渎庇护', '🖤', 105, 0, 4, { damageReductionFlat: 12, attackInterval: 10 }, '伤害减免 +12%，攻击间隔 +10%', 'unholy'],
  ['pr_unholy_greed', '亵渎贪婪', '💰', 110, 4, 2, { combatGP: 50, maxHit: -5 }, '战斗金币 +50%，最大伤害 -5%', 'unholy'],
  ['pr_abyss_fury', '深渊之怒', '💢', 99, 6, 0, { maxHit: 12, abyssalResistanceFlat: 2 }, '最大伤害 +12%，深渊抗性 +2（消耗灵魂点）', 'abyssal'],
  ['pr_abyss_bulwark', '深渊壁垒', '🧱', 99, 0, 5, { abyssalResistanceFlat: 8 }, '深渊抗性 +8（消耗灵魂点）', 'abyssal'],
  ['pr_abyss_siphon', '深渊虹吸', '🌀', 99, 5, 2, { lifesteal: 4 }, '生命偷取 +4%（消耗灵魂点）', 'abyssal'],
];
for (const [id, name, icon, level, pp, pe, modifiers, description, book] of P) {
  addPrayer({ id, name, icon, level, pointsPerPlayer: pp, pointsPerEnemy: pe, modifiers, description, book,
    requirements: book === 'unholy' ? [{ type: 'dungeon', id: 'dg_herald_gate' }] : book === 'abyssal' ? [{ type: 'abyssal', skill: 'prayer', level: id === 'pr_abyss_fury' ? 1 : id === 'pr_abyss_bulwark' ? 15 : 30 }] : [],
    expansion: book === 'unholy' ? 'toth' : book === 'abyssal' ? 'ita' : 'base' });
}
