<script setup lang="ts">
// 敏捷：障碍路线建造与运行
import { computed, ref } from 'vue';
import { C } from '@/content';
import { useGameStore } from '@/stores/game';
import type { ObstacleDef } from '@/game/core/types';
import { AGILITY_SLOTS, AGILITY_PILLAR_SLOT, ABYSSAL_AGILITY_SLOTS } from '@/content/recipes/support';
import { builtCourse, scaledInterval } from '@/game/production/actions';
import { buildObstacle, destroyObstacle, obstacleCost, slotUnlocked } from '@/game/production/special';
import { describeMods } from '@/game/ui/skillHelpers';
import { fmt, full, fmtSec } from '@/app/format';
import SkillHeader from '@/components/SkillHeader.vue';
import ItemList from '@/components/ItemList.vue';
import ProgressBar from '@/components/ProgressBar.vue';
import MasteryBar from '@/components/MasteryBar.vue';
import ConfirmButton from '@/components/ConfirmButton.vue';

const store = useGameStore();
const g = computed(() => store.game!);
const s = computed(() => g.value.state);

const slots = computed(() => [...AGILITY_SLOTS.map((_, i) => i), AGILITY_PILLAR_SLOT, ...ABYSSAL_AGILITY_SLOTS]);
function slotName(slot: number) {
  if (slot === AGILITY_PILLAR_SLOT) return '立柱';
  if (ABYSSAL_AGILITY_SLOTS.includes(slot)) return `深渊障碍 ${slot - 10}`;
  return `障碍 ${slot + 1}`;
}
function slotReq(slot: number) {
  if (slot === AGILITY_PILLAR_SLOT) return '需要敏捷 99 级';
  if (ABYSSAL_AGILITY_SLOTS.includes(slot)) return g.value.inAbyss() ? `需要敏捷深渊 ${(slot - 11) * 15 + 1} 级` : '需要开启深渊之门';
  return `需要敏捷 ${AGILITY_SLOTS[slot]} 级`;
}
function unlocked(slot: number) { void store.frame; return slotUnlocked(g.value, slot); }
function obstaclesFor(slot: number) { return Object.values(C.obstacles).filter((o) => o.slot === slot); }
function built(slot: number): ObstacleDef | null { const id = s.value.agility.built[slot]; return id ? C.obstacles[id] ?? null : null; }
function cost(o: ObstacleDef) { void store.frame; return obstacleCost(g.value, o.id); }
function obsLock(o: ObstacleDef): string | null {
  if (o.realm === 'abyssal' && !g.value.inAbyss()) return '需要开启深渊之门';
  if (g.value.level('agility') < o.level) return `需要敏捷 ${o.level} 级`;
  if (o.abyssalLevel && g.value.abyssalLevel('agility') < o.abyssalLevel) return `需要敏捷深渊 ${o.abyssalLevel} 级`;
  return null;
}
function canAfford(o: ObstacleDef) { const c = cost(o); return s.value.currencies.gp >= c.gp && g.value.hasItems(c.items); }
function obsInterval(o: ObstacleDef) { void store.frame; return o.interval ? scaledInterval(g.value, 'agility', o.interval) : 0; }

const open = ref<number | null>(null);
function toggle(slot: number) { open.value = open.value === slot ? null : slot; }

// 路线运行
const course = computed(() => { void s.value.agility.built; return builtCourse(g.value); });
const running = computed(() => s.value.activeAction?.skill === 'agility' ? s.value.activeAction : null);
const currentId = computed(() => (course.value.length ? course.value[s.value.agility.currentSlot % course.value.length] : null));
const courseTime = computed(() => { void store.frame; return course.value.reduce((t, id) => t + scaledInterval(g.value, 'agility', C.obstacles[id].interval), 0); });
const courseGp = computed(() => course.value.reduce((t, id) => t + C.obstacles[id].gp, 0));
const courseXp = computed(() => course.value.reduce((t, id) => t + C.obstacles[id].xp, 0));
function startCourse() { if (course.value[0]) store.act(() => g.value.startAction('agility', course.value[0]), { silent: true }); }
function stop() { store.act(() => { g.value.stopAction(); return null; }); }
</script>

