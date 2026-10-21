// 制造技能内容：生火、烹饪、锻造、制箭、制作、符文、药剂
import { addAction, addItem, C } from '../registry';
import { LOGS, logId, FISH, rawFishId, cookedFishId, BARS, barId, RUNES, COMBO_RUNES, runeId, HIDES, HERBS } from '../items/materials';
import { METAL_TIERS, SMITH_PIECES, equipId, LEATHER_PIECES, DHIDE_PIECES, STAFF_TIERS, ELEMENTS, ROBE_TIERS, ROBE_PIECES, JEWELRY, BOW_LEVELS } from '../items/equipment';
import type { ExpansionId, ItemQty, ModifierMap, SkillId } from '@/game/core/types';

const abyssXp = (xp: number, ab?: number) => (ab ? Math.round(xp * 0.6) : undefined);

// --------------------------------------------------------------------------- 生火
for (const l of LOGS) {
  addAction({
    id: `fm_${l.id}`, skill: 'firemaking', name: `燃烧${C.items[logId(l.id)].name}`, icon: '🔥', level: l.fmLevel, abyssalLevel: l.abyssal, realm: l.realm,
    interval: l.fmInterval, xp: l.fmXp, abyssalXp: abyssXp(l.fmXp, l.abyssal), inputs: [{ id: logId(l.id), qty: 1 }], outputs: [],
    extraDrops: [{ id: 'ash', chance: 0.4 }, { id: 'charcoal', chance: 0.05 }],
    data: { bonfireLogs: 10, bonfireBonus: 5 + Math.floor(l.fmLevel / 20) * 2, bonfireDuration: 10 * 60 * 1000 },
    expansion: l.exp,
  });
}

