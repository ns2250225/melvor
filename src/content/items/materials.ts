// 基础材料：木材、矿石、金属锭、宝石、鱼类、作物、草药、种子、骨头、符文、碎片与杂项
import { addItem } from '../registry';
import type { ExpansionId, Realm } from '@/game/core/types';

export interface LogTier { id: string; name: string; level: number; abyssal?: number; interval: number; xp: number; fmLevel: number; fmXp: number; fmInterval: number; sell: number; color: string; exp: ExpansionId; realm: Realm }
export const LOGS: LogTier[] = [
  { id: 'normal', name: '普通', level: 1, interval: 3000, xp: 10, fmLevel: 1, fmXp: 19, fmInterval: 2000, sell: 1, color: '#a0794a', exp: 'base', realm: 'melvor' },
  { id: 'oak', name: '橡木', level: 10, interval: 4000, xp: 15, fmLevel: 10, fmXp: 39, fmInterval: 3000, sell: 5, color: '#b5884f', exp: 'base', realm: 'melvor' },
  { id: 'willow', name: '柳木', level: 25, interval: 5000, xp: 22, fmLevel: 25, fmXp: 52, fmInterval: 3000, sell: 10, color: '#9c9d58', exp: 'base', realm: 'melvor' },
  { id: 'teak', name: '柚木', level: 35, interval: 6000, xp: 30, fmLevel: 35, fmXp: 66, fmInterval: 4000, sell: 20, color: '#8b5a2b', exp: 'base', realm: 'melvor' },
  { id: 'maple', name: '枫木', level: 45, interval: 8000, xp: 40, fmLevel: 45, fmXp: 90, fmInterval: 4000, sell: 35, color: '#c0632b', exp: 'base', realm: 'melvor' },
  { id: 'mahogany', name: '桃花心木', level: 55, interval: 9000, xp: 60, fmLevel: 55, fmXp: 112, fmInterval: 5000, sell: 50, color: '#7b3f2b', exp: 'base', realm: 'melvor' },
  { id: 'yew', name: '紫杉木', level: 60, interval: 10000, xp: 80, fmLevel: 60, fmXp: 147, fmInterval: 5000, sell: 75, color: '#5e7a3a', exp: 'base', realm: 'melvor' },
  { id: 'magic', name: '魔法木', level: 75, interval: 13000, xp: 100, fmLevel: 75, fmXp: 225, fmInterval: 6000, sell: 120, color: '#5d6dce', exp: 'base', realm: 'melvor' },
  { id: 'redwood', name: '红杉木', level: 90, interval: 15000, xp: 180, fmLevel: 90, fmXp: 350, fmInterval: 7000, sell: 200, color: '#a93226', exp: 'base', realm: 'melvor' },
  { id: 'elderwood', name: '古龙木', level: 100, interval: 16000, xp: 260, fmLevel: 100, fmXp: 480, fmInterval: 7000, sell: 320, color: '#d4ac0d', exp: 'toth', realm: 'melvor' },
  { id: 'voidwood', name: '虚空木', level: 99, abyssal: 1, interval: 12000, xp: 300, fmLevel: 99, fmXp: 500, fmInterval: 6000, sell: 450, color: '#6c3483', exp: 'ita', realm: 'abyssal' },
  { id: 'shadowwood', name: '暗影木', level: 99, abyssal: 20, interval: 14000, xp: 420, fmLevel: 99, fmXp: 700, fmInterval: 7000, sell: 700, color: '#2c3e50', exp: 'ita', realm: 'abyssal' },
  { id: 'starwood', name: '星辉木', level: 99, abyssal: 40, interval: 16000, xp: 600, fmLevel: 99, fmXp: 950, fmInterval: 8000, sell: 1100, color: '#85c1e9', exp: 'ita', realm: 'abyssal' },
];
export const logId = (t: string) => `log_${t}`;

