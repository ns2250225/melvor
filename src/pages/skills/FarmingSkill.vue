<script setup lang="ts">
// 农业：地块解锁、种植、施肥、成长与收获
import { computed, ref } from 'vue';
import { C } from '@/content';
import { useGameStore } from '@/stores/game';
import { FARMING_PLOTS } from '@/content/recipes/support';
import { plotStatus, unlockPlot, plant, harvest, applyCompost, harvestAndReplantAll, growTime } from '@/game/production/farming';
import type { FarmingCropDef } from '@/game/core/types';
import { fmtMs, full, pct } from '@/app/format';
import SkillHeader from '@/components/SkillHeader.vue';
import ItemIcon from '@/components/ItemIcon.vue';
import ProgressBar from '@/components/ProgressBar.vue';
import MasteryBar from '@/components/MasteryBar.vue';
import Modal from '@/components/Modal.vue';

const store = useGameStore();
const g = computed(() => store.game!);
const s = computed(() => g.value.state);

const TYPES = [
  { id: 'allotment' as const, name: '菜地', icon: '🌱' },
  { id: 'herb' as const, name: '草药地', icon: '🌿' },
  { id: 'tree' as const, name: '果树地', icon: '🌳' },
];
const tab = ref<'allotment' | 'herb' | 'tree'>('allotment');
const plots = computed(() => FARMING_PLOTS.filter((p) => p.type === tab.value));
function plotState(id: string) { return s.value.farming.plots.find((p) => p.id === id); }
function status(id: string) { void store.frame; return plotStatus(g.value, id); }
const readyCount = computed(() => { void store.frame; return s.value.farming.plots.filter((p) => p.cropId && plotStatus(g.value, p.id).state === 'ready').length; });

function cropOf(id: string): FarmingCropDef | null { const p = plotState(id); return p?.cropId ? C.crops[p.cropId] : null; }
function harvestChance(id: string) {
  const p = plotState(id);
  if (!p?.cropId) return 0;
  if (p.gloop) return 100;
  return Math.min(100, 50 + p.compost * 20 + g.value.masteryLevel(p.cropId) / 2);
}

// 种植选择
const choosing = ref<string | null>(null);
const choosingType = computed(() => (choosing.value ? FARMING_PLOTS.find((p) => p.id === choosing.value)?.type : null));
const cropOptions = computed(() => Object.values(C.crops).filter((c) => c.plotType === choosingType.value).sort((a, b) => a.level - b.level));
function cropLock(c: FarmingCropDef): string | null { return g.value.actionUnlocked(c.id); }
function doPlant(c: FarmingCropDef) {
  const plotId = choosing.value;
  if (!plotId) return;
  if (store.act(() => plant(g.value, plotId, c.id))) choosing.value = null;
}
function gt(c: FarmingCropDef) { void store.frame; return growTime(g.value, c.id); }
</script>

