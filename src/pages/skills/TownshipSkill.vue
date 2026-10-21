<script setup lang="ts">
// 城镇：概览、资源、土地与建筑、信仰、捐献与兑换、城镇任务
import { computed, ref } from 'vue';
import { C } from '@/content';
import { useGameStore } from '@/stores/game';
import type { TownshipBuildingDef } from '@/game/core/types';
import { BIOMES, DEITIES, SEASONS, TOWNSHIP_TASKS, TOWNSHIP_TICK_MS } from '@/content/recipes/support';
import { estimate, buyLand, landCost, biomeUsed, buildCheck, build, demolish, buildingCount, setDeity, donate, convert, completeTask } from '@/game/production/township';
import { describeMods } from '@/game/ui/skillHelpers';
import { fmt, full, fmtMs, pct } from '@/app/format';
import SkillHeader from '@/components/SkillHeader.vue';
import ItemIcon from '@/components/ItemIcon.vue';
import ItemList from '@/components/ItemList.vue';
import ProgressBar from '@/components/ProgressBar.vue';
import ConfirmButton from '@/components/ConfirmButton.vue';

const store = useGameStore();
const g = computed(() => store.game!);
const t = computed(() => g.value.state.township);

const est = computed(() => { void store.frame; return estimate(g.value); });
const season = computed(() => SEASONS[t.value.season % SEASONS.length]);
const hasBuildings = computed(() => Object.keys(t.value.buildings).length > 0);
const nextTick = computed(() => Math.max(0, TOWNSHIP_TICK_MS - t.value.tickTimer));
const resources = computed(() => Object.values(C.townshipResources));

const section = ref<'build' | 'deity' | 'trade' | 'tasks'>('build');
const biome = ref(BIOMES[0].id);
const biomeDef = computed(() => BIOMES.find((b) => b.id === biome.value)!);
const biomeBuildings = computed(() => Object.values(C.townshipBuildings).filter((b) => b.biomes.includes(biome.value)).sort((a, b) => a.level - b.level));
function countIn(bid: string) { return t.value.buildings[biome.value]?.[bid] || 0; }
function check(bid: string) { void store.frame; return buildCheck(g.value, biome.value, bid); }
function lc(id: string) { void store.frame; return landCost(g.value, id); }
function used(id: string) { return biomeUsed(g.value, id); }

const RES_STAT: Record<string, string> = { population: '人口', storage: '仓储', happiness: '幸福度', education: '教育', health: '健康', worship: '信仰', taxGp: '税收' };
function provides(b: TownshipBuildingDef): string[] {
  const out: string[] = [];
  for (const [k, v] of Object.entries(b.provides)) {
    if (k === 'production' || k === 'consumption') continue;
    if (typeof v === 'number' && v) out.push(`${RES_STAT[k] ?? k} ${v > 0 ? '+' : ''}${v}`);
  }
  for (const [r, v] of Object.entries(b.provides.production ?? {})) out.push(`产出 ${C.townshipResources[r]?.icon ?? ''}${C.townshipResources[r]?.name ?? r} +${v}`);
  for (const [r, v] of Object.entries(b.provides.consumption ?? {})) out.push(`消耗 ${C.townshipResources[r]?.icon ?? ''}${C.townshipResources[r]?.name ?? r} -${v}`);
  return out;
}
function costText(b: TownshipBuildingDef) {
  return Object.entries(b.cost).map(([r, v]) => ({ r, v: v ?? 0, have: r === 'gp' ? g.value.state.currencies.gp : t.value.resources[r] || 0, label: r === 'gp' ? '🪙 金币' : `${C.townshipResources[r]?.icon ?? ''} ${C.townshipResources[r]?.name ?? r}` }));
}

// 捐献 / 兑换
const donatable = computed(() => resources.value.flatMap((r) => (r.fromItems ?? []).map((id) => ({ res: r, id }))));
function donateQty(id: string, qty: number) { store.act(() => donate(g.value, id, qty)); }
function convertUnits(resId: string, units: number) { store.act(() => convert(g.value, resId, units)); }
</script>

