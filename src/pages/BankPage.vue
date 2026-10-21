<script setup lang="ts">
// 银行页面：容量、搜索、分类筛选、排序、物品网格（分页渲染）、批量出售与最近获得
import { computed, ref, watch } from 'vue';
import { C } from '@/content';
import { useGameStore } from '@/stores/game';
import type { Settings } from '@/game/core/state';
import { fmt, full } from '@/app/format';
import ItemIcon from '@/components/ItemIcon.vue';
import ConfirmButton from '@/components/ConfirmButton.vue';
import ProgressBar from '@/components/ProgressBar.vue';

const store = useGameStore();
const g = computed(() => store.game!);
const s = computed(() => g.value.state);

const PAGE = 300;
const search = ref('');
const category = ref('');
const limit = ref(PAGE);
const SORTS: { id: Settings['bankSort']; name: string }[] = [
  { id: 'default', name: '默认顺序' }, { id: 'name', name: '名称' }, { id: 'value', name: '总价值' }, { id: 'qty', name: '数量' }, { id: 'category', name: '分类' },
];
const sort = computed({
  get: () => s.value.settings.bankSort,
  set: (v: Settings['bankSort']) => { s.value.settings.bankSort = v; store.requestSave(); },
});

const ids = computed(() => Object.keys(s.value.bank).filter((id) => C.items[id]));
const categories = computed(() => [...new Set(ids.value.map((id) => C.items[id].category))].sort());
const orderIndex = computed(() => {
  const m: Record<string, number> = {};
  s.value.bankOrder.forEach((id, i) => { m[id] = i; });
  return m;
});
const price = (id: string) => { void store.frame; return g.value.sellPrice(id); };
const filtered = computed(() => {
  void store.frame;
  const q = search.value.trim().toLowerCase();
  const list = ids.value.filter((id) => {
    const it = C.items[id];
    if (category.value && it.category !== category.value) return false;
    if (q && !it.name.toLowerCase().includes(q) && !id.includes(q) && !(it.description ?? '').toLowerCase().includes(q)) return false;
    return true;
  });
  const bank = s.value.bank;
  const oi = orderIndex.value;
  const byName = (a: string, b: string) => C.items[a].name.localeCompare(C.items[b].name, 'zh-CN');
  switch (sort.value) {
    case 'name': list.sort(byName); break;
    case 'value': list.sort((a, b) => price(b) * bank[b] - price(a) * bank[a]); break;
    case 'qty': list.sort((a, b) => bank[b] - bank[a]); break;
    case 'category': list.sort((a, b) => C.items[a].category.localeCompare(C.items[b].category, 'zh-CN') || byName(a, b)); break;
    default: list.sort((a, b) => (oi[a] ?? 1e9) - (oi[b] ?? 1e9));
  }
  return list;
});
watch([search, category, sort], () => { limit.value = PAGE; });
const visible = computed(() => filtered.value.slice(0, limit.value));
const totalValue = computed(() => { void store.frame; return ids.value.reduce((a, id) => a + price(id) * s.value.bank[id], 0); });
const filteredValue = computed(() => filtered.value.reduce((a, id) => a + price(id) * s.value.bank[id], 0));
const used = computed(() => g.value.bankUsed());
const cap = computed(() => g.value.bankCapacity());

// ------------------------------------------------------------------ 批量出售
const selling = ref(false);
const picked = ref<Record<string, boolean>>({});
const sellable = (id: string) => !!C.items[id] && !C.items[id].noSell && !s.value.bankLocked[id];
const pickedIds = computed(() => Object.keys(picked.value).filter((id) => picked.value[id] && s.value.bank[id] !== undefined && sellable(id)));
const pickedValue = computed(() => pickedIds.value.reduce((a, id) => a + price(id) * (s.value.bank[id] || 0), 0));
function onTile(id: string, e: Event) {
  if (!selling.value) return;
  e.stopPropagation();
  if (!sellable(id)) { store.toast(s.value.bankLocked[id] ? '该物品已锁定' : '该物品不可出售', 'warning'); return; }
  picked.value[id] = !picked.value[id];
}
function toggleSelling() { selling.value = !selling.value; picked.value = {}; }
function pickAllVisible() { for (const id of visible.value) if (sellable(id)) picked.value[id] = true; }
function clearPicked() { picked.value = {}; }
function sellPicked() {
  const list = [...pickedIds.value];
  store.act(() => {
    let n = 0;
    for (const id of list) if (g.value.sellItem(id, g.value.qty(id))) n++;
    return n ? null : '没有可出售的物品';
  });
  picked.value = {};
}
const recent = computed(() => s.value.recent.items);
</script>

