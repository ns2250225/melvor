// ============================================================================
// 核心类型定义：内容数据（只读定义）与运行时状态严格分离
// ============================================================================

export type ExpansionId = 'base' | 'toth' | 'aod' | 'ita';
export type Realm = 'melvor' | 'abyssal';

export type SkillId =
  | 'attack' | 'strength' | 'defence' | 'hitpoints' | 'ranged' | 'magic' | 'prayer' | 'slayer'
  | 'woodcutting' | 'fishing' | 'firemaking' | 'cooking' | 'mining' | 'smithing' | 'thieving'
  | 'farming' | 'fletching' | 'crafting' | 'runecrafting' | 'herblore' | 'agility' | 'summoning'
  | 'astrology' | 'township' | 'cartography' | 'archaeology' | 'corruption' | 'harvesting';

export type SkillCategory = 'combat' | 'gathering' | 'artisan' | 'support' | 'passive';

export interface SkillDefinition {
  id: SkillId;
  name: string;
  icon: string;
  color: string;
  category: SkillCategory;
  maxLevel: number;          // 基础等级上限（扩展可提升）
  xpCurveId: 'standard';
  actions: string[];         // 动作 ID 列表（由内容注册阶段填充）
  masteryEnabled: boolean;
  abyssalEnabled: boolean;   // 是否支持深渊等级（Into the Abyss）
  offlinePolicy: 'simulate' | 'passive' | 'none';
  expansionId?: ExpansionId;
  description: string;
}

export interface ItemQty { id: string; qty: number }

export type ItemType =
  | 'log' | 'ore' | 'bar' | 'gem' | 'fish' | 'food' | 'equipment' | 'weapon' | 'ammo' | 'rune'
  | 'potion' | 'bone' | 'seed' | 'herb' | 'shard' | 'tablet' | 'chest' | 'currency' | 'material'
  | 'map' | 'artifact' | 'junk' | 'consumable' | 'produce' | 'token' | 'misc';

export type EquipSlot =
  | 'helmet' | 'body' | 'legs' | 'boots' | 'gloves' | 'cape' | 'amulet' | 'ring'
  | 'weapon' | 'shield' | 'quiver' | 'passive' | 'summon1' | 'summon2' | 'consumable' | 'gem';

export const EQUIP_SLOTS: EquipSlot[] = [
  'helmet', 'body', 'legs', 'boots', 'gloves', 'cape', 'amulet', 'ring',
  'weapon', 'shield', 'quiver', 'passive', 'summon1', 'summon2', 'consumable', 'gem',
];

export type AttackType = 'melee' | 'ranged' | 'magic';
export type MeleeStyle = 'stab' | 'slash' | 'block';

export type StatKey =
  | 'attackSpeed' | 'stabAttack' | 'slashAttack' | 'blockAttack' | 'meleeStrength'
  | 'rangedAttack' | 'rangedStrength' | 'magicAttack' | 'magicDamage'
  | 'meleeDefence' | 'rangedDefence' | 'magicDefence' | 'damageReduction' | 'abyssalResistance'
  | 'summoningMaxHit';

export type Stats = Partial<Record<StatKey, number>>;

/** 修饰符映射：key 形如 "skillXP" 或 "skillXP:woodcutting" */
export type ModifierMap = Record<string, number>;

export type AmmoType = 'arrow' | 'bolt' | 'javelin' | 'knife';

export interface EquipmentDef {
  slot: EquipSlot;
  twoHanded?: boolean;
  attackType?: AttackType;      // 武器专用
  ammoType?: AmmoType;          // 远程武器需要的弹药 / 弹药自身类型
  isAmmo?: boolean;
  throwsSelf?: boolean;         // 投掷武器（标枪、飞刀）本身被消耗
  requirements: { skill: SkillId; level: number; abyssal?: boolean }[];
  stats: Stats;
  modifiers?: ModifierMap;
  specialAttacks?: string[];    // 特殊攻击 ID
  providesRunes?: string[];     // 法杖提供的无限符文
  realm?: Realm;
}

export interface PotionDef {
  skill: SkillId | 'combat';
  tier: number;                 // 1..4
  charges: number;
  modifiers: ModifierMap;
  healPercent?: number;
}

export interface ItemDef {
  id: string;
  name: string;
  type: ItemType;
  icon: string;
  color?: string;
  description?: string;
  sellPrice: number;
  /** 稀有度 0 普通 1 稀有 2 史诗 3 传说 */
  rarity?: 0 | 1 | 2 | 3;
  category: string;             // 银行分类
  expansion: ExpansionId;
  equipment?: EquipmentDef;
  healsFor?: number;            // 食物恢复量（生命值 ×10 制）
  potion?: PotionDef;
  prayerPoints?: number;        // 骨头
  dropTable?: string;           // 可开启（宝箱）
  soulPoints?: number;          // 深渊骨灰
  tablet?: { familiarId: string };
  artifact?: { digSite: string; size: ArtifactSize };
  stackable?: boolean;          // 默认 true
  /** 不可出售（任务物品等） */
  noSell?: boolean;
}

