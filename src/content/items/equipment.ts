// 装备生成：锻造金属装备、远程武器与弹药、皮甲与龙皮甲、法杖与法袍、珠宝、技能披风
import { addItem, C } from '../registry';
import type { EquipSlot, ExpansionId, Realm, SkillId, Stats, ModifierMap, ItemDef } from '@/game/core/types';
import { LOGS, HIDES, GEMS } from './materials';

export interface EquipTier { id: string; name: string; power: number; level: number; abyssal?: number; color: string; exp: ExpansionId; realm: Realm }
export const METAL_TIERS: EquipTier[] = [
  { id: 'bronze', name: '青铜', power: 1, level: 1, color: '#b08d57', exp: 'base', realm: 'melvor' },
  { id: 'iron', name: '铁', power: 2, level: 10, color: '#8a8f98', exp: 'base', realm: 'melvor' },
  { id: 'steel', name: '钢', power: 3.5, level: 20, color: '#aab4c0', exp: 'base', realm: 'melvor' },
  { id: 'mithril', name: '秘银', power: 5.5, level: 30, color: '#4a6fa5', exp: 'base', realm: 'melvor' },
  { id: 'adamant', name: '精金', power: 8, level: 40, color: '#3b7d4f', exp: 'base', realm: 'melvor' },
  { id: 'rune', name: '符石', power: 11, level: 50, color: '#3aa0c8', exp: 'base', realm: 'melvor' },
  { id: 'dragon', name: '龙', power: 15, level: 60, color: '#c0392b', exp: 'base', realm: 'melvor' },
  { id: 'starfall', name: '星陨', power: 21, level: 100, color: '#f5b041', exp: 'toth', realm: 'melvor' },
  { id: 'celestium', name: '天河', power: 27, level: 110, color: '#a569bd', exp: 'toth', realm: 'melvor' },
  { id: 'void', name: '虚空', power: 34, level: 99, abyssal: 1, color: '#5b2c6f', exp: 'ita', realm: 'abyssal' },
  { id: 'abyssal', name: '深渊', power: 42, level: 99, abyssal: 20, color: '#922b21', exp: 'ita', realm: 'abyssal' },
  { id: 'nether', name: '冥铁', power: 52, level: 99, abyssal: 40, color: '#1c2833', exp: 'ita', realm: 'abyssal' },
];

export interface SmithPiece { key: string; name: string; slot: EquipSlot; bars: number; levelOffset: number; icon: string; twoHanded?: boolean; speed?: number; style?: 'stab' | 'slash' | 'block'; outputQty?: number; isComponent?: boolean }
export const SMITH_PIECES: SmithPiece[] = [
  { key: 'dagger', name: '匕首', slot: 'weapon', bars: 1, levelOffset: 0, icon: '🔪', speed: 2200, style: 'stab' },
  { key: 'sword', name: '长剑', slot: 'weapon', bars: 1, levelOffset: 1, icon: '🗡️', speed: 2400, style: 'stab' },
  { key: 'scimitar', name: '弯刀', slot: 'weapon', bars: 2, levelOffset: 2, icon: '⚔️', speed: 2400, style: 'slash' },
  { key: 'battleaxe', name: '战斧', slot: 'weapon', bars: 3, levelOffset: 4, icon: '🪓', twoHanded: true, speed: 3000, style: 'slash' },
  { key: '2hsword', name: '双手剑', slot: 'weapon', bars: 3, levelOffset: 6, icon: '🗡️', twoHanded: true, speed: 3600, style: 'slash' },
  { key: 'helmet', name: '头盔', slot: 'helmet', bars: 1, levelOffset: 1, icon: '⛑️' },
  { key: 'boots', name: '战靴', slot: 'boots', bars: 1, levelOffset: 2, icon: '🥾' },
  { key: 'gloves', name: '护手', slot: 'gloves', bars: 1, levelOffset: 3, icon: '🧤' },
  { key: 'shield', name: '盾牌', slot: 'shield', bars: 3, levelOffset: 5, icon: '🛡️' },
  { key: 'platelegs', name: '板甲护腿', slot: 'legs', bars: 2, levelOffset: 7, icon: '👖' },
  { key: 'platebody', name: '板甲', slot: 'body', bars: 5, levelOffset: 9, icon: '🦺' },
  { key: 'arrowtips', name: '箭头', slot: 'quiver', bars: 1, levelOffset: 0, icon: '🔺', outputQty: 15, isComponent: true },
  { key: 'javhead', name: '标枪头', slot: 'quiver', bars: 1, levelOffset: 3, icon: '🔻', outputQty: 10, isComponent: true },
  { key: 'bolttips', name: '弩矢头', slot: 'quiver', bars: 1, levelOffset: 4, icon: '🔸', outputQty: 15, isComponent: true },
];

