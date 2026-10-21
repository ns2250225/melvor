// 内容完整性校验：重复 ID、引用完整性、概率合法性、来源与用途、解锁可达性
import { C, duplicateIds } from '@/content/registry';
import { handlers } from '../production/actions';
import type { Requirement } from './types';

export interface ContentReport {
  ok: boolean;
  counts: Record<string, number>;
  errors: string[];
  warnings: string[];
}

export function checkContent(): ContentReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const item = (id: string, where: string) => { if (id !== '$gp' && !C.items[id]) errors.push(`${where} 引用不存在的物品：${id}`); };
  const req = (r: Requirement, where: string) => {
    if (r.type === 'dungeon' && !C.dungeons[r.id]) errors.push(`${where} 引用不存在的副本：${r.id}`);
    if (r.type === 'quest' && !C.quests[r.id]) errors.push(`${where} 引用不存在的任务：${r.id}`);
    if (r.type === 'shop' && !C.shop[r.id]) errors.push(`${where} 引用不存在的商品：${r.id}`);
    if (r.type === 'poi' && !C.pois[r.id]) errors.push(`${where} 引用不存在的兴趣点：${r.id}`);
    if ((r.type === 'item' || r.type === 'equipped') && !C.items[r.id]) errors.push(`${where} 引用不存在的物品：${r.id}`);
    if (r.type === 'monster' && !C.monsters[r.id]) errors.push(`${where} 引用不存在的怪物：${r.id}`);
  };
  for (const d of duplicateIds) errors.push(`重复 ID：${d}`);
  // 技能与动作
  for (const sid of C.skillOrder) {
    const sk = C.skills[sid];
    if (!sk.name) errors.push(`技能缺少名称：${sid}`);
    const hasActions = (C.actionsBySkill[sid] ?? []).length > 0;
    if (hasActions && !handlers[sid] && sid !== 'farming') errors.push(`技能 ${sid} 有动作但没有动作处理器`);
  }
  for (const a of Object.values(C.actions)) {
    const w = `动作 ${a.id}`;
    if (!C.skills[a.skill]) errors.push(`${w} 的技能不存在`);
    if (!(a.interval > 0) && a.skill !== 'farming') errors.push(`${w} 耗时非法`);
    for (const i of a.inputs) item(i.id, w);
    for (const set of a.altInputs ?? []) for (const i of set) item(i.id, w);
    for (const o of a.outputs) item(o.id, w);
    for (const e of a.extraDrops ?? []) { item(e.id, w); if (e.chance < 0 || e.chance > 1) errors.push(`${w} 额外掉落概率非法`); }
    for (const r of a.requirements ?? []) req(r, w);
    if (a.data?.table && !C.dropTables[a.data.table]) errors.push(`${w} 掉落表不存在`);
    for (const t of a.data?.tiers ?? []) item(t, w);
    if (a.data?.burnt) item(a.data.burnt, w);
    if (a.data?.perfect) item(a.data.perfect, w);
  }
  // 掉落表
  for (const t of Object.values(C.dropTables)) {
    if (!t.entries.length) errors.push(`掉落表为空：${t.id}`);
    if (t.chance !== undefined && (t.chance < 0 || t.chance > 1)) errors.push(`掉落表概率非法：${t.id}`);
    for (const e of t.entries) {
      item(e.id, `掉落表 ${t.id}`);
      if (!(e.weight > 0)) errors.push(`掉落表 ${t.id} 权重非法：${e.id}`);
      if (e.min > e.max || e.min < 0) errors.push(`掉落表 ${t.id} 数量区间非法：${e.id}`);
    }
  }
  // 怪物、区域、副本
  for (const m of Object.values(C.monsters)) {
    const w = `怪物 ${m.id}`;
    if (!(m.hitpoints > 0) || !(m.attackSpeed > 0)) errors.push(`${w} 属性非法`);
    if (m.drops && !C.dropTables[m.drops]) errors.push(`${w} 掉落表不存在`);
    if (m.bones) item(m.bones, w);
    for (const s of m.specialAttacks ?? []) if (!C.specialAttacks[s]) errors.push(`${w} 特殊攻击不存在：${s}`);
    if (m.pet && !C.pets[m.pet.id]) errors.push(`${w} 宠物不存在`);
  }
  const usedMonsters = new Set<string>();
  for (const a of Object.values(C.areas)) {
    for (const m of a.monsters) { usedMonsters.add(m); if (!C.monsters[m]) errors.push(`区域 ${a.id} 怪物不存在：${m}`); }
    for (const r of a.requirements) req(r, `区域 ${a.id}`);
    for (const e of a.entryEquipment ?? []) item(e, `区域 ${a.id}`);
  }
  for (const d of Object.values(C.dungeons)) {
    if (!d.monsters.length) errors.push(`副本 ${d.id} 没有敌人`);
    for (const m of d.monsters) { usedMonsters.add(m); if (!C.monsters[m]) errors.push(`副本 ${d.id} 怪物不存在：${m}`); }
    for (const r of d.requirements) { req(r, `副本 ${d.id}`); if (r.type === 'dungeon' && r.id === d.id) errors.push(`副本 ${d.id} 依赖自身`); }
    for (const r of d.rewards) item(r.id, `副本 ${d.id}`);
    if (d.rewardTable && !C.dropTables[d.rewardTable]) errors.push(`副本 ${d.id} 奖励表不存在`);
    if (d.pet && !C.pets[d.pet.id]) errors.push(`副本 ${d.id} 宠物不存在`);
  }
  for (const m of Object.keys(C.monsters)) if (!usedMonsters.has(m)) warnings.push(`怪物未出现在任何区域或副本：${m}`);
  // 法术与祈祷
  for (const s of Object.values(C.spells)) {
    for (const r of s.runes) item(r.id, `法术 ${s.id}`);
    for (const r of s.requirements ?? []) req(r, `法术 ${s.id}`);
    if (s.specialAttack && !C.specialAttacks[s.specialAttack]) errors.push(`法术 ${s.id} 特殊攻击不存在`);
    for (const p of [...(s.alt?.consumes ?? []), ...(s.alt?.produces ?? [])]) item(p.id, `法术 ${s.id}`);
  }
  for (const p of Object.values(C.prayers)) for (const r of p.requirements ?? []) req(r, `祈祷 ${p.id}`);
  // 商店
  for (const s of Object.values(C.shop)) {
    for (const g of s.grants ?? []) item(g.id, `商品 ${s.id}`);
    for (const i of s.cost.items ?? []) item(i.id, `商品 ${s.id}`);
    for (const r of s.requirements) req(r, `商品 ${s.id}`);
    if (s.replaces && !C.shop[s.replaces]) errors.push(`商品 ${s.id} 替换目标不存在`);
  }
  // 任务与成就
  for (const q of Object.values(C.quests)) {
    for (const p of q.prerequisites) if (!C.quests[p]) errors.push(`任务 ${q.id} 前置不存在：${p}`);
    for (const r of q.requirements) req(r, `任务 ${q.id}`);
    for (const o of q.objectives) {
      if (o.type === 'kill' && o.monster && !C.monsters[o.monster]) errors.push(`任务 ${q.id} 怪物不存在`);
      if ((o.type === 'craft' || o.type === 'collect')) item(o.item, `任务 ${q.id}`);
      if (o.type === 'dungeon' && !C.dungeons[o.id]) errors.push(`任务 ${q.id} 副本不存在`);
    }
    for (const i of q.rewards.items ?? []) item(i.id, `任务 ${q.id}`);
  }
  // 任务依赖环检测
  const visiting = new Set<string>(), done = new Set<string>();
  const dfs = (id: string): boolean => {
    if (done.has(id)) return true;
    if (visiting.has(id)) { errors.push(`任务依赖成环：${id}`); return false; }
    visiting.add(id);
    for (const p of C.quests[id]?.prerequisites ?? []) dfs(p);
    visiting.delete(id); done.add(id);
    return true;
  };
  for (const id of Object.keys(C.quests)) dfs(id);
  for (const a of Object.values(C.achievements)) {
    const c = a.condition as any;
    if (c.type === 'dungeon' && !C.dungeons[c.id]) errors.push(`成就 ${a.id} 副本不存在`);
    if ((c.type === 'collect' || c.type === 'craft') && !C.items[c.item]) errors.push(`成就 ${a.id} 物品不存在`);
  }
  // 召唤、敏捷、占星、城镇、考古
  for (const f of Object.values(C.familiars)) item(f.tabletId, `召唤兽 ${f.id}`);
  for (const s of C.synergies) if (!C.familiars[s.a] || !C.familiars[s.b]) errors.push(`协同引用不存在的召唤兽：${s.a}/${s.b}`);
  for (const o of Object.values(C.obstacles)) for (const i of o.cost.items) item(i.id, `障碍 ${o.id}`);
  for (const c of Object.values(C.crops)) { item(c.seed, `作物 ${c.id}`); item(c.produce, `作物 ${c.id}`); }
  for (const d of Object.values(C.digSites)) {
    for (const list of Object.values(d.artifacts)) { if (!list.length) errors.push(`发掘点 ${d.id} 有空的文物池`); for (const i of list) item(i, `发掘点 ${d.id}`); }
    if (!C.pois[`poi_${d.id}`]) errors.push(`发掘点 ${d.id} 没有对应兴趣点`);
  }
  for (const n of Object.values(C.skillTree)) for (const p of n.parents) if (!C.skillTree[p]) errors.push(`技能树节点 ${n.id} 父节点不存在`);
  for (const p of Object.values(C.pets)) if (p.sourceType === 'dungeon' && !C.dungeons[p.sourceId!]) errors.push(`宠物 ${p.id} 来源副本不存在`);
  // 物品：来源与用途
  for (const it of Object.values(C.items)) {
    if (!it.name) errors.push(`物品缺少名称：${it.id}`);
    if (!C.itemSources[it.id]?.length) warnings.push(`物品没有获取来源：${it.id}（${it.name}）`);
    if (!C.itemUses[it.id]?.length) warnings.push(`物品没有用途：${it.id}（${it.name}）`);
  }
  const counts = {
    skills: C.skillOrder.length, items: Object.keys(C.items).length, actions: Object.keys(C.actions).length, monsters: Object.keys(C.monsters).length,
    combatAreas: Object.values(C.areas).filter((a) => a.type === 'combat').length, slayerAreas: Object.values(C.areas).filter((a) => a.type === 'slayer').length,
    dungeons: Object.keys(C.dungeons).length, dropTables: Object.keys(C.dropTables).length, spells: Object.keys(C.spells).length, prayers: Object.keys(C.prayers).length,
    familiars: Object.keys(C.familiars).length, synergies: C.synergies.length, shopItems: Object.keys(C.shop).length, quests: Object.keys(C.quests).length,
    achievements: Object.keys(C.achievements).length, pets: Object.keys(C.pets).length, obstacles: Object.keys(C.obstacles).length,
    constellations: Object.keys(C.constellations).length, crops: Object.keys(C.crops).length, townshipBuildings: Object.keys(C.townshipBuildings).length,
    digSites: Object.keys(C.digSites).length, pois: Object.keys(C.pois).length, skillTreeNodes: Object.keys(C.skillTree).length, corruptionEffects: Object.keys(C.corruptionEffects).length,
  };
  return { ok: errors.length === 0, counts, errors, warnings };
}