export type ArtifactSize = 'tiny' | 'small' | 'medium' | 'large';

// ----------------------------------------------------------------------------
// 需求 / 解锁条件
// ----------------------------------------------------------------------------
export type Requirement =
  | { type: 'skill'; skill: SkillId; level: number }
  | { type: 'abyssal'; skill: SkillId; level: number }
  | { type: 'dungeon'; id: string; count?: number }
  | { type: 'quest'; id: string }
  | { type: 'shop'; id: string; count?: number }
  | { type: 'monster'; id: string; count: number }
  | { type: 'equipped'; id: string }
  | { type: 'item'; id: string; qty?: number }
  | { type: 'poi'; id: string }
  | { type: 'realm'; realm: Realm }
  | { type: 'township'; level: number }
  | { type: 'gameMode'; mode: GameMode }
  | { type: 'totalLevel'; level: number };

// ----------------------------------------------------------------------------
// 掉落表
// ----------------------------------------------------------------------------
export interface DropEntry { id: string; min: number; max: number; weight: number }
export interface DropTableDef {
  id: string;
  /** 每次掷骰次数 */
  rolls?: number;
  /** 总体触发概率（0-1），默认 1 */
  chance?: number;
  entries: DropEntry[];
}

// ----------------------------------------------------------------------------
// 技能动作（统一动作模型）
// ----------------------------------------------------------------------------
export interface SkillActionDef {
  id: string;
  skill: SkillId;
  name: string;
  icon: string;
  category?: string;            // 例如 cooking 的 fire/furnace/pot，fishing 的钓区
  level: number;
  abyssalLevel?: number;
  realm?: Realm;
  interval: number;             // 毫秒
  intervalMax?: number;         // 随机耗时上限（钓鱼）
  xp: number;
  abyssalXp?: number;
  inputs: ItemQty[];
  outputs: ItemQty[];
  gp?: number;
  /** 输入替代：任意一组输入可满足（例如烹饪、召唤石板的可选材料） */
  altInputs?: ItemQty[][];
  requirements?: Requirement[];
  masteryEnabled?: boolean;     // 默认 true
  /** 额外随机产出 */
  extraDrops?: { id: string; chance: number; qty?: number }[];
  /** 技能专属数据 */
  data?: Record<string, any>;
  expansion: ExpansionId;
  description?: string;
}

// ----------------------------------------------------------------------------
// 战斗内容
// ----------------------------------------------------------------------------
export type StatusEffectKind =
  | 'poison' | 'burn' | 'bleed' | 'stun' | 'freeze' | 'sleep' | 'slow'
  | 'weaken' | 'blind' | 'curse' | 'regen' | 'shield' | 'corruption' | 'vulnerable';

export interface StatusEffectApply {
  kind: StatusEffectKind;
  chance: number;               // 0-1
  turns?: number;               // 持续回合（攻击次数）
  duration?: number;            // 持续毫秒
  value?: number;               // 每跳伤害或百分比
  target?: 'self' | 'enemy';
}

export interface SpecialAttackDef {
  id: string;
  name: string;
  description: string;
  chance: number;               // 0-100
  damageMultiplier?: number;    // 伤害倍率
  hits?: number;                // 多段攻击
  minAccuracyBoost?: boolean;   // 必中
  lifesteal?: number;           // 0-1
  flatDamage?: number;
  effects?: StatusEffectApply[];
}

export interface MonsterDef {
  id: string;
  name: string;
  icon: string;
  level?: number;               // 计算得出的战斗等级
  hitpoints: number;            // 等级，实际生命 = ×10
  attack: number;
  strength: number;
  defence: number;
  ranged: number;
  magic: number;
  attackType: AttackType;
  attackSpeed: number;          // ms
  bonuses: Stats;
  maxHitOverride?: number;      // 法术怪物用
  specialAttacks?: string[];
  passives?: ModifierMap;       // 怪物被动
  drops: string | null;         // 掉落表 ID
  bones?: string | null;
  gp: [number, number];
  isBoss?: boolean;
  slayerTaskable?: boolean;
  realm?: Realm;
  damageType?: 'normal' | 'abyssal';
  barrier?: number;             // 深渊屏障（需要屏障伤害）
  expansion: ExpansionId;
  pet?: { id: string; chance: number };
}

