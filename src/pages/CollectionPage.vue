<script setup lang="ts">
// 图鉴：物品、怪物、宠物、副本、兴趣点、博物馆与完成度
import { computed, ref, watch } from 'vue';
import { C } from '@/content';
import { useGameStore } from '@/stores/game';
import { completion } from '@/game/achievements/achievements';
import { MUSEUM_MILESTONES } from '@/game/production/special';
import { fmt, full, pct, fmtDate } from '@/app/format';
import { EXPANSION_NAMES } from '@/content/registry';
import ItemIcon from '@/components/ItemIcon.vue';
import ProgressBar from '@/components/ProgressBar.vue';

const store = useGameStore();
const g = computed(() => store.game!);
const s = computed(() => g.value.state);

type Tab = 'items' | 'monsters' | 'pets' | 'dungeons' | 'pois' | 'museum' | 'completion';
const TABS: [Tab, string][] = [['items', '物品'], ['monsters', '怪物'], ['pets', '宠物'], ['dungeons', '副本'], ['pois', '区域探索'], ['museum', '博物馆'], ['completion', '完成度']];
const tab = ref<Tab>('items');
const PAGE = 120;

// ---------------------------------------------------------------- 物品
const allItems = Object.values(C.items);
const itemCats = ['全部', ...new Set(allItems.map((i) => i.category))];
const itemCat = ref('全部');
const itemSearch = ref('');
const itemFound = ref<'all' | 'found' | 'missing'>('all');
const itemLimit = ref(PAGE);
const filteredItems = computed(() => {
  const q = itemSearch.value.trim().toLowerCase();
  const f = s.value.itemsFound;
  return allItems.filter((i) => {
    const found = !!f[i.id];
    if (itemCat.value !== '全部' && i.category !== itemCat.value) return false;
    if (itemFound.value === 'found' && !found) return false;
    if (itemFound.value === 'missing' && found) return false;
    if (q && !(found && (i.name.toLowerCase().includes(q) || i.id.includes(q)))) return false;
    return true;
  });
});
const itemsFoundCount = computed(() => allItems.filter((i) => s.value.itemsFound[i.id]).length);
watch([itemCat, itemSearch, itemFound], () => { itemLimit.value = PAGE; });

// ---------------------------------------------------------------- 怪物
const allMonsters = Object.values(C.monsters);
const monRealm = ref<'all' | 'melvor' | 'abyssal'>('all');
const monLimit = ref(PAGE);
const monsters = computed(() => allMonsters.filter((m) => monRealm.value === 'all' || (m.realm ?? 'melvor') === monRealm.value));
const monKnown = computed(() => allMonsters.filter((m) => s.value.monsterKills[m.id]).length);
watch(monRealm, () => { monLimit.value = PAGE; });

// ---------------------------------------------------------------- 宠物
const allPets = Object.values(C.pets);
const petsOwned = computed(() => allPets.filter((p) => s.value.pets[p.id]).length);

// ---------------------------------------------------------------- 副本
const allDungeons = Object.values(C.dungeons);
const dungeonsDone = computed(() => allDungeons.filter((d) => s.value.dungeonCompletions[d.id]).length);

// ---------------------------------------------------------------- 兴趣点
const allPois = Object.values(C.pois);
const POI_KIND: Record<string, string> = { digSite: '发掘点', watchtower: '瞭望塔', portal: '传送门', treasure: '宝藏', landmark: '地标', hiddenHole: '隐秘洞穴' };
const poiDiscovered = computed(() => new Set(s.value.cartography.discovered));

// ---------------------------------------------------------------- 博物馆
const artifacts = allItems.filter((i) => i.artifact);
const donated = computed(() => artifacts.filter((a) => s.value.archaeology.museum[a.id]).length);
const SIZE: Record<string, string> = { tiny: '微型', small: '小型', medium: '中型', large: '大型' };

// ---------------------------------------------------------------- 完成度
const comp = computed(() => { void store.frame; return completion(g.value); });
const compRows = computed(() => [
  ['📦 物品', comp.value.items, `${itemsFoundCount.value} / ${allItems.length}`],
  ['👹 怪物', comp.value.monsters, `${monKnown.value} / ${allMonsters.length}`],
  ['🐾 宠物', comp.value.pets, `${petsOwned.value} / ${allPets.length}`],
  ['📈 技能（按 99 级计）', comp.value.skills, ''],
  ['🎖️ 掌握度', comp.value.mastery, ''],
  ['🏰 副本', comp.value.dungeons, `${dungeonsDone.value} / ${allDungeons.length}`],
] as [string, number, string][]);
</script>

