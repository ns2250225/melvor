// 战斗区域、Slayer 区域、副本（含扩展与终局）、Slayer 任务档位
import { addArea, addDungeon, addDropTable, C } from '../registry';
import { defineMonster } from '../monsters';
import type { Requirement, Realm, ExpansionId, ItemQty } from '@/game/core/types';

const area = (id: string, name: string, icon: string, monsters: string[], requirements: Requirement[] = [], realm: Realm = 'melvor', expansion: ExpansionId = 'base', description?: string) =>
  addArea({ id, name, icon, type: 'combat', monsters, requirements, realm, expansion, description });

area('area_farm', '宁静农场', '🚜', ['chicken', 'cow', 'boar', 'farmhand'], [], 'melvor', 'base', '适合新手的农场。');
area('area_forest', '林间小径', '🌲', ['goblin', 'wolf', 'bandit', 'treant']);
area('area_swamp', '迷雾沼泽', '🪷', ['giant_frog', 'leech', 'bog_beast']);
area('area_graveyard', '荒芜墓地', '⚰️', ['skeleton', 'zombie', 'ghost'], [{ type: 'skill', skill: 'attack', level: 10 }]);
area('area_caves', '山岭洞穴', '⛰️', ['cave_spider', 'troll', 'gargoyle'], [{ type: 'skill', skill: 'defence', level: 20 }]);
area('area_pirate', '海盗湾', '🏝️', ['pirate', 'pirate_gunner', 'sea_serpent'], [{ type: 'skill', skill: 'ranged', level: 15 }]);
area('area_tower', '法师之塔', '🗼', ['apprentice', 'dark_wizard', 'archmage_guard'], [{ type: 'skill', skill: 'magic', level: 20 }]);
area('area_tundra', '永冻冰原', '🏔️', ['ice_wolf', 'yeti', 'ice_giant'], [{ type: 'dungeon', id: 'dg_frozen_cove' }]);
area('area_volcano', '灼热火山', '🌋', ['fire_elemental', 'lava_serpent', 'demon'], [{ type: 'skill', skill: 'defence', level: 50 }]);
area('area_dragons', '龙之谷', '🐉', ['green_dragon', 'blue_dragon', 'red_dragon', 'black_dragon'], [{ type: 'dungeon', id: 'dg_wizard_hall' }]);

const slayer = (id: string, name: string, icon: string, monsters: string[], level: number, entry?: string[], effect?: { description: string; modifiers: Record<string, number>; target: 'player' | 'enemy' }, realm: Realm = 'melvor', expansion: ExpansionId = 'base') =>
  addArea({ id, name, icon, type: 'slayer', monsters, requirements: [{ type: 'skill', skill: 'slayer', level }], entryEquipment: entry, areaEffect: effect, realm, expansion });
slayer('slayer_toxic', '剧毒沼泽', '☠️', ['venom_toad', 'swamp_viper'], 15, undefined, { description: '玩家攻击间隔 +10%', modifiers: { attackInterval: 10 }, target: 'player' });
slayer('slayer_dark_forest', '黑暗森林', '🌑', ['shadow_wolf', 'vampire_bat'], 35, undefined, { description: '玩家命中 -10%', modifiers: { meleeAccuracy: -10, rangedAccuracy: -10, magicAccuracy: -10 }, target: 'player' });
slayer('slayer_mirror', '镜之洞窟', '🪞', ['medusa', 'basilisk'], 50, ['mirror_shield']);
slayer('slayer_scorched', '灼热荒原', '🔥', ['magma_hound', 'ash_wraith'], 65, ['fire_cloak'], { description: '敌人伤害 +10%', modifiers: { maxHit: 10 }, target: 'enemy' });
slayer('slayer_miasma', '毒雾峡谷', '🌫️', ['plague_rat', 'toxic_horror'], 80, ['gas_mask'], { description: '玩家生命回复 -100%', modifiers: { hpRegen: -100 }, target: 'player' });
slayer('slayer_rift', '时空裂隙', '🌀', ['rift_stalker'], 95, undefined, { description: '玩家最大伤害 -10%', modifiers: { maxHit: -10 }, target: 'player' });