<template>
  <div>
    <SkillHeader skill="township" />

    <div class="panel">
      <div class="row between">
        <h3>🏘️ 城镇概览</h3>
        <span class="tag">{{ season.icon }} {{ season.name }}</span>
      </div>
      <div class="stats">
        <div><span class="muted small">人口</span><b>{{ fmt(t.population) }} / {{ fmt(est.totals.population) }}</b></div>
        <div><span class="muted small">就业率</span><b>{{ pct(est.employment * 100) }}</b></div>
        <div><span class="muted small">幸福度</span><b>{{ fmt(t.happiness) }}</b></div>
        <div><span class="muted small">教育</span><b>{{ fmt(t.education) }}</b></div>
        <div><span class="muted small">健康</span><b>{{ fmt(t.health) }}</b></div>
        <div><span class="muted small">信仰</span><b>{{ fmt(t.worship) }}</b></div>
        <div><span class="muted small">仓储上限</span><b>{{ fmt(t.storage) }}</b></div>
        <div><span class="muted small">每次税收</span><b class="gold">🪙 {{ fmt(est.tax) }}</b></div>
      </div>
      <div class="mt">
        <div class="row between small">
          <span>下次城镇结算</span>
          <span class="muted">{{ hasBuildings ? fmtMs(nextTick) : '建造第一座建筑后开始结算' }}</span>
        </div>
        <ProgressBar :value="hasBuildings ? t.tickTimer / TOWNSHIP_TICK_MS : 0" color="var(--good)" :height="6" />
      </div>
    </div>

    <div class="panel">
      <h3>📦 资源</h3>
      <div class="scroll">
        <table>
          <thead><tr><th>资源</th><th>库存</th><th>每次结算</th></tr></thead>
          <tbody>
            <tr v-for="r in resources" :key="r.id">
              <td>{{ r.icon }} {{ r.name }}</td>
              <td>{{ fmt(t.resources[r.id] || 0) }} <span class="muted tiny">/ {{ fmt(t.storage) }}</span></td>
              <td :class="(est.net[r.id] || 0) > 0 ? 'good' : (est.net[r.id] || 0) < 0 ? 'bad' : 'muted'">{{ (est.net[r.id] || 0) > 0 ? '+' : '' }}{{ fmt(est.net[r.id] || 0) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="tabs mt">
      <button :class="{ on: section === 'build' }" @click="section = 'build'">🏗️ 土地与建筑</button>
      <button :class="{ on: section === 'deity' }" @click="section = 'deity'">⛩️ 信仰</button>
      <button :class="{ on: section === 'trade' }" @click="section = 'trade'">🔄 捐献与兑换</button>
      <button :class="{ on: section === 'tasks' }" @click="section = 'tasks'">📋 城镇任务</button>
    </div>

    <template v-if="section === 'build'">
      <div class="tabs">
        <button v-for="b in BIOMES" :key="b.id" :class="{ on: biome === b.id }" @click="biome = b.id">
          {{ b.icon }} {{ b.name }} <span class="tiny">{{ used(b.id) }}/{{ t.land[b.id] || 0 }}</span>
        </button>
      </div>
      <div class="panel">
        <div class="row between">
          <div>
            <b>{{ biomeDef.icon }} {{ biomeDef.name }}</b>
            <div class="small muted">已用土地 {{ used(biome) }} / 拥有 {{ t.land[biome] || 0 }}</div>
            <div v-if="g.level('township') < biomeDef.level" class="small bad">需要城镇 {{ biomeDef.level }} 级</div>
          </div>
          <button class="primary" :disabled="g.level('township') < biomeDef.level || g.state.currencies.gp < lc(biome)" @click="store.act(() => buyLand(g, biome))">购买土地（🪙 {{ full(lc(biome)) }}）</button>
        </div>
      </div>
      <div class="cards lg mt">
        <div v-for="b in biomeBuildings" :key="b.id" class="card" :class="{ locked: g.level('township') < b.level }">
          <div class="row between nowrap">
            <b>{{ b.icon }} {{ b.name }}</b>
            <span class="tiny muted">Lv {{ b.level }} · 本地 {{ countIn(b.id) }} · 总计 {{ buildingCount(g, b.id) }}/{{ b.maxCount }}</span>
          </div>
          <div class="row tiny">
            <span v-for="p in provides(b)" :key="p" class="tag">{{ p }}</span>
          </div>
          <div class="row tiny">
            <span class="muted">费用：</span>
            <span v-for="c in costText(b)" :key="c.r" :class="c.have >= c.v ? '' : 'bad'">{{ c.label }} {{ fmt(c.v) }}</span>
          </div>
          <div class="tiny muted">建造经验 {{ b.xp }}</div>
          <div v-if="check(b.id)" class="tiny bad">{{ check(b.id) }}</div>
          <div class="row">
            <button class="primary small grow" :disabled="!!check(b.id)" @click="store.act(() => build(g, biome, b.id))">建造</button>
            <ConfirmButton v-if="countIn(b.id) > 0" label="拆除" confirm-text="确认拆除？返还 50% 资源" small @confirm="store.act(() => demolish(g, biome, b.id))" />
          </div>
        </div>
      </div>
    </template>

    <div v-else-if="section === 'deity'" class="panel">
      <h3>⛩️ 信仰</h3>
      <div class="small muted mb">选择供奉的神明。神明的技能加成始终生效；当城镇信仰 ≥ 20 时，还会提升对应城镇资源产出。当前信仰 {{ t.worship }}。</div>
      <div class="cards">
        <div v-for="d in DEITIES" :key="d.id" class="card" :class="{ active: t.deity === d.id }">
          <b>{{ d.name }}</b>
          <div class="row tiny">
            <span v-for="m in describeMods(d.mods)" :key="m" class="tag">{{ m }}</span>
            <span v-for="(v, r) in d.town" :key="r" class="tag" :class="{ good: t.worship >= 20 }">城镇{{ C.townshipResources[r]?.name ?? r }} ×{{ v }}</span>
            <span v-if="d.id === 'none'" class="muted">无加成</span>
          </div>
          <span v-if="t.deity === d.id" class="tag good">当前信仰</span>
          <button v-else class="small primary" @click="store.act(() => setDeity(g, d.id))">供奉</button>
        </div>
      </div>
    </div>

    <template v-else-if="section === 'trade'">
      <div class="panel">
        <h3>📥 捐献物品</h3>
        <div class="small muted mb">将银行物品捐献给城镇，转换为对应的城镇资源（1:1，受仓储上限限制）。</div>
        <div class="cards sm">
          <div v-for="d in donatable" :key="d.id" class="card" :class="{ locked: g.qty(d.id) <= 0 }">
            <div class="row nowrap">
              <ItemIcon :id="d.id" :qty="g.qty(d.id)" :size="34" />
              <div class="small">
                <div>{{ C.items[d.id]?.name }}</div>
                <div class="muted tiny">→ {{ d.res.icon }} {{ d.res.name }}</div>
              </div>
            </div>
            <div class="row">
              <button class="small" :disabled="g.qty(d.id) <= 0" @click="donateQty(d.id, 100)">100</button>
              <button class="small primary" :disabled="g.qty(d.id) <= 0" @click="donateQty(d.id, g.qty(d.id))">全部</button>
            </div>
          </div>
        </div>
      </div>
      <div class="panel">
        <h3>📤 兑换资源</h3>
        <div class="small muted mb">将城镇资源兑换为银行物品。</div>
        <div class="cards sm">
          <template v-for="r in resources" :key="r.id">
            <div v-if="r.convertsTo && r.convertRatio" class="card">
              <div class="row nowrap">
                <span class="big">{{ r.icon }}</span>
                <div class="small">
                  <div>{{ r.name }} <span class="muted">（{{ fmt(t.resources[r.id] || 0) }}）</span></div>
                  <div class="muted tiny">{{ r.convertRatio }} → 1 {{ C.items[r.convertsTo]?.name }}</div>
                </div>
                <ItemIcon :id="r.convertsTo" :size="28" />
              </div>
              <div class="row">
                <button class="small" :disabled="(t.resources[r.id] || 0) < r.convertRatio" @click="convertUnits(r.id, r.convertRatio)">兑换 1 个</button>
                <button class="small primary" :disabled="(t.resources[r.id] || 0) < r.convertRatio" @click="convertUnits(r.id, t.resources[r.id] || 0)">全部兑换</button>
              </div>
            </div>
          </template>
        </div>
      </div>
    </template>

    <div v-else class="panel">
      <h3>📋 城镇任务</h3>
      <div class="col">
        <div v-for="task in TOWNSHIP_TASKS" :key="task.id" class="row between task">
          <div class="grow">
            <b>{{ task.name }}</b>
            <ItemList :items="task.requires" check :size="26" show-name />
            <div class="tiny muted">
              奖励：<span v-if="task.reward.gp">🪙 {{ full(task.reward.gp) }} </span>
              <span v-if="task.reward.xp">· 城镇经验 {{ full(task.reward.xp) }} </span>
              <span v-for="(v, r) in task.reward.resources ?? {}" :key="r">· {{ C.townshipResources[r]?.icon }}{{ C.townshipResources[r]?.name }} {{ v }} </span>
              <span v-for="i in task.reward.items ?? []" :key="i.id">· {{ C.items[i.id]?.name }} ×{{ i.qty }} </span>
            </div>
          </div>
          <span v-if="t.tasksCompleted.includes(task.id)" class="tag good">已完成</span>
          <button v-else class="primary small" :disabled="!g.hasItems(task.requires)" @click="store.act(() => completeTask(g, task.id))">提交</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 8px; }
.stats > div { display: flex; flex-direction: column; background: var(--panel2); border-radius: 8px; padding: 6px 10px; }
.big { font-size: 24px; }
.task { padding: 8px 0; border-bottom: 1px solid var(--border); flex-wrap: nowrap; }
</style>
