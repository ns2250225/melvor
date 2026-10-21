// 成就系统与完成度统计
import type { Game } from '../core/game';
import type { AchievementDef } from '../core/types';
import { C } from '@/content';
import { objectiveProgress, grantReward } from '../quests/quests';

export function achievementProgress(g: Game, a: AchievementDef): { cur: number; target: number } {
  const c = a.condition;
  const s = g.state;
  switch (c.type) {
    case 'stat': return { cur: s.stats[c.stat] || 0, target: c.value };
    case 'completion': return { cur: Math.floor(completion(g).total), target: c.percent };
    case 'mastery99': {
      let n = 0;
      for (const [id, xp] of Object.entries(s.mastery)) { if (xp >= 13034431 && (!c.skill || C.actions[id]?.skill === c.skill)) n++; }
      return { cur: n, target: c.count };
    }
    case 'kill': return { cur: c.monster ? s.monsterKills[c.monster] || 0 : s.stats.monstersKilled || 0, target: c.count };
    case 'collect': return { cur: s.itemsFound[c.item] || 0, target: c.count };
    case 'craft': return { cur: s.itemsFound[c.item] || 0, target: c.count };
    case 'actions': return { cur: s.skillStats[c.skill]?.actions || 0, target: c.count };
    default: return objectiveProgress(g, c);
  }
}

export function checkAchievements(g: Game) {
  const s = g.state;
  for (const a of Object.values(C.achievements)) {
    if (s.achievements[a.id]) continue;
    const p = achievementProgress(g, a);
    if (p.cur < p.target) continue;
    s.achievements[a.id] = s.clock;
    grantReward(g, a.reward, 'achievement');
    g.notify(`达成成就：${a.name}`, 'success', '🏆');
    g.events.emit('achievementCompleted', { achievementId: a.id });
  }
}

let cache: { t: number; id: string; v: ReturnType<typeof computeCompletion> } | null = null;
export function completion(g: Game) {
  if (cache && cache.id === g.state.player.id && Math.abs(cache.t - g.state.clock) < 5000) return cache.v;
  const v = computeCompletion(g);
  cache = { t: g.state.clock, id: g.state.player.id, v };
  return v;
}

function computeCompletion(g: Game) {
  const s = g.state;
  const items = Object.keys(C.items);
  const itemsPct = items.filter((i) => s.itemsFound[i]).length / items.length;
  const monsters = Object.keys(C.monsters);
  const monstersPct = monsters.filter((m) => s.monsterKills[m]).length / monsters.length;
  const pets = Object.keys(C.pets);
  const petsPct = pets.filter((p) => s.pets[p]).length / pets.length;
  let lv = 0, lvMax = 0;
  for (const sid of C.skillOrder) { lv += Math.min(s.skills[sid].level, 99); lvMax += 99; }
  const skillsPct = lv / lvMax;
  let ml = 0, mlMax = 0;
  for (const a of Object.values(C.actions)) {
    if (a.masteryEnabled === false || !C.skills[a.skill].masteryEnabled) continue;
    ml += g.masteryLevel(a.id); mlMax += 99;
  }
  const masteryPct = mlMax ? ml / mlMax : 0;
  const dungeons = Object.keys(C.dungeons);
  const dungeonPct = dungeons.filter((d) => s.dungeonCompletions[d]).length / dungeons.length;
  const total = ((itemsPct + monstersPct + petsPct + skillsPct + masteryPct + dungeonPct) / 6) * 100;
  return { items: itemsPct * 100, monsters: monstersPct * 100, pets: petsPct * 100, skills: skillsPct * 100, mastery: masteryPct * 100, dungeons: dungeonPct * 100, total };
}