export interface OreTier { id: string; name: string; level: number; abyssal?: number; interval: number; xp: number; sell: number; rockHp: number; respawn: number; color: string; exp: ExpansionId; realm: Realm; isEssence?: boolean }
export const ORES: OreTier[] = [
  { id: 'essence', name: '符文精华', level: 1, interval: 3000, xp: 5, sell: 1, rockHp: 999999, respawn: 0, color: '#d6eaf8', exp: 'base', realm: 'melvor', isEssence: true },
  { id: 'copper', name: '铜矿', level: 1, interval: 3000, xp: 7, sell: 2, rockHp: 5, respawn: 5000, color: '#d35400', exp: 'base', realm: 'melvor' },
  { id: 'tin', name: '锡矿', level: 1, interval: 3000, xp: 7, sell: 2, rockHp: 5, respawn: 5000, color: '#bdc3c7', exp: 'base', realm: 'melvor' },
  { id: 'iron', name: '铁矿', level: 15, interval: 3000, xp: 14, sell: 5, rockHp: 6, respawn: 7000, color: '#7b5e57', exp: 'base', realm: 'melvor' },
  { id: 'coal', name: '煤矿', level: 30, interval: 3000, xp: 18, sell: 13, rockHp: 6, respawn: 10000, color: '#2c3e50', exp: 'base', realm: 'melvor' },
  { id: 'silver', name: '银矿', level: 30, interval: 3000, xp: 18, sell: 15, rockHp: 6, respawn: 10000, color: '#d5dbdb', exp: 'base', realm: 'melvor' },
  { id: 'gold', name: '金矿', level: 40, interval: 3000, xp: 23, sell: 20, rockHp: 6, respawn: 12000, color: '#f4d03f', exp: 'base', realm: 'melvor' },
  { id: 'mithril', name: '秘银矿', level: 50, interval: 3000, xp: 33, sell: 32, rockHp: 7, respawn: 15000, color: '#5d6d7e', exp: 'base', realm: 'melvor' },
  { id: 'adamantite', name: '精金矿', level: 70, interval: 3000, xp: 50, sell: 55, rockHp: 8, respawn: 20000, color: '#239b56', exp: 'base', realm: 'melvor' },
  { id: 'runite', name: '符石矿', level: 80, interval: 3000, xp: 75, sell: 100, rockHp: 8, respawn: 30000, color: '#2e86c1', exp: 'base', realm: 'melvor' },
  { id: 'dragonite', name: '龙晶矿', level: 95, interval: 3000, xp: 85, sell: 160, rockHp: 9, respawn: 40000, color: '#c0392b', exp: 'base', realm: 'melvor' },
  { id: 'starfall', name: '星陨矿', level: 100, interval: 3000, xp: 110, sell: 240, rockHp: 10, respawn: 45000, color: '#f5b041', exp: 'toth', realm: 'melvor' },
  { id: 'celestium', name: '天河矿', level: 110, interval: 3000, xp: 140, sell: 330, rockHp: 10, respawn: 50000, color: '#a569bd', exp: 'toth', realm: 'melvor' },
  { id: 'abyssal_essence', name: '深渊精华', level: 99, abyssal: 1, interval: 3000, xp: 40, sell: 30, rockHp: 999999, respawn: 0, color: '#7d3c98', exp: 'ita', realm: 'abyssal', isEssence: true },
  { id: 'void', name: '虚空矿', level: 99, abyssal: 1, interval: 3000, xp: 160, sell: 380, rockHp: 10, respawn: 40000, color: '#5b2c6f', exp: 'ita', realm: 'abyssal' },
  { id: 'abyssite', name: '深渊晶矿', level: 99, abyssal: 20, interval: 3000, xp: 220, sell: 560, rockHp: 11, respawn: 45000, color: '#922b21', exp: 'ita', realm: 'abyssal' },
  { id: 'netherite', name: '冥铁矿', level: 99, abyssal: 40, interval: 3000, xp: 300, sell: 800, rockHp: 12, respawn: 50000, color: '#1c2833', exp: 'ita', realm: 'abyssal' },
];
export const oreId = (t: string) => (t === 'essence' ? 'rune_essence' : t === 'abyssal_essence' ? 'abyssal_essence' : `ore_${t}`);