export const equipId = (tier: string, key: string) => `${tier}_${key}`;

function reqs(skills: SkillId[], level: number, abyssal?: number) {
  const out: { skill: SkillId; level: number; abyssal?: boolean }[] = skills.map((s) => ({ skill: s, level }));
  if (abyssal) for (const s of skills) out.push({ skill: s, level: abyssal, abyssal: true });
  return out;
}

const r = Math.round;

function addEquip(def: Omit<ItemDef, 'expansion' | 'category' | 'sellPrice'> & { exp: ExpansionId; sell: number; category?: string }) {
  const { exp, sell, ...rest } = def as any;
  return addItem({ ...rest, expansion: exp, sellPrice: sell, category: def.category || '装备' });
}

// ---------------------------------------------------------------------------
// 金属装备
// ---------------------------------------------------------------------------
for (const t of METAL_TIERS) {
  const p = t.power;
  const sell = (bars: number) => r(bars * 8 * Math.pow(p, 1.6));
  for (const piece of SMITH_PIECES) {
    const id = equipId(t.id, piece.key);
    if (piece.isComponent) {
      addItem({ id, name: `${t.name}${piece.name}`, type: 'material', icon: piece.icon, color: t.color, sellPrice: Math.max(1, r(p * 2)), category: '制箭', expansion: t.exp });
      continue;
    }
    let stats: Stats = {};
    let attackType: 'melee' | undefined;
    if (piece.slot === 'weapon') {
      attackType = 'melee';
      const mult = piece.key === '2hsword' ? 2.1 : piece.key === 'battleaxe' ? 1.75 : piece.key === 'scimitar' ? 1.25 : piece.key === 'sword' ? 1 : 0.8;
      stats = {
        attackSpeed: piece.speed,
        stabAttack: r(p * 4 * mult * (piece.style === 'stab' ? 1 : 0.5)),
        slashAttack: r(p * 4 * mult * (piece.style === 'slash' ? 1 : 0.5)),
        blockAttack: r(p * 2 * mult),
        meleeStrength: r(p * 3.8 * mult),
      };
      if (piece.key === 'battleaxe') stats.meleeDefence = r(p * 1.5);
    } else {
      const def = { helmet: 1.4, boots: 0.9, gloves: 0.9, shield: 2.3, legs: 2.5, body: 3.7 }[piece.slot as 'helmet'] ?? 1;
      stats = { meleeDefence: r(p * 3 * def), rangedDefence: r(p * 3 * def), magicDefence: -r(p * 0.6 * def) };
      if (piece.slot === 'body') stats.damageReduction = Math.min(12, r(1 + p * 0.25));
      if (piece.slot === 'legs') stats.damageReduction = Math.min(8, r(p * 0.15) + 1);
      if (piece.slot === 'shield') stats.damageReduction = Math.min(8, r(p * 0.12) + 1);
      if (piece.slot === 'helmet') stats.damageReduction = Math.min(5, r(p * 0.08));
      if (piece.slot === 'gloves') { stats.stabAttack = r(p); stats.slashAttack = r(p); stats.meleeStrength = r(p * 0.6); }
      if (t.realm === 'abyssal') stats.abyssalResistance = r((t.power - 30) * 0.3 * def);
    }
    addEquip({
      id, name: `${t.name}${piece.name}`, type: piece.slot === 'weapon' ? 'weapon' : 'equipment', icon: piece.icon, color: t.color, exp: t.exp, sell: sell(piece.bars),
      equipment: {
        slot: piece.slot, twoHanded: piece.twoHanded, attackType, realm: t.realm,
        requirements: reqs(piece.slot === 'weapon' ? ['attack'] : ['defence'], t.level, t.abyssal),
        stats,
      },
    });
  }
  // 弹药（由制箭制作）
  addEquip({ id: `${t.id}_arrows`, name: `${t.name}箭矢`, type: 'ammo', icon: '➶', color: t.color, exp: t.exp, sell: Math.max(1, r(p * 2)), category: '弹药',
    equipment: { slot: 'quiver', isAmmo: true, ammoType: 'arrow', realm: t.realm, requirements: reqs(['ranged'], t.level, t.abyssal), stats: { rangedStrength: r(7 + p * 6), rangedAttack: r(p * 2) } } });
  addEquip({ id: `${t.id}_bolts`, name: `${t.name}弩矢`, type: 'ammo', icon: '➵', color: t.color, exp: t.exp, sell: Math.max(1, r(p * 3)), category: '弹药',
    equipment: { slot: 'quiver', isAmmo: true, ammoType: 'bolt', realm: t.realm, requirements: reqs(['ranged'], t.level, t.abyssal), stats: { rangedStrength: r(10 + p * 7.5), rangedAttack: r(p * 2.5) } } });
  addEquip({ id: `${t.id}_javelin`, name: `${t.name}标枪`, type: 'ammo', icon: '🔱', color: t.color, exp: t.exp, sell: Math.max(1, r(p * 4)), category: '弹药',
    equipment: { slot: 'quiver', isAmmo: true, ammoType: 'javelin', realm: t.realm, requirements: reqs(['ranged'], t.level, t.abyssal), stats: { rangedStrength: r(12 + p * 9), rangedAttack: r(p * 4) } } });
  addEquip({ id: `${t.id}_crossbow`, name: `${t.name}弩`, type: 'weapon', icon: '🏹', color: t.color, exp: t.exp, sell: sell(2),
    equipment: { slot: 'weapon', twoHanded: true, attackType: 'ranged', ammoType: 'bolt', realm: t.realm, requirements: reqs(['ranged'], t.level, t.abyssal), stats: { attackSpeed: 2800, rangedAttack: r(p * 6), rangedStrength: r(p * 1.5) } } });
}

