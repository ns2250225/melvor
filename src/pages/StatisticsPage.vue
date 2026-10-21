<script setup lang="ts">
// 统计：综合统计、技能统计、怪物击杀与副本通关
import { computed } from 'vue';
import { C } from '@/content';
import { useGameStore } from '@/stores/game';
import type { SkillId } from '@/game/core/types';
import { full, fmtMs, fmtDate } from '@/app/format';
import { STAT_LABELS, SKILL_STAT_LABELS } from '@/game/ui/metaHelpers';

const store = useGameStore();
const g = computed(() => store.game!);
const s = computed(() => g.value.state);

const general = computed(() => {
  void store.frame;
  const st = s.value.stats;
  const keys = [...Object.keys(STAT_LABELS), ...Object.keys(st).filter((k) => !(k in STAT_LABELS)).sort()];
  return keys.map((k) => ({ k, label: STAT_LABELS[k] ?? k, v: st[k] || 0 }));
});

const skillCols = computed(() => {
  const set = new Set<string>();
  for (const v of Object.values(s.value.skillStats)) for (const k of Object.keys(v)) set.add(k);
  const known = Object.keys(SKILL_STAT_LABELS).filter((k) => set.has(k));
  return [...known, ...[...set].filter((k) => !(k in SKILL_STAT_LABELS)).sort()];
});
const skillRows = computed(() => {
  void store.frame;
  return C.skillOrder.filter((sid) => s.value.skillStats[sid]).map((sid) => ({ sid, st: s.value.skillStats[sid] }))
    .concat(Object.keys(s.value.skillStats).filter((k) => !C.skills[k as SkillId]).map((k) => ({ sid: k as SkillId, st: s.value.skillStats[k] })));
});
function cell(k: string, v: number | undefined) { if (!v) return '-'; return k === 'timeSpent' ? fmtMs(v) : full(v); }

const topKills = computed(() => {
  void store.frame;
  return Object.entries(s.value.monsterKills).sort((a, b) => b[1] - a[1]).slice(0, 20);
});
const totalKills = computed(() => Object.values(s.value.monsterKills).reduce((a, b) => a + b, 0));
const dungeons = computed(() => Object.entries(s.value.dungeonCompletions).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]));
</script>

<template>
  <div>
    <div class="page-title"><span class="icon">📊</span><h2>统计</h2></div>

    <div class="panel">
      <h3>综合</h3>
      <div class="kv">
        <span>游戏时长</span><span>{{ fmtMs(s.playTime) }}</span>
        <span>角色创建</span><span>{{ fmtDate(s.player.createdAt) }}</span>
        <span>总等级</span><span>{{ full(g.totalLevel()) }}</span>
        <span>完成任务 / 成就</span><span>{{ Object.values(s.quests).filter((q) => q.status === 'completed').length }} / {{ Object.keys(s.achievements).length }}</span>
        <span>宠物</span><span>{{ Object.keys(s.pets).length }}</span>
        <span>累计击杀</span><span>{{ full(totalKills) }}</span>
      </div>
      <div class="sep" />
      <div class="stat-grid">
        <div v-for="x in general" :key="x.k" class="row between stat">
          <span class="muted small">{{ x.label }}</span><span class="bold">{{ full(x.v) }}</span>
        </div>
      </div>
    </div>

    <div class="panel">
      <h3>技能统计</h3>
      <div v-if="!skillRows.length" class="empty">暂无技能统计</div>
      <div v-else class="scroll">
        <table>
          <thead><tr><th>技能</th><th v-for="c in skillCols" :key="c" class="right">{{ SKILL_STAT_LABELS[c] ?? c }}</th></tr></thead>
          <tbody>
            <tr v-for="r in skillRows" :key="r.sid">
              <td style="white-space: nowrap">{{ C.skills[r.sid]?.icon }} {{ C.skills[r.sid]?.name ?? r.sid }}</td>
              <td v-for="c in skillCols" :key="c" class="right">{{ cell(c, r.st[c]) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="cards lg mt">
      <div class="card">
        <h3>击杀排行（前 20）</h3>
        <div v-if="!topKills.length" class="empty small">暂无</div>
        <table v-else>
          <tbody>
            <tr v-for="[id, n] in topKills" :key="id">
              <td>{{ C.monsters[id]?.icon }} {{ C.monsters[id]?.name ?? id }}</td><td class="right">{{ full(n) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="card">
        <h3>副本通关</h3>
        <div v-if="!dungeons.length" class="empty small">暂无</div>
        <table v-else>
          <tbody>
            <tr v-for="[id, n] in dungeons" :key="id">
              <td>{{ C.dungeons[id]?.icon }} {{ C.dungeons[id]?.name ?? id }}</td><td class="right">{{ full(n) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 4px 16px; }
.stat { border-bottom: 1px dashed var(--border); padding: 2px 0; }
</style>
