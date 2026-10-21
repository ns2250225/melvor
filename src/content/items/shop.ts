// 商店内容
import { addShopItem, C } from '../registry';
import { SHARDS, shardId } from '../items/materials';
import type { ShopItemDef, SkillId, Requirement, ModifierMap, ExpansionId } from '@/game/core/types';

const shop = (d: Omit<ShopItemDef, 'expansion' | 'requirements' | 'buyLimit'> & Partial<Pick<ShopItemDef, 'expansion' | 'requirements' | 'buyLimit'>>) =>
  addShopItem({ expansion: 'base', requirements: [], buyLimit: 1, ...d } as ShopItemDef);

// --------------------------------------------------------------------------- 通用
shop({ id: 'bank_slot', name: '银行扩容', icon: '🏦', category: '通用', description: '银行容量 +1 格', cost: { gp: 0, scaling: 'bankSlot' }, upgrade: { flag: 'bankSlot' }, buyLimit: 1500 });
shop({ id: 'equip_set_2', name: '装备方案 2', icon: '🎽', category: '通用', description: '解锁第 2 套装备方案', cost: { gp: 50000 }, upgrade: { flag: 'equipSet2' } });
shop({ id: 'equip_set_3', name: '装备方案 3', icon: '🎽', category: '通用', description: '解锁第 3 套装备方案', cost: { gp: 500000 }, upgrade: { flag: 'equipSet3' }, requirements: [{ type: 'shop', id: 'equip_set_2' }] });
shop({ id: 'food_slot_2', name: '食物栏 2', icon: '🍽️', category: '通用', description: '解锁第 2 个食物栏', cost: { gp: 20000 }, upgrade: { flag: 'foodSlot2' } });
shop({ id: 'food_slot_3', name: '食物栏 3', icon: '🍽️', category: '通用', description: '解锁第 3 个食物栏', cost: { gp: 200000 }, upgrade: { flag: 'foodSlot3' }, requirements: [{ type: 'shop', id: 'food_slot_2' }] });
shop({ id: 'autoeat_1', name: '自动进食 I', icon: '🍴', category: '通用', description: '生命低于 20% 时自动进食，效率 50%，吃到 50% 生命', cost: { gp: 1000000 }, upgrade: { modifiers: { autoEatThreshold: 20, autoEatEfficiency: 50, autoEatLimit: 50 } } });
shop({ id: 'autoeat_2', name: '自动进食 II', icon: '🍴', category: '通用', description: '生命低于 30% 时自动进食，效率 60%，吃到 70% 生命', cost: { gp: 5000000 }, upgrade: { modifiers: { autoEatThreshold: 30, autoEatEfficiency: 60, autoEatLimit: 70 } }, replaces: 'autoeat_1', requirements: [{ type: 'shop', id: 'autoeat_1' }] });
shop({ id: 'autoeat_3', name: '自动进食 III', icon: '🍴', category: '通用', description: '生命低于 40% 时自动进食，效率 70%，吃到 90% 生命', cost: { gp: 20000000 }, upgrade: { modifiers: { autoEatThreshold: 40, autoEatEfficiency: 70, autoEatLimit: 90 } }, replaces: 'autoeat_2', requirements: [{ type: 'shop', id: 'autoeat_2' }] });
shop({ id: 'multi_tree', name: '双树伐木', icon: '🌲', category: '通用', description: '可同时砍伐两棵树', cost: { gp: 5000000 }, upgrade: { flag: 'multiTree' }, requirements: [{ type: 'skill', skill: 'woodcutting', level: 50 }] });
shop({ id: 'auto_slayer', name: '自动猎杀', icon: '🎯', category: '猎杀', description: '自动前往当前猎杀任务目标所在区域，任务完成后自动领取新任务', cost: { slayerCoins: 10000 }, upgrade: { flag: 'autoSlayer' } });