// ---------------------------------------------------------------------------
// 弓（按木材等级）
// ---------------------------------------------------------------------------
export const BOW_LEVELS: Record<string, number> = { normal: 1, oak: 5, willow: 20, teak: 25, maple: 30, mahogany: 35, yew: 40, magic: 50, redwood: 60, elderwood: 100, voidwood: 99, shadowwood: 99, starwood: 99 };
LOGS.forEach((l, i) => {
  const p = [1, 2, 3.5, 4.5, 5.5, 7, 8, 11, 15, 21, 34, 42, 52][i];
  const lvl = BOW_LEVELS[l.id];
  addEquip({ id: `${l.id}_shortbow`, name: `${l.name.replace('普通', '')}短弓`, type: 'weapon', icon: '🏹', color: l.color, exp: l.exp, sell: r(10 * Math.pow(p, 1.6)), category: '装备',
    equipment: { slot: 'weapon', twoHanded: true, attackType: 'ranged', ammoType: 'arrow', realm: l.realm, requirements: reqs(['ranged'], lvl, l.abyssal), stats: { attackSpeed: 2200, rangedAttack: r(p * 5.5) } } });
  addEquip({ id: `${l.id}_longbow`, name: `${l.name.replace('普通', '')}长弓`, type: 'weapon', icon: '🏹', color: l.color, exp: l.exp, sell: r(14 * Math.pow(p, 1.6)), category: '装备',
    equipment: { slot: 'weapon', twoHanded: true, attackType: 'ranged', ammoType: 'arrow', realm: l.realm, requirements: reqs(['ranged'], lvl, l.abyssal), stats: { attackSpeed: 2800, rangedAttack: r(p * 7.2), rangedStrength: r(p * 1.2) } } });
});