// --------------------------------------------------------------------------- 烹饪
for (const f of FISH) {
  addAction({
    id: `cook_${f.id}`, skill: 'cooking', name: C.items[cookedFishId(f.id)].name, icon: '🍣', category: 'fire',
    level: f.cookLevel, abyssalLevel: f.abyssal, realm: f.realm, interval: 3000 + Math.floor(f.cookLevel / 25) * 500, xp: f.cookXp, abyssalXp: abyssXp(f.cookXp, f.abyssal),
    inputs: [{ id: rawFishId(f.id), qty: 1 }], outputs: [{ id: cookedFishId(f.id), qty: 1 }],
    data: { burnt: `burnt_${f.id}`, perfect: `perfect_${f.id}` }, expansion: f.exp,
  });
}
const MEALS: { id: string; name: string; icon: string; cat: 'fire' | 'furnace' | 'pot'; level: number; xp: number; heals: number; inputs: ItemQty[]; interval: number; sell: number }[] = [
  { id: 'chicken', name: '烤鸡', icon: '🍗', cat: 'fire', level: 1, xp: 5, heals: 40, inputs: [{ id: 'raw_chicken', qty: 1 }], interval: 3000, sell: 3 },
  { id: 'beef', name: '牛排', icon: '🥩', cat: 'fire', level: 1, xp: 6, heals: 50, inputs: [{ id: 'raw_beef', qty: 1 }], interval: 3000, sell: 4 },
  { id: 'boar', name: '烤野猪肉', icon: '🍖', cat: 'fire', level: 25, xp: 28, heals: 100, inputs: [{ id: 'raw_boar', qty: 1 }], interval: 3500, sell: 12 },
  { id: 'bread', name: '面包', icon: '🍞', cat: 'furnace', level: 5, xp: 15, heals: 60, inputs: [{ id: 'crop_wheat', qty: 2 }], interval: 4000, sell: 6 },
  { id: 'omelette', name: '煎蛋卷', icon: '🍳', cat: 'furnace', level: 15, xp: 25, heals: 80, inputs: [{ id: 'egg', qty: 2 }, { id: 'milk', qty: 1 }], interval: 4000, sell: 10 },
  { id: 'meat_pie', name: '肉派', icon: '🥧', cat: 'furnace', level: 30, xp: 45, heals: 140, inputs: [{ id: 'crop_wheat', qty: 2 }, { id: 'raw_beef', qty: 1 }, { id: 'crop_onion', qty: 1 }], interval: 4500, sell: 25 },
  { id: 'pizza', name: '番茄披萨', icon: '🍕', cat: 'furnace', level: 45, xp: 70, heals: 190, inputs: [{ id: 'crop_wheat', qty: 2 }, { id: 'crop_tomato', qty: 2 }, { id: 'milk', qty: 1 }], interval: 5000, sell: 40 },
  { id: 'strawberry_cake', name: '草莓蛋糕', icon: '🍰', cat: 'furnace', level: 60, xp: 100, heals: 240, inputs: [{ id: 'crop_wheat', qty: 2 }, { id: 'crop_strawberry', qty: 3 }, { id: 'egg', qty: 2 }], interval: 5500, sell: 70 },
  { id: 'carrot_cake', name: '胡萝卜蛋糕', icon: '🎂', cat: 'furnace', level: 75, xp: 140, heals: 300, inputs: [{ id: 'crop_wheat', qty: 3 }, { id: 'crop_carrot', qty: 3 }, { id: 'egg', qty: 2 }, { id: 'milk', qty: 1 }], interval: 6000, sell: 110 },
  { id: 'potato_soup', name: '土豆汤', icon: '🥣', cat: 'pot', level: 10, xp: 20, heals: 70, inputs: [{ id: 'crop_potato', qty: 3 }], interval: 4000, sell: 8 },
  { id: 'cabbage_soup', name: '卷心菜汤', icon: '🥗', cat: 'pot', level: 20, xp: 32, heals: 100, inputs: [{ id: 'crop_cabbage', qty: 2 }, { id: 'crop_onion', qty: 1 }], interval: 4500, sell: 14 },
  { id: 'beef_stew', name: '炖牛肉', icon: '🍲', cat: 'pot', level: 35, xp: 55, heals: 160, inputs: [{ id: 'raw_beef', qty: 2 }, { id: 'crop_potato', qty: 2 }, { id: 'crop_onion', qty: 1 }], interval: 5000, sell: 30 },
  { id: 'corn_chowder', name: '玉米浓汤', icon: '🌽', cat: 'pot', level: 50, xp: 80, heals: 210, inputs: [{ id: 'crop_sweetcorn', qty: 3 }, { id: 'milk', qty: 1 }, { id: 'crop_onion', qty: 1 }], interval: 5500, sell: 50 },
  { id: 'melon_salad', name: '西瓜沙拉', icon: '🍉', cat: 'pot', level: 65, xp: 115, heals: 260, inputs: [{ id: 'crop_watermelon', qty: 2 }, { id: 'crop_strawberry', qty: 2 }], interval: 5500, sell: 80 },
  { id: 'seafood_stew', name: '海鲜杂烩', icon: '🦞', cat: 'pot', level: 80, xp: 170, heals: 340, inputs: [{ id: 'raw_lobster', qty: 1 }, { id: 'raw_crab', qty: 1 }, { id: 'crop_potato', qty: 2 }], interval: 6000, sell: 140 },
  { id: 'herald_feast', name: '使者盛宴', icon: '🍱', cat: 'pot', level: 105, xp: 260, heals: 450, inputs: [{ id: 'raw_frosteel', qty: 1 }, { id: 'raw_whale', qty: 1 }, { id: 'crop_carrot', qty: 3 }], interval: 7000, sell: 300 },
  { id: 'void_broth', name: '虚空浓汤', icon: '🫕', cat: 'pot', level: 99, xp: 400, heals: 700, inputs: [{ id: 'raw_voidfish', qty: 2 }, { id: 'herb_voidroot', qty: 1 }], interval: 7000, sell: 600 },
];
for (const m of MEALS) {
  const id = m.id === 'bread' ? 'bread' : `food_${m.id}`;
  if (!C.items[id]) addItem({ id, name: m.name, type: 'food', icon: m.icon, sellPrice: m.sell, category: '食物', healsFor: m.heals, expansion: m.level > 99 ? 'toth' : m.id === 'void_broth' ? 'ita' : 'base' });
  addItem({ id: `perfect_${m.id}`, name: `完美${m.name}`, type: 'food', icon: m.icon, color: '#f7dc6f', sellPrice: m.sell * 2, category: '食物', healsFor: Math.round(m.heals * 1.3), rarity: 1, expansion: C.items[id].expansion });
  addItem({ id: `burnt_${m.id}`, name: `烧焦的${m.name}`, type: 'junk', icon: '🔥', color: '#4d5656', sellPrice: 0, category: '杂物', expansion: C.items[id].expansion });
  addAction({
    id: `cook_${m.id}`, skill: 'cooking', name: m.name, icon: m.icon, category: m.cat, level: m.level, realm: m.id === 'void_broth' ? 'abyssal' : 'melvor',
    abyssalLevel: m.id === 'void_broth' ? 5 : undefined, abyssalXp: m.id === 'void_broth' ? 240 : undefined,
    interval: m.interval, xp: m.xp, inputs: m.inputs, outputs: [{ id, qty: 1 }], data: { burnt: `burnt_${m.id}`, perfect: `perfect_${m.id}` }, expansion: C.items[id].expansion,
  });
}