// --------------------------------------------------------------------------- 技能工具升级
const toolLine = (skill: SkillId, key: string, names: string[], icon: string, levels: number[], costs: number[], mods: (i: number) => ModifierMap, desc: (i: number) => string, exp: (i: number) => ExpansionId = () => 'base') => {
  names.forEach((name, i) => {
    shop({ id: `${key}_${i}`, name, icon, category: '技能升级', description: desc(i), cost: { gp: costs[i] }, upgrade: { modifiers: mods(i) },
      replaces: i > 0 ? `${key}_${i - 1}` : undefined, expansion: exp(i),
      requirements: [{ type: 'skill', skill, level: levels[i] } as Requirement, ...(i > 0 ? [{ type: 'shop', id: `${key}_${i - 1}` } as Requirement] : [])] });
  });
};
const METALS = ['铁', '钢', '秘银', '精金', '符石', '龙', '星陨'];
toolLine('woodcutting', 'axe', METALS.map((m) => `${m}斧`), '🪓', [1, 10, 20, 30, 40, 60, 100], [50, 750, 2500, 10000, 25000, 60000, 2000000],
  (i) => ({ 'skillInterval:woodcutting': -5 * (i + 1) }), (i) => `伐木耗时 -${5 * (i + 1)}%`, (i) => (i === 6 ? 'toth' : 'base'));
toolLine('fishing', 'rod', METALS.map((m) => `${m}鱼竿`), '🎣', [1, 10, 20, 30, 40, 60, 100], [100, 1000, 3000, 12000, 30000, 70000, 2000000],
  (i) => ({ 'skillInterval:fishing': -5 * (i + 1) }), (i) => `钓鱼耗时 -${5 * (i + 1)}%`, (i) => (i === 6 ? 'toth' : 'base'));
toolLine('mining', 'pickaxe', METALS.map((m) => `${m}镐`), '⛏️', [1, 10, 20, 30, 40, 60, 100], [250, 2000, 5000, 15000, 40000, 80000, 2000000],
  (i) => ({ 'skillInterval:mining': -5 * (i + 1), 'doubleItems:mining': i * 2 }), (i) => `采矿耗时 -${5 * (i + 1)}%，双倍矿石 +${i * 2}%`, (i) => (i === 6 ? 'toth' : 'base'));
const FIRES = ['普通篝火', '橡木篝火', '柳木篝火', '枫木篝火', '紫杉篝火', '魔法篝火'];
toolLine('cooking', 'fire', FIRES, '🔥', [1, 10, 25, 45, 60, 75], [100, 2500, 10000, 30000, 80000, 200000],
  (i) => ({ 'cookingXP:fire': 5 * i, 'cookingSuccess:fire': 2 * i }), (i) => `篝火烹饪经验 +${5 * i}%，成功率 +${2 * i}%`);
toolLine('cooking', 'furnace', ['普通烤炉', '铁烤炉', '钢烤炉', '秘银烤炉', '精金烤炉'], '♨️', [5, 20, 40, 60, 80], [500, 5000, 20000, 60000, 150000],
  (i) => ({ 'cookingXP:furnace': 5 * i, 'cookingSuccess:furnace': 2 * i }), (i) => `烤炉烹饪经验 +${5 * i}%，成功率 +${2 * i}%`);
toolLine('cooking', 'pot', ['陶锅', '铁锅', '钢锅', '秘银锅', '精金锅'], '🍲', [10, 25, 45, 65, 85], [500, 5000, 20000, 60000, 150000],
  (i) => ({ 'cookingXP:pot': 5 * i, 'cookingSuccess:pot': 2 * i }), (i) => `锅具烹饪经验 +${5 * i}%，成功率 +${2 * i}%`);
