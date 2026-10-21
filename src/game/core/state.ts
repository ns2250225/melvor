// 运行时游戏状态（存档主体）与新角色初始化
import type { SkillId, EquipSlot, GameMode, Realm, ArtifactSize, MeleeStyle } from './types';
import { EQUIP_SLOTS } from './types';
import { C } from '@/content';
import { seedFromNumber, randomSeed, type RngState } from './rng';
import { ADVENTURE_START_SKILLS } from '@/content/skills';
import { FARMING_PLOTS } from '@/content/recipes/support';

export const SCHEMA_VERSION = 3;
export const GAME_VERSION = '1.0.0';
export const OFFLINE_RULES_VERSION = 1;

export interface SkillState {
  skillId: SkillId;
  xp: number;
  level: number;
  unlocked: boolean;
  abyssalXp: number;
  abyssalLevel: number;
  masteryPoolXp: number;
  treePoints: number;
  treeNodes: string[];
}

export interface EquipStack { id: string; qty: number }
export type EquipmentSet = Partial<Record<EquipSlot, EquipStack | null>>;

export interface ActiveEffect { kind: string; turns: number; value: number; tickTimer?: number; source?: string }

export interface EnemyState {
  monsterId: string;
  hp: number;
  maxHp: number;
  barrier: number;
  maxBarrier: number;
  attackTimer: number;
  effects: ActiveEffect[];
  corruption: string[];
}

export interface CombatLogEntry { t: number; text: string; kind: 'player' | 'enemy' | 'info' | 'loot' | 'xp' | 'danger' }

export interface CombatState {
  active: boolean;
  area: { kind: 'area' | 'slayer' | 'dungeon'; id: string; monster?: string } | null;
  dungeonIndex: number;
  enemy: EnemyState | null;
  spawnTimer: number;
  playerAttackTimer: number;
  playerEffects: ActiveEffect[];
  summonTimer: number;
  regenTimer: number;
  meleeStyle: MeleeStyle;
  rangedStyle: 'accurate' | 'rapid' | 'longrange';
  magicStyle: 'magic' | 'defensive';
  redemptionUsed: boolean;
  loot: { id: string; qty: number }[];
  log: CombatLogEntry[];
  killsThisRun: number;
}

export interface ActiveAction {
  skill: SkillId;
  actionId: string;
  progress: number;          // 当前动作已累计毫秒
  interval: number;          // 当前动作总耗时
  secondaryId?: string;      // 双树伐木
  secondaryProgress?: number;
  secondaryInterval?: number;
  startedAt: number;
  completed: number;
  // 替代魔法与其他需要目标的动作
  target?: string;
}

export interface PlotState { id: string; unlocked: boolean; cropId: string | null; plantedAt: number; compost: number; gloop: boolean }

export interface TownshipState {
  level: number;
  resources: Record<string, number>;
  buildings: Record<string, Record<string, number>>; // biome -> building -> count
  land: Record<string, number>;
  population: number;
  happiness: number;
  education: number;
  health: number;
  worship: number;
  deity: string;
  tickTimer: number;
  ticks: number;
  season: number;
  tasksCompleted: string[];
  storage: number;
}

export interface CartographyState {
  pos: [number, number];
  hexes: Record<string, number>;   // "q,r" -> 勘测经验
  surveyed: string[];              // 完全勘测
  target: string | null;           // 当前勘测目标
  discovered: string[];            // 兴趣点
  maps: Record<string, { tier: number; charges: number }>;
}

export interface GameStatistics { [key: string]: number }

export interface Settings {
  theme: 'dark' | 'light' | 'auto';
  sound: boolean;
  volume: number;
  notifications: boolean;
  showCombatLog: boolean;
  confirmSell: boolean;
  autoSaveSeconds: number;
  compactNumbers: boolean;
  autoRestartDungeon: boolean;
  autoLoot: boolean;
  offlineReport: boolean;
  bankSort: 'default' | 'name' | 'value' | 'qty' | 'category';
}