// --------------------------------------------------------------------------- 锻造
for (const b of BARS) {
  addAction({
    id: `smelt_${b.id}`, skill: 'smithing', name: `${b.name}锭`, icon: '🧱', category: 'bars', level: b.level, abyssalLevel: b.abyssal, realm: b.realm,
    interval: 2000, xp: b.xp, abyssalXp: abyssXp(b.xp, b.abyssal), inputs: b.ores, outputs: [{ id: barId(b.id), qty: 1 }], expansion: b.exp,
    // 木炭可代替煤
    altInputs: b.ores.some((o) => o.id === 'ore_coal') ? [b.ores.map((o) => (o.id === 'ore_coal' ? { id: 'charcoal', qty: Math.ceil(o.qty / 2) } : o))] : undefined,
  });
}
const BAR_FOR_TIER: Record<string, { bar: string; level: number; abyssal?: number; xpBase: number }> = {};
for (const t of METAL_TIERS) {
  const b = BARS.find((x) => x.id === t.id)!;
  BAR_FOR_TIER[t.id] = { bar: barId(b.id), level: b.level, abyssal: b.abyssal, xpBase: b.xp };
}
for (const t of METAL_TIERS) {
  const info = BAR_FOR_TIER[t.id];
  for (const piece of SMITH_PIECES) {
    const id = equipId(t.id, piece.key);
    const lvl = Math.min(info.abyssal ? 99 : 120, info.level + piece.levelOffset);
    addAction({
      id: `smith_${id}`, skill: 'smithing', name: C.items[id].name, icon: piece.icon, category: t.id, level: info.abyssal ? 99 : lvl,
      abyssalLevel: info.abyssal ? info.abyssal + piece.levelOffset : undefined, realm: t.realm,
      interval: 2000, xp: Math.round(info.xpBase * piece.bars * 1.6), abyssalXp: info.abyssal ? Math.round(info.xpBase * piece.bars) : undefined,
      inputs: [{ id: info.bar, qty: piece.bars }], outputs: [{ id, qty: piece.outputQty ?? 1 }], expansion: t.exp,
    });
  }
}