export interface BarTier { id: string; name: string; level: number; abyssal?: number; xp: number; ores: { id: string; qty: number }[]; sell: number; color: string; exp: ExpansionId; realm: Realm }
export const BARS: BarTier[] = [
  { id: 'bronze', name: '青铜', level: 1, xp: 5, ores: [{ id: 'ore_copper', qty: 1 }, { id: 'ore_tin', qty: 1 }], sell: 5, color: '#b08d57', exp: 'base', realm: 'melvor' },
  { id: 'iron', name: '铁', level: 10, xp: 8, ores: [{ id: 'ore_iron', qty: 1 }], sell: 10, color: '#8a8f98', exp: 'base', realm: 'melvor' },
  { id: 'steel', name: '钢', level: 20, xp: 12, ores: [{ id: 'ore_iron', qty: 1 }, { id: 'ore_coal', qty: 2 }], sell: 28, color: '#aab4c0', exp: 'base', realm: 'melvor' },
  { id: 'silver', name: '银', level: 25, xp: 14, ores: [{ id: 'ore_silver', qty: 1 }], sell: 30, color: '#e5e8e8', exp: 'base', realm: 'melvor' },
  { id: 'gold', name: '金', level: 30, xp: 16, ores: [{ id: 'ore_gold', qty: 1 }], sell: 45, color: '#f1c40f', exp: 'base', realm: 'melvor' },
  { id: 'mithril', name: '秘银', level: 40, xp: 22, ores: [{ id: 'ore_mithril', qty: 1 }, { id: 'ore_coal', qty: 4 }], sell: 90, color: '#4a6fa5', exp: 'base', realm: 'melvor' },
  { id: 'adamant', name: '精金', level: 55, xp: 30, ores: [{ id: 'ore_adamantite', qty: 1 }, { id: 'ore_coal', qty: 6 }], sell: 160, color: '#3b7d4f', exp: 'base', realm: 'melvor' },
  { id: 'rune', name: '符石', level: 70, xp: 42, ores: [{ id: 'ore_runite', qty: 1 }, { id: 'ore_coal', qty: 8 }], sell: 300, color: '#3aa0c8', exp: 'base', realm: 'melvor' },
  { id: 'dragon', name: '龙', level: 85, xp: 60, ores: [{ id: 'ore_dragonite', qty: 1 }, { id: 'ore_runite', qty: 1 }, { id: 'ore_coal', qty: 10 }], sell: 520, color: '#c0392b', exp: 'base', realm: 'melvor' },
  { id: 'starfall', name: '星陨', level: 100, xp: 80, ores: [{ id: 'ore_starfall', qty: 1 }, { id: 'ore_coal', qty: 12 }], sell: 800, color: '#f5b041', exp: 'toth', realm: 'melvor' },
  { id: 'celestium', name: '天河', level: 110, xp: 105, ores: [{ id: 'ore_celestium', qty: 1 }, { id: 'ore_starfall', qty: 1 }, { id: 'ore_coal', qty: 14 }], sell: 1150, color: '#a569bd', exp: 'toth', realm: 'melvor' },
  { id: 'void', name: '虚空', level: 99, abyssal: 1, xp: 120, ores: [{ id: 'ore_void', qty: 2 }], sell: 900, color: '#5b2c6f', exp: 'ita', realm: 'abyssal' },
  { id: 'abyssal', name: '深渊', level: 99, abyssal: 20, xp: 170, ores: [{ id: 'ore_abyssite', qty: 2 }, { id: 'ore_void', qty: 1 }], sell: 1500, color: '#922b21', exp: 'ita', realm: 'abyssal' },
  { id: 'nether', name: '冥铁', level: 99, abyssal: 40, xp: 230, ores: [{ id: 'ore_netherite', qty: 2 }, { id: 'ore_abyssite', qty: 1 }], sell: 2300, color: '#1c2833', exp: 'ita', realm: 'abyssal' },
];
export const barId = (t: string) => `bar_${t}`;

export const GEMS = [
  { id: 'topaz', name: '黄玉', weight: 50, sell: 150, color: '#f39c12', exp: 'base' as ExpansionId },
  { id: 'sapphire', name: '蓝宝石', weight: 17.5, sell: 300, color: '#2e86c1', exp: 'base' as ExpansionId },
  { id: 'ruby', name: '红宝石', weight: 17.5, sell: 450, color: '#c0392b', exp: 'base' as ExpansionId },
  { id: 'emerald', name: '绿宝石', weight: 10, sell: 600, color: '#27ae60', exp: 'base' as ExpansionId },
  { id: 'diamond', name: '钻石', weight: 5, sell: 1000, color: '#d6eaf8', exp: 'base' as ExpansionId },
  { id: 'onyx', name: '缟玛瑙', weight: 0, sell: 3000, color: '#17202a', exp: 'toth' as ExpansionId },
  { id: 'voidgem', name: '虚空宝石', weight: 0, sell: 5000, color: '#8e44ad', exp: 'ita' as ExpansionId },
];
export const gemId = (t: string) => `gem_${t}`;