export interface Notification { id: number; text: string; kind: string; icon?: string; t: number }

export interface GameState {
  schemaVersion: number;
  gameVersion: string;
  contentManifestVersion: string;
  offlineRulesVersion: number;
  player: { id: string; name: string; mode: GameMode; createdAt: number; realm: Realm; dead?: boolean };
  clock: number;
  lastSettledAt: number;
  hp: number;
  cooking: { passive: Record<string, string | null>; timers: Record<string, number> };
  playTime: number;
  settlementId: number;
  skills: Record<SkillId, SkillState>;
  mastery: Record<string, number>;
  bank: Record<string, number>;
  bankOrder: string[];
  bankLocked: Record<string, boolean>;
  currencies: { gp: number; slayerCoins: number; abyssalPieces: number; abyssalSlayerCoins: number; prayerPoints: number; soulPoints: number };
  equipmentSets: EquipmentSet[];
  activeSet: number;
  food: (EquipStack | null)[];
  selectedFood: number;
  combat: CombatState;
  activeAction: ActiveAction | null;
  potions: Record<string, { itemId: string; charges: number }>;
  glovesCharges: Record<string, number>;
  shop: Record<string, number>;
  flags: Record<string, number>;
  farming: { plots: PlotState[] };
  agility: { built: Record<number, string | null>; currentSlot: number; buildCounts: Record<string, number> };
  astrology: Record<string, { std: number[]; uniq: number[] }>;
  summoning: { marks: Record<string, number> };
  township: TownshipState;
  cartography: CartographyState;
  archaeology: { tools: Record<ArtifactSize, number>; museum: Record<string, boolean>; museumRewards: number };
  harvesting: { intensity: Record<string, number> };
  corruption: { enabled: string[] };
  mining: { rocks: Record<string, { hp: number; respawnAt: number }> };
  bonfire: { endsAt: number; bonus: number; logsBurnt: number };
  slayer: { task: { monsterId: string; total: number; remaining: number; tier: string; realm: Realm } | null; tasksCompleted: Record<string, number>; autoSlayer: boolean };
  magic: { spell: string | null; curse: string | null; aura: string | null };
  prayers: string[];
  quests: Record<string, { status: 'active' | 'completed'; progress: number[]; startedAt: number }>;
  achievements: Record<string, number>;
  pets: Record<string, number>;
  dungeonCompletions: Record<string, number>;
  monsterKills: Record<string, number>;
  itemsFound: Record<string, number>;
  stats: GameStatistics;
  skillStats: Record<string, Record<string, number>>;
  settings: Settings;
  rngState: RngState;
  recent: { items: { id: string; qty: number; t: number }[]; levels: { skill: SkillId; level: number; t: number; abyssal: boolean }[] };
}

export function defaultSettings(): Settings {
  return {
    theme: 'auto', sound: true, volume: 0.4, notifications: true, showCombatLog: true, confirmSell: true,
    autoSaveSeconds: 10, compactNumbers: true, autoRestartDungeon: true, autoLoot: true, offlineReport: true, bankSort: 'default',
  };
}

export function defaultCombat(): CombatState {
  return {
    active: false, area: null, dungeonIndex: 0, enemy: null, spawnTimer: 0, playerAttackTimer: 0, playerEffects: [],
    summonTimer: 0, regenTimer: 0, meleeStyle: 'stab', rangedStyle: 'accurate', magicStyle: 'magic', redemptionUsed: false,
    loot: [], log: [], killsThisRun: 0,
  };
}

export function emptyEquipmentSet(): EquipmentSet {
  const s: EquipmentSet = {};
  for (const slot of EQUIP_SLOTS) s[slot] = null;
  return s;
}

