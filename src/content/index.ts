// 内容入口：按依赖顺序加载全部内容模块并建立派生索引
import { C, noteSource, noteUse } from './registry';
import './skills';
import './items/materials';
import './items/equipment';
import './recipes/gathering';
import './recipes/artisan';
import './recipes/support';
import './monsters';
import './combat-areas';
import './effects/magic';
import './items/shop';
import './quests';
import { TOWNSHIP_TASKS } from './recipes/support';
import manifest from './manifest.json';

export { C } from './registry';
export const CONTENT_MANIFEST = manifest;

let built = false;
export function buildContentIndexes() {
  if (built) return;
  built = true;
  for (const a of Object.values(C.actions)) {
    C.skills[a.skill].actions.push(a.id);
    const src = `${C.skills[a.skill].name}：${a.name}`;
    for (const o of a.outputs) noteSource(o.id, src);
    for (const e of a.extraDrops ?? []) noteSource(e.id, src);
    for (const i of a.inputs) noteUse(i.id, src);
    for (const alt of a.altInputs ?? []) for (const i of alt) noteUse(i.id, src);
    if (a.data?.tiers) for (const t of a.data.tiers) noteSource(t, src);
    if (a.data?.table) for (const e of C.dropTables[a.data.table]?.entries ?? []) noteSource(e.id, src);
    if (a.data?.unique) noteSource(a.data.unique.id, src);
    if (a.data?.areaUnique) noteSource(a.data.areaUnique.id, `${C.skills[a.skill].name}区域稀有掉落`);
    if (a.data?.burnt) noteSource(a.data.burnt, src);
    if (a.data?.perfect) noteSource(a.data.perfect, src);
    if (a.data?.rare) noteSource(a.data.rare.id, src);
  }
  const tableSource = (tableId: string, label: string) => { for (const e of C.dropTables[tableId]?.entries ?? []) if (!e.id.startsWith('$')) noteSource(e.id, label); };
  tableSource('dt_fish_junk', '钓鱼：杂物');
  tableSource('dt_fish_special', '钓鱼：特殊物品');
  tableSource('dt_fish_glacier', '钓鱼：永冻冰河');
  tableSource('dt_fish_abyss', '钓鱼：深渊之海');
  for (const it of Object.values(C.items)) if (it.dropTable) tableSource(it.dropTable, `开启：${it.name}`);
  for (const m of Object.values(C.monsters)) {
    if (m.drops) tableSource(m.drops, `击败：${m.name}`);
    if (m.bones) noteSource(m.bones, `击败：${m.name}`);
  }
  for (const d of Object.values(C.dungeons)) {
    for (const r of d.rewards) noteSource(r.id, `副本：${d.name}`);
    if (d.rewardTable) tableSource(d.rewardTable, `副本：${d.name}`);
    for (const r of d.requirements) if (r.type === 'item') noteUse(r.id, `进入副本：${d.name}`);
  }
  for (const s of Object.values(C.shop)) {
    for (const g of s.grants ?? []) noteSource(g.id, `商店：${s.name}`);
    for (const i of s.cost.items ?? []) noteUse(i.id, `商店：${s.name}`);
  }
  for (const q of Object.values(C.quests)) {
    for (const i of q.rewards.items ?? []) noteSource(i.id, `任务：${q.name}`);
    for (const o of q.objectives) if (o.type === 'collect' && o.consume) noteUse(o.item, `任务：${q.name}`);
  }
  for (const p of Object.values(C.pois)) for (const i of p.reward?.items ?? []) noteSource(i.id, `兴趣点：${p.name}`);
  for (const c of Object.values(C.crops)) { noteSource(c.produce, `农业：${C.items[c.produce]?.name}`); noteUse(c.seed, '农业种植'); }
  for (const d of Object.values(C.digSites)) for (const list of Object.values(d.artifacts)) for (const id of list) noteSource(id, `考古：${d.name}`);
  for (const sp of Object.values(C.spells)) {
    for (const r of sp.runes) noteUse(r.id, `法术：${sp.name}`);
    for (const p of sp.alt?.produces ?? []) noteSource(p.id, `替代魔法：${sp.name}`);
    for (const p of sp.alt?.consumes ?? []) noteUse(p.id, `替代魔法：${sp.name}`);
  }
  for (const t of TOWNSHIP_TASKS) {
    for (const i of t.requires) noteUse(i.id, `城镇任务：${t.name}`);
    for (const i of t.reward.items ?? []) noteSource(i.id, `城镇任务：${t.name}`);
  }
  for (const r of Object.values(C.townshipResources)) {
    if (r.convertsTo) noteSource(r.convertsTo, `城镇兑换：${r.name}`);
    for (const i of r.fromItems ?? []) noteUse(i, `城镇捐献：${r.name}`);
  }
  for (const o of Object.values(C.obstacles)) for (const i of o.cost.items) noteUse(i.id, `敏捷：${o.name}`);
  // 通用用途
  for (const it of Object.values(C.items)) {
    if (it.equipment) noteUse(it.id, '装备');
    if (it.healsFor) noteUse(it.id, '食物');
    if (it.prayerPoints || it.soulPoints) noteUse(it.id, '祈祷（埋葬）');
    if (it.potion) noteUse(it.id, '药水');
    if (it.dropTable) noteUse(it.id, '开启');
    if (it.artifact) noteUse(it.id, '博物馆捐赠');
    if (it.type === 'junk' || (!C.itemUses[it.id] && !it.noSell)) noteUse(it.id, '出售');
  }
}

buildContentIndexes();