export interface FishTier { id: string; name: string; level: number; abyssal?: number; min: number; max: number; xp: number; cookLevel: number; cookXp: number; heals: number; sell: number; area: string; exp: ExpansionId; realm: Realm }
export const FISH: FishTier[] = [
  { id: 'shrimp', name: '虾', level: 1, min: 4000, max: 8000, xp: 10, cookLevel: 1, cookXp: 5, heals: 30, sell: 1, area: 'shallows', exp: 'base', realm: 'melvor' },
  { id: 'sardine', name: '沙丁鱼', level: 5, min: 4000, max: 8000, xp: 12, cookLevel: 5, cookXp: 10, heals: 40, sell: 3, area: 'shallows', exp: 'base', realm: 'melvor' },
  { id: 'herring', name: '鲱鱼', level: 10, min: 4000, max: 9000, xp: 15, cookLevel: 10, cookXp: 15, heals: 50, sell: 5, area: 'shallows', exp: 'base', realm: 'melvor' },
  { id: 'trout', name: '鳟鱼', level: 20, min: 4000, max: 10000, xp: 20, cookLevel: 20, cookXp: 22, heals: 70, sell: 10, area: 'river', exp: 'base', realm: 'melvor' },
  { id: 'salmon', name: '鲑鱼', level: 30, min: 4000, max: 10000, xp: 30, cookLevel: 30, cookXp: 30, heals: 90, sell: 18, area: 'river', exp: 'base', realm: 'melvor' },
  { id: 'carp', name: '鲤鱼', level: 35, min: 5000, max: 11000, xp: 35, cookLevel: 35, cookXp: 35, heals: 100, sell: 22, area: 'river', exp: 'base', realm: 'melvor' },
  { id: 'lobster', name: '龙虾', level: 40, min: 5000, max: 11000, xp: 45, cookLevel: 40, cookXp: 45, heals: 110, sell: 30, area: 'coast', exp: 'base', realm: 'melvor' },
  { id: 'swordfish', name: '剑鱼', level: 50, min: 5000, max: 12000, xp: 55, cookLevel: 50, cookXp: 55, heals: 140, sell: 45, area: 'coast', exp: 'base', realm: 'melvor' },
  { id: 'anglerfish', name: '鮟鱇鱼', level: 55, min: 6000, max: 12000, xp: 62, cookLevel: 55, cookXp: 62, heals: 150, sell: 55, area: 'coast', exp: 'base', realm: 'melvor' },
  { id: 'crab', name: '帝王蟹', level: 60, min: 6000, max: 13000, xp: 70, cookLevel: 60, cookXp: 70, heals: 170, sell: 70, area: 'coast', exp: 'base', realm: 'melvor' },
  { id: 'fanfish', name: '扇尾鱼', level: 65, min: 6000, max: 13000, xp: 78, cookLevel: 65, cookXp: 78, heals: 180, sell: 80, area: 'deep', exp: 'base', realm: 'melvor' },
  { id: 'shark', name: '鲨鱼', level: 70, min: 7000, max: 14000, xp: 90, cookLevel: 70, cookXp: 90, heals: 200, sell: 100, area: 'deep', exp: 'base', realm: 'melvor' },
  { id: 'cavefish', name: '洞穴鱼', level: 80, min: 7000, max: 14000, xp: 110, cookLevel: 80, cookXp: 110, heals: 230, sell: 130, area: 'cave', exp: 'base', realm: 'melvor' },
  { id: 'manta', name: '魔鬼鱼', level: 85, min: 8000, max: 15000, xp: 125, cookLevel: 85, cookXp: 125, heals: 260, sell: 160, area: 'deep', exp: 'base', realm: 'melvor' },
  { id: 'whale', name: '鲸鱼', level: 95, min: 9000, max: 16000, xp: 160, cookLevel: 95, cookXp: 160, heals: 300, sell: 220, area: 'deep', exp: 'base', realm: 'melvor' },
  { id: 'frosteel', name: '霜鳗', level: 105, min: 9000, max: 16000, xp: 210, cookLevel: 105, cookXp: 210, heals: 360, sell: 300, area: 'glacier', exp: 'toth', realm: 'melvor' },
  { id: 'starfish', name: '星光鱼', level: 115, min: 10000, max: 17000, xp: 260, cookLevel: 115, cookXp: 260, heals: 420, sell: 380, area: 'glacier', exp: 'toth', realm: 'melvor' },
  { id: 'voidfish', name: '虚空鱼', level: 99, abyssal: 1, min: 8000, max: 14000, xp: 300, cookLevel: 99, cookXp: 300, heals: 500, sell: 450, area: 'abyss_sea', exp: 'ita', realm: 'abyssal' },
  { id: 'abyssal_eel', name: '深渊鳗', level: 99, abyssal: 20, min: 9000, max: 15000, xp: 420, cookLevel: 99, cookXp: 420, heals: 650, sell: 700, area: 'abyss_sea', exp: 'ita', realm: 'abyssal' },
  { id: 'leviathan', name: '利维坦幼体', level: 99, abyssal: 40, min: 10000, max: 17000, xp: 580, cookLevel: 99, cookXp: 580, heals: 800, sell: 1000, area: 'abyss_sea', exp: 'ita', realm: 'abyssal' },
];
export const rawFishId = (t: string) => `raw_${t}`;
export const cookedFishId = (t: string) => `food_${t}`;

export const ALLOTMENTS = [
  { id: 'potato', name: '土豆', level: 1, xp: 9, growMin: 5, sell: 2, heals: 20 },
  { id: 'onion', name: '洋葱', level: 5, xp: 12, growMin: 6, sell: 3, heals: 25 },
  { id: 'cabbage', name: '卷心菜', level: 10, xp: 15, growMin: 7, sell: 4, heals: 30 },
  { id: 'wheat', name: '小麦', level: 15, xp: 18, growMin: 8, sell: 5, heals: 0 },
  { id: 'tomato', name: '番茄', level: 20, xp: 23, growMin: 9, sell: 6, heals: 40 },
  { id: 'sweetcorn', name: '甜玉米', level: 30, xp: 34, growMin: 10, sell: 8, heals: 50 },
  { id: 'strawberry', name: '草莓', level: 40, xp: 47, growMin: 12, sell: 12, heals: 60 },
  { id: 'carrot', name: '胡萝卜', level: 50, xp: 60, growMin: 14, sell: 15, heals: 70 },
  { id: 'watermelon', name: '西瓜', level: 60, xp: 75, growMin: 16, sell: 20, heals: 90 },
];