export function defaultTownship(): TownshipState {
  return {
    level: 1, resources: { food: 200, wood: 200, stone: 100, gp: 0 }, buildings: {}, land: { grass: 6, forest: 4 },
    population: 0, happiness: 50, education: 0, health: 50, worship: 0, deity: 'none', tickTimer: 0, ticks: 0, season: 0,
    tasksCompleted: [], storage: 5000,
  };
}

export function createNewState(name: string, mode: GameMode, now = Date.now(), seed = randomSeed()): GameState {
  const skills = {} as Record<SkillId, SkillState>;
  for (const id of C.skillOrder) {
    const isHp = id === 'hitpoints';
    skills[id] = {
      skillId: id, xp: isHp ? 1154 : 0, level: isHp ? 10 : 1,
      unlocked: mode !== 'adventure' || ADVENTURE_START_SKILLS.includes(id),
      abyssalXp: 0, abyssalLevel: 1, masteryPoolXp: 0, treePoints: 0, treeNodes: [],
    };
  }
  const plots = FARMING_PLOTS.map((p) => ({ id: p.id, unlocked: p.cost === 0, cropId: null, plantedAt: 0, compost: 0, gloop: false }));
  const astrology: GameState['astrology'] = {};
  for (const c of Object.values(C.constellations)) astrology[c.id] = { std: c.standard.map(() => 0), uniq: c.unique.map(() => 0) };
  return {
    schemaVersion: SCHEMA_VERSION,
    gameVersion: GAME_VERSION,
    contentManifestVersion: '1.0.0',
    offlineRulesVersion: OFFLINE_RULES_VERSION,
    player: { id: `local-${now.toString(36)}`, name: name || '冒险者', mode, createdAt: now, realm: 'melvor' },
    clock: now,
    lastSettledAt: now,
    hp: 100,
    cooking: { passive: { fire: null, furnace: null, pot: null }, timers: { fire: 0, furnace: 0, pot: 0 } },
    playTime: 0,
    settlementId: 0,
    skills,
    mastery: {},
    bank: { bronze_dagger: 1, normal_shortbow: 1, bronze_arrows: 50, food_shrimp: 10 },
    bankOrder: ['bronze_dagger', 'normal_shortbow', 'bronze_arrows', 'food_shrimp'],
    bankLocked: {},
    currencies: { gp: C.gameModes[mode].startingGp, slayerCoins: 0, abyssalPieces: 0, abyssalSlayerCoins: 0, prayerPoints: 0, soulPoints: 0 },
    equipmentSets: [emptyEquipmentSet(), emptyEquipmentSet(), emptyEquipmentSet()],
    activeSet: 0,
    food: [null, null, null],
    selectedFood: 0,
    combat: defaultCombat(),
    activeAction: null,
    potions: {},
    glovesCharges: {},
    shop: {},
    flags: {},
    farming: { plots },
    agility: { built: {}, currentSlot: 0, buildCounts: {} },
    astrology,
    summoning: { marks: {} },
    township: defaultTownship(),
    cartography: { pos: [0, 0], hexes: {}, surveyed: ['0,0'], target: null, discovered: [], maps: {} },
    archaeology: { tools: { tiny: 0, small: 0, medium: 0, large: 0 }, museum: {}, museumRewards: 0 },
    harvesting: { intensity: {} },
    corruption: { enabled: [] },
    mining: { rocks: {} },
    bonfire: { endsAt: 0, bonus: 0, logsBurnt: 0 },
    slayer: { task: null, tasksCompleted: {}, autoSlayer: false },
    magic: { spell: 'sp_air_strike', curse: null, aura: null },
    prayers: [],
    quests: {},
    achievements: {},
    pets: {},
    dungeonCompletions: {},
    monsterKills: {},
    itemsFound: { bronze_dagger: 1, normal_shortbow: 1, bronze_arrows: 50, food_shrimp: 10 },
    stats: {},
    skillStats: {},
    settings: defaultSettings(),
    rngState: seedFromNumber(seed),
    recent: { items: [], levels: [] },
  };
}