shop({ id: 'void_tools', name: '虚空工具组', icon: '🛠️', category: '技能升级', description: '采集技能深渊经验 +10%，耗时 -5%', expansion: 'ita',
  cost: { abyssalPieces: 50000 }, upgrade: { modifiers: { 'abyssalXP:woodcutting': 10, 'abyssalXP:mining': 10, 'abyssalXP:fishing': 10, 'skillInterval:woodcutting': -5, 'skillInterval:mining': -5, 'skillInterval:fishing': -5 } }, requirements: [{ type: 'realm', realm: 'abyssal' }] });

// --------------------------------------------------------------------------- 材料
shop({ id: 'buy_feather', name: '羽毛', icon: '🪶', category: '材料', description: '制箭材料', cost: { gp: 2 }, grants: [{ id: 'feather', qty: 1 }], buyLimit: 0 });
shop({ id: 'buy_compost', name: '堆肥', icon: '💩', category: '材料', description: '农业：提高作物成功率', cost: { gp: 50 }, grants: [{ id: 'compost', qty: 1 }], buyLimit: 0 });
shop({ id: 'buy_leather', name: '皮革', icon: '🟫', category: '材料', description: '制作材料', cost: { gp: 25 }, grants: [{ id: 'leather', qty: 1 }], buyLimit: 0 });
shop({ id: 'buy_egg', name: '鸡蛋', icon: '🥚', category: '材料', description: '烹饪食材', cost: { gp: 5 }, grants: [{ id: 'egg', qty: 1 }], buyLimit: 0 });
shop({ id: 'buy_milk', name: '牛奶', icon: '🥛', category: '材料', description: '烹饪食材', cost: { gp: 5 }, grants: [{ id: 'milk', qty: 1 }], buyLimit: 0 });
for (const s of SHARDS) if (s.price > 0) shop({ id: `buy_${shardId(s.id)}`, name: s.name, icon: '🔹', category: '材料', description: '召唤材料', cost: { gp: s.price }, grants: [{ id: shardId(s.id), qty: 1 }], buyLimit: 0 });
shop({ id: 'buy_shard_void', name: '虚空召唤碎片', icon: '🔹', category: '深渊', description: '深渊召唤材料', cost: { abyssalPieces: 30 }, grants: [{ id: 'shard_void', qty: 1 }], buyLimit: 0, expansion: 'ita', requirements: [{ type: 'realm', realm: 'abyssal' }] });
for (const [rune, price] of [['air', 4], ['mind', 4], ['water', 5], ['earth', 5], ['fire', 6]] as const)
  shop({ id: `buy_rune_${rune}`, name: C.items[`rune_${rune}`].name, icon: '🔷', category: '魔法', description: '基础符文', cost: { gp: price }, grants: [{ id: `rune_${rune}`, qty: 1 }], buyLimit: 0 });
shop({ id: 'buy_bronze_arrows', name: '青铜箭矢', icon: '➶', category: '材料', description: '基础弹药', cost: { gp: 2 }, grants: [{ id: 'bronze_arrows', qty: 1 }], buyLimit: 0 });
shop({ id: 'buy_normal_shortbow', name: '短弓', icon: '🏹', category: '材料', description: '基础远程武器', cost: { gp: 100 }, grants: [{ id: 'normal_shortbow', qty: 1 }], buyLimit: 0 });
shop({ id: 'buy_staff_air', name: '空气法杖', icon: '🪄', category: '魔法', description: '基础魔法武器', cost: { gp: 300 }, grants: [{ id: 'staff_basic_air', qty: 1 }], buyLimit: 0 });

// --------------------------------------------------------------------------- 手套（充能）
for (const [id, price] of [['gloves_cooking', 50000], ['gloves_mining', 75000], ['gloves_smithing', 100000], ['gloves_thieving', 100000], ['gloves_gem', 500000]] as const) {
  shop({ id: `buy_${id}`, name: C.items[id].name, icon: '🧤', category: '手套', description: `${C.items[id].description}；每次购买 +500 充能`, cost: { gp: price }, grants: [{ id, qty: 1 }], charges: 500, buyLimit: 0 });
}