// --------------------------------------------------------------------------- 制箭
LOGS.forEach((l, i) => {
  const shafts = Math.min(15 * (i + 1), 120);
  addAction({ id: `fletch_shafts_${l.id}`, skill: 'fletching', name: `箭杆（${C.items[logId(l.id)].name}）`, icon: '🥢', category: 'shafts', level: 1, interval: 2000, xp: 1 + i,
    inputs: [{ id: logId(l.id), qty: 1 }], outputs: [{ id: 'arrow_shafts', qty: shafts }], expansion: l.exp, realm: 'melvor', masteryEnabled: true });
  const lvl = BOW_LEVELS[l.id];
  addAction({ id: `fletch_${l.id}_shortbow`, skill: 'fletching', name: C.items[`${l.id}_shortbow`].name, icon: '🏹', category: 'bows', level: l.abyssal ? 99 : Math.max(1, lvl), abyssalLevel: l.abyssal, realm: l.realm,
    interval: 2000, xp: Math.round(l.xp * 0.8 + 5), abyssalXp: abyssXp(l.xp * 0.8, l.abyssal), inputs: [{ id: logId(l.id), qty: 2 }], outputs: [{ id: `${l.id}_shortbow`, qty: 1 }], expansion: l.exp });
  addAction({ id: `fletch_${l.id}_longbow`, skill: 'fletching', name: C.items[`${l.id}_longbow`].name, icon: '🏹', category: 'bows', level: l.abyssal ? 99 : Math.min(120, lvl + 5), abyssalLevel: l.abyssal ? l.abyssal + 5 : undefined, realm: l.realm,
    interval: 2000, xp: Math.round(l.xp * 1.1 + 8), abyssalXp: abyssXp(l.xp * 1.1, l.abyssal), inputs: [{ id: logId(l.id), qty: 3 }], outputs: [{ id: `${l.id}_longbow`, qty: 1 }], expansion: l.exp });
});
addAction({ id: 'fletch_headless', skill: 'fletching', name: '无头箭', icon: '➖', category: 'arrows', level: 1, interval: 2000, xp: 1,
  inputs: [{ id: 'arrow_shafts', qty: 15 }, { id: 'feather', qty: 15 }], outputs: [{ id: 'headless_arrows', qty: 15 }], expansion: 'base' });
for (const t of METAL_TIERS) {
  const info = BAR_FOR_TIER[t.id];
  const base = info.abyssal ? 99 : Math.max(1, info.level);
  addAction({ id: `fletch_${t.id}_arrows`, skill: 'fletching', name: C.items[`${t.id}_arrows`].name, icon: '➶', category: 'arrows', level: base, abyssalLevel: info.abyssal, realm: t.realm,
    interval: 2000, xp: Math.round(info.xpBase * 1.2 + 2), abyssalXp: abyssXp(info.xpBase, info.abyssal),
    inputs: [{ id: 'headless_arrows', qty: 15 }, { id: equipId(t.id, 'arrowtips'), qty: 15 }], outputs: [{ id: `${t.id}_arrows`, qty: 15 }], expansion: t.exp });
  addAction({ id: `fletch_${t.id}_bolts`, skill: 'fletching', name: C.items[`${t.id}_bolts`].name, icon: '➵', category: 'bolts', level: info.abyssal ? 99 : Math.min(120, base + 4), abyssalLevel: info.abyssal ? info.abyssal + 4 : undefined, realm: t.realm,
    interval: 2000, xp: Math.round(info.xpBase * 1.4 + 3), abyssalXp: abyssXp(info.xpBase * 1.2, info.abyssal),
    inputs: [{ id: 'arrow_shafts', qty: 15 }, { id: equipId(t.id, 'bolttips'), qty: 15 }], outputs: [{ id: `${t.id}_bolts`, qty: 15 }], expansion: t.exp });
  addAction({ id: `fletch_${t.id}_javelin`, skill: 'fletching', name: C.items[`${t.id}_javelin`].name, icon: '🔱', category: 'javelins', level: info.abyssal ? 99 : Math.min(120, base + 3), abyssalLevel: info.abyssal ? info.abyssal + 3 : undefined, realm: t.realm,
    interval: 2000, xp: Math.round(info.xpBase * 1.3 + 3), abyssalXp: abyssXp(info.xpBase * 1.1, info.abyssal),
    inputs: [{ id: 'arrow_shafts', qty: 10 }, { id: equipId(t.id, 'javhead'), qty: 10 }], outputs: [{ id: `${t.id}_javelin`, qty: 10 }], expansion: t.exp });
  addAction({ id: `fletch_${t.id}_crossbow`, skill: 'fletching', name: C.items[`${t.id}_crossbow`].name, icon: '🏹', category: 'crossbows', level: info.abyssal ? 99 : Math.min(120, base + 6), abyssalLevel: info.abyssal ? info.abyssal + 6 : undefined, realm: t.realm,
    interval: 2500, xp: Math.round(info.xpBase * 2.4 + 6), abyssalXp: abyssXp(info.xpBase * 2, info.abyssal),
    inputs: [{ id: info.bar, qty: 2 }, { id: logId(t.realm === 'abyssal' ? 'voidwood' : 'maple'), qty: 2 }], outputs: [{ id: `${t.id}_crossbow`, qty: 1 }], expansion: t.exp });
}