// --------------------------------------------------------------------------- 副本怪物
type D = [string, number, number, number];
const H = (id: string, min: number, max: number, w: number): D => [id, min, max, w];
const dm = (id: string, name: string, icon: string, L: number, type: 'melee' | 'ranged' | 'magic', o: Partial<{ sa: string[]; boss: boolean; drops: D[]; exp: ExpansionId; realm: Realm; barrier: number; speed: number; bones: string | null; pet: { id: string; chance: number }; slayer: boolean; hp: number }> = {}) =>
  defineMonster({ id, name, icon, L, type, sa: o.sa, boss: o.boss, drops: o.drops, exp: o.exp, realm: o.realm, barrier: o.barrier, speed: o.speed, bones: o.bones, pet: o.pet, slayer: o.slayer ?? false, hp: o.hp, gp: o.boss ? [L * 10, L * 40] : undefined });

// 基础副本
dm('dg_chick', '暴躁小鸡', '🐤', 4, 'melee');
dm('dg_hen_queen', '母鸡女王', '🐓', 12, 'melee', { boss: true, sa: ['sa_double'] });
dm('dg_skeleton_knight', '骷髅骑士', '💀', 26, 'melee', { sa: ['sa_heavy'] });
dm('dg_banshee', '女妖', '👻', 30, 'magic', { sa: ['sa_curse'] });
dm('dg_grave_lord', '墓园领主', '☠️', 40, 'melee', { boss: true, sa: ['sa_drain', 'sa_heavy'] });
dm('dg_spiderling', '幼蛛', '🕷️', 30, 'melee', { sa: ['sa_poison'] });
dm('dg_spider_queen', '蜘蛛女王', '🕸️', 48, 'melee', { boss: true, sa: ['sa_poison', 'sa_slow'] });
dm('dg_ice_sprite', '冰精', '❄️', 40, 'magic', { sa: ['sa_freeze'] });
dm('dg_frost_witch', '冰霜女巫', '🧙‍♀️', 56, 'magic', { boss: true, sa: ['sa_freeze', 'sa_frostbreath'] });
dm('dg_ghost_pirate', '幽灵水手', '🏴‍☠️', 44, 'ranged');
dm('dg_ghost_captain', '幽灵船长', '☠️', 62, 'melee', { boss: true, sa: ['sa_double', 'sa_drain'] });
dm('dg_bandit_elite', '精英强盗', '🥷', 50, 'melee', { sa: ['sa_bleed'] });
dm('dg_bandit_king', '盗贼王', '🤴', 66, 'ranged', { boss: true, sa: ['sa_triple', 'sa_blind'] });
dm('dg_magma_imp', '熔岩小鬼', '😈', 60, 'magic', { sa: ['sa_burn'] });
dm('dg_flame_lord', '炎魔', '🔥', 80, 'magic', { boss: true, sa: ['sa_burn', 'sa_annihilate'] });
dm('dg_wizard_adept', '巫师学徒', '🧙', 64, 'magic', { sa: ['sa_curse'] });
dm('dg_grand_wizard', '大巫师', '🧙‍♂️', 85, 'magic', { boss: true, sa: ['sa_stun', 'sa_curse', 'sa_weaken'] });
dm('dg_drake', '幼龙', '🦎', 80, 'melee', { sa: ['sa_dragonfire'], bones: 'dragon_bones' });
dm('dg_dragon_mother', '龙母', '🐉', 105, 'magic', { boss: true, sa: ['sa_dragonfire', 'sa_crush'], bones: 'dragon_bones' });
dm('dg_crystal_golem', '水晶魔像', '💎', 92, 'melee', { sa: ['sa_shield'], bones: null });
dm('dg_crystal_core', '晶核巨像', '🔷', 115, 'melee', { boss: true, sa: ['sa_shield', 'sa_crush'], bones: null });
dm('dg_hellhound', '地狱犬', '🐕‍🦺', 100, 'melee', { sa: ['sa_burn', 'sa_bleed'] });
dm('dg_infernal_lord', '炼狱领主', '👿', 125, 'melee', { boss: true, sa: ['sa_burn', 'sa_annihilate', 'sa_drain'], bones: 'magic_bones' });
dm('dg_air_god', '风神', '🌪️', 120, 'ranged', { boss: true, sa: ['sa_triple', 'sa_slow'], bones: 'magic_bones' });
dm('dg_water_god', '水神', '🌊', 125, 'magic', { boss: true, sa: ['sa_freeze', 'sa_regen'], bones: 'magic_bones' });
dm('dg_earth_god', '地神', '🪨', 130, 'melee', { boss: true, sa: ['sa_shield', 'sa_crush'], bones: 'magic_bones' });
dm('dg_fire_god', '火神', '☀️', 135, 'magic', { boss: true, sa: ['sa_burn', 'sa_annihilate'], bones: 'magic_bones' });
dm('dg_temple_guard', '神殿守卫', '🗿', 120, 'melee', { sa: ['sa_stun'] });
dm('dg_forgotten_one', '遗忘之神', '🌀', 145, 'magic', { boss: true, sa: ['sa_vuln', 'sa_curse', 'sa_annihilate'], bones: 'magic_bones' });
dm('dg_chaos_spawn', '混沌爪牙', '🦑', 135, 'melee', { sa: ['sa_bleed', 'sa_weaken'] });
dm('dg_chaos_lord', '混沌魔王', '👁️‍🗨️', 160, 'melee', { boss: true, sa: ['sa_annihilate', 'sa_drain', 'sa_vuln', 'sa_stun'], bones: 'magic_bones', hp: 400 });
// Throne of the Herald
dm('tg_gatekeeper', '圣门守卫', '🛡️', 140, 'melee', { exp: 'toth', sa: ['sa_shield'], bones: 'elder_bones', drops: [H('ore_starfall', 1, 3, 40), H('charm_ward', 1, 3, 30)] });
dm('tg_herald_knight', '使者骑士', '⚔️', 155, 'melee', { exp: 'toth', boss: true, sa: ['sa_heavy', 'sa_stun'], bones: 'elder_bones' });
dm('tg_sky_archer', '天穹弓手', '🏹', 160, 'ranged', { exp: 'toth', sa: ['sa_triple'], bones: 'elder_bones', drops: [H('bar_starfall', 1, 2, 40), H('charm_fury', 1, 3, 30)] });
dm('tg_storm_mage', '风暴法师', '⛈️', 165, 'magic', { exp: 'toth', sa: ['sa_stun', 'sa_curse'], bones: 'elder_bones', drops: [H('rune_havoc', 5, 20, 40), H('charm_fortune', 1, 2, 30)] });
dm('tg_sky_sovereign', '天穹君主', '🦅', 180, 'magic', { exp: 'toth', boss: true, sa: ['sa_annihilate', 'sa_freeze'], bones: 'elder_bones' });
dm('tg_raptor', '迅猛龙', '🦖', 170, 'melee', { exp: 'toth', sa: ['sa_bleed', 'sa_double'], bones: 'elder_bones', drops: [H('hide_elder', 1, 2, 50)] });
dm('tg_titan', '远古巨兽', '🦕', 195, 'melee', { exp: 'toth', boss: true, sa: ['sa_crush', 'sa_annihilate'], bones: 'elder_bones', hp: 420 });
dm('tg_herald', '使者', '👑', 220, 'magic', { exp: 'toth', boss: true, sa: ['sa_annihilate', 'sa_vuln', 'sa_drain', 'sa_stun'], bones: 'elder_bones', hp: 600 });
// TotH 普通区域怪物
dm('tm_starfall_golem', '星陨魔像', '🌠', 135, 'melee', { exp: 'toth', slayer: true, sa: ['sa_shield'], bones: null, drops: [H('ore_starfall', 1, 2, 50), H('ore_celestium', 1, 1, 15)] });
dm('tm_frost_wyrm', '霜翼飞龙', '🐉', 150, 'magic', { exp: 'toth', slayer: true, sa: ['sa_frostbreath'], bones: 'elder_bones', drops: [H('hide_elder', 1, 1, 40), H('raw_frosteel', 2, 4, 40)] });
dm('tm_herald_zealot', '使者狂信徒', '🧎', 158, 'melee', { exp: 'toth', slayer: true, sa: ['sa_heavy'], bones: 'elder_bones', drops: [H('herb_heraldbloom', 1, 2, 40), H('seed_heraldbloom', 1, 1, 15), H('charm_fury', 1, 2, 20)] });
dm('tm_cloud_spirit', '云灵', '☁️', 168, 'ranged', { exp: 'toth', slayer: true, sa: ['sa_slow'], bones: null, drops: [H('rune_havoc', 5, 15, 50), H('charm_fortune', 1, 1, 15)] });
// Into the Abyss
const ab = (id: string, name: string, icon: string, L: number, type: 'melee' | 'ranged' | 'magic', drops: D[], o: { sa?: string[]; boss?: boolean; hp?: number; slayer?: boolean } = {}) =>
  dm(id, name, icon, L, type, { exp: 'ita', realm: 'abyssal', barrier: Math.round(L * (o.boss ? 6 : 3)), drops, sa: o.sa, boss: o.boss, hp: o.hp, slayer: o.slayer ?? !o.boss, bones: L > 260 ? 'abyssal_ashes' : 'void_ashes' });