// --------------------------------------------------------------------------- 技能披风
for (const sid of C.skillOrder) {
  const capeId = `cape_${sid}`;
  if (!C.items[capeId]) continue;
  shop({ id: `buy_${capeId}`, name: C.items[capeId].name, icon: '🧣', category: '技能披风', description: C.items[capeId].description ?? '', cost: { gp: 1000000 }, grants: [{ id: capeId, qty: 1 }], buyLimit: 0,
    requirements: [{ type: 'skill', skill: sid, level: 99 }], expansion: C.items[capeId].expansion });
}
shop({ id: 'buy_cape_max', name: '全能披风', icon: '🎽', category: '技能披风', description: '需要全部技能 99 级', cost: { gp: 50000000 }, grants: [{ id: 'cape_max', qty: 1 }], buyLimit: 0,
  requirements: C.skillOrder.filter((s) => C.skills[s].expansionId === undefined).map((s) => ({ type: 'skill', skill: s, level: 99 }) as Requirement) });
shop({ id: 'buy_cape_herald', name: '使者至尊披风', icon: '🎽', category: '技能披风', description: '需要全部技能 120 级', cost: { gp: 200000000 }, grants: [{ id: 'cape_herald', qty: 1 }], buyLimit: 0, expansion: 'toth',
  requirements: C.skillOrder.filter((s) => C.skills[s].expansionId === undefined && s !== 'township').map((s) => ({ type: 'skill', skill: s, level: 120 }) as Requirement) });

// --------------------------------------------------------------------------- Slayer 商店
shop({ id: 'buy_slayer_helmet', name: '猎杀头盔', icon: '🪖', category: '猎杀', description: '猎杀任务目标伤害与命中 +8%', cost: { slayerCoins: 2000 }, grants: [{ id: 'slayer_helmet', qty: 1 }], buyLimit: 0, requirements: [{ type: 'skill', skill: 'slayer', level: 10 }] });
shop({ id: 'buy_slayer_helmet_elite', name: '精英猎杀头盔', icon: '🪖', category: '猎杀', description: '猎杀任务目标伤害与命中 +15%', cost: { slayerCoins: 25000, items: [{ id: 'slayer_helmet', qty: 1 }] }, grants: [{ id: 'slayer_helmet_elite', qty: 1 }], buyLimit: 0, requirements: [{ type: 'skill', skill: 'slayer', level: 70 }] });
shop({ id: 'buy_mirror_shield', name: '镜盾', icon: '🪞', category: '猎杀', description: '进入「镜之洞窟」所需', cost: { slayerCoins: 5000 }, grants: [{ id: 'mirror_shield', qty: 1 }], buyLimit: 0, requirements: [{ type: 'skill', skill: 'slayer', level: 50 }] });
shop({ id: 'buy_fire_cloak', name: '防火斗篷', icon: '🧥', category: '猎杀', description: '进入「灼热荒原」所需', cost: { slayerCoins: 8000 }, grants: [{ id: 'fire_cloak', qty: 1 }], buyLimit: 0, requirements: [{ type: 'skill', skill: 'slayer', level: 65 }] });
shop({ id: 'buy_gas_mask', name: '防毒面罩', icon: '😷', category: '猎杀', description: '进入「毒雾峡谷」所需', cost: { slayerCoins: 12000 }, grants: [{ id: 'gas_mask', qty: 1 }], buyLimit: 0, requirements: [{ type: 'skill', skill: 'slayer', level: 80 }] });
shop({ id: 'buy_void_lantern', name: '虚空提灯', icon: '🏮', category: '深渊', description: '进入「无光深穴」所需', cost: { abyssalSlayerCoins: 5000 }, grants: [{ id: 'void_lantern', qty: 1 }], buyLimit: 0, expansion: 'ita', requirements: [{ type: 'realm', realm: 'abyssal' }] });
shop({ id: 'buy_gem_pouch_sc', name: '宝石袋', icon: '👝', category: '猎杀', description: '随机宝石', cost: { slayerCoins: 300 }, grants: [{ id: 'gem_pouch', qty: 1 }], buyLimit: 0 });
shop({ id: 'buy_herb_sack_sc', name: '草药袋', icon: '🎒', category: '猎杀', description: '随机草药', cost: { slayerCoins: 200 }, grants: [{ id: 'herb_sack', qty: 1 }], buyLimit: 0 });
shop({ id: 'buy_weird_gloop', name: '奇异粘液', icon: '🧪', category: '猎杀', description: '农业：必定成功且收成翻倍', cost: { slayerCoins: 1500 }, grants: [{ id: 'weird_gloop', qty: 1 }], buyLimit: 0 });