<template>
  <div>
    <div class="page-title"><span class="icon">📖</span><h2>图鉴</h2><span class="muted">总完成度 {{ pct(comp.total, 2) }}</span></div>
    <div class="tabs">
      <button v-for="[t, label] in TABS" :key="t" :class="{ on: tab === t }" @click="tab = t">{{ label }}</button>
    </div>

    <!-- 物品 -->
    <div v-if="tab === 'items'" class="panel">
      <div class="row between mb">
        <span>已发现 <b>{{ itemsFoundCount }}</b> / {{ allItems.length }}</span>
        <span class="small muted">共 {{ filteredItems.length }} 项</span>
      </div>
      <div class="row mb">
        <input v-model="itemSearch" class="grow" placeholder="搜索已发现的物品…" />
        <select v-model="itemCat"><option v-for="c in itemCats" :key="c" :value="c">{{ c }}</option></select>
        <select v-model="itemFound">
          <option value="all">全部</option><option value="found">已发现</option><option value="missing">未发现</option>
        </select>
      </div>
      <div class="igrid">
        <div v-for="i in filteredItems.slice(0, itemLimit)" :key="i.id" class="icell" :class="{ unknown: !s.itemsFound[i.id] }" :title="s.itemsFound[i.id] ? i.name : '???'">
          <ItemIcon v-if="s.itemsFound[i.id]" :id="i.id" :size="44" />
          <div v-else class="qbox">?</div>
          <div class="tiny name">{{ s.itemsFound[i.id] ? i.name : '???' }}</div>
        </div>
      </div>
      <div v-if="!filteredItems.length" class="empty">没有符合条件的物品</div>
      <div v-if="filteredItems.length > itemLimit" class="center mt"><button @click="itemLimit += PAGE">显示更多（剩余 {{ filteredItems.length - itemLimit }}）</button></div>
    </div>

    <!-- 怪物 -->
    <div v-else-if="tab === 'monsters'" class="panel">
      <div class="row between mb">
        <span>已击败种类 <b>{{ monKnown }}</b> / {{ allMonsters.length }}</span>
        <div class="row">
          <button class="small" :class="{ primary: monRealm === 'all' }" @click="monRealm = 'all'">全部</button>
          <button class="small" :class="{ primary: monRealm === 'melvor' }" @click="monRealm = 'melvor'">梅尔沃</button>
          <button class="small" :class="{ primary: monRealm === 'abyssal' }" @click="monRealm = 'abyssal'">深渊</button>
        </div>
      </div>
      <div class="cards sm">
        <div v-for="m in monsters.slice(0, monLimit)" :key="m.id" class="card">
          <div class="row nowrap">
            <span class="micon" :class="{ sil: !s.monsterKills[m.id] }">{{ m.icon }}</span>
            <div class="grow">
              <div class="bold small">{{ s.monsterKills[m.id] ? m.name : '???' }}</div>
              <div class="tiny muted">
                <template v-if="s.monsterKills[m.id]">Lv.{{ m.level ?? '?' }} · </template>
                <span :class="{ abyss: m.realm === 'abyssal' }">{{ m.realm === 'abyssal' ? '深渊' : '梅尔沃' }}</span>
                <span v-if="m.isBoss" class="bad"> · 首领</span>
              </div>
            </div>
          </div>
          <div class="small">击杀 <b>{{ full(s.monsterKills[m.id] || 0) }}</b></div>
        </div>
      </div>
      <div v-if="monsters.length > monLimit" class="center mt"><button @click="monLimit += PAGE">显示更多（剩余 {{ monsters.length - monLimit }}）</button></div>
    </div>

    <!-- 宠物 -->
    <div v-else-if="tab === 'pets'" class="panel">
      <div class="row between mb">
        <span>已收集 <b>{{ petsOwned }}</b> / {{ allPets.length }}</span>
        <button class="small" @click="store.go('pets')">查看宠物详情</button>
      </div>
      <ProgressBar :value="petsOwned / Math.max(1, allPets.length)" color="var(--good)" />
      <div class="row mt">
        <span v-for="p in allPets" :key="p.id" class="pet" :class="{ sil: !s.pets[p.id] }" :title="s.pets[p.id] ? p.name : '???'">{{ p.icon }}</span>
      </div>
    </div>

    <!-- 副本 -->
    <div v-else-if="tab === 'dungeons'" class="panel">
      <div class="mb">已通关 <b>{{ dungeonsDone }}</b> / {{ allDungeons.length }}</div>
      <div class="scroll">
        <table>
          <thead><tr><th>副本</th><th>领域</th><th>扩展</th><th>敌人数</th><th class="right">通关次数</th></tr></thead>
          <tbody>
            <tr v-for="d in allDungeons" :key="d.id">
              <td>{{ d.icon }} {{ d.name }} <span v-if="d.isEndgame" class="tag gold">终局</span></td>
              <td :class="{ abyss: d.realm === 'abyssal' }">{{ d.realm === 'abyssal' ? '深渊' : '梅尔沃' }}</td>
              <td class="small muted">{{ EXPANSION_NAMES[d.expansion] }}</td>
              <td>{{ d.monsters.length }}</td>
              <td class="right" :class="{ good: s.dungeonCompletions[d.id] }">{{ full(s.dungeonCompletions[d.id] || 0) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 兴趣点 -->
    <div v-else-if="tab === 'pois'" class="panel">
      <div class="row between mb">
        <span>已发现兴趣点 <b>{{ poiDiscovered.size }}</b> / {{ allPois.length }}</span>
        <span class="small muted">已完全勘测 {{ s.cartography.surveyed.length }} 格</span>
      </div>
      <ProgressBar :value="poiDiscovered.size / Math.max(1, allPois.length)" color="var(--accent2)" />
      <div class="cards mt">
        <div v-for="p in allPois" :key="p.id" class="card" :class="{ locked: !poiDiscovered.has(p.id) }">
          <div class="row nowrap">
            <span class="micon" :class="{ sil: !poiDiscovered.has(p.id) }">{{ p.icon }}</span>
            <div class="grow">
              <div class="bold small">{{ poiDiscovered.has(p.id) ? p.name : '未发现的兴趣点' }}</div>
              <div class="tiny muted">{{ POI_KIND[p.kind] ?? p.kind }} · 坐标 ({{ p.hex[0] }}, {{ p.hex[1] }})</div>
            </div>
          </div>
          <div v-if="poiDiscovered.has(p.id)" class="small muted">{{ p.description }}</div>
        </div>
      </div>
      <div v-if="!allPois.length" class="empty">没有兴趣点数据</div>
    </div>

    <!-- 博物馆 -->
    <div v-else-if="tab === 'museum'" class="panel">
      <div class="row between mb">
        <span>已捐赠文物 <b>{{ donated }}</b> / {{ artifacts.length }}</span>
        <button class="small" @click="store.go('skill', 'archaeology')">前往考古</button>
      </div>
      <ProgressBar :value="donated / Math.max(1, artifacts.length)" color="var(--accent2)" />
      <div class="row small mt">
        <span v-for="m in MUSEUM_MILESTONES" :key="m.count" class="tag" :class="{ good: donated >= m.count }">{{ m.count }} 件：{{ fmt(m.reward.gp ?? 0) }} 金币<template v-if="m.pet"> + 宠物</template></span>
      </div>
      <div class="igrid mt">
        <div v-for="a in artifacts" :key="a.id" class="icell" :class="{ unknown: !s.archaeology.museum[a.id] }">
          <ItemIcon v-if="s.itemsFound[a.id]" :id="a.id" :size="44" :dim="!s.archaeology.museum[a.id]" />
          <div v-else class="qbox">?</div>
          <div class="tiny name">{{ s.itemsFound[a.id] ? a.name : '???' }}</div>
          <div class="tiny" :class="s.archaeology.museum[a.id] ? 'good' : 'muted'">{{ s.archaeology.museum[a.id] ? '已捐赠' : SIZE[a.artifact!.size] }}</div>
        </div>
      </div>
      <div v-if="!artifacts.length" class="empty">没有文物数据</div>
    </div>

    <!-- 完成度 -->
    <div v-else class="panel">
      <div class="row between"><h3>总完成度</h3><span class="bold gold">{{ pct(comp.total, 2) }}</span></div>
      <ProgressBar :value="comp.total / 100" color="var(--accent2)" :height="14" />
      <div class="small muted mt">总完成度为以下六项的平均值。</div>
      <div v-for="[label, v, detail] in compRows" :key="label" class="col mt" style="gap: 4px">
        <div class="row between"><span>{{ label }}</span><span>{{ detail }} <b>{{ pct(v, 2) }}</b></span></div>
        <ProgressBar :value="v / 100" :height="8" />
      </div>
      <div class="small muted mt">角色创建于 {{ fmtDate(s.player.createdAt) }}</div>
    </div>
  </div>
</template>

<style scoped>
.igrid { display: grid; gap: 8px; grid-template-columns: repeat(auto-fill, minmax(84px, 1fr)); }
.icell { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 6px 4px; border: 1px solid var(--border); border-radius: 8px; background: var(--bg2); min-width: 0; }
.icell.unknown { opacity: 0.6; }
.icell .name { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: center; }
.qbox { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border: 1px dashed var(--border); border-radius: 8px; color: var(--muted); font-size: 20px; }
.micon { font-size: 28px; width: 36px; text-align: center; }
.sil { filter: brightness(0) opacity(0.5); }
.pet { font-size: 28px; }
</style>