ab('am_void_crawler', '虚空爬行者', '🦂', 200, 'melee', [H('abyssal_shard', 1, 3, 50), H('ore_void', 1, 2, 30)], { sa: ['sa_poison'] });
ab('am_shade', '暗影魅影', '👤', 210, 'magic', [H('rune_void', 5, 20, 50), H('abyssal_shard', 1, 3, 30)], { sa: ['sa_curse'] });
ab('am_void_hound', '虚空猎犬', '🐕', 220, 'melee', [H('hide_void', 1, 1, 40), H('abyssal_shard', 2, 4, 40)], { sa: ['sa_void'] });
ab('am_corrupted_ent', '腐化树人', '🌳', 235, 'melee', [H('log_shadowwood', 2, 6, 50), H('seed_voidroot', 1, 1, 15)], { sa: ['sa_corrupt'] });
ab('am_rot_sprite', '腐朽精灵', '🧚', 245, 'magic', [H('herb_voidroot', 1, 3, 50), H('rune_abyssal', 5, 15, 30)], { sa: ['sa_corrupt', 'sa_blind'] });
ab('am_abyss_archer', '深渊射手', '🏹', 255, 'ranged', [H('bar_void', 1, 2, 40), H('void_arrows', 10, 30, 30)], { sa: ['sa_triple'] });
ab('am_abyss_knight', '深渊骑士', '🛡️', 270, 'melee', [H('bar_abyssal', 1, 2, 40), H('abyssal_platelegs', 1, 1, 2)], { sa: ['sa_void', 'sa_heavy'] });
ab('am_soul_eater', '噬魂者', '👹', 285, 'magic', [H('rune_soul', 5, 15, 40), H('abyssal_stardust', 1, 1, 10)], { sa: ['sa_drain', 'sa_corrupt'] });
ab('am_nether_wyrm', '冥界巨龙', '🐲', 300, 'magic', [H('ore_netherite', 1, 3, 40), H('abyssal_ashes', 1, 2, 30)], { sa: ['sa_dragonfire', 'sa_void'] });
ab('am_lurker', '无光潜伏者', '🦑', 260, 'melee', [H('abyssal_shard', 3, 6, 50), H('gem_voidgem', 1, 1, 3)], { sa: ['sa_bleed', 'sa_void'] });
ab('am_eye', '深渊之眼', '👁️', 290, 'magic', [H('abyssal_stardust', 1, 2, 20), H('rune_soul', 5, 20, 40)], { sa: ['sa_stun', 'sa_vuln'] });
ab('ad_maw_guardian', '虚空之喉守卫', '🛡️', 240, 'melee', [], { sa: ['sa_void'], slayer: false });
ab('ad_maw', '虚空之喉', '🕳️', 275, 'magic', [], { boss: true, sa: ['sa_void', 'sa_annihilate'] });
ab('ad_shadow_warden', '暗影看守', '🗝️', 280, 'melee', [], { sa: ['sa_corrupt', 'sa_heavy'], slayer: false });
ab('ad_shadow_king', '暗影之王', '🤴', 310, 'melee', [], { boss: true, sa: ['sa_void', 'sa_drain', 'sa_annihilate'] });
ab('ad_abyss_herald', '深渊传令官', '📯', 320, 'magic', [], { sa: ['sa_corrupt', 'sa_curse'], slayer: false });
ab('ad_abyss_lord', '深渊之主', '😈', 360, 'magic', [], { boss: true, sa: ['sa_annihilate', 'sa_void', 'sa_corrupt', 'sa_stun'], hp: 900 });

