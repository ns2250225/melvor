// 扩展清单：所有扩展内容通过清单登记
import type { ExpansionId } from '@/game/core/types';

export interface ExpansionManifest {
  id: ExpansionId;
  name: string;
  version: string;
  dependencies: ExpansionId[];
  description: string;
  skills: string[];
  specialRules: string[];
  endgame: string[];
}

export const EXPANSIONS: ExpansionManifest[] = [
  {
    id: 'base', name: '基础游戏', version: '1.3.1', dependencies: [],
    description: '全部基础技能、战斗区域、副本与终局「暗黑降临」。',
    skills: ['attack', 'strength', 'defence', 'hitpoints', 'ranged', 'magic', 'prayer', 'slayer', 'woodcutting', 'fishing', 'firemaking', 'cooking', 'mining', 'smithing', 'thieving', 'farming', 'fletching', 'crafting', 'runecrafting', 'herblore', 'agility', 'summoning', 'astrology', 'township'],
    specialRules: ['战斗三角', '自动进食', 'Slayer 任务', '掌握度池检查点', '召唤协同'],
    endgame: ['dg_chaos', 'dg_forgotten_temple', 'dg_elemental'],
  },
  {
    id: 'toth', name: 'Throne of the Herald', version: '1.3.1', dependencies: ['base'],
    description: '技能等级上限提升至 120（通过使者启示），新增星陨/天河装备、亵渎祈祷、消耗品栏与使者副本。',
    skills: [],
    specialRules: ['等级上限 99→120（使者启示 I-III）', '亵渎祈祷', '消耗品装备栏', '120 级披风'],
    endgame: ['dg_throne'],
  },
  {
    id: 'aod', name: 'Atlas of Discovery', version: '1.3.1', dependencies: ['base'],
    description: '新增制图与考古技能、六角格世界地图、兴趣点、发掘点、博物馆与古代遗法。',
    skills: ['cartography', 'archaeology'],
    specialRules: ['六角格勘测', '发掘地图与充能', '考古工具升级', '博物馆捐赠'],
    endgame: ['ach_poi_all'],
  },
  {
    id: 'ita', name: 'Into the Abyss', version: '1.3.1', dependencies: ['base'],
    description: '深渊领域、深渊等级（最高 60）、腐化与收割技能、技能树、屏障机制、深渊伤害与抗性、深渊副本。',
    skills: ['corruption', 'harvesting'],
    specialRules: ['深渊等级与深渊经验', '技能树点数（每深渊等级 1 点）', '屏障：召唤兽全额破盾，玩家攻击 25%', '深渊伤害无视减伤，由深渊抗性减免', '腐化效果'],
    endgame: ['dg_abyss_throne'],
  },
];