// --------------------------------------------------------------------------- 制作
addAction({ id: 'craft_leather', skill: 'crafting', name: '皮革', icon: '🟫', category: 'leather', level: 1, interval: 2000, xp: 3, inputs: [{ id: 'cowhide', qty: 1 }], outputs: [{ id: 'leather', qty: 1 }], expansion: 'base' });
for (const piece of LEATHER_PIECES) {
  addAction({ id: `craft_leather_${piece.key}`, skill: 'crafting', name: C.items[`leather_${piece.key}`].name, icon: '🧥', category: 'leather', level: piece.level, interval: 2000, xp: 10 + piece.level,
    inputs: [{ id: 'leather', qty: piece.mats }], outputs: [{ id: `leather_${piece.key}`, qty: 1 }], expansion: 'base' });
}
HIDES.forEach((h) => {
  const ab = (h as any).abyssal as number | undefined;
  addAction({ id: `craft_dleather_${h.id}`, skill: 'crafting', name: C.items[`dleather_${h.id}`].name, icon: '🟥', category: 'dragonhide', level: ab ? 99 : h.level - 5, abyssalLevel: ab, realm: ab ? 'abyssal' : 'melvor',
    interval: 2000, xp: Math.round(h.level * 0.6), abyssalXp: abyssXp(h.level * 2, ab), inputs: [{ id: `hide_${h.id}`, qty: 1 }], outputs: [{ id: `dleather_${h.id}`, qty: 1 }], expansion: h.exp });
  DHIDE_PIECES.forEach((piece, j) => {
    addAction({ id: `craft_dhide_${h.id}_${piece.key}`, skill: 'crafting', name: C.items[`dhide_${h.id}_${piece.key}`].name, icon: '🥋', category: 'dragonhide', level: ab ? 99 : Math.min(120, h.level + j * 2), abyssalLevel: ab ? ab + j * 2 : undefined, realm: ab ? 'abyssal' : 'melvor',
      interval: 2000, xp: Math.round(h.level * 1.4 * piece.mats), abyssalXp: abyssXp(h.level * 2.5 * piece.mats, ab), inputs: [{ id: `dleather_${h.id}`, qty: piece.mats }], outputs: [{ id: `dhide_${h.id}_${piece.key}`, qty: 1 }], expansion: h.exp });
  });
});
for (const j of JEWELRY) {
  const inputs: ItemQty[] = [{ id: j.bar, qty: 1 }];
  if (j.gem) inputs.push({ id: j.gem, qty: 1 });
  addAction({ id: `craft_${j.id}`, skill: 'crafting', name: C.items[j.id].name, icon: j.slot === 'ring' ? '💍' : '📿', category: 'jewelry', level: j.level, interval: 2500, xp: Math.round(15 + j.level * 1.2),
    inputs, outputs: [{ id: j.id, qty: 1 }], expansion: j.exp });
}