export const HERBS = [
  { id: 'greenleaf', name: '青叶草', level: 1, xp: 15, growMin: 10, sell: 5, color: '#58d68d', exp: 'base' as ExpansionId },
  { id: 'moonwort', name: '月光草', level: 10, xp: 25, growMin: 11, sell: 10, color: '#aed6f1', exp: 'base' as ExpansionId },
  { id: 'sunbloom', name: '太阳花', level: 20, xp: 35, growMin: 12, sell: 18, color: '#f9e79f', exp: 'base' as ExpansionId },
  { id: 'flamemoss', name: '火焰苔', level: 30, xp: 50, growMin: 13, sell: 25, color: '#e67e22', exp: 'base' as ExpansionId },
  { id: 'frostleaf', name: '冰晶草', level: 40, xp: 70, growMin: 14, sell: 35, color: '#85c1e9', exp: 'base' as ExpansionId },
  { id: 'dragonroot', name: '龙舌根', level: 50, xp: 95, growMin: 15, sell: 50, color: '#cb4335', exp: 'base' as ExpansionId },
  { id: 'ghostcap', name: '幽灵菇', level: 60, xp: 125, growMin: 16, sell: 70, color: '#d7dbdd', exp: 'base' as ExpansionId },
  { id: 'starherb', name: '星辰草', level: 70, xp: 160, growMin: 18, sell: 95, color: '#5dade2', exp: 'base' as ExpansionId },
  { id: 'holyherb', name: '圣灵草', level: 80, xp: 210, growMin: 20, sell: 130, color: '#fdfefe', exp: 'base' as ExpansionId },
  { id: 'heraldbloom', name: '使者之花', level: 100, xp: 300, growMin: 22, sell: 220, color: '#f5b041', exp: 'toth' as ExpansionId },
  { id: 'voidroot', name: '虚空根', level: 99, xp: 380, growMin: 24, sell: 320, color: '#7d3c98', exp: 'ita' as ExpansionId },
];

export const TREES = [
  { id: 'oak', name: '橡树', level: 15, xp: 110, growMin: 60, log: 'log_oak' },
  { id: 'willow', name: '柳树', level: 25, xp: 200, growMin: 90, log: 'log_willow' },
  { id: 'maple', name: '枫树', level: 45, xp: 450, growMin: 150, log: 'log_maple' },
  { id: 'apple', name: '苹果树', level: 35, xp: 350, growMin: 120, log: 'fruit_apple' },
  { id: 'yew', name: '紫杉树', level: 60, xp: 800, growMin: 210, log: 'log_yew' },
  { id: 'cherry', name: '樱桃树', level: 55, xp: 700, growMin: 180, log: 'fruit_cherry' },
  { id: 'magic', name: '魔法树', level: 75, xp: 1500, growMin: 300, log: 'log_magic' },
  { id: 'redwood', name: '红杉树', level: 90, xp: 2600, growMin: 360, log: 'log_redwood' },
];

export const BONES = [
  { id: 'bones', name: '骨头', pp: 1, sell: 1, exp: 'base' as ExpansionId },
  { id: 'big_bones', name: '大骨头', pp: 3, sell: 5, exp: 'base' as ExpansionId },
  { id: 'dragon_bones', name: '龙骨', pp: 6, sell: 30, exp: 'base' as ExpansionId },
  { id: 'magic_bones', name: '魔法骨', pp: 10, sell: 60, exp: 'base' as ExpansionId },
  { id: 'elder_bones', name: '古龙骨', pp: 16, sell: 120, exp: 'toth' as ExpansionId },
];

export const RUNES = [
  { id: 'air', name: '空气符文', level: 1, xp: 5, sell: 2, color: '#d6eaf8', essence: 'rune_essence' },
  { id: 'mind', name: '心灵符文', level: 1, xp: 5.5, sell: 2, color: '#f0b27a', essence: 'rune_essence' },
  { id: 'water', name: '水之符文', level: 5, xp: 6, sell: 3, color: '#5dade2', essence: 'rune_essence' },
  { id: 'earth', name: '大地符文', level: 10, xp: 6.5, sell: 3, color: '#a04000', essence: 'rune_essence' },
  { id: 'fire', name: '火焰符文', level: 15, xp: 7, sell: 4, color: '#e74c3c', essence: 'rune_essence' },
  { id: 'body', name: '躯体符文', level: 20, xp: 7.5, sell: 5, color: '#a9cce3', essence: 'rune_essence' },
  { id: 'chaos', name: '混沌符文', level: 35, xp: 8.5, sell: 10, color: '#d4ac0d', essence: 'rune_essence' },
  { id: 'nature', name: '自然符文', level: 44, xp: 9, sell: 15, color: '#27ae60', essence: 'rune_essence' },
  { id: 'death', name: '死亡符文', level: 65, xp: 10, sell: 25, color: '#566573', essence: 'rune_essence' },
  { id: 'blood', name: '鲜血符文', level: 77, xp: 10.5, sell: 30, color: '#943126', essence: 'rune_essence' },
  { id: 'spirit', name: '灵魂符文', level: 85, xp: 11, sell: 40, color: '#e8daef', essence: 'rune_essence' },
  { id: 'ancient', name: '远古符文', level: 90, xp: 12, sell: 60, color: '#9a7d0a', essence: 'rune_essence' },
  { id: 'havoc', name: '浩劫符文', level: 105, xp: 15, sell: 90, color: '#cb4335', essence: 'rune_essence' },
  { id: 'void', name: '虚空符文', level: 99, abyssal: 1, xp: 30, sell: 120, color: '#6c3483', essence: 'abyssal_essence' },
  { id: 'abyssal', name: '深渊符文', level: 99, abyssal: 20, xp: 45, sell: 180, color: '#922b21', essence: 'abyssal_essence' },
  { id: 'soul', name: '灵魄符文', level: 99, abyssal: 40, xp: 60, sell: 260, color: '#d2b4de', essence: 'abyssal_essence' },
];
export const COMBO_RUNES = [
  { id: 'mist', name: '雾之符文', level: 30, xp: 9, parts: ['air', 'water'], sell: 8 },
  { id: 'dust', name: '尘之符文', level: 35, xp: 9.5, parts: ['air', 'earth'], sell: 8 },
  { id: 'smoke', name: '烟之符文', level: 40, xp: 10, parts: ['air', 'fire'], sell: 8 },
  { id: 'mud', name: '泥之符文', level: 50, xp: 10.5, parts: ['water', 'earth'], sell: 9 },
  { id: 'steam', name: '蒸汽符文', level: 55, xp: 11, parts: ['water', 'fire'], sell: 9 },
  { id: 'lava', name: '熔岩符文', level: 60, xp: 11.5, parts: ['earth', 'fire'], sell: 9 },
];
export const runeId = (t: string) => `rune_${t}`;

