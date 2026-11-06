// 百科数据层：直接读取游戏内容注册表（与游戏共用一份数据，内容更新后百科自动同步）
import { C, EXPANSION_NAMES } from '@/content/registry';
import '@/content';
import type { Requirement, ItemDef, MonsterDef, SkillId } from '@/game/core/types';
import { dropTableRows } from '@/game/ui/combatHelpers';

export { C, EXPANSION_NAMES };

export type Kind = 'skill' | 'item' | 'monster' | 'area' | 'dungeon' | 'spell' | 'prayer' | 'pet' | 'shop' | 'quest' | 'achievement' | 'familiar';

export const KIND_NAMES: Record<Kind, string> = {
  skill: '技能', item: '物品', monster: '怪物', area: '区域', dungeon: '副本', spell: '法术', prayer: '祈祷',
  pet: '宠物', shop: '商店', quest: '任务', achievement: '成就', familiar: '召唤兽',
};

export const href = (kind: string, id?: string) => `#/${kind}${id ? '/' + encodeURIComponent(id) : ''}`;

/** 需求文字（与游戏内描述一致，但不依赖存档） */
export function reqText(r: Requirement): string {
  switch (r.type) {
    case 'skill': return `${C.skills[r.skill]?.name} ${r.level} 级`;
    case 'abyssal': return `${C.skills[r.skill]?.name} 深渊 ${r.level} 级`;
    case 'dungeon': return `通关「${C.dungeons[r.id]?.name ?? r.id}」${r.count && r.count > 1 ? ` ${r.count} 次` : ''}`;
    case 'quest': return `完成任务「${C.quests[r.id]?.name ?? r.id}」`;
    case 'shop': return `购买「${C.shop[r.id]?.name ?? r.id}」`;
    case 'monster': return `击败 ${C.monsters[r.id]?.name ?? r.id} ${r.count} 次`;
    case 'equipped': return `装备 ${C.items[r.id]?.name ?? r.id}`;
    case 'item': return `持有 ${C.items[r.id]?.name ?? r.id} ×${r.qty ?? 1}`;
    case 'poi': return `发现「${C.pois[r.id]?.name ?? r.id}」`;
    case 'realm': return r.realm === 'abyssal' ? '开启深渊之门' : '';
    case 'township': return `城镇 ${r.level} 级`;
    case 'gameMode': return C.gameModes[r.mode]?.name ?? r.mode;
    case 'totalLevel': return `总等级 ${r.level}`;
  }
}

/** 怪物战斗等级（与游戏内公式同构的简化估算，用于排序与展示） */
export function monsterLevel(m: MonsterDef): number {
  if (m.level) return m.level;
  const base = 0.25 * (m.defence + m.hitpoints);
  const melee = 0.325 * (m.attack + m.strength), ranged = 0.325 * 1.5 * m.ranged, magic = 0.325 * 1.5 * m.magic;
  return Math.floor(base + Math.max(melee, ranged, magic));
}

// ---------- 反向索引 ----------
let _dropIdx: Record<string, { monster: string; chance: number }[]> | null = null;
/** 物品 → 掉落该物品的怪物 */
export function droppedBy(itemId: string) {
  if (!_dropIdx) {
    _dropIdx = {};
    for (const m of Object.values(C.monsters)) for (const r of dropTableRows(m.drops)) (_dropIdx[r.id] ||= []).push({ monster: m.id, chance: r.chance });
    for (const m of Object.values(C.monsters)) if (m.bones) (_dropIdx[m.bones] ||= []).push({ monster: m.id, chance: 1 });
  }
  return (_dropIdx[itemId] ?? []).sort((a, b) => b.chance - a.chance);
}
let _prodIdx: Record<string, string[]> | null = null;
let _useIdx: Record<string, string[]> | null = null;
function buildActionIdx() {
  _prodIdx = {}; _useIdx = {};
  for (const a of Object.values(C.actions)) {
    for (const o of a.outputs) (_prodIdx[o.id] ||= []).push(a.id);
    for (const i of [...a.inputs, ...(a.altInputs ?? []).flat()]) { const l = (_useIdx[i.id] ||= []); if (!l.includes(a.id)) l.push(a.id); }
  }
}
/** 物品 → 产出它的技能动作 */
export function producedBy(itemId: string) { if (!_prodIdx) buildActionIdx(); return _prodIdx![itemId] ?? []; }
/** 物品 → 以它为材料的技能动作 */
export function usedBy(itemId: string) { if (!_useIdx) buildActionIdx(); return _useIdx![itemId] ?? []; }
/** 怪物 → 出现的区域 / 副本 */
export function monsterLocations(id: string) {
  return [
    ...Object.values(C.areas).filter((a) => a.monsters.includes(id)).map((a) => ({ kind: 'area' as const, id: a.id })),
    ...Object.values(C.dungeons).filter((d) => d.monsters.includes(id)).map((d) => ({ kind: 'dungeon' as const, id: d.id })),
  ];
}

// ---------- 搜索 ----------
export interface Entry { kind: Kind; id: string; name: string; icon: string; sub: string; seed?: string; tint?: string }
let _index: Entry[] | null = null;
export function searchIndex(): Entry[] {
  if (_index) return _index;
  const out: Entry[] = [];
  for (const s of C.skillOrder) { const d = C.skills[s]; out.push({ kind: 'skill', id: s, name: d.name, icon: d.icon, sub: '技能' }); }
  for (const i of Object.values(C.items)) out.push({ kind: 'item', id: i.id, name: i.name, icon: i.icon, sub: i.category, seed: i.id, tint: i.color });
  for (const m of Object.values(C.monsters)) out.push({ kind: 'monster', id: m.id, name: m.name, icon: m.icon, sub: `怪物 · Lv ${monsterLevel(m)}`, seed: m.id });
  for (const a of Object.values(C.areas)) out.push({ kind: 'area', id: a.id, name: a.name, icon: a.icon, sub: a.type === 'slayer' ? '猎杀区域' : '战斗区域', seed: a.id });
  for (const d of Object.values(C.dungeons)) out.push({ kind: 'dungeon', id: d.id, name: d.name, icon: d.icon, sub: '副本', seed: d.id });
  for (const s of Object.values(C.spells)) out.push({ kind: 'spell', id: s.id, name: s.name, icon: s.icon, sub: '法术', seed: s.id });
  for (const p of Object.values(C.prayers)) out.push({ kind: 'prayer', id: p.id, name: p.name, icon: p.icon, sub: '祈祷', seed: p.id });
  for (const p of Object.values(C.pets)) out.push({ kind: 'pet', id: p.id, name: p.name, icon: p.icon, sub: '宠物', seed: p.id });
  for (const q of Object.values(C.quests)) out.push({ kind: 'quest', id: q.id, name: q.name, icon: 'scroll', sub: `任务 · ${q.chapter}` });
  _index = out;
  return out;
}

export function itemTint(it: ItemDef | undefined) { return it?.color; }
export const skillName = (s: SkillId | string) => C.skills[s as SkillId]?.name ?? s;
