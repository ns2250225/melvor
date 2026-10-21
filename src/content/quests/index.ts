// 宠物、任务、成就
import { addPet, addQuest, addAchievement, C } from '../registry';
import type { SkillId, ModifierMap, ExpansionId, QuestDef, AchievementDef } from '@/game/core/types';

// --------------------------------------------------------------------------- 宠物
const SKILL_PETS: Partial<Record<SkillId, [string, string, ModifierMap, string]>> = {
  attack: ['小剑灵', '🗡️', { meleeAccuracy: 2 }, '近战命中 +2%'],
  strength: ['大力蛙', '🐸', { meleeMaxHit: 1 }, '近战伤害 +1%'],
  defence: ['小乌龟', '🐢', { damageReductionFlat: 1 }, '伤害减免 +1%'],
  hitpoints: ['心心兔', '🐰', { hpRegen: 20 }, '生命回复 +20%'],
  ranged: ['小隼', '🐦', { rangedAccuracy: 2 }, '远程命中 +2%'],
  magic: ['魔法猫', '🐈‍⬛', { magicAccuracy: 2 }, '魔法命中 +2%'],
  prayer: ['小天使', '👼', { prayerPreservation: 5 }, '祈祷点节省 +5%'],
  slayer: ['骷髅犬', '🐕', { slayerCoins: 5 }, '猎杀币 +5%'],
  woodcutting: ['啄木鸟', '🐦', { 'skillXP:woodcutting': 3 }, '伐木经验 +3%'],
  fishing: ['小企鹅', '🐧', { 'skillXP:fishing': 3 }, '钓鱼经验 +3%'],
  firemaking: ['火蜥蜴', '🦎', { 'skillXP:firemaking': 3 }, '生火经验 +3%'],
  cooking: ['小厨鼠', '🐭', { 'skillXP:cooking': 3 }, '烹饪经验 +3%'],
  mining: ['石头怪', '🪨', { 'skillXP:mining': 3 }, '采矿经验 +3%'],
  smithing: ['铁砧精', '⚒️', { 'skillXP:smithing': 3 }, '锻造经验 +3%'],
  thieving: ['小浣熊', '🦝', { 'skillXP:thieving': 3 }, '偷窃经验 +3%'],
  farming: ['小蜗牛', '🐌', { 'skillXP:farming': 3 }, '农业经验 +3%'],
  fletching: ['小鹦鹉', '🦜', { 'skillXP:fletching': 3 }, '制箭经验 +3%'],
  crafting: ['小蜘蛛', '🕷️', { 'skillXP:crafting': 3 }, '制作经验 +3%'],
  runecrafting: ['符文精', '🌀', { 'skillXP:runecrafting': 3 }, '符文经验 +3%'],
  herblore: ['小蘑菇', '🍄', { 'skillXP:herblore': 3 }, '药剂经验 +3%'],
  agility: ['小松鼠', '🐿️', { 'skillXP:agility': 3 }, '敏捷经验 +3%'],
  summoning: ['召唤灵', '🧚', { 'skillXP:summoning': 3 }, '召唤经验 +3%'],
  astrology: ['小星星', '⭐', { 'skillXP:astrology': 3 }, '占星经验 +3%'],
  township: ['小市长', '🎩', { townshipProduction: 3 }, '城镇产出 +3%'],
  cartography: ['小罗盘', '🧭', { 'skillXP:cartography': 3 }, '制图经验 +3%'],
  archaeology: ['小鼹鼠', '🦔', { 'skillXP:archaeology': 3 }, '考古经验 +3%'],
  corruption: ['小魔影', '👾', { 'skillXP:corruption': 3 }, '腐化经验 +3%'],
  harvesting: ['深渊蚯蚓', '🪱', { 'skillXP:harvesting': 3 }, '收割经验 +3%'],
};
for (const [skill, [name, icon, modifiers, description]] of Object.entries(SKILL_PETS)) {
  const exp: ExpansionId = C.skills[skill as SkillId].expansionId ?? 'base';
  addPet({ id: `pet_${skill}`, name, icon, source: `${C.skills[skill as SkillId].name}技能动作中有几率获得`, sourceType: 'skill', sourceId: skill, modifiers, description, expansion: exp });
}
const DPETS: [string, string, string, string, ModifierMap, string][] = [
  ['pet_coop', '小鸡崽', '🐣', 'dg_coop', { combatGP: 3 }, '战斗金币 +3%'],
  ['pet_graveyard', '小骷髅', '💀', 'dg_graveyard', { meleeAccuracy: 2 }, '近战命中 +2%'],
  ['pet_spider', '小蛛蛛', '🕷️', 'dg_spider_forest', { poisonImmunity: 1 }, '免疫中毒'],
  ['pet_frozen', '小雪人', '⛄', 'dg_frozen_cove', { magicAccuracy: 2 }, '魔法命中 +2%'],
  ['pet_pirate', '小鹦鹉船长', '🦜', 'dg_pirate_ship', { rangedAccuracy: 2 }, '远程命中 +2%'],
  ['pet_bandit', '小盗贼', '🥷', 'dg_bandit_hideout', { gpGlobal: 2 }, '全局金币 +2%'],
  ['pet_volcano', '熔岩宝宝', '🔥', 'dg_volcano', { burnImmunity: 1 }, '免疫燃烧'],
  ['pet_wizard', '小法师', '🧙', 'dg_wizard_hall', { runePreservation: 5 }, '符文节省 +5%'],
  ['pet_dragon', '龙宝宝', '🐲', 'dg_dragon_den', { maxHit: 2 }, '最大伤害 +2%'],
  ['pet_crystal', '水晶精灵', '💎', 'dg_crystal_caves', { damageReductionFlat: 1 }, '伤害减免 +1%'],
  ['pet_infernal', '小恶魔', '😈', 'dg_infernal', { lifesteal: 1 }, '生命偷取 +1%'],
  ['pet_elemental', '元素之灵', '🌈', 'dg_elemental', { meleeAccuracy: 2, rangedAccuracy: 2, magicAccuracy: 2 }, '全部命中 +2%'],
  ['pet_temple', '遗忘之眼', '👁️', 'dg_forgotten_temple', { skillXP: 2 }, '全技能经验 +2%'],
  ['pet_chaos', '混沌之子', '🦑', 'dg_chaos', { maxHit: 3, damageReductionFlat: 2 }, '最大伤害 +3%，减伤 +2%'],
  ['pet_herald_gate', '小守门人', '🛡️', 'dg_herald_gate', { damageReductionFlat: 2 }, '伤害减免 +2%'],
  ['pet_sky', '天穹雏鹰', '🦅', 'dg_sky_citadel', { attackInterval: -2 }, '攻击间隔 -2%'],
  ['pet_lost_world', '小恐龙', '🦖', 'dg_lost_world', { maxHit: 3 }, '最大伤害 +3%'],
  ['pet_throne', '小使者', '👑', 'dg_throne', { skillXP: 3, masteryXP: 3 }, '经验与掌握度经验 +3%'],
  ['pet_void_maw', '虚空小口', '🕳️', 'dg_void_maw', { abyssalResistanceFlat: 2 }, '深渊抗性 +2'],
  ['pet_shadow_keep', '小暗影', '🌑', 'dg_shadow_keep', { abyssalXP: 3 }, '深渊经验 +3%'],
  ['pet_abyss_throne', '深渊之子', '😈', 'dg_abyss_throne', { maxHit: 4, abyssalXP: 4 }, '最大伤害 +4%，深渊经验 +4%'],
];
for (const [id, name, icon, dg, modifiers, description] of DPETS) {
  const d = C.dungeons[dg];
  addPet({ id, name, icon, source: `通关「${d.name}」时有几率获得（${d.pet?.completions ?? 100} 次通关必得）`, sourceType: 'dungeon', sourceId: dg, modifiers, description, expansion: d.expansion });
}
addPet({ id: 'pet_golden_chicken', name: '金色小鸡', icon: '🐥', source: '击杀鸡时 1/10000 几率', sourceType: 'monster', sourceId: 'chicken', modifiers: { gpGlobal: 3 }, description: '全局金币 +3%', expansion: 'base' });
C.monsters['chicken'].pet = { id: 'pet_golden_chicken', chance: 1 / 10000 };
addPet({ id: 'pet_ruby_dragon', name: '红宝石幼龙', icon: '🐉', source: '击杀红龙时 1/5000 几率', sourceType: 'monster', sourceId: 'red_dragon', modifiers: { rareDropChance: 5 }, description: '稀有掉落 +5%', expansion: 'base' });
C.monsters['red_dragon'].pet = { id: 'pet_ruby_dragon', chance: 1 / 5000 };
addPet({ id: 'pet_museum', name: '博物馆馆长', icon: '🧐', source: '向博物馆捐赠 30 件文物', sourceType: 'special', modifiers: { artifactChance: 5 }, description: '文物发现率 +5%', expansion: 'aod' });