export const SHARDS = [
  { id: 'green', name: '绿色召唤碎片', price: 10, color: '#27ae60' },
  { id: 'blue', name: '蓝色召唤碎片', price: 25, color: '#2980b9' },
  { id: 'red', name: '红色召唤碎片', price: 50, color: '#c0392b' },
  { id: 'silver', name: '银色召唤碎片', price: 100, color: '#bdc3c7' },
  { id: 'gold', name: '金色召唤碎片', price: 200, color: '#f1c40f' },
  { id: 'black', name: '黑色召唤碎片', price: 400, color: '#17202a' },
  { id: 'void', name: '虚空召唤碎片', price: 0, color: '#6c3483' },
];
export const shardId = (t: string) => `shard_${t}`;

// ---------------------------------------------------------------------------
// 注册
// ---------------------------------------------------------------------------
for (const l of LOGS) addItem({ id: logId(l.id), name: `${l.name}木材`.replace('木木材', '木材'), type: 'log', icon: '🪵', color: l.color, sellPrice: l.sell, category: '木材', expansion: l.exp });
for (const o of ORES) addItem({ id: oreId(o.id), name: o.isEssence ? o.name : o.name, type: 'ore', icon: o.isEssence ? '💠' : '🪨', color: o.color, sellPrice: o.sell, category: '矿石', expansion: o.exp });
for (const b of BARS) addItem({ id: barId(b.id), name: `${b.name}锭`, type: 'bar', icon: '🧱', color: b.color, sellPrice: b.sell, category: '金属锭', expansion: b.exp });
for (const g of GEMS) addItem({ id: gemId(g.id), name: g.name, type: 'gem', icon: '💎', color: g.color, sellPrice: g.sell, category: '宝石', expansion: g.exp, rarity: g.sell >= 1000 ? 1 : 0 });
for (const f of FISH) {
  addItem({ id: rawFishId(f.id), name: `生${f.name}`, type: 'fish', icon: '🐟', color: '#7fb3d5', sellPrice: f.sell, category: '鱼类', expansion: f.exp });
  addItem({ id: cookedFishId(f.id), name: `熟${f.name}`, type: 'food', icon: '🍣', color: '#e59866', sellPrice: Math.round(f.sell * 1.6), category: '食物', expansion: f.exp, healsFor: f.heals });
  addItem({ id: `burnt_${f.id}`, name: `烤焦的${f.name}`, type: 'junk', icon: '🔥', color: '#4d5656', sellPrice: 0, category: '杂物', expansion: f.exp, description: '烹饪失败的产物，可在城镇换取少量食物。' });
  addItem({ id: `perfect_${f.id}`, name: `完美${f.name}`, type: 'food', icon: '🍱', color: '#f7dc6f', sellPrice: Math.round(f.sell * 2.5), category: '食物', expansion: f.exp, healsFor: Math.round(f.heals * 1.3), rarity: 1 });
}
for (const a of ALLOTMENTS) {
  addItem({ id: `seed_${a.id}`, name: `${a.name}种子`, type: 'seed', icon: '🌰', color: '#a9dfbf', sellPrice: 1 + Math.floor(a.level / 10), category: '种子' });
  addItem({ id: `crop_${a.id}`, name: a.name, type: a.heals > 0 ? 'food' : 'produce', icon: a.id === 'wheat' ? '🌾' : a.id === 'strawberry' ? '🍓' : a.id === 'tomato' ? '🍅' : a.id === 'carrot' ? '🥕' : a.id === 'watermelon' ? '🍉' : a.id === 'sweetcorn' ? '🌽' : a.id === 'onion' ? '🧅' : a.id === 'cabbage' ? '🥬' : '🥔', sellPrice: a.sell, category: '作物', healsFor: a.heals || undefined });
}
for (const h of HERBS) {
  addItem({ id: `seed_${h.id}`, name: `${h.name}种子`, type: 'seed', icon: '🌰', color: h.color, sellPrice: 2 + Math.floor(h.level / 5), category: '种子', expansion: h.exp });
  addItem({ id: `herb_${h.id}`, name: h.name, type: 'herb', icon: '🌿', color: h.color, sellPrice: h.sell, category: '草药', expansion: h.exp });
}
for (const t of TREES) addItem({ id: `seed_tree_${t.id}`, name: `${t.name}树苗`, type: 'seed', icon: '🌳', color: '#239b56', sellPrice: 10 + t.level, category: '种子' });
addItem({ id: 'fruit_apple', name: '苹果', type: 'food', icon: '🍎', sellPrice: 8, category: '作物', healsFor: 60 });
addItem({ id: 'fruit_cherry', name: '樱桃', type: 'food', icon: '🍒', sellPrice: 14, category: '作物', healsFor: 90 });
for (const b of BONES) addItem({ id: b.id, name: b.name, type: 'bone', icon: '🦴', color: '#f8f9f9', sellPrice: b.sell, category: '骨头', prayerPoints: b.pp, expansion: b.exp });
addItem({ id: 'void_ashes', name: '虚空骨灰', type: 'bone', icon: '⚱️', color: '#6c3483', sellPrice: 80, category: '骨头', soulPoints: 4, expansion: 'ita' });
addItem({ id: 'abyssal_ashes', name: '深渊骨灰', type: 'bone', icon: '⚱️', color: '#922b21', sellPrice: 160, category: '骨头', soulPoints: 9, expansion: 'ita' });
for (const r of RUNES) addItem({ id: runeId(r.id), name: r.name, type: 'rune', icon: '🔷', color: r.color, sellPrice: r.sell, category: '符文', expansion: r.level > 99 ? 'toth' : (r as any).abyssal ? 'ita' : 'base' });
for (const r of COMBO_RUNES) addItem({ id: runeId(r.id), name: r.name, type: 'rune', icon: '🔶', color: '#a3e4d7', sellPrice: r.sell, category: '符文' });
for (const s of SHARDS) addItem({ id: shardId(s.id), name: s.name, type: 'shard', icon: '🔹', color: s.color, sellPrice: Math.max(1, Math.floor(s.price / 5)), category: '召唤', expansion: s.id === 'void' ? 'ita' : 'base' });

