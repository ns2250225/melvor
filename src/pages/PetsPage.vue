<script setup lang="ts">
// 宠物收藏
import { computed, ref } from 'vue';
import { C } from '@/content';
import { useGameStore } from '@/stores/game';
import { fmtDate, pct } from '@/app/format';
import { EXPANSION_NAMES } from '@/content/registry';
import ProgressBar from '@/components/ProgressBar.vue';

const store = useGameStore();
const g = computed(() => store.game!);
const all = Object.values(C.pets);
const filter = ref<'all' | 'owned' | 'missing'>('all');
const TYPE: Record<string, string> = { skill: '技能', dungeon: '副本', monster: '怪物', special: '特殊' };

const owned = computed(() => all.filter((p) => g.value.state.pets[p.id]).length);
const list = computed(() => all
  .map((p) => ({ p, t: g.value.state.pets[p.id] || 0 }))
  .filter((x) => filter.value === 'all' || (filter.value === 'owned' ? x.t : !x.t)));

function sourceLink(sourceType: string, sourceId?: string) {
  if (!sourceId) return '';
  if (sourceType === 'skill') return C.skills[sourceId as keyof typeof C.skills]?.name ?? '';
  if (sourceType === 'dungeon') return C.dungeons[sourceId]?.name ?? '';
  if (sourceType === 'monster') return C.monsters[sourceId]?.name ?? '';
  return '';
}
</script>

<template>
  <div>
    <div class="page-title"><span class="icon">🐾</span><h2>宠物</h2><span class="muted">{{ owned }} / {{ all.length }}（{{ pct((owned / Math.max(1, all.length)) * 100) }}）</span></div>
    <ProgressBar class="mb" :value="owned / Math.max(1, all.length)" color="var(--good)" :height="10" />
    <p class="small muted">宠物在对应活动中随机获得，获得后其加成永久生效，无需装备。</p>
    <div class="tabs">
      <button :class="{ on: filter === 'all' }" @click="filter = 'all'">全部</button>
      <button :class="{ on: filter === 'owned' }" @click="filter = 'owned'">已获得（{{ owned }}）</button>
      <button :class="{ on: filter === 'missing' }" @click="filter = 'missing'">未获得（{{ all.length - owned }}）</button>
    </div>
    <div v-if="!list.length" class="panel empty">没有宠物</div>
    <div class="cards">
      <div v-for="x in list" :key="x.p.id" class="card" :class="{ active: !!x.t }">
        <div class="row nowrap">
          <span class="picon" :class="{ dim: !x.t }">{{ x.p.icon }}</span>
          <div class="grow">
            <div class="bold">{{ x.t ? x.p.name : '未知宠物' }}</div>
            <div class="tiny muted">{{ TYPE[x.p.sourceType] ?? x.p.sourceType }}<template v-if="sourceLink(x.p.sourceType, x.p.sourceId)"> · {{ sourceLink(x.p.sourceType, x.p.sourceId) }}</template></div>
          </div>
        </div>
        <div class="small"><span class="muted">来源：</span>{{ x.p.source }}</div>
        <div class="small"><span class="muted">效果：</span><span :class="{ good: !!x.t }">{{ x.p.description }}</span></div>
        <div v-if="x.p.expansion !== 'base'" class="tiny abyss">{{ EXPANSION_NAMES[x.p.expansion] }}</div>
        <div v-if="x.t" class="tiny good">获得于 {{ fmtDate(x.t) }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.picon { font-size: 30px; width: 40px; text-align: center; }
.picon.dim { filter: grayscale(1) brightness(0.3); }
</style>