// --------------------------------------------------------------------------- 任务
const q = (d: Omit<QuestDef, 'expansion' | 'requirements'> & Partial<Pick<QuestDef, 'expansion' | 'requirements'>>) => addQuest({ expansion: 'base', requirements: [], ...d });
q({ id: 'q_first_steps', chapter: '第一章 · 启程', name: '初来乍到', description: '砍伐木材，迈出冒险的第一步。', prerequisites: [], objectives: [{ type: 'actions', skill: 'woodcutting', count: 25 }], rewards: { gp: 500, items: [{ id: 'compost', qty: 5 }] } });
q({ id: 'q_fire', chapter: '第一章 · 启程', name: '生起篝火', description: '燃烧 20 根木材。', prerequisites: ['q_first_steps'], objectives: [{ type: 'actions', skill: 'firemaking', count: 20 }], rewards: { gp: 500, xp: [{ skill: 'firemaking', amount: 200 }] } });
q({ id: 'q_fishing', chapter: '第一章 · 启程', name: '河边垂钓', description: '钓上 30 条鱼。', prerequisites: ['q_first_steps'], objectives: [{ type: 'actions', skill: 'fishing', count: 30 }], rewards: { gp: 800, items: [{ id: 'raw_trout', qty: 10 }] } });
q({ id: 'q_cook', chapter: '第一章 · 启程', name: '饱餐一顿', description: '烹饪 25 份熟虾。', prerequisites: ['q_fishing', 'q_fire'], objectives: [{ type: 'craft', item: 'food_shrimp', count: 25 }], rewards: { gp: 1000, items: [{ id: 'food_trout', qty: 10 }] } });
q({ id: 'q_mining', chapter: '第一章 · 启程', name: '矿工学徒', description: '采集铜矿与锡矿各 20 个并上交。', prerequisites: ['q_first_steps'], objectives: [{ type: 'collect', item: 'ore_copper', count: 20, consume: true }, { type: 'collect', item: 'ore_tin', count: 20, consume: true }], rewards: { gp: 1000, items: [{ id: 'bar_bronze', qty: 10 }] } });
q({ id: 'q_smith', chapter: '第一章 · 启程', name: '铁匠的考验', description: '锻造一把青铜长剑和一件青铜头盔。', prerequisites: ['q_mining'], objectives: [{ type: 'craft', item: 'bronze_sword', count: 1 }, { type: 'craft', item: 'bronze_helmet', count: 1 }], rewards: { gp: 1500, items: [{ id: 'iron_sword', qty: 1 }] } });
q({ id: 'q_first_blood', chapter: '第一章 · 启程', name: '初次战斗', description: '在宁静农场击败 10 只鸡。', prerequisites: ['q_smith', 'q_cook'], objectives: [{ type: 'kill', monster: 'chicken', count: 10 }], rewards: { gp: 2000, items: [{ id: 'bronze_platebody', qty: 1 }] } });
q({ id: 'q_cow', chapter: '第一章 · 启程', name: '牛皮生意', description: '收集 30 张牛皮。', prerequisites: ['q_first_blood'], objectives: [{ type: 'collect', item: 'cowhide', count: 30, consume: true }], rewards: { gp: 3000, items: [{ id: 'leather_body', qty: 1 }] } });
q({ id: 'q_coop', chapter: '第一章 · 启程', name: '鸡舍风波', description: '通关「鸡舍」副本。', prerequisites: ['q_first_blood'], objectives: [{ type: 'dungeon', id: 'dg_coop', count: 1 }], rewards: { gp: 5000, slayerCoins: 200 } });
q({ id: 'q_fletch', chapter: '第二章 · 成长', name: '弓箭手之路', description: '制作 300 支青铜箭矢。', prerequisites: ['q_coop'], objectives: [{ type: 'craft', item: 'bronze_arrows', count: 300 }], rewards: { gp: 4000, items: [{ id: 'oak_shortbow', qty: 1 }] } });
q({ id: 'q_runes', chapter: '第二章 · 成长', name: '符文初识', description: '制作 200 个空气符文。', prerequisites: ['q_coop'], objectives: [{ type: 'craft', item: 'rune_air', count: 200 }], rewards: { gp: 4000, items: [{ id: 'staff_basic_air', qty: 1 }, { id: 'rune_mind', qty: 200 }] } });
q({ id: 'q_herbs', chapter: '第二章 · 成长', name: '草药学徒', description: '种植并收获青叶草，调配 10 瓶药水。', prerequisites: ['q_coop'], objectives: [{ type: 'actions', skill: 'herblore', count: 10 }], rewards: { gp: 5000, items: [{ id: 'seed_moonwort', qty: 10 }] } });
q({ id: 'q_thief', chapter: '第二章 · 成长', name: '妙手空空', description: '成功偷窃 100 次。', prerequisites: ['q_coop'], objectives: [{ type: 'actions', skill: 'thieving', count: 100 }], rewards: { gp: 6000 } });
q({ id: 'q_slayer', chapter: '第二章 · 成长', name: '猎杀者', description: '猎杀等级达到 20。', prerequisites: ['q_coop'], objectives: [{ type: 'skillLevel', skill: 'slayer', level: 20 }], rewards: { slayerCoins: 1000, gp: 5000 } });
q({ id: 'q_graveyard', chapter: '第二章 · 成长', name: '安息之地', description: '通关「亡灵墓园」。', prerequisites: ['q_slayer'], objectives: [{ type: 'dungeon', id: 'dg_graveyard', count: 1 }], rewards: { gp: 15000, items: [{ id: 'potion_strength_2', qty: 5 }] } });
q({ id: 'q_level30', chapter: '第二章 · 成长', name: '小有所成', description: '总等级达到 500。', prerequisites: ['q_fletch', 'q_runes'], objectives: [{ type: 'totalLevel', level: 500 }], rewards: { gp: 25000, items: [{ id: 'gem_pouch', qty: 5 }] } });
q({ id: 'q_frozen', chapter: '第三章 · 远征', name: '冰封之谜', description: '通关「冰封海湾」。', prerequisites: ['q_graveyard'], objectives: [{ type: 'dungeon', id: 'dg_frozen_cove', count: 1 }], rewards: { gp: 30000, items: [{ id: 'food_shark', qty: 50 }] } });
q({ id: 'q_pirate', chapter: '第三章 · 远征', name: '海上幽灵', description: '通关「幽灵海盗船」。', prerequisites: ['q_graveyard'], objectives: [{ type: 'dungeon', id: 'dg_pirate_ship', count: 1 }], rewards: { gp: 30000, items: [{ id: 'treasure_chest', qty: 5 }] } });
q({ id: 'q_agility', chapter: '第三章 · 远征', name: '身手矫健', description: '完成 200 次敏捷障碍。', prerequisites: ['q_level30'], objectives: [{ type: 'actions', skill: 'agility', count: 200 }], rewards: { gp: 40000 } });
q({ id: 'q_summon', chapter: '第三章 · 远征', name: '召唤之契', description: '制作 100 块召唤石板。', prerequisites: ['q_level30'], objectives: [{ type: 'actions', skill: 'summoning', count: 4 }], rewards: { gp: 20000, items: [{ id: 'shard_blue', qty: 100 }] } });
q({ id: 'q_astro', chapter: '第三章 · 远征', name: '仰望星空', description: '研究星座 300 次。', prerequisites: ['q_level30'], objectives: [{ type: 'actions', skill: 'astrology', count: 300 }], rewards: { gp: 20000, items: [{ id: 'stardust', qty: 300 }] } });
q({ id: 'q_town', chapter: '第三章 · 远征', name: '城镇奠基', description: '城镇等级达到 15。', prerequisites: ['q_level30'], objectives: [{ type: 'township', level: 15 }], rewards: { gp: 30000 } });
q({ id: 'q_wizard', chapter: '第三章 · 远征', name: '巫师的挑战', description: '通关「巫师大厅」。', prerequisites: ['q_frozen', 'q_pirate'], objectives: [{ type: 'dungeon', id: 'dg_wizard_hall', count: 1 }], rewards: { gp: 80000, items: [{ id: 'rune_ancient', qty: 100 }] } });
q({ id: 'q_dragon', chapter: '第四章 · 屠龙', name: '屠龙者', description: '击败 50 条任意巨龙并通关「龙之巢穴」。', prerequisites: ['q_wizard'], objectives: [{ type: 'kill', monster: 'green_dragon', count: 20 }, { type: 'kill', monster: 'red_dragon', count: 20 }, { type: 'dungeon', id: 'dg_dragon_den', count: 1 }], rewards: { gp: 200000, items: [{ id: 'dragon_bones', qty: 50 }] } });
q({ id: 'q_level80', chapter: '第四章 · 屠龙', name: '技艺精湛', description: '总等级达到 1500。', prerequisites: ['q_dragon'], objectives: [{ type: 'totalLevel', level: 1500 }], rewards: { gp: 500000, items: [{ id: 'golden_stardust', qty: 20 }] } });
q({ id: 'q_infernal', chapter: '第四章 · 屠龙', name: '直面炼狱', description: '通关「炼狱要塞」。', prerequisites: ['q_dragon'], objectives: [{ type: 'dungeon', id: 'dg_infernal', count: 1 }], rewards: { gp: 400000 } });
q({ id: 'q_stones', chapter: '第四章 · 屠龙', name: '神秘石之谜', description: '集齐 5 块神秘石。', prerequisites: ['q_dragon'], objectives: [{ type: 'collect', item: 'mysterious_stone', count: 5 }], rewards: { gp: 100000 } });
q({ id: 'q_elements', chapter: '第五章 · 终焉', name: '元素试炼', description: '通关「元素神殿」。', prerequisites: ['q_infernal'], objectives: [{ type: 'dungeon', id: 'dg_elemental', count: 1 }], rewards: { gp: 1000000 } });
q({ id: 'q_chaos', chapter: '第五章 · 终焉', name: '暗黑降临', description: '击败混沌魔王。', prerequisites: ['q_elements', 'q_stones'], objectives: [{ type: 'dungeon', id: 'dg_chaos', count: 1 }], rewards: { gp: 5000000, items: [{ id: 'golden_stardust', qty: 100 }] } });
q({ id: 'q_max', chapter: '第五章 · 终焉', name: '登峰造极', description: '总等级达到 2300。', prerequisites: ['q_chaos'], objectives: [{ type: 'totalLevel', level: 2300 }], rewards: { gp: 10000000 } });
// 扩展任务
q({ id: 'q_aod_survey', chapter: '发现地图集', name: '测绘新世界', description: '发现 5 个兴趣点。', prerequisites: ['q_level30'], objectives: [{ type: 'poi', count: 5 }], rewards: { gp: 50000, items: [{ id: 'paper', qty: 100 }, { id: 'ink', qty: 20 }] }, expansion: 'aod' });
q({ id: 'q_aod_dig', chapter: '发现地图集', name: '初探遗迹', description: '进行 100 次考古挖掘。', prerequisites: ['q_aod_survey'], objectives: [{ type: 'actions', skill: 'archaeology', count: 100 }], rewards: { gp: 80000 }, expansion: 'aod' });
q({ id: 'q_aod_atlas', chapter: '发现地图集', name: '地图集大师', description: '发现 15 个兴趣点。', prerequisites: ['q_aod_dig'], objectives: [{ type: 'poi', count: 15 }], rewards: { gp: 1000000, items: [{ id: 'golden_stardust', qty: 30 }] }, expansion: 'aod' });
q({ id: 'q_toth_gate', chapter: '使者王座', name: '叩响圣门', description: '通关「使者之门」。', prerequisites: ['q_chaos'], objectives: [{ type: 'dungeon', id: 'dg_herald_gate', count: 1 }], rewards: { gp: 3000000 }, expansion: 'toth' });
q({ id: 'q_toth_105', chapter: '使者王座', name: '突破极限', description: '任意技能达到 105 级（攻击）。', prerequisites: ['q_toth_gate'], objectives: [{ type: 'skillLevel', skill: 'attack', level: 105 }], rewards: { gp: 5000000, items: [{ id: 'herald_sigil', qty: 1 }] }, expansion: 'toth' });
q({ id: 'q_toth_throne', chapter: '使者王座', name: '王座之主', description: '通关「使者王座」。', prerequisites: ['q_toth_105'], objectives: [{ type: 'dungeon', id: 'dg_throne', count: 1 }], rewards: { gp: 20000000 }, expansion: 'toth' });
q({ id: 'q_ita_enter', chapter: '深入深渊', name: '凝视深渊', description: '在深渊中击败 50 个敌人。', prerequisites: ['q_chaos'], requirements: [{ type: 'realm', realm: 'abyssal' }], objectives: [{ type: 'kill', realm: 'abyssal', count: 50 }], rewards: { abyssalPieces: 20000, items: [{ id: 'shard_void', qty: 100 }] }, expansion: 'ita' });
q({ id: 'q_ita_maw', chapter: '深入深渊', name: '虚空之喉', description: '通关「虚空之喉」。', prerequisites: ['q_ita_enter'], objectives: [{ type: 'dungeon', id: 'dg_void_maw', count: 1 }], rewards: { abyssalPieces: 50000 }, expansion: 'ita' });
q({ id: 'q_ita_al20', chapter: '深入深渊', name: '深渊修行', description: '攻击深渊等级达到 20。', prerequisites: ['q_ita_maw'], objectives: [{ type: 'abyssalLevel', skill: 'attack', level: 20 }], rewards: { abyssalPieces: 100000, items: [{ id: 'abyssal_stardust', qty: 10 }] }, expansion: 'ita' });
q({ id: 'q_ita_throne', chapter: '深入深渊', name: '深渊之主', description: '通关「深渊王座」。', prerequisites: ['q_ita_al20'], objectives: [{ type: 'dungeon', id: 'dg_abyss_throne', count: 1 }], rewards: { abyssalPieces: 1000000 }, expansion: 'ita' });