// ---------------------------------------------------------------------------
// 皮甲与龙皮甲（远程护甲）
// ---------------------------------------------------------------------------
export const LEATHER_PIECES = [
  { key: 'cowl', name: '兜帽', slot: 'helmet' as EquipSlot, mats: 1, level: 1, def: 1.3 },
  { key: 'vambraces', name: '护腕', slot: 'gloves' as EquipSlot, mats: 1, level: 5, def: 0.9 },
  { key: 'boots', name: '靴子', slot: 'boots' as EquipSlot, mats: 1, level: 7, def: 0.9 },
  { key: 'chaps', name: '皮护腿', slot: 'legs' as EquipSlot, mats: 2, level: 11, def: 2.2 },
  { key: 'body', name: '皮甲', slot: 'body' as EquipSlot, mats: 3, level: 14, def: 3.2 },
];
for (const piece of LEATHER_PIECES) {
  addEquip({ id: `leather_${piece.key}`, name: `皮革${piece.name}`, type: 'equipment', icon: '🧥', color: '#a0522d', exp: 'base', sell: 15 * piece.mats,
    equipment: { slot: piece.slot, requirements: [{ skill: 'ranged', level: 1 }], stats: { rangedDefence: r(2 * piece.def), meleeDefence: r(1.5 * piece.def), magicDefence: r(1 * piece.def), rangedAttack: piece.slot === 'gloves' ? 3 : r(piece.def) } } });
}
export const DHIDE_PIECES = LEATHER_PIECES.filter((p) => p.key !== 'cowl' && p.key !== 'boots');
HIDES.forEach((h, i) => {
  const p = [6, 9, 12, 16, 22, 34][i];
  const level = [40, 50, 60, 70, 100, 99][i];
  for (const piece of DHIDE_PIECES) {
    addEquip({ id: `dhide_${h.id}_${piece.key}`, name: `${h.name}${piece.name}`, type: 'equipment', icon: '🥋', color: h.color, exp: h.exp, sell: r(h.sell * piece.mats * 2.2),
      equipment: { slot: piece.slot, realm: h.exp === 'ita' ? 'abyssal' : 'melvor', requirements: reqs(['ranged'], level, (h as any).abyssal), stats: {
        rangedDefence: r(p * 2.6 * piece.def), meleeDefence: r(p * 1.8 * piece.def), magicDefence: r(p * 1.6 * piece.def), rangedAttack: r(p * 1.2 * piece.def),
        rangedStrength: piece.slot === 'gloves' ? r(p * 0.8) : 0, damageReduction: piece.slot === 'body' ? Math.min(10, r(p * 0.25)) : piece.slot === 'legs' ? Math.min(6, r(p * 0.15)) : 0,
        ...(h.exp === 'ita' ? { abyssalResistance: r(p * 0.3 * piece.def) } : {}) } } });
  }
});

// ---------------------------------------------------------------------------
// 法杖与法袍（符文制作）
// ---------------------------------------------------------------------------
export const ELEMENTS = [
  { id: 'air', name: '空气' }, { id: 'water', name: '水' }, { id: 'earth', name: '大地' }, { id: 'fire', name: '火焰' },
];
export const STAFF_TIERS = [
  { id: 'basic', name: '法杖', level: 1, magicLevel: 1, power: 1, log: 'log_normal', logs: 2, runes: 10, exp: 'base' as ExpansionId },
  { id: 'battle', name: '战斗法杖', level: 30, magicLevel: 30, power: 5, log: 'log_maple', logs: 3, runes: 50, exp: 'base' as ExpansionId },
  { id: 'mystic', name: '秘法杖', level: 60, magicLevel: 60, power: 12, log: 'log_magic', logs: 4, runes: 150, exp: 'base' as ExpansionId },
  { id: 'celestial', name: '天穹法杖', level: 100, magicLevel: 100, power: 22, log: 'log_elderwood', logs: 5, runes: 300, exp: 'toth' as ExpansionId },
];
for (const tier of STAFF_TIERS) {
  for (const el of ELEMENTS) {
    addEquip({ id: `staff_${tier.id}_${el.id}`, name: `${el.name}${tier.name}`, type: 'weapon', icon: '🪄', color: { air: '#d6eaf8', water: '#5dade2', earth: '#a04000', fire: '#e74c3c' }[el.id], exp: tier.exp, sell: r(30 * Math.pow(tier.power, 1.6)),
      equipment: { slot: 'weapon', twoHanded: true, attackType: 'magic', providesRunes: [`rune_${el.id}`], requirements: [{ skill: 'magic', level: tier.magicLevel }],
        stats: { attackSpeed: 2400, magicAttack: r(tier.power * 6), magicDamage: r(tier.power * 1.2), meleeDefence: r(tier.power * 1.5), stabAttack: r(tier.power * 2), meleeStrength: r(tier.power * 1.5) } } });
  }
}
addEquip({ id: 'staff_void', name: '虚空法杖', type: 'weapon', icon: '🪄', color: '#6c3483', exp: 'ita', sell: 60000,
  equipment: { slot: 'weapon', twoHanded: true, attackType: 'magic', realm: 'abyssal', providesRunes: ['rune_void'], requirements: reqs(['magic'], 99, 1), stats: { attackSpeed: 2400, magicAttack: 210, magicDamage: 40, magicDefence: 30, abyssalResistance: 5 } } });