export interface CombatAreaDef {
  id: string;
  name: string;
  icon: string;
  type: 'combat' | 'slayer';
  monsters: string[];
  requirements: Requirement[];
  /** Slayer 区域进入物品要求（需要装备） */
  entryEquipment?: string[];
  areaEffect?: { description: string; modifiers: ModifierMap; target: 'player' | 'enemy' };
  realm: Realm;
  expansion: ExpansionId;
  description?: string;
}

export interface DungeonDef {
  id: string;
  name: string;
  icon: string;
  monsters: string[];           // 顺序敌人序列
  requirements: Requirement[];
  rewards: ItemQty[];           // 通关固定奖励
  rewardTable?: string;         // 通关宝箱
  pet?: { id: string; completions: number };
  unlocks?: string;             // 描述文字
  noFoodAllowed?: boolean;
  realm: Realm;
  expansion: ExpansionId;
  isEndgame?: boolean;
  description?: string;
}

export interface SlayerTierDef {
  id: string;
  name: string;
  minLevel: number;             // 怪物战斗等级区间
  maxLevel: number;
  slayerLevel: number;          // Slayer 技能等级要求
  cost: number;                 // Slayer 币
  currency: 'slayerCoins' | 'abyssalSlayerCoins';
  killsMin: number;
  killsMax: number;
  realm: Realm;
}

export type SpellBook = 'standard' | 'curse' | 'aura' | 'ancient' | 'archaic' | 'abyssal' | 'alt';

export interface SpellDef {
  id: string;
  name: string;
  icon: string;
  book: SpellBook;
  level: number;
  runes: ItemQty[];
  maxHit?: number;              // 伤害法术基础最大伤害（×10 制）
  xp?: number;                  // 替代魔法经验
  modifiers?: ModifierMap;      // 光环
  curse?: { kind: 'accuracy' | 'evasion' | 'damage' | 'maxhit' | 'decay'; value: number; turns: number };
  specialAttack?: string;
  requirements?: Requirement[];
  /** 替代魔法专属行为 */
  alt?: { kind: 'alch' | 'superheat' | 'enchant' | 'convert' | 'charge'; ratio?: number; target?: string; produces?: ItemQty[]; consumes?: ItemQty[]; itemTypes?: ItemType[] };
  interval?: number;
  expansion: ExpansionId;
  description: string;
}

export interface PrayerDef {
  id: string;
  name: string;
  icon: string;
  level: number;
  pointsPerPlayer: number;      // 玩家每次攻击消耗
  pointsPerEnemy: number;       // 敌人每次攻击消耗
  modifiers: ModifierMap;
  book: 'normal' | 'unholy' | 'abyssal';
  requirements?: Requirement[];
  description: string;
  expansion: ExpansionId;
}

// ----------------------------------------------------------------------------
// 召唤
// ----------------------------------------------------------------------------
export interface FamiliarDef {
  id: string;
  name: string;
  icon: string;
  level: number;
  tabletId: string;
  /** 印记来源技能（使用这些技能时有概率发现印记） */
  markSkills: SkillId[];
  combat?: { maxHit: number };
  modifiers: ModifierMap;
  expansion: ExpansionId;
  realm: Realm;
}

export interface SynergyDef {
  a: string;
  b: string;
  description: string;
  modifiers: ModifierMap;
}

// ----------------------------------------------------------------------------
// 商店
// ----------------------------------------------------------------------------
export interface ShopItemDef {
  id: string;
  name: string;
  icon: string;
  category: string;
  description: string;
  cost: { gp?: number; slayerCoins?: number; abyssalPieces?: number; abyssalSlayerCoins?: number; items?: ItemQty[]; scaling?: 'bankSlot' };
  /** 购买得到的物品；若为空则为永久升级 */
  grants?: ItemQty[];
  /** 永久升级效果 */
  upgrade?: { modifiers?: ModifierMap; flag?: string };
  buyLimit: number;             // 0 = 无限制
  requirements: Requirement[];
  /** 购买后替换前一档（如斧头升级） */
  replaces?: string;
  expansion: ExpansionId;
  /** 手套等充能物品：每次购买获得的充能次数 */
  charges?: number;
}

// ----------------------------------------------------------------------------
// 任务 / 成就 / 宠物
// ----------------------------------------------------------------------------
export type ObjectiveDef =
  | { type: 'skillLevel'; skill: SkillId; level: number }
  | { type: 'kill'; monster?: string; count: number; realm?: Realm }
  | { type: 'craft'; item: string; count: number }
  | { type: 'collect'; item: string; count: number; consume?: boolean }
  | { type: 'dungeon'; id: string; count: number }
  | { type: 'actions'; skill: SkillId; count: number }
  | { type: 'gp'; amount: number }
  | { type: 'totalLevel'; level: number }
  | { type: 'pet'; count: number }
  | { type: 'poi'; count: number }
  | { type: 'township'; level: number }
  | { type: 'abyssalLevel'; skill: SkillId; level: number };