// --------------------------------------------------------------------------- 成就
const a = (d: Omit<AchievementDef, 'expansion'> & { expansion?: ExpansionId }) => addAchievement({ expansion: 'base', ...d });
for (const sid of C.skillOrder) {
  const s = C.skills[sid];
  const exp = s.expansionId ?? 'base';
  if (sid === 'township') {
    a({ id: `ach_${sid}_50`, name: `${s.name}能手`, description: `${s.name}达到 50 级`, category: '技能', icon: s.icon, condition: { type: 'skillLevel', skill: sid, level: 50 }, reward: { gp: 5000 }, expansion: exp });
    a({ id: `ach_${sid}_99`, name: `${s.name}大师`, description: `${s.name}达到 99 级`, category: '技能', icon: s.icon, condition: { type: 'skillLevel', skill: sid, level: 99 }, reward: { gp: 100000 }, expansion: exp });
    continue;
  }
  a({ id: `ach_${sid}_50`, name: `${s.name}能手`, description: `${s.name}达到 50 级`, category: '技能', icon: s.icon, condition: { type: 'skillLevel', skill: sid, level: 50 }, reward: { gp: 5000 }, expansion: exp });
  a({ id: `ach_${sid}_99`, name: `${s.name}大师`, description: `${s.name}达到 99 级`, category: '技能', icon: s.icon, condition: { type: 'skillLevel', skill: sid, level: 99 }, reward: { gp: 100000 }, expansion: exp });
  a({ id: `ach_${sid}_120`, name: `${s.name}传奇`, description: `${s.name}达到 120 级`, category: '终局', icon: s.icon, condition: { type: 'skillLevel', skill: sid, level: 120 }, reward: { gp: 1000000 }, expansion: 'toth' });
  if (s.abyssalEnabled) a({ id: `ach_${sid}_a20`, name: `深渊${s.name}`, description: `${s.name}深渊等级达到 20`, category: '深渊', icon: s.icon, condition: { type: 'abyssalLevel', skill: sid, level: 20 }, reward: { abyssalPieces: 10000 }, expansion: 'ita' });
}
for (const lvl of [250, 500, 1000, 1500, 2000, 2500, 3000]) a({ id: `ach_total_${lvl}`, name: `总等级 ${lvl}`, description: `总等级达到 ${lvl}`, category: '技能', icon: '📈', condition: { type: 'totalLevel', level: lvl }, reward: { gp: lvl * 50 }, expansion: lvl > 2500 ? 'toth' : 'base' });
for (const n of [100, 1000, 10000, 100000]) a({ id: `ach_kills_${n}`, name: `击杀 ${n}`, description: `累计击杀 ${n} 个敌人`, category: '战斗', icon: '⚔️', condition: { type: 'stat', stat: 'monstersKilled', value: n }, reward: { gp: n * 5 } });
for (const d of Object.values(C.dungeons)) a({ id: `ach_${d.id}`, name: `征服：${d.name}`, description: `通关「${d.name}」`, category: d.isEndgame ? '终局' : '副本', icon: d.icon, condition: { type: 'dungeon', id: d.id, count: 1 }, reward: { gp: 10000 }, expansion: d.expansion });
for (const d of Object.values(C.dungeons).filter((x) => x.isEndgame)) a({ id: `ach_${d.id}_10`, name: `宿敌：${d.name}`, description: `通关「${d.name}」10 次`, category: '终局', icon: d.icon, condition: { type: 'dungeon', id: d.id, count: 10 }, reward: { gp: 500000 }, expansion: d.expansion });
for (const n of [1e5, 1e6, 1e7, 1e8]) a({ id: `ach_gp_${n}`, name: `财富积累 ${n.toLocaleString()}`, description: `累计获得 ${n.toLocaleString()} 金币`, category: '经济', icon: '🪙', condition: { type: 'stat', stat: 'gpEarned', value: n } });
for (const n of [1, 10, 25]) a({ id: `ach_pets_${n}`, name: `宠物收藏家 ${n}`, description: `获得 ${n} 只宠物`, category: '收藏', icon: '🐾', condition: { type: 'pet', count: n } });
a({ id: 'ach_pets_all', name: '万兽之主', description: '获得全部宠物', category: '终局', icon: '🦁', condition: { type: 'pet', count: Object.keys(C.pets).length }, reward: { gp: 10000000 } });
for (const n of [1, 10, 50]) a({ id: `ach_mastery_${n}`, name: `精通 ${n}`, description: `将 ${n} 个动作的掌握度提升至 99`, category: '技能', icon: '🎖️', condition: { type: 'mastery99', count: n } });
for (const p of [25, 50, 75, 100]) a({ id: `ach_completion_${p}`, name: `完成度 ${p}%`, description: `游戏完成度达到 ${p}%`, category: '终局', icon: '🏆', condition: { type: 'completion', percent: p } });
a({ id: 'ach_poi_5', name: '探险家', description: '发现 5 个兴趣点', category: '探索', icon: '🧭', condition: { type: 'poi', count: 5 }, expansion: 'aod' });
a({ id: 'ach_poi_all', name: '制图大师', description: '发现全部兴趣点', category: '探索', icon: '🗺️', condition: { type: 'poi', count: Object.keys(C.pois).length }, expansion: 'aod' });
a({ id: 'ach_museum_10', name: '收藏家', description: '向博物馆捐赠 10 件文物', category: '探索', icon: '🏛️', condition: { type: 'stat', stat: 'museumDonations', value: 10 }, expansion: 'aod' });
a({ id: 'ach_death', name: '出师未捷', description: '第一次死亡', category: '隐藏', icon: '💀', hidden: true, condition: { type: 'stat', stat: 'deaths', value: 1 } });
a({ id: 'ach_burn', name: '黑暗料理', description: '烧焦 100 份食物', category: '隐藏', icon: '🔥', hidden: true, condition: { type: 'stat', stat: 'foodBurnt', value: 100 } });
a({ id: 'ach_stun', name: '眼冒金星', description: '偷窃失败 100 次', category: '隐藏', icon: '💫', hidden: true, condition: { type: 'stat', stat: 'thievingFails', value: 100 } });
a({ id: 'ach_stone', name: '神秘之物', description: '发现一块神秘石', category: '隐藏', icon: '🗿', hidden: true, condition: { type: 'collect', item: 'mysterious_stone', count: 1 } });
a({ id: 'ach_town_50', name: '繁荣城镇', description: '城镇等级达到 50', category: '技能', icon: '🏘️', condition: { type: 'township', level: 50 } });
a({ id: 'ach_slayer_100', name: '猎杀专家', description: '完成 100 个猎杀任务', category: '战斗', icon: '💀', condition: { type: 'stat', stat: 'slayerTasks', value: 100 } });