// TotH 与深渊战斗区域
area('area_starfall', '星陨高地', '🌠', ['tm_starfall_golem', 'tm_frost_wyrm'], [{ type: 'dungeon', id: 'dg_chaos' }], 'melvor', 'toth', 'Throne of the Herald 区域。');
area('area_herald_lands', '使者领域', '🏛️', ['tm_herald_zealot', 'tm_cloud_spirit'], [{ type: 'dungeon', id: 'dg_herald_gate' }], 'melvor', 'toth');
area('area_void_edge', '虚空边缘', '🌑', ['am_void_crawler', 'am_shade', 'am_void_hound'], [{ type: 'realm', realm: 'abyssal' }], 'abyssal', 'ita', '深渊敌人拥有屏障，召唤兽可全额破除屏障。');
area('area_rot_forest', '腐化森林', '🍂', ['am_corrupted_ent', 'am_rot_sprite', 'am_abyss_archer'], [{ type: 'dungeon', id: 'dg_void_maw' }], 'abyssal', 'ita');
area('area_abyss_heart', '深渊之心', '🖤', ['am_abyss_knight', 'am_soul_eater', 'am_nether_wyrm'], [{ type: 'dungeon', id: 'dg_shadow_keep' }], 'abyssal', 'ita');
slayer('slayer_lightless', '无光深穴', '🕯️', ['am_lurker', 'am_eye'], 99, ['void_lantern'], { description: '玩家命中 -15%', modifiers: { meleeAccuracy: -15, rangedAccuracy: -15, magicAccuracy: -15 }, target: 'player' }, 'abyssal', 'ita');
C.areas['slayer_lightless'].requirements.push({ type: 'realm', realm: 'abyssal' });