// 动物材料与制作材料
addItem({ id: 'feather', name: '羽毛', type: 'material', icon: '🪶', sellPrice: 1, category: '材料' });
addItem({ id: 'cowhide', name: '牛皮', type: 'material', icon: '🐄', color: '#d5dbdb', sellPrice: 2, category: '材料' });
addItem({ id: 'leather', name: '皮革', type: 'material', icon: '🟫', color: '#a0522d', sellPrice: 8, category: '材料' });
addItem({ id: 'raw_chicken', name: '生鸡肉', type: 'material', icon: '🍗', sellPrice: 1, category: '食材' });
addItem({ id: 'raw_beef', name: '生牛肉', type: 'material', icon: '🥩', sellPrice: 1, category: '食材' });
addItem({ id: 'raw_boar', name: '生野猪肉', type: 'material', icon: '🥓', sellPrice: 3, category: '食材' });
addItem({ id: 'egg', name: '鸡蛋', type: 'material', icon: '🥚', sellPrice: 2, category: '食材' });
addItem({ id: 'milk', name: '牛奶', type: 'material', icon: '🥛', sellPrice: 2, category: '食材' });
export const HIDES = [
  { id: 'green', name: '绿龙皮', level: 50, sell: 40, color: '#27ae60', exp: 'base' as ExpansionId },
  { id: 'blue', name: '蓝龙皮', level: 60, sell: 70, color: '#2e86c1', exp: 'base' as ExpansionId },
  { id: 'red', name: '红龙皮', level: 70, sell: 110, color: '#c0392b', exp: 'base' as ExpansionId },
  { id: 'black', name: '黑龙皮', level: 80, sell: 170, color: '#17202a', exp: 'base' as ExpansionId },
  { id: 'elder', name: '古龙皮', level: 100, sell: 320, color: '#d4ac0d', exp: 'toth' as ExpansionId },
  { id: 'void', name: '虚空兽皮', level: 99, abyssal: 10, sell: 600, color: '#6c3483', exp: 'ita' as ExpansionId },
];
for (const h of HIDES) {
  addItem({ id: `hide_${h.id}`, name: h.name, type: 'material', icon: '🐉', color: h.color, sellPrice: h.sell, category: '材料', expansion: h.exp });
  addItem({ id: `dleather_${h.id}`, name: `${h.name}革`, type: 'material', icon: '🟥', color: h.color, sellPrice: Math.round(h.sell * 1.4), category: '材料', expansion: h.exp });
}
addItem({ id: 'arrow_shafts', name: '箭杆', type: 'material', icon: '🥢', sellPrice: 1, category: '制箭' });
addItem({ id: 'headless_arrows', name: '无头箭', type: 'material', icon: '➖', sellPrice: 1, category: '制箭' });
addItem({ id: 'paper', name: '纸张', type: 'material', icon: '📜', sellPrice: 3, category: '材料', expansion: 'aod' });
addItem({ id: 'ink', name: '墨水', type: 'material', icon: '🖋️', sellPrice: 10, category: '材料', expansion: 'aod' });
addItem({ id: 'ash', name: '草木灰', type: 'material', icon: '🌫️', sellPrice: 2, category: '材料', description: '生火副产品，可用于堆肥。' });
addItem({ id: 'charcoal', name: '木炭', type: 'material', icon: '⬛', sellPrice: 6, category: '材料', description: '生火副产品，可在锻造中代替煤。' });
addItem({ id: 'compost', name: '堆肥', type: 'consumable', icon: '💩', sellPrice: 1, category: '农业', description: '施用后作物成功率 +20%。' });
addItem({ id: 'weird_gloop', name: '奇异粘液', type: 'consumable', icon: '🧪', color: '#58d68d', sellPrice: 50, category: '农业', description: '施用后作物必定成功且收成翻倍。', rarity: 1 });
addItem({ id: 'stardust', name: '星尘', type: 'currency', icon: '✨', color: '#f9e79f', sellPrice: 10, category: '占星' });
addItem({ id: 'golden_stardust', name: '金星尘', type: 'currency', icon: '🌟', color: '#f4d03f', sellPrice: 100, category: '占星', rarity: 1 });
addItem({ id: 'abyssal_stardust', name: '深渊星尘', type: 'currency', icon: '💫', color: '#a569bd', sellPrice: 200, category: '占星', expansion: 'ita', rarity: 1 });
addItem({ id: 'mysterious_stone', name: '神秘石', type: 'misc', icon: '🗿', sellPrice: 0, category: '特殊', noSell: true, description: '在采集时偶然发现，集齐后可进入「被遗忘的神殿」。', rarity: 2 });
addItem({ id: 'bird_nest', name: '鸟巢', type: 'chest', icon: '🪹', sellPrice: 15, category: '宝箱', dropTable: 'dt_bird_nest' });
addItem({ id: 'treasure_chest', name: '海底宝箱', type: 'chest', icon: '🧰', sellPrice: 50, category: '宝箱', dropTable: 'dt_treasure_chest', rarity: 1 });
addItem({ id: 'gem_pouch', name: '宝石袋', type: 'chest', icon: '👝', sellPrice: 50, category: '宝箱', dropTable: 'dt_gem_pouch' });
addItem({ id: 'herb_sack', name: '草药袋', type: 'chest', icon: '🎒', sellPrice: 30, category: '宝箱', dropTable: 'dt_herb_sack' });
addItem({ id: 'coin_pouch', name: '钱袋', type: 'chest', icon: '💰', sellPrice: 0, category: '宝箱', dropTable: 'dt_coin_pouch' });
// 钓鱼杂物
for (const [id, name] of [['old_boot', '旧靴子'], ['seaweed', '海藻'], ['rusty_can', '生锈的罐头'], ['driftwood', '浮木']] as const)
  addItem({ id, name, type: 'junk', icon: id === 'seaweed' ? '🌿' : id === 'old_boot' ? '👢' : id === 'driftwood' ? '🪵' : '🥫', sellPrice: 1, category: '杂物' });