// --------------------------------------------------------------------------- 扩展：等级上限、深渊
shop({ id: 'herald_insight_1', name: '使者启示 I', icon: '🔱', category: '扩展', description: '全部技能等级上限 99 → 106', cost: { gp: 10000000, items: [{ id: 'herald_sigil', qty: 1 }] }, upgrade: { modifiers: { levelCap: 7 } }, expansion: 'toth', requirements: [{ type: 'dungeon', id: 'dg_herald_gate' }] });
shop({ id: 'herald_insight_2', name: '使者启示 II', icon: '🔱', category: '扩展', description: '全部技能等级上限 106 → 113', cost: { gp: 30000000, items: [{ id: 'herald_sigil', qty: 2 }] }, upgrade: { modifiers: { levelCap: 7 } }, expansion: 'toth', requirements: [{ type: 'shop', id: 'herald_insight_1' }, { type: 'dungeon', id: 'dg_sky_citadel' }] });
shop({ id: 'herald_insight_3', name: '使者启示 III', icon: '🔱', category: '扩展', description: '全部技能等级上限 113 → 120', cost: { gp: 60000000, items: [{ id: 'herald_sigil', qty: 3 }] }, upgrade: { modifiers: { levelCap: 7 } }, expansion: 'toth', requirements: [{ type: 'shop', id: 'herald_insight_2' }, { type: 'dungeon', id: 'dg_lost_world' }] });
shop({ id: 'abyss_gate', name: '开启深渊之门', icon: '🌀', category: '扩展', description: '解锁深渊领域（Into the Abyss），深渊等级上限 20', cost: { gp: 5000000 }, upgrade: { flag: 'realm_abyssal' }, expansion: 'ita', requirements: [{ type: 'dungeon', id: 'dg_chaos' }] });
shop({ id: 'abyss_insight_1', name: '深渊启迪 I', icon: '💜', category: '扩展', description: '深渊等级上限 20 → 40', cost: { abyssalPieces: 100000, items: [{ id: 'abyssal_shard', qty: 200 }] }, upgrade: { modifiers: { abyssalLevelCap: 20 } }, expansion: 'ita', requirements: [{ type: 'shop', id: 'abyss_gate' }, { type: 'dungeon', id: 'dg_void_maw' }] });
shop({ id: 'abyss_insight_2', name: '深渊启迪 II', icon: '💜', category: '扩展', description: '深渊等级上限 40 → 60', cost: { abyssalPieces: 500000, items: [{ id: 'corrupted_heart', qty: 1 }] }, upgrade: { modifiers: { abyssalLevelCap: 20 } }, expansion: 'ita', requirements: [{ type: 'shop', id: 'abyss_insight_1' }, { type: 'dungeon', id: 'dg_shadow_keep' }] });
for (const [id, price] of [['charm_fury', 20000], ['charm_ward', 20000], ['charm_fortune', 40000]] as const)
  shop({ id: `buy_${id}`, name: C.items[id].name, icon: '🧿', category: '扩展', description: C.items[id].description ?? '', cost: { gp: price }, grants: [{ id, qty: 1 }], buyLimit: 0, expansion: 'toth', requirements: [{ type: 'dungeon', id: 'dg_herald_gate' }] });