<template>
  <div>
    <SkillHeader skill="farming" />
    <div class="panel">
      <div class="row between">
        <div class="small muted">
          作物会随游戏时间（包括离线）成长。堆肥每份 +20% 收获成功率（最多 3 份），奇异粘液保证收获并使产量翻倍。
        </div>
        <button class="primary" :disabled="!readyCount" @click="store.act(() => { harvestAndReplantAll(g); return null; })">🌾 收获全部并补种（{{ readyCount }}）</button>
      </div>
      <div class="row small mt">
        <span class="row nowrap"><ItemIcon id="compost" :size="22" /> 堆肥 {{ full(g.qty('compost')) }}</span>
        <span class="row nowrap"><ItemIcon id="weird_gloop" :size="22" /> 奇异粘液 {{ full(g.qty('weird_gloop')) }}</span>
      </div>
    </div>

    <div class="tabs mt">
      <button v-for="t in TYPES" :key="t.id" :class="{ on: tab === t.id }" @click="tab = t.id">{{ t.icon }} {{ t.name }}</button>
    </div>

    <div class="cards">
      <div v-for="(def, i) in plots" :key="def.id" class="card" :class="{ locked: status(def.id).state === 'locked', active: status(def.id).state === 'ready' }">
        <div class="row between">
          <b>{{ TYPES.find((t) => t.id === def.type)?.name }} #{{ i + 1 }}</b>
          <span class="tag" :class="{ good: status(def.id).state === 'ready' }">
            {{ { locked: '🔒 未解锁', empty: '空闲', growing: '成长中', ready: '可收获' }[status(def.id).state] }}
          </span>
        </div>

        <template v-if="status(def.id).state === 'locked'">
          <div class="small">需要农业 <b :class="g.level('farming') >= def.level ? 'good' : 'bad'">{{ def.level }}</b> 级</div>
          <div class="small">解锁费用 <span class="gold">🪙 {{ full(def.cost) }}</span></div>
          <button class="primary small" :disabled="g.level('farming') < def.level || s.currencies.gp < def.cost" @click="store.act(() => unlockPlot(g, def.id))">解锁地块</button>
        </template>

        <template v-else-if="status(def.id).state === 'empty'">
          <div class="muted small">地块空闲，选择种子进行种植。</div>
          <button class="primary small" @click="choosing = def.id">🌱 种植</button>
        </template>

        <template v-else-if="cropOf(def.id)">
          <div class="row nowrap">
            <ItemIcon :id="cropOf(def.id)!.produce" :size="36" />
            <div>
              <div>{{ C.items[cropOf(def.id)!.produce]?.name }}</div>
              <div class="tiny muted">收获成功率 {{ pct(harvestChance(def.id)) }}</div>
            </div>
          </div>
          <template v-if="status(def.id).state === 'growing'">
            <ProgressBar :value="status(def.id).progress" color="var(--good)" :height="8" />
            <div class="tiny muted">剩余 {{ fmtMs(status(def.id).remaining) }}</div>
          </template>
          <button v-else class="good small" @click="store.act(() => harvest(g, def.id))">🌾 收获</button>
          <MasteryBar :action-id="cropOf(def.id)!.id" />
        </template>

        <div v-if="status(def.id).state !== 'locked'" class="row tiny">
          <span class="muted">堆肥 {{ plotState(def.id)?.compost ?? 0 }}/3</span>
          <span v-if="plotState(def.id)?.gloop" class="tag good">已施粘液</span>
        </div>
        <div v-if="status(def.id).state === 'empty' || status(def.id).state === 'growing'" class="row">
          <button class="small" :disabled="(plotState(def.id)?.compost ?? 0) >= 3 || g.qty('compost') <= 0" @click="store.act(() => applyCompost(g, def.id, false))">施堆肥</button>
          <button class="small" :disabled="!!plotState(def.id)?.gloop || g.qty('weird_gloop') <= 0" @click="store.act(() => applyCompost(g, def.id, true))">施奇异粘液</button>
        </div>
      </div>
    </div>

    <Modal v-if="choosing" title="选择作物" @close="choosing = null">
      <div v-if="!cropOptions.length" class="empty">没有可种植的作物</div>
      <div v-for="c in cropOptions" :key="c.id" class="row between crop-row" :class="{ dim: !!cropLock(c) }">
        <div class="row nowrap grow">
          <ItemIcon :id="c.seed" :qty="g.qty(c.seed)" :size="36" />
          <div class="grow">
            <div>{{ C.items[c.produce]?.name }}</div>
            <div class="tiny muted">
              Lv {{ c.level }} · 每次 {{ c.seedQty }} 粒种子（持有 {{ full(g.qty(c.seed)) }}） · 成长 {{ fmtMs(gt(c)) }} · {{ c.xp }} XP
            </div>
            <div v-if="cropLock(c)" class="tiny bad">{{ cropLock(c) }}</div>
          </div>
        </div>
        <button class="primary small" :disabled="!!cropLock(c) || g.qty(c.seed) < c.seedQty" @click="doPlant(c)">种植</button>
      </div>
    </Modal>
  </div>
</template>

<style scoped>
.crop-row { padding: 8px 0; border-bottom: 1px solid var(--border); flex-wrap: nowrap; }
.dim { opacity: 0.55; }
</style>
