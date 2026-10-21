// 内容注册表：所有游戏内容数据（只读）集中于此，供规则引擎按 ID 查询。
import type {
  ItemDef, SkillActionDef, MonsterDef, CombatAreaDef, DungeonDef, DropTableDef, SpellDef, PrayerDef,
  FamiliarDef, SynergyDef, ShopItemDef, QuestDef, AchievementDef, PetDef, ObstacleDef, ConstellationDef,
  FarmingCropDef, TownshipBuildingDef, TownshipResourceDef, DigSiteDef, PoiDef, SkillTreeNodeDef,
  CorruptionEffectDef, SpecialAttackDef, SlayerTierDef, SkillDefinition, SkillId, ExpansionId, GameModeDef,
} from '@/game/core/types';

export interface ContentRegistry {
  skills: Record<SkillId, SkillDefinition>;
  skillOrder: SkillId[];
  items: Record<string, ItemDef>;
  actions: Record<string, SkillActionDef>;
  actionsBySkill: Partial<Record<SkillId, SkillActionDef[]>>;
  monsters: Record<string, MonsterDef>;
  areas: Record<string, CombatAreaDef>;
  dungeons: Record<string, DungeonDef>;
  dropTables: Record<string, DropTableDef>;
  specialAttacks: Record<string, SpecialAttackDef>;
  spells: Record<string, SpellDef>;
  prayers: Record<string, PrayerDef>;
  familiars: Record<string, FamiliarDef>;
  synergies: SynergyDef[];
  shop: Record<string, ShopItemDef>;
  quests: Record<string, QuestDef>;
  achievements: Record<string, AchievementDef>;
  pets: Record<string, PetDef>;
  obstacles: Record<string, ObstacleDef>;
  constellations: Record<string, ConstellationDef>;
  crops: Record<string, FarmingCropDef>;
  townshipBuildings: Record<string, TownshipBuildingDef>;
  townshipResources: Record<string, TownshipResourceDef>;
  digSites: Record<string, DigSiteDef>;
  pois: Record<string, PoiDef>;
  skillTree: Record<string, SkillTreeNodeDef>;
  corruptionEffects: Record<string, CorruptionEffectDef>;
  slayerTiers: SlayerTierDef[];
  gameModes: Record<string, GameModeDef>;
  /** 物品来源索引（用于图鉴、完整性校验） */
  itemSources: Record<string, string[]>;
  itemUses: Record<string, string[]>;
}

export const C: ContentRegistry = {
  skills: {} as Record<SkillId, SkillDefinition>,
  skillOrder: [],
  items: {}, actions: {}, actionsBySkill: {}, monsters: {}, areas: {}, dungeons: {}, dropTables: {},
  specialAttacks: {}, spells: {}, prayers: {}, familiars: {}, synergies: [], shop: {}, quests: {},
  achievements: {}, pets: {}, obstacles: {}, constellations: {}, crops: {}, townshipBuildings: {},
  townshipResources: {}, digSites: {}, pois: {}, skillTree: {}, corruptionEffects: {}, slayerTiers: [],
  gameModes: {}, itemSources: {}, itemUses: {},
};

/** 重复 ID 记录（供内容校验工具） */
export const duplicateIds: string[] = [];

function put<T extends { id: string }>(map: Record<string, T>, def: T, kind: string): T {
  if (map[def.id]) duplicateIds.push(`${kind}:${def.id}`);
  map[def.id] = def;
  return def;
}

type ItemInput = Omit<ItemDef, 'expansion' | 'category' | 'sellPrice'> & Partial<Pick<ItemDef, 'expansion' | 'category' | 'sellPrice'>>;

export function addItem(def: ItemInput): ItemDef {
  const full: ItemDef = { expansion: 'base', category: def.type, sellPrice: 1, ...def } as ItemDef;
  return put(C.items, full, 'item');
}

export function addAction(def: SkillActionDef): SkillActionDef {
  put(C.actions, def, 'action');
  (C.actionsBySkill[def.skill] ||= []).push(def);
  return def;
}

export function addMonster(def: MonsterDef) { return put(C.monsters, def, 'monster'); }
export function addArea(def: CombatAreaDef) { return put(C.areas, def, 'area'); }
export function addDungeon(def: DungeonDef) { return put(C.dungeons, def, 'dungeon'); }
export function addDropTable(def: DropTableDef) { return put(C.dropTables, def, 'dropTable'); }
export function addSpecial(def: SpecialAttackDef) { return put(C.specialAttacks, def, 'special'); }
export function addSpell(def: SpellDef) { return put(C.spells, def, 'spell'); }
export function addPrayer(def: PrayerDef) { return put(C.prayers, def, 'prayer'); }
export function addFamiliar(def: FamiliarDef) { return put(C.familiars, def, 'familiar'); }
export function addShopItem(def: ShopItemDef) { return put(C.shop, def, 'shop'); }
export function addQuest(def: QuestDef) { return put(C.quests, def, 'quest'); }
export function addAchievement(def: AchievementDef) { return put(C.achievements, def, 'achievement'); }
export function addPet(def: PetDef) { return put(C.pets, def, 'pet'); }
export function addObstacle(def: ObstacleDef) { return put(C.obstacles, def, 'obstacle'); }
export function addConstellation(def: ConstellationDef) { return put(C.constellations, def, 'constellation'); }
export function addCrop(def: FarmingCropDef) { return put(C.crops, def, 'crop'); }
export function addBuilding(def: TownshipBuildingDef) { return put(C.townshipBuildings, def, 'building'); }
export function addTownResource(def: TownshipResourceDef) { return put(C.townshipResources, def, 'townResource'); }
export function addDigSite(def: DigSiteDef) { return put(C.digSites, def, 'digSite'); }
export function addPoi(def: PoiDef) { return put(C.pois, def, 'poi'); }
export function addTreeNode(def: SkillTreeNodeDef) { return put(C.skillTree, def, 'treeNode'); }
export function addCorruption(def: CorruptionEffectDef) { return put(C.corruptionEffects, def, 'corruption'); }

export function item(id: string): ItemDef {
  const it = C.items[id];
  if (!it) throw new Error(`Unknown item: ${id}`);
  return it;
}

export function itemName(id: string): string {
  return C.items[id]?.name ?? id;
}

export function noteSource(itemId: string, source: string) {
  (C.itemSources[itemId] ||= []);
  if (!C.itemSources[itemId].includes(source)) C.itemSources[itemId].push(source);
}

export function noteUse(itemId: string, use: string) {
  (C.itemUses[itemId] ||= []);
  if (!C.itemUses[itemId].includes(use)) C.itemUses[itemId].push(use);
}

export const EXPANSION_NAMES: Record<ExpansionId, string> = {
  base: '基础游戏',
  toth: 'Throne of the Herald',
  aod: 'Atlas of Discovery',
  ita: 'Into the Abyss',
};