export interface QuestReward {
  gp?: number;
  items?: ItemQty[];
  xp?: { skill: SkillId; amount: number }[];
  slayerCoins?: number;
  abyssalPieces?: number;
  unlockFlag?: string;
}

export interface QuestDef {
  id: string;
  name: string;
  description: string;
  chapter: string;
  prerequisites: string[];
  requirements: Requirement[];
  objectives: ObjectiveDef[];
  rewards: QuestReward;
  expansion: ExpansionId;
}

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  hidden?: boolean;
  condition: ObjectiveDef | { type: 'stat'; stat: string; value: number } | { type: 'completion'; percent: number } | { type: 'mastery99'; skill?: SkillId; count: number };
  reward?: QuestReward;
  expansion: ExpansionId;
}

export interface PetDef {
  id: string;
  name: string;
  icon: string;
  source: string;               // 描述
  sourceType: 'skill' | 'dungeon' | 'monster' | 'special';
  sourceId?: string;
  modifiers: ModifierMap;
  description: string;
  expansion: ExpansionId;
}

// ----------------------------------------------------------------------------
// 综合技能内容
// ----------------------------------------------------------------------------
export interface ObstacleDef {
  id: string;
  name: string;
  icon: string;
  slot: number;                 // 0..N-1，第 N 位为立柱
  level: number;
  abyssalLevel?: number;
  interval: number;
  xp: number;
  gp: number;
  cost: { gp: number; items: ItemQty[] };
  modifiers: ModifierMap;
  isPillar?: boolean;
  realm: Realm;
  expansion: ExpansionId;
}

export interface ConstellationDef {
  id: string;
  name: string;
  icon: string;
  level: number;
  abyssalLevel?: number;
  xp: number;
  skills: SkillId[];
  /** 标准修饰（星尘购买），每项最多 maxLevel 级 */
  standard: { key: string; perLevel: number; maxLevel: number; description: string }[];
  /** 独特修饰（金星尘购买） */
  unique: { key: string; perLevel: number; maxLevel: number; description: string }[];
  realm: Realm;
  expansion: ExpansionId;
}

export interface FarmingCropDef {
  id: string;                   // 动作 ID（同时等于种子作物）
  seed: string;
  seedQty: number;
  produce: string;
  plotType: 'allotment' | 'herb' | 'tree';
  level: number;
  growTime: number;             // ms
  xp: number;
  baseYield: number;
  expansion: ExpansionId;
}

export interface TownshipBuildingDef {
  id: string;
  name: string;
  icon: string;
  biomes: string[];
  level: number;
  cost: Partial<Record<string, number>>;   // 资源 ID → 数量（gp 用 'gp'）
  maxCount: number;
  provides: {
    population?: number;
    storage?: number;
    happiness?: number;
    education?: number;
    health?: number;
    worship?: number;
    production?: Partial<Record<string, number>>;  // 每次城镇结算
    consumption?: Partial<Record<string, number>>;
    taxGp?: number;
  };
  xp: number;
  expansion: ExpansionId;
}

export interface TownshipResourceDef {
  id: string;
  name: string;
  icon: string;
  /** 可兑换为的游戏物品 */
  convertsTo?: string;
  convertRatio?: number;
  /** 由游戏物品兑换为城镇资源 */
  fromItems?: string[];
}

export interface DigSiteDef {
  id: string;
  name: string;
  icon: string;
  level: number;
  abyssalLevel?: number;
  hex: [number, number];
  artifacts: Record<ArtifactSize, string[]>;
  xp: number;
  realm: Realm;
  expansion: ExpansionId;
}

export interface PoiDef {
  id: string;
  name: string;
  icon: string;
  hex: [number, number];
  kind: 'digSite' | 'watchtower' | 'portal' | 'treasure' | 'landmark' | 'hiddenHole';
  digSite?: string;
  reward?: QuestReward;
  modifiers?: ModifierMap;     // 发现后永久加成
  description: string;
}

export interface SkillTreeNodeDef {
  id: string;
  skill: SkillId;
  name: string;
  cost: number;
  parents: string[];
  modifiers: ModifierMap;
  description: string;
}

export interface CorruptionEffectDef {
  id: string;
  name: string;
  level: number;
  description: string;
  enemyModifiers: ModifierMap;  // 施加于敌人
  playerModifiers?: ModifierMap;
}

export type GameMode = 'standard' | 'hardcore' | 'adventure';

export interface GameModeDef {
  id: GameMode;
  name: string;
  description: string;
  permadeath: boolean;
  skillUnlockCost: boolean;     // 冒险模式：技能需要用金币解锁
  startingGp: number;
  combatTriangle: 'standard' | 'hardcore';
  levelCapBase: number;
}
