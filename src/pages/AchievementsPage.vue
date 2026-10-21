<script setup lang="ts">
// 成就：分类、进度、隐藏成就、完成时间与奖励
import { computed, ref } from 'vue';
import { C } from '@/content';
import { useGameStore } from '@/stores/game';
import { achievementProgress } from '@/game/achievements/achievements';
import { fmt, fmtDate } from '@/app/format';
import { describeObjective, rewardParts } from '@/game/ui/metaHelpers';
import ProgressBar from '@/components/ProgressBar.vue';
import ItemList from '@/components/ItemList.vue';

const store = useGameStore();
const g = computed(() => store.game!);
const all = Object.values(C.achievements);
const categories = ['全部', ...new Set(all.map((a) => a.category))];
const cat = ref('全部');
const show = ref<'all' | 'done' | 'todo'>('all');

const list = computed(() => {
  void store.frame;
  const done = g.value.state.achievements;
  return all
    .filter((a) => cat.value === '全部' || a.category === cat.value)
    .map((a) => {
      const t = done[a.id] || 0;
      const p = t ? null : achievementProgress(g.value, a);
      return { a, t, p, hidden: !!a.hidden && !t };
    })
    .filter((x) => show.value === 'all' || (show.value === 'done' ? x.t : !x.t));
});

const total = computed(() => {
  const done = g.value.state.achievements;
  return { done: all.filter((a) => done[a.id]).length, total: all.length };
});
function catCount(c: string) {
  const done = g.value.state.achievements;
  const l = c === '全部' ? all : all.filter((a) => a.category === c);
  return `${l.filter((a) => done[a.id]).length}/${l.length}`;
}
</script>

<template>
  <div>
    <div class="page-title"><span class="icon">🏆</span><h2>成就</h2><span class="muted">{{ total.done }} / {{ total.total }}</span></div>
    <ProgressBar class="mb" :value="total.done / Math.max(1, total.total)" color="var(--accent2)" :height="10" :label="`${((total.done / Math.max(1, total.total)) * 100).toFixed(1)}%`" />
    <div class="tabs">
      <button v-for="c in categories" :key="c" :class="{ on: cat === c }" @click="cat = c">{{ c }} <span class="tiny">{{ catCount(c) }}</span></button>
    </div>
    <div class="tabs">
      <button class="small" :class="{ on: show === 'all' }" @click="show = 'all'">全部</button>
      <button class="small" :class="{ on: show === 'todo' }" @click="show = 'todo'">未完成</button>
      <button class="small" :class="{ on: show === 'done' }" @click="show = 'done'">已完成</button>
    </div>

    <div v-if="!list.length" class="panel empty">没有成就</div>
    <div class="cards">
      <div v-for="x in list" :key="x.a.id" class="card" :class="{ active: !!x.t }">
        <div class="row nowrap">
          <span class="aicon" :class="{ dim: !x.t }">{{ x.hidden ? '❔' : x.a.icon }}</span>
          <div class="grow">
            <div class="bold">{{ x.hidden ? '???' : x.a.name }}</div>
            <div class="tiny muted">{{ x.a.category }}</div>
          </div>
          <span v-if="x.t" class="good">✓</span>
        </div>
        <div class="small muted">{{ x.hidden ? '隐藏成就：达成后揭晓' : x.a.description }}</div>
        <div v-if="!x.hidden && !x.t" class="tiny muted">{{ describeObjective(x.a.condition) }}</div>
        <template v-if="x.t">
          <div class="tiny good">完成于 {{ fmtDate(x.t) }}</div>
        </template>
        <template v-else-if="x.p && !x.hidden">
          <div class="row between tiny"><span>进度</span><span>{{ fmt(Math.min(x.p.cur, x.p.target)) }} / {{ fmt(x.p.target) }}</span></div>
          <ProgressBar :value="x.p.cur / Math.max(1, x.p.target)" :height="6" />
        </template>
        <template v-if="x.a.reward && !x.hidden">
          <div class="row tiny">
            <span v-for="(r, i) in rewardParts(x.a.reward)" :key="i" class="tag">{{ r }}</span>
          </div>
          <ItemList v-if="x.a.reward.items?.length" :items="x.a.reward.items" :size="26" />
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.aicon { font-size: 28px; width: 36px; text-align: center; }
.aicon.dim { filter: grayscale(1); opacity: 0.6; }
</style>
