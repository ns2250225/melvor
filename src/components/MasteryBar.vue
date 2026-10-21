<script setup lang="ts">
// 单个动作的掌握度显示，支持使用掌握度池经验升级
import { computed } from 'vue';
import { useGameStore } from '@/stores/game';
import { levelProgress, xpForLevel } from '@/game/core/xp';
import { C } from '@/content';
import ProgressBar from './ProgressBar.vue';

const props = defineProps<{ actionId: string }>();
const store = useGameStore();
const g = computed(() => store.game!);
const xp = computed(() => g.value.state.mastery[props.actionId] || 0);
const lvl = computed(() => g.value.masteryLevel(props.actionId));
const prog = computed(() => levelProgress(xp.value, lvl.value, 99));
const skill = computed(() => C.actions[props.actionId]?.skill);
const canSpend = computed(() => {
  if (!skill.value || lvl.value >= 99) return false;
  return g.value.state.skills[skill.value].masteryPoolXp >= xpForLevel(lvl.value + 1) - xp.value;
});
</script>

<template>
  <div v-if="skill && C.skills[skill].masteryEnabled && C.actions[actionId].masteryEnabled !== false" class="mastery">
    <div class="row between tiny">
      <span class="muted">掌握度 <b class="gold">{{ lvl }}</b></span>
      <button v-if="canSpend" class="small ghost" title="使用掌握度池经验提升 1 级" @click.stop="store.act(() => g.spendPoolXp(actionId, 1) ? null : '池经验不足')">＋1</button>
    </div>
    <ProgressBar :value="prog" color="var(--mastery)" :height="5" />
  </div>
</template>

<style scoped>
.mastery button { min-height: 18px; padding: 0 6px; }
</style>