<template>
  <div>
    <SkillHeader skill="agility" />

    <div class="panel">
      <div class="row between">
        <div>
          <h3>🏃 障碍路线</h3>
          <div class="small muted">共 {{ course.length }} 个障碍 · 一圈 {{ fmtSec(courseTime) }} · {{ fmt(courseXp) }} XP · 🪙 {{ fmt(courseGp) }}</div>
        </div>
        <button v-if="running" class="danger" @click="stop">停止</button>
        <button v-else class="primary" :disabled="!course.length" @click="startCourse">开始跑酷</button>
      </div>
      <div v-if="!course.length" class="muted small mt">尚未建造任何障碍。在下方选择障碍位建造障碍后即可开始。</div>
      <div v-else class="row mt course">
        <span v-for="(id, i) in course" :key="id" class="tag" :class="{ good: running && id === currentId }">{{ i + 1 }}. {{ C.obstacles[id].icon }} {{ C.obstacles[id].name }}</span>
      </div>
      <template v-if="running && currentId">
        <div class="row between small mt">
          <span>当前障碍：<b>{{ C.obstacles[currentId].icon }} {{ C.obstacles[currentId].name }}</b></span>
          <span class="muted">{{ fmtSec(running.interval) }}</span>
        </div>
        <ProgressBar :value="running.interval ? running.progress / running.interval : 0" :height="8" />
      </template>
      <div class="tiny muted mt">已建造障碍（包括立柱）的修饰符始终生效；更换或拆除障碍会中断当前跑酷。重复建造同一障碍可降低费用（每次 -4%，最多 -75%）。</div>
    </div>

    <div class="col mt">
      <div v-for="slot in slots" :key="slot" class="panel slot" :class="{ locked: !unlocked(slot) }">
        <div class="row between">
          <div>
            <b>{{ slotName(slot) }}</b>
            <span v-if="!unlocked(slot)" class="tag bad">🔒 {{ slotReq(slot) }}</span>
            <div v-if="built(slot)" class="small">
              {{ built(slot)!.icon }} {{ built(slot)!.name }}
              <span v-if="built(slot)!.interval" class="muted tiny">· {{ fmtSec(obsInterval(built(slot)!)) }} · {{ built(slot)!.xp }} XP · 🪙{{ built(slot)!.gp }}</span>
            </div>
            <div v-else class="small muted">空</div>
            <div v-if="built(slot)" class="row tiny">
              <span v-for="d in describeMods(built(slot)!.modifiers)" :key="d" class="tag">{{ d }}</span>
            </div>
          </div>
          <div class="row">
            <ConfirmButton v-if="built(slot)" label="拆除" confirm-text="确认拆除？" small @confirm="store.act(() => destroyObstacle(g, slot))" />
            <button class="small" :disabled="!unlocked(slot)" @click="toggle(slot)">{{ open === slot ? '收起' : built(slot) ? '更换' : '建造' }}</button>
          </div>
        </div>
        <MasteryBar v-if="built(slot) && built(slot)!.interval" :action-id="built(slot)!.id" />

        <div v-if="open === slot && unlocked(slot)" class="cards mt">
          <div v-for="o in obstaclesFor(slot)" :key="o.id" class="card" :class="{ active: built(slot)?.id === o.id, locked: !!obsLock(o) }">
            <div class="row between nowrap">
              <b>{{ o.icon }} {{ o.name }}</b>
              <span class="tiny muted">Lv {{ o.level }}<span v-if="o.abyssalLevel" class="abyss"> · 深渊 {{ o.abyssalLevel }}</span></span>
            </div>
            <div v-if="o.interval" class="tiny muted">{{ fmtSec(obsInterval(o)) }} · {{ o.xp }} XP · 🪙{{ o.gp }} · 已建造 {{ s.agility.buildCounts[o.id] || 0 }} 次</div>
            <div class="row tiny">
              <span v-for="d in describeMods(o.modifiers)" :key="d" class="tag">{{ d }}</span>
            </div>
            <div class="small muted">费用 <span :class="s.currencies.gp >= cost(o).gp ? 'gold' : 'bad'">🪙 {{ full(cost(o).gp) }}</span></div>
            <ItemList :items="cost(o).items" check :size="26" />
            <div v-if="obsLock(o)" class="bad tiny">🔒 {{ obsLock(o) }}</div>
            <span v-if="built(slot)?.id === o.id" class="tag good">已建造</span>
            <button v-else class="primary small" :disabled="!!obsLock(o) || !canAfford(o)" @click="store.act(() => buildObstacle(g, o.id))">建造</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.slot.locked { opacity: 0.6; }
.course { gap: 4px; }
.panel.slot { margin-top: 0; }
</style>