addItem({ id: 'frozen_pearl', name: '冰封珍珠', type: 'misc', icon: '🦪', color: '#d6eaf8', sellPrice: 800, category: '特殊', expansion: 'toth', rarity: 1 });
addItem({ id: 'herald_sigil', name: '使者徽记', type: 'token', icon: '🔱', color: '#f5b041', sellPrice: 0, noSell: true, category: '特殊', expansion: 'toth', description: '通关使者领域的副本获得，用于提升等级上限。', rarity: 2 });
addItem({ id: 'abyssal_shard', name: '深渊碎晶', type: 'material', icon: '🟣', color: '#8e44ad', sellPrice: 100, category: '深渊', expansion: 'ita' });
addItem({ id: 'corrupted_heart', name: '腐化之心', type: 'token', icon: '🖤', color: '#922b21', sellPrice: 0, noSell: true, category: '深渊', expansion: 'ita', description: '深渊终局副本的钥匙。', rarity: 3 });
addItem({ id: 'map_fragment', name: '地图碎片', type: 'material', icon: '🧩', color: '#d4ac0d', sellPrice: 20, category: '制图', expansion: 'aod' });
addItem({ id: 'museum_token', name: '博物馆代币', type: 'currency', icon: '🎫', color: '#a1887f', sellPrice: 0, noSell: true, category: '考古', expansion: 'aod' });