export const ROBE_TIERS = [
  { id: 'acolyte', name: '学徒', level: 1, power: 1.5, exp: 'base' as ExpansionId, runes: 'rune_air', leather: 'leather' },
  { id: 'adept', name: '精通', level: 40, power: 6, exp: 'base' as ExpansionId, runes: 'rune_chaos', leather: 'dleather_green' },
  { id: 'expert', name: '专家', level: 70, power: 13, exp: 'base' as ExpansionId, runes: 'rune_death', leather: 'dleather_red' },
  { id: 'herald', name: '使者', level: 100, power: 22, exp: 'toth' as ExpansionId, runes: 'rune_havoc', leather: 'dleather_elder' },
  { id: 'voidweave', name: '虚织', level: 99, abyssal: 10, power: 34, exp: 'ita' as ExpansionId, runes: 'rune_void', leather: 'dleather_void' },
];
export const ROBE_PIECES = [
  { key: 'hat', name: '法帽', slot: 'helmet' as EquipSlot, mats: 1, def: 1.2 },
  { key: 'robe', name: '法袍', slot: 'body' as EquipSlot, mats: 3, def: 3 },
  { key: 'bottoms', name: '法裙', slot: 'legs' as EquipSlot, mats: 2, def: 2.2 },
  { key: 'boots', name: '法靴', slot: 'boots' as EquipSlot, mats: 1, def: 0.9 },
];
for (const tier of ROBE_TIERS) {
  for (const piece of ROBE_PIECES) {
    const p = tier.power;
    addEquip({ id: `robe_${tier.id}_${piece.key}`, name: `${tier.name}${piece.name}`, type: 'equipment', icon: '🧙', color: '#7d3c98', exp: tier.exp, sell: r(20 * piece.mats * Math.pow(p, 1.5)),
      equipment: { slot: piece.slot, realm: tier.exp === 'ita' ? 'abyssal' : 'melvor', requirements: reqs(['magic'], tier.level, (tier as any).abyssal), stats: {
        magicAttack: r(p * 1.8 * piece.def), magicDamage: r(p * 0.35 * piece.def), magicDefence: r(p * 2.6 * piece.def), meleeDefence: r(p * 0.6 * piece.def), rangedDefence: r(p * 0.8 * piece.def),
        ...(tier.exp === 'ita' ? { abyssalResistance: r(p * 0.25 * piece.def) } : {}) } } });
  }
}

// ---------------------------------------------------------------------------
// 珠宝（制作）
// ---------------------------------------------------------------------------
export const JEWELRY_GEMS = GEMS.filter((g) => ['topaz', 'sapphire', 'ruby', 'emerald', 'diamond', 'onyx'].includes(g.id));
const gemMods: Record<string, { ring: ModifierMap; amulet: ModifierMap; rd: string; ad: string }> = {
  topaz: { ring: { 'skillXP': 3 }, amulet: { 'combatGP': 10 }, rd: '全技能经验 +3%', ad: '战斗金币 +10%' },
  sapphire: { ring: { 'preservation': 3 }, amulet: { 'meleeAccuracy': 6, 'rangedAccuracy': 6, 'magicAccuracy': 6 }, rd: '材料节省 +3%', ad: '命中率 +6%' },
  ruby: { ring: { 'doubleItems': 3 }, amulet: { 'maxHit': 4 }, rd: '双倍产出 +3%', ad: '最大伤害 +4%' },
  emerald: { ring: { 'masteryXP': 5 }, amulet: { 'lifesteal': 2 }, rd: '掌握度经验 +5%', ad: '生命偷取 +2%' },
  diamond: { ring: { 'skillInterval': -3 }, amulet: { 'damageReductionFlat': 3 }, rd: '技能耗时 -3%', ad: '伤害减免 +3%' },
  onyx: { ring: { 'skillXP': 6, 'doubleItems': 4 }, amulet: { 'maxHit': 8, 'damageReductionFlat': 4 }, rd: '经验 +6%，双倍 +4%', ad: '最大伤害 +8%，减伤 +4%' },
};
export const JEWELRY: { id: string; level: number; bar: string; gem?: string; slot: 'ring' | 'amulet'; exp: ExpansionId }[] = [];
for (const slot of ['ring', 'amulet'] as const) {
  addEquip({ id: `silver_${slot}`, name: slot === 'ring' ? '银戒指' : '银项链', type: 'equipment', icon: slot === 'ring' ? '💍' : '📿', color: '#d5dbdb', exp: 'base', sell: 60,
    equipment: { slot, requirements: [], stats: { magicDefence: 2, magicAttack: 2 }, modifiers: slot === 'ring' ? { 'gpGlobal': 2 } : { 'prayerPreservation': 5 } }, description: slot === 'ring' ? '全局金币 +2%' : '祈祷点节省 +5%' });
  JEWELRY.push({ id: `silver_${slot}`, level: slot === 'ring' ? 5 : 8, bar: 'bar_silver', slot, exp: 'base' });
  JEWELRY_GEMS.forEach((g, i) => {
    const m = gemMods[g.id];
    const id = `${g.id}_${slot}`;
    const p = i + 2;
    addEquip({ id, name: `${g.name}${slot === 'ring' ? '戒指' : '项链'}`, type: 'equipment', icon: slot === 'ring' ? '💍' : '📿', color: g.color, exp: g.exp, sell: g.sell * 2 + 100,
      equipment: { slot, requirements: [], stats: { magicAttack: p * 3, magicDefence: p * 2, magicDamage: slot === 'amulet' ? p : 0 }, modifiers: slot === 'ring' ? m.ring : m.amulet },
      description: slot === 'ring' ? m.rd : m.ad });
    JEWELRY.push({ id, level: [20, 35, 50, 65, 80, 100][i] + (slot === 'amulet' ? 3 : 0), bar: 'bar_gold', gem: `gem_${g.id}`, slot, exp: g.exp });
  });
}

