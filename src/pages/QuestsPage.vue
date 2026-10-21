<script setup lang="ts">
// 任务：按章节分组、状态筛选、目标进度、接受与领奖
import { computed, ref } from 'vue';
import { C } from '@/content';
import { useGameStore } from '@/stores/game';
import { questStatus, startQuest, questProgress, canCompleteQuest, completeQuest, type QuestStatus } from '@/game/quests/quests';
import { fmt } from '@/app/format';
import { describeObjective, rewardParts, QUEST_STATUS_LABELS } from '@/game/ui/metaHelpers';
import ProgressBar from '@/components/ProgressBar.vue';
import Requirements from '@/components/Requirements.vue';
import ItemList from '@/components/ItemList.vue';
import { EXPANSION_NAMES } from '@/content/registry';

const store = useGameStore();
const g = computed(() => store.game!);
type Filter = 'all' | QuestStatus;
const filter = ref<Filter>('all');
const FILTERS: [Filter, string][] = [['all', '全部'], ['available', '可接受'], ['active', '进行中'], ['completed', '已完成'], ['locked', '未解锁']];

const quests = computed(() => {
  void store.frame;
  return Object.values(C.quests).map((q) => {
    const status = questStatus(g.value, q.id);
    return { q, status, prog: questProgress(g.value, q.id), canComplete: status === 'active' && canCompleteQuest(g.value, q.id) };
  });
});

const counts = computed(() => {
  const c: Record<string, number> = { all: quests.value.length, locked: 0, available: 0, active: 0, completed: 0 };
  for (const x of quests.value) c[x.status]++;
  return c;
});

const chapters = computed(() => {
  const map = new Map<string, typeof quests.value>();
  for (const x of quests.value) {
    if (filter.value !== 'all' && x.status !== filter.value) continue;
    if (!map.has(x.q.chapter)) map.set(x.q.chapter, []);
    map.get(x.q.chapter)!.push(x);
  }
  return [...map.entries()].map(([name, list]) => ({ name, list, done: quests.value.filter((x) => x.q.chapter === name && x.status === 'completed').length, total: quests.value.filter((x) => x.q.chapter === name).length }));
});

const STATUS_CLASS: Record<QuestStatus, string> = { locked: 'bad', available: '', active: 'abyss', completed: 'good' };
function prereqDone(id: string) { return g.value.state.quests[id]?.status === 'completed'; }
</script>

<template>
  <div>
    <div class="page-title"><span class="icon">📜</span><h2>任务</h2><span class="muted">已完成 {{ counts.completed }} / {{ counts.all }}</span></div>
    <ProgressBar class="mb" :value="counts.completed / Math.max(1, counts.all)" color="var(--good)" :height="8" />
    <div class="tabs">
      <button v-for="[f, label] in FILTERS" :key="f" :class="{ on: filter === f }" @click="filter = f">{{ label }}（{{ counts[f] }}）</button>
    </div>

    <div v-if="!chapters.length" class="panel empty">没有符合条件的任务</div>
    <div v-for="ch in chapters" :key="ch.name" class="panel">
      <div class="row between mb"><h3>{{ ch.name }}</h3><span class="small muted">{{ ch.done }} / {{ ch.total }}</span></div>
      <div class="cards lg">
        <div v-for="x in ch.list" :key="x.q.id" class="card" :class="{ locked: x.status === 'locked', active: x.status === 'active' }">
          <div class="row between">
            <span class="bold">{{ x.q.name }}</span>
            <span class="tag" :class="STATUS_CLASS[x.status]">{{ QUEST_STATUS_LABELS[x.status] }}</span>
          </div>
          <div class="small muted">{{ x.q.description }}</div>
          <div v-if="x.q.expansion !== 'base'" class="tiny abyss">{{ EXPANSION_NAMES[x.q.expansion] }}</div>

          <div v-if="x.q.prerequisites.length" class="row small">
            <span class="muted">前置任务：</span>
            <span v-for="p in x.q.prerequisites" :key="p" class="tag" :class="prereqDone(p) ? 'good' : 'bad'">{{ C.quests[p]?.name ?? p }}</span>
          </div>
          <div v-if="x.q.requirements.length" class="row small"><span class="muted">需求：</span><Requirements :reqs="x.q.requirements" /></div>

          <div class="col" style="gap: 4px">
            <div class="small muted">目标</div>
            <div v-for="(o, i) in x.q.objectives" :key="i" class="col" style="gap: 2px">
              <div class="row between small">
                <span>{{ describeObjective(o) }}</span>
                <span v-if="x.status !== 'completed'" :class="{ good: x.prog[i].cur >= x.prog[i].target }">{{ fmt(Math.min(x.prog[i].cur, x.prog[i].target)) }} / {{ fmt(x.prog[i].target) }}</span>
                <span v-else class="good">✓</span>
              </div>
              <ProgressBar v-if="x.status === 'active'" :value="x.prog[i].cur / Math.max(1, x.prog[i].target)" :color="x.prog[i].cur >= x.prog[i].target ? 'var(--good)' : 'var(--accent)'" :height="6" />
            </div>
          </div>

          <div class="col" style="gap: 4px">
            <div class="small muted">奖励</div>
            <div class="row small">
              <span v-for="(r, i) in rewardParts(x.q.rewards)" :key="i" class="tag">{{ r }}</span>
            </div>
            <ItemList v-if="x.q.rewards.items?.length" :items="x.q.rewards.items" :size="28" />
          </div>

          <div class="row">
            <button v-if="x.status === 'available'" class="primary" @click="store.act(() => startQuest(g, x.q.id))">接受任务</button>
            <button v-if="x.status === 'active'" class="good" :disabled="!x.canComplete" @click="store.act(() => completeQuest(g, x.q.id))">完成并领取奖励</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