<template>
  <div>
    <div class="page-title">
      <span class="icon">🏦</span>
      <div class="grow">
        <h2>银行</h2>
        <div class="muted small">点击物品查看详情、出售、装备或使用</div>
      </div>
      <span class="tag gold">🪙 {{ fmt(s.currencies.gp) }}</span>
    </div>

    <div class="panel">
      <div class="row between">
        <div class="grow cap">
          <div class="row between small">
            <span>容量 <b :class="used >= cap ? 'bad' : ''">{{ used }} / {{ cap }}</b></span>
            <span class="muted">银行总价值 <span class="gold">{{ fmt(totalValue) }}</span> 金币</span>
          </div>
          <ProgressBar :value="cap ? used / cap : 0" :color="used >= cap ? 'var(--bad)' : 'var(--accent)'" :height="8" />
        </div>
        <button class="small" @click="store.go('shop')">🏦 银行扩容</button>
      </div>
      <div v-if="used >= cap" class="small bad mt">银行已满！新物品将无法入库（战利品会留在战利品栏）。</div>
    </div>

    <div v-if="recent.length" class="panel">
      <div class="small bold mb">最近获得</div>
      <div class="row"><ItemIcon v-for="(r, i) in recent" :key="i" :id="r.id" :qty="r.qty" :size="34" /></div>
    </div>

    <div class="panel">
      <div class="row filters">
        <input v-model="search" placeholder="搜索物品" class="grow" />
        <select v-model="category">
          <option value="">全部分类</option>
          <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
        </select>
        <select v-model="sort">
          <option v-for="o in SORTS" :key="o.id" :value="o.id">排序：{{ o.name }}</option>
        </select>
        <button :class="{ primary: selling }" @click="toggleSelling">{{ selling ? '退出批量出售' : '💰 批量出售' }}</button>
      </div>
      <div v-if="selling" class="sellbar row between mt">
        <span class="small">已选 <b>{{ pickedIds.length }}</b> 种 · 合计 <span class="gold">{{ fmt(pickedValue) }}</span> 金币 <span class="muted tiny">（出售全部数量，锁定物品不可选）</span></span>
        <div class="row">
          <button class="small" @click="pickAllVisible">选择当前显示</button>
          <button class="small" :disabled="!pickedIds.length" @click="clearPicked">清空</button>
          <ConfirmButton :label="`出售 ${pickedIds.length} 种`" :confirm-text="`确认出售获得 ${fmt(pickedValue)} 金币？`" small :disabled="!pickedIds.length" @confirm="sellPicked" />
        </div>
      </div>
      <div class="small muted mt">显示 {{ visible.length }} / {{ filtered.length }} 种物品 · 价值 {{ fmt(filteredValue) }} 金币</div>

      <div v-if="!filtered.length" class="empty">{{ ids.length ? '没有匹配的物品' : '银行是空的' }}</div>
      <div class="grid-items mt">
        <div v-for="id in visible" :key="id" class="tile" :class="{ picked: selling && picked[id], nosell: selling && !sellable(id) }" @click.capture="onTile(id, $event)">
          <ItemIcon :id="id" :qty="s.bank[id]" :size="48" :clickable="!selling" />
          <span v-if="s.bankLocked[id]" class="lock">🔒</span>
          <span v-if="selling && picked[id]" class="check">✔</span>
        </div>
      </div>
      <div v-if="filtered.length > limit" class="row mt" style="justify-content: center">
        <button @click="limit += PAGE">加载更多（剩余 {{ filtered.length - limit }}）</button>
        <button class="ghost" @click="limit = filtered.length">全部显示</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cap { min-width: 200px; }
.filters select { min-width: 120px; }
.sellbar { padding: 8px; border: 1px solid var(--warn); border-radius: 8px; }
.grid-items { display: grid; grid-template-columns: repeat(auto-fill, minmax(54px, 1fr)); gap: 6px; }
.tile { position: relative; display: flex; justify-content: center; padding: 2px; border-radius: 10px; border: 2px solid transparent; }
.tile.picked { border-color: var(--good); background: rgba(76, 195, 138, 0.15); }
.tile.nosell { opacity: 0.4; }
.lock { position: absolute; top: -2px; left: 2px; font-size: 12px; pointer-events: none; }
.check { position: absolute; top: -2px; right: 4px; font-size: 13px; color: var(--good); font-weight: 700; pointer-events: none; }
</style>