// ---------------------------------------------------------------------------
// 技能披风（99 级可在商店购买）与全能披风
// ---------------------------------------------------------------------------
export const CAPE_MODS: Partial<Record<SkillId, { mods: ModifierMap; desc: string }>> = {
  attack: { mods: { meleeAccuracy: 10 }, desc: '近战命中 +10%' },
  strength: { mods: { meleeMaxHit: 6 }, desc: '近战最大伤害 +6%' },
  defence: { mods: { damageReductionFlat: 5 }, desc: '伤害减免 +5%' },
  hitpoints: { mods: { hpRegen: 100, foodHealing: 10 }, desc: '生命回复 +100%，食物治疗 +10%' },
  ranged: { mods: { rangedMaxHit: 6, ammoPreservation: 10 }, desc: '远程伤害 +6%，弹药节省 +10%' },
  magic: { mods: { magicMaxHit: 6, runePreservation: 10 }, desc: '魔法伤害 +6%，符文节省 +10%' },
  prayer: { mods: { prayerPreservation: 25 }, desc: '祈祷点节省 +25%' },
  slayer: { mods: { slayerCoins: 15, 'skillXP:slayer': 5 }, desc: '猎杀币 +15%，猎杀经验 +5%' },
  woodcutting: { mods: { 'doubleItems:woodcutting': 10 }, desc: '伐木双倍产出 +10%' },
  fishing: { mods: { 'skillInterval:fishing': -10 }, desc: '钓鱼耗时 -10%' },
  firemaking: { mods: { 'skillInterval:firemaking': -10 }, desc: '生火耗时 -10%' },
  cooking: { mods: { 'cookingSuccess': 10, 'skillInterval:cooking': -5 }, desc: '烹饪成功率 +10%，耗时 -5%' },
  mining: { mods: { 'additionalItem:mining': 1 }, desc: '采矿每次额外 +1 矿石' },
  smithing: { mods: { 'preservation:smithing': 10 }, desc: '锻造材料节省 +10%' },
  thieving: { mods: { 'thievingStealth': 30, 'gpGlobal:thieving': 10 }, desc: '潜行 +30，偷窃金币 +10%' },
  farming: { mods: { 'farmingYield': 20 }, desc: '农业收成 +20%' },
  fletching: { mods: { 'additionalItem:fletching': 1 }, desc: '制箭额外产出 +1' },
  crafting: { mods: { 'preservation:crafting': 10 }, desc: '制作材料节省 +10%' },
  runecrafting: { mods: { 'doubleItems:runecrafting': 15 }, desc: '符文双倍产出 +15%' },
  herblore: { mods: { 'potionCharges': 2 }, desc: '药水充能 +2' },
  agility: { mods: { 'agilityObstacleCost': -50 }, desc: '障碍建造成本 -50%' },
  summoning: { mods: { 'summonChargePreservation': 10 }, desc: '召唤充能节省 +10%' },
  astrology: { mods: { 'doubleItems:astrology': 10 }, desc: '星尘双倍 +10%' },
  township: { mods: { 'townshipProduction': 10 }, desc: '城镇产出 +10%' },
  cartography: { mods: { 'skillInterval:cartography': -10 }, desc: '勘测耗时 -10%' },
  archaeology: { mods: { 'artifactChance': 10 }, desc: '文物发现率 +10%' },
  corruption: { mods: { 'abyssalResistanceFlat': 5 }, desc: '深渊抗性 +5' },
  harvesting: { mods: { 'harvestIntensity': 2 }, desc: '收割强度增长 +2' },
};
for (const [skill, cfg] of Object.entries(CAPE_MODS)) {
  const exp: ExpansionId = skill === 'cartography' || skill === 'archaeology' ? 'aod' : skill === 'corruption' || skill === 'harvesting' ? 'ita' : 'base';
  addEquip({ id: `cape_${skill}`, name: `${C.skills[skill as SkillId]?.name ?? skill}技能披风`, type: 'equipment', icon: '🧣', color: '#f4d03f', exp, sell: 0, noSell: true,
    equipment: { slot: 'cape', requirements: [{ skill: skill as SkillId, level: 99 }], stats: { meleeDefence: 9, rangedDefence: 9, magicDefence: 9, damageReduction: 2 }, modifiers: cfg!.mods }, description: cfg!.desc, rarity: 2 });
}
addEquip({ id: 'cape_max', name: '全能披风', type: 'equipment', icon: '🎽', color: '#f5b041', exp: 'base', sell: 0, noSell: true, rarity: 3,
  equipment: { slot: 'cape', requirements: [], stats: { meleeDefence: 15, rangedDefence: 15, magicDefence: 15, damageReduction: 4 }, modifiers: Object.values(CAPE_MODS).reduce((acc, c) => { for (const [k, v] of Object.entries(c!.mods)) acc[k] = (acc[k] || 0) + v; return acc; }, {} as ModifierMap) },
  description: '集合全部技能披风效果，需要所有技能达到 99 级。' });