// --------------------------------------------------------------------------- 副本
const chest = (id: string, entries: D[], rolls = 2) => { addDropTable({ id, rolls, entries: entries.map(([i, min, max, weight]) => ({ id: i, min, max, weight })) }); return id; };
const dungeon = (id: string, name: string, icon: string, seq: [string, number][], requirements: Requirement[], rewards: ItemQty[], table: D[], pet: string | undefined, o: Partial<{ unlocks: string; exp: ExpansionId; realm: Realm; endgame: boolean; noFood: boolean; description: string; petCompletions: number }> = {}) => {
  const monsters: string[] = [];
  for (const [m, n] of seq) for (let i = 0; i < n; i++) monsters.push(m);
  addDungeon({ id, name, icon, monsters, requirements, rewards, rewardTable: table.length ? chest(`dt_${id}`, table) : undefined, pet: pet ? { id: pet, completions: o.petCompletions ?? 100 } : undefined,
    unlocks: o.unlocks, realm: o.realm ?? 'melvor', expansion: o.exp ?? 'base', isEndgame: o.endgame, noFoodAllowed: o.noFood, description: o.description });
};
dungeon('dg_coop', '鸡舍', '🐔', [['dg_chick', 8], ['dg_hen_queen', 1]], [], [{ id: 'feather', qty: 200 }], [H('golden_egg', 1, 1, 2), H('egg', 5, 20, 50), H('raw_chicken', 5, 20, 48)], 'pet_coop', { description: '适合新手的第一个副本。' });
dungeon('dg_graveyard', '亡灵墓园', '⚰️', [['skeleton', 4], ['dg_skeleton_knight', 3], ['dg_banshee', 3], ['dg_grave_lord', 1]], [{ type: 'dungeon', id: 'dg_coop' }], [{ id: 'big_bones', qty: 20 }], [H('grave_scythe', 1, 1, 2), H('rune_death', 10, 30, 40), H('rune_body', 20, 60, 58)], 'pet_graveyard');
dungeon('dg_spider_forest', '蜘蛛森林', '🕸️', [['cave_spider', 5], ['dg_spiderling', 5], ['dg_spider_queen', 1]], [{ type: 'skill', skill: 'defence', level: 25 }], [{ id: 'gem_pouch', qty: 2 }], [H('silk_gloves', 1, 1, 3), H('herb_sunbloom', 3, 8, 50), H('seed_sunbloom', 2, 5, 47)], 'pet_spider');
dungeon('dg_frozen_cove', '冰封海湾', '🧊', [['ice_wolf', 4], ['dg_ice_sprite', 5], ['dg_frost_witch', 1]], [{ type: 'dungeon', id: 'dg_graveyard' }], [{ id: 'raw_cavefish', qty: 20 }], [H('frost_staff', 1, 1, 2), H('rune_water', 50, 150, 50), H('gem_sapphire', 1, 3, 48)], 'pet_frozen', { unlocks: '解锁永冻冰原与幽暗洞穴湖钓区' });
dungeon('dg_pirate_ship', '幽灵海盗船', '🚢', [['pirate', 4], ['dg_ghost_pirate', 5], ['dg_ghost_captain', 1]], [{ type: 'skill', skill: 'ranged', level: 30 }], [{ id: 'treasure_chest', qty: 3 }], [H('ghost_cutlass', 1, 1, 2), H('treasure_chest', 1, 3, 50), H('raw_shark', 5, 15, 48)], 'pet_pirate');
dungeon('dg_bandit_hideout', '盗贼巢穴', '🏚️', [['bandit', 5], ['dg_bandit_elite', 5], ['dg_bandit_king', 1]], [{ type: 'dungeon', id: 'dg_pirate_ship' }], [{ id: 'coin_pouch', qty: 10 }], [H('bandit_ring', 1, 1, 2), H('coin_pouch', 3, 10, 60), H('gem_ruby', 1, 2, 38)], 'pet_bandit');
dungeon('dg_volcano', '火山洞窟', '🌋', [['fire_elemental', 4], ['dg_magma_imp', 6], ['dg_flame_lord', 1]], [{ type: 'skill', skill: 'defence', level: 55 }, { type: 'dungeon', id: 'dg_frozen_cove' }], [{ id: 'rune_fire', qty: 500 }], [H('flame_bow', 1, 1, 2), H('ore_runite', 3, 8, 50), H('rune_lava', 50, 150, 48)], 'pet_volcano');
dungeon('dg_wizard_hall', '巫师大厅', '🏛️', [['apprentice', 4], ['dg_wizard_adept', 6], ['dg_grand_wizard', 1]], [{ type: 'skill', skill: 'magic', level: 55 }], [{ id: 'rune_blood', qty: 200 }], [H('archmage_hat', 1, 1, 2), H('rune_ancient', 10, 40, 40), H('robe_expert_bottoms', 1, 1, 8), H('rune_spirit', 20, 60, 50)], 'pet_wizard', { unlocks: '解锁龙之谷与远古魔法' });
dungeon('dg_dragon_den', '龙之巢穴', '🐲', [['green_dragon', 2], ['blue_dragon', 2], ['dg_drake', 5], ['dg_dragon_mother', 1]], [{ type: 'skill', skill: 'defence', level: 70 }, { type: 'dungeon', id: 'dg_wizard_hall' }], [{ id: 'dragon_bones', qty: 30 }], [H('dragon_scale_shield', 1, 1, 2), H('dragon_claws', 1, 1, 1), H('hide_black', 3, 8, 50), H('ore_dragonite', 3, 8, 47)], 'pet_dragon', { unlocks: '解锁龙晶矿' });
dungeon('dg_crystal_caves', '水晶洞穴', '💎', [['gargoyle', 4], ['dg_crystal_golem', 6], ['dg_crystal_core', 1]], [{ type: 'dungeon', id: 'dg_dragon_den' }], [{ id: 'gem_diamond', qty: 5 }], [H('crystal_platebody', 1, 1, 2), H('gem_diamond', 1, 3, 40), H('gem_emerald', 2, 5, 58)], 'pet_crystal');
dungeon('dg_infernal', '炼狱要塞', '🏰', [['demon', 5], ['dg_hellhound', 6], ['dg_infernal_lord', 1]], [{ type: 'dungeon', id: 'dg_crystal_caves' }, { type: 'skill', skill: 'hitpoints', level: 80 }], [{ id: 'magic_bones', qty: 30 }], [H('infernal_cape', 1, 1, 2), H('rune_blood', 50, 150, 50), H('bar_dragon', 2, 5, 48)], 'pet_infernal');
dungeon('dg_elemental', '元素神殿', '⛩️', [['dg_air_god', 1], ['dg_water_god', 1], ['dg_earth_god', 1], ['dg_fire_god', 1]], [{ type: 'dungeon', id: 'dg_infernal' }], [{ id: 'golden_stardust', qty: 10 }], [H('air_god_boots', 1, 1, 3), H('water_god_amulet', 1, 1, 3), H('earth_god_shield', 1, 1, 3), H('fire_god_sword', 1, 1, 3), H('rune_ancient', 30, 80, 88)], 'pet_elemental', { petCompletions: 50 });
dungeon('dg_forgotten_temple', '被遗忘的神殿', '🌀', [['dg_temple_guard', 8], ['dg_forgotten_one', 1]], [{ type: 'item', id: 'mysterious_stone', qty: 5 }, { type: 'dungeon', id: 'dg_crystal_caves' }], [{ id: 'weird_gloop', qty: 5 }], [H('chaos_helm', 1, 1, 3), H('rune_ancient', 50, 100, 60), H('golden_stardust', 5, 15, 37)], 'pet_temple', { description: '需要持有 5 块神秘石才能进入。' });
dungeon('dg_chaos', '暗黑降临', '👁️‍🗨️', [['dg_chaos_spawn', 10], ['dg_chaos_lord', 1]], [{ type: 'dungeon', id: 'dg_elemental' }, { type: 'dungeon', id: 'dg_forgotten_temple' }], [{ id: 'golden_stardust', qty: 50 }], [H('chaos_blade', 1, 1, 2), H('chaos_bow', 1, 1, 2), H('chaos_wand', 1, 1, 2), H('bar_dragon', 5, 15, 94)], 'pet_chaos', { endgame: true, unlocks: '基础游戏终局；解锁星陨高地（TotH）与深渊（ItA）', petCompletions: 25 });
// Throne of the Herald
dungeon('dg_herald_gate', '使者之门', '🚪', [['tg_gatekeeper', 8], ['tg_herald_knight', 1]], [{ type: 'dungeon', id: 'dg_chaos' }], [{ id: 'herald_sigil', qty: 1 }], [H('ore_starfall', 5, 15, 60), H('charm_ward', 2, 5, 40)], 'pet_herald_gate', { exp: 'toth', unlocks: '解锁星陨矿、使者领域' });
dungeon('dg_sky_citadel', '天穹堡垒', '🏯', [['tg_sky_archer', 6], ['tg_storm_mage', 6], ['tg_sky_sovereign', 1]], [{ type: 'dungeon', id: 'dg_herald_gate' }], [{ id: 'herald_sigil', qty: 1 }], [H('sky_bow', 1, 1, 2), H('starlight_scepter', 1, 1, 2), H('herald_wings', 1, 1, 1), H('ore_celestium', 3, 8, 95)], 'pet_sky', { exp: 'toth' });
dungeon('dg_lost_world', '失落世界', '🦖', [['tg_raptor', 10], ['tg_titan', 1]], [{ type: 'dungeon', id: 'dg_herald_gate' }, { type: 'skill', skill: 'slayer', level: 105 }], [{ id: 'herald_sigil', qty: 1 }], [H('lost_world_tooth', 1, 1, 2), H('herald_greatsword', 1, 1, 1), H('hide_elder', 5, 10, 97)], 'pet_lost_world', { exp: 'toth' });
dungeon('dg_throne', '使者王座', '👑', [['tg_herald_knight', 3], ['tg_sky_sovereign', 2], ['tg_titan', 1], ['tg_herald', 1]], [{ type: 'dungeon', id: 'dg_sky_citadel' }, { type: 'dungeon', id: 'dg_lost_world' }], [{ id: 'herald_sigil', qty: 2 }], [H('herald_crown', 1, 1, 3), H('herald_greatsword', 1, 1, 2), H('bar_celestium', 5, 15, 95)], 'pet_throne', { exp: 'toth', endgame: true, petCompletions: 25, unlocks: 'Throne of the Herald 终局' });
// Into the Abyss
dungeon('dg_void_maw', '虚空之喉', '🕳️', [['am_void_hound', 4], ['ad_maw_guardian', 6], ['ad_maw', 1]], [{ type: 'realm', realm: 'abyssal' }], [{ id: 'abyssal_shard', qty: 50 }], [H('void_reaper', 1, 1, 2), H('bar_void', 5, 15, 98)], 'pet_void_maw', { exp: 'ita', realm: 'abyssal' });
dungeon('dg_shadow_keep', '暗影要塞', '🏰', [['am_abyss_archer', 5], ['ad_shadow_warden', 6], ['ad_shadow_king', 1]], [{ type: 'dungeon', id: 'dg_void_maw' }], [{ id: 'corrupted_heart', qty: 1 }], [H('shadow_longbow', 1, 1, 2), H('bar_abyssal', 5, 15, 98)], 'pet_shadow_keep', { exp: 'ita', realm: 'abyssal' });
dungeon('dg_abyss_throne', '深渊王座', '😈', [['am_soul_eater', 4], ['ad_abyss_herald', 6], ['ad_abyss_lord', 1]], [{ type: 'dungeon', id: 'dg_shadow_keep' }, { type: 'item', id: 'corrupted_heart', qty: 3 }], [{ id: 'abyssal_stardust', qty: 20 }], [H('abyss_crown', 1, 1, 3), H('heart_of_abyss', 1, 1, 1), H('bar_nether', 5, 15, 96)], 'pet_abyss_throne', { exp: 'ita', realm: 'abyssal', endgame: true, petCompletions: 25, unlocks: 'Into the Abyss 终局；需要 3 颗腐化之心' });