// --------------------------------------------------------------------------- 符文
for (const r of RUNES) {
  const ab = (r as any).abyssal as number | undefined;
  addAction({ id: `rc_${r.id}`, skill: 'runecrafting', name: r.name, icon: '🔷', category: 'runes', level: ab ? 99 : r.level, abyssalLevel: ab, realm: ab ? 'abyssal' : 'melvor',
    interval: 2000, xp: r.xp, abyssalXp: abyssXp(r.xp * 3, ab), inputs: [{ id: r.essence, qty: 1 }], outputs: [{ id: runeId(r.id), qty: 1 }],
    data: { multiplierLevels: ab ? [] : [r.level + 15, r.level + 30, r.level + 45] }, expansion: r.level > 99 ? 'toth' : ab ? 'ita' : 'base' });
}
for (const r of COMBO_RUNES) {
  addAction({ id: `rc_${r.id}`, skill: 'runecrafting', name: r.name, icon: '🔶', category: 'combo', level: r.level, interval: 2000, xp: r.xp,
    inputs: [{ id: 'rune_essence', qty: 2 }, { id: runeId(r.parts[0]), qty: 1 }, { id: runeId(r.parts[1]), qty: 1 }], outputs: [{ id: runeId(r.id), qty: 2 }], expansion: 'base' });
}
for (const tier of STAFF_TIERS) {
  for (const el of ELEMENTS) {
    const id = `staff_${tier.id}_${el.id}`;
    addAction({ id: `rc_${id}`, skill: 'runecrafting', name: C.items[id].name, icon: '🪄', category: 'staves', level: tier.level, interval: 3000, xp: Math.round(20 + tier.level * 3),
      inputs: [{ id: tier.log, qty: tier.logs }, { id: runeId(el.id), qty: tier.runes }], outputs: [{ id, qty: 1 }], expansion: tier.exp });
  }
}
addAction({ id: 'rc_staff_void', skill: 'runecrafting', name: '虚空法杖', icon: '🪄', category: 'staves', level: 99, abyssalLevel: 25, realm: 'abyssal', interval: 3000, xp: 900, abyssalXp: 600,
  inputs: [{ id: 'log_shadowwood', qty: 5 }, { id: 'rune_void', qty: 400 }, { id: 'abyssal_shard', qty: 20 }], outputs: [{ id: 'staff_void', qty: 1 }], expansion: 'ita' });
for (const tier of ROBE_TIERS) {
  const ab = (tier as any).abyssal as number | undefined;
  ROBE_PIECES.forEach((piece, j) => {
    const id = `robe_${tier.id}_${piece.key}`;
    addAction({ id: `rc_${id}`, skill: 'runecrafting', name: C.items[id].name, icon: '🧙', category: 'robes', level: ab ? 99 : Math.min(120, tier.level + j * 2), abyssalLevel: ab ? ab + j * 2 : undefined, realm: ab ? 'abyssal' : 'melvor',
      interval: 3000, xp: Math.round((15 + tier.level * 2) * piece.mats), abyssalXp: abyssXp((tier.level * 2) * piece.mats, ab),
      inputs: [{ id: tier.leather, qty: piece.mats }, { id: tier.runes, qty: piece.mats * 20 }], outputs: [{ id, qty: 1 }], expansion: tier.exp });
  });
}