addEquip({ id: 'cape_herald', name: '使者至尊披风', type: 'equipment', icon: '🎽', color: '#d4ac0d', exp: 'toth', sell: 0, noSell: true, rarity: 3,
  equipment: { slot: 'cape', requirements: [], stats: { meleeDefence: 25, rangedDefence: 25, magicDefence: 25, damageReduction: 6 }, modifiers: { skillXP: 5, masteryXP: 5, maxHit: 5, ...Object.values(CAPE_MODS).reduce((acc, c) => { for (const [k, v] of Object.entries(c!.mods)) acc[k] = (acc[k] || 0) + v; return acc; }, {} as ModifierMap) } },
  description: '需要所有技能达到 120 级（Throne of the Herald）。' });

// 技能工具类装备（手套等由商店提供充能）
for (const g of ([
  { id: 'gloves_cooking', name: '烹饪手套', skill: 'cooking', desc: '烹饪成功率 100%（消耗充能）', mods: { cookingSuccess: 100 } },
  { id: 'gloves_mining', name: '采矿手套', skill: 'mining', desc: '采矿额外 +1 矿石（消耗充能）', mods: { 'additionalItem:mining': 1 } },
  { id: 'gloves_smithing', name: '锻造手套', skill: 'smithing', desc: '锻造经验 +50%（消耗充能）', mods: { 'skillXP:smithing': 50 } },
  { id: 'gloves_thieving', name: '偷窃手套', skill: 'thieving', desc: '潜行 +75（消耗充能）', mods: { thievingStealth: 75 } },
  { id: 'gloves_gem', name: '宝石手套', skill: 'mining', desc: '采矿宝石几率 +5%（消耗充能）', mods: { miningGemChance: 5 } },
] as { id: string; name: string; skill: string; desc: string; mods: ModifierMap }[])) {
  addEquip({ id: g.id, name: g.name, type: 'equipment', icon: '🧤', color: '#aab7b8', exp: 'base', sell: 0, noSell: true,
    equipment: { slot: 'gloves', requirements: [], stats: {}, modifiers: g.mods }, description: g.desc });
}