// --------------------------------------------------------------------------- Slayer 档位
C.slayerTiers.push(
  { id: 'easy', name: '简单', minLevel: 1, maxLevel: 49, slayerLevel: 1, cost: 0, currency: 'slayerCoins', killsMin: 10, killsMax: 40, realm: 'melvor' },
  { id: 'normal', name: '普通', minLevel: 50, maxLevel: 99, slayerLevel: 1, cost: 200, currency: 'slayerCoins', killsMin: 15, killsMax: 50, realm: 'melvor' },
  { id: 'hard', name: '困难', minLevel: 100, maxLevel: 139, slayerLevel: 50, cost: 500, currency: 'slayerCoins', killsMin: 20, killsMax: 60, realm: 'melvor' },
  { id: 'elite', name: '精英', minLevel: 140, maxLevel: 179, slayerLevel: 75, cost: 1000, currency: 'slayerCoins', killsMin: 25, killsMax: 70, realm: 'melvor' },
  { id: 'master', name: '大师', minLevel: 180, maxLevel: 999, slayerLevel: 90, cost: 2000, currency: 'slayerCoins', killsMin: 30, killsMax: 80, realm: 'melvor' },
  { id: 'abyssal1', name: '深渊 I', minLevel: 200, maxLevel: 280, slayerLevel: 99, cost: 500, currency: 'abyssalSlayerCoins', killsMin: 15, killsMax: 40, realm: 'abyssal' },
  { id: 'abyssal2', name: '深渊 II', minLevel: 281, maxLevel: 9999, slayerLevel: 99, cost: 1500, currency: 'abyssalSlayerCoins', killsMin: 20, killsMax: 50, realm: 'abyssal' },
);