// --------------------------------------------------------------------------- 药剂与药水
interface PotionCfg { id: string; name: string; skill: SkillId | 'combat'; mods: ModifierMap; desc: string; heal?: number; secondary: string }
const ROMAN = ['I', 'II', 'III', 'IV'];
const TIER_SCALE = [1, 1.5, 2, 3];
export const POTIONS: PotionCfg[] = [
  { id: 'woodcutting', name: '樵夫药水', skill: 'woodcutting', mods: { 'doubleItems:woodcutting': 5 }, desc: '伐木双倍产出 +{v}%', secondary: 'log_oak' },
  { id: 'fishing', name: '渔夫药水', skill: 'fishing', mods: { 'skillInterval:fishing': -4 }, desc: '钓鱼耗时 {v}%', secondary: 'raw_sardine' },
  { id: 'firemaking', name: '火焰药水', skill: 'firemaking', mods: { 'skillXP:firemaking': 5 }, desc: '生火经验 +{v}%', secondary: 'ash' },
  { id: 'cooking', name: '厨师药水', skill: 'cooking', mods: { cookingSuccess: 6 }, desc: '烹饪成功率 +{v}%', secondary: 'crop_potato' },
  { id: 'mining', name: '矿工药水', skill: 'mining', mods: { 'doubleItems:mining': 5 }, desc: '采矿双倍产出 +{v}%', secondary: 'ore_copper' },
  { id: 'smithing', name: '铁匠药水', skill: 'smithing', mods: { 'preservation:smithing': 5 }, desc: '锻造材料节省 +{v}%', secondary: 'ore_iron' },
  { id: 'thieving', name: '盗贼药水', skill: 'thieving', mods: { thievingStealth: 20 }, desc: '潜行 +{v}', secondary: 'coin_pouch' },
  { id: 'farming', name: '园丁药水', skill: 'farming', mods: { farmingYield: 6 }, desc: '农业收成 +{v}%', secondary: 'compost' },
  { id: 'fletching', name: '箭匠药水', skill: 'fletching', mods: { 'preservation:fletching': 5 }, desc: '制箭材料节省 +{v}%', secondary: 'feather' },
  { id: 'crafting', name: '工匠药水', skill: 'crafting', mods: { 'doubleItems:crafting': 5 }, desc: '制作双倍产出 +{v}%', secondary: 'leather' },
  { id: 'runecrafting', name: '符文药水', skill: 'runecrafting', mods: { 'doubleItems:runecrafting': 6 }, desc: '符文双倍产出 +{v}%', secondary: 'rune_essence' },
  { id: 'herblore', name: '炼金药水', skill: 'herblore', mods: { 'preservation:herblore': 5 }, desc: '药剂材料节省 +{v}%', secondary: 'herb_moonwort' },
  { id: 'agility', name: '疾风药水', skill: 'agility', mods: { 'gpGlobal:agility': 8 }, desc: '敏捷金币 +{v}%', secondary: 'feather' },
  { id: 'summoning', name: '唤灵药水', skill: 'summoning', mods: { 'preservation:summoning': 5 }, desc: '召唤材料节省 +{v}%', secondary: 'shard_green' },
  { id: 'astrology', name: '星辰药水', skill: 'astrology', mods: { 'doubleItems:astrology': 5 }, desc: '星尘双倍 +{v}%', secondary: 'stardust' },
  { id: 'archaeology', name: '考古药水', skill: 'archaeology', mods: { artifactChance: 5 }, desc: '文物发现率 +{v}%', secondary: 'paper' },
  { id: 'cartography', name: '勘测药水', skill: 'cartography', mods: { 'skillInterval:cartography': -4 }, desc: '勘测耗时 {v}%', secondary: 'paper' },
  { id: 'harvesting', name: '收割药水', skill: 'harvesting', mods: { harvestIntensity: 2 }, desc: '收割强度增长 +{v}', secondary: 'abyssal_shard' },
  { id: 'accuracy', name: '精准药水', skill: 'combat', mods: { meleeAccuracy: 5, rangedAccuracy: 5, magicAccuracy: 5 }, desc: '全部命中 +{v}%', secondary: 'raw_trout' },
  { id: 'strength', name: '力量药水', skill: 'combat', mods: { meleeMaxHit: 4 }, desc: '近战最大伤害 +{v}%', secondary: 'raw_beef' },
  { id: 'ranging', name: '射手药水', skill: 'combat', mods: { rangedMaxHit: 4 }, desc: '远程最大伤害 +{v}%', secondary: 'feather' },
  { id: 'magic', name: '法师药水', skill: 'combat', mods: { magicMaxHit: 4 }, desc: '魔法最大伤害 +{v}%', secondary: 'rune_mind' },
  { id: 'defence', name: '坚守药水', skill: 'combat', mods: { damageReductionFlat: 2 }, desc: '伤害减免 +{v}%', secondary: 'bar_iron' },
  { id: 'healing', name: '治疗药水', skill: 'combat', mods: {}, heal: 15, desc: '生命低于 20% 时恢复 {v}% 最大生命', secondary: 'crop_cabbage' },
  { id: 'lifesteal', name: '吸血药水', skill: 'combat', mods: { lifesteal: 2 }, desc: '生命偷取 +{v}%', secondary: 'big_bones' },
  { id: 'evasion', name: '敏捷身法药水', skill: 'combat', mods: { evasion: 4 }, desc: '全部闪避 +{v}%', secondary: 'dleather_green' },
  { id: 'abyssal', name: '深渊抗性药水', skill: 'combat', mods: { abyssalResistanceFlat: 3 }, desc: '深渊抗性 +{v}', secondary: 'abyssal_shard' },
];
POTIONS.forEach((p, i) => {
  const HERB_FOR_POTION = [0, 1, 0, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 1, 2, 3, 4, 5, 6, 9, 8, 8];
  const herb = HERBS[p.id === 'abyssal' || p.id === 'harvesting' ? HERBS.length - 1 : HERB_FOR_POTION[i] ?? 0];
  const exp: ExpansionId = ['archaeology', 'cartography'].includes(p.id) ? 'aod' : ['harvesting', 'abyssal'].includes(p.id) ? 'ita' : herb.exp === 'toth' ? 'toth' : 'base';
  const isAbyss = exp === 'ita';
  const items: string[] = [];
  for (let t = 1; t <= 4; t++) {
    const scale = TIER_SCALE[t - 1];
    const mods: ModifierMap = {};
    for (const [k, v] of Object.entries(p.mods)) mods[k] = Math.round(v * scale * 10) / 10;
    const shown = p.heal ? Math.round(p.heal * scale) : Object.values(mods)[0];
    const id = `potion_${p.id}_${t}`;
    items.push(id);
    addItem({ id, name: `${p.name} ${ROMAN[t - 1]}`, type: 'potion', icon: '🧪', color: herb.color, sellPrice: Math.round((herb.sell + 5) * t * 1.5), category: '药水', expansion: exp,
      potion: { skill: p.skill, tier: t, charges: p.skill === 'combat' ? [25, 50, 75, 100][t - 1] : [15, 25, 40, 60][t - 1], modifiers: mods, healPercent: p.heal ? Math.round(p.heal * scale) : undefined },
      description: p.desc.replace('{v}', String(shown)) });
  }
  const level = isAbyss ? 99 : herb.level + (i % 3) * 2;
  addAction({ id: `herb_${p.id}`, skill: 'herblore', name: p.name, icon: '🧪', category: p.skill === 'combat' ? 'combat' : 'skill', level, abyssalLevel: isAbyss ? (p.id === 'abyssal' ? 15 : 5) : undefined, realm: isAbyss ? 'abyssal' : 'melvor',
    interval: 2000, xp: Math.round(herb.xp * 0.8 + 4), abyssalXp: isAbyss ? Math.round(herb.xp * 0.5) : undefined,
    inputs: [{ id: `herb_${herb.id}`, qty: 1 }, { id: p.secondary, qty: 1 }], outputs: [{ id: items[0], qty: 1 }],
    data: { tiers: items, tierMastery: [1, 20, 50, 90] }, expansion: exp });
});
