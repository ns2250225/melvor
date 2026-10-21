<script setup lang="ts">
// 冒险模式：用金币解锁技能
import { computed } from 'vue';
import type { SkillId } from '@/game/core/types';
import { C } from '@/content';
import { useGameStore } from '@/stores/game';
import { adventureUnlockCost } from '@/content/skills';
import { unlockSkill } from '@/game/inventory/shop';
import { full } from '@/app/format';

const props = defineProps<{ skill: SkillId }>();
const store = useGameStore();
const g = computed(() => store.game!);
const def = computed(() => C.skills[props.skill]);
const unlockedCount = computed(() => C.skillOrder.filter((x) => g.value.state.skills[x].unlocked).length);
const cost = computed(() => adventureUnlockCost(unlockedCount.value));
const affordable = computed(() => g.value.state.currencies.gp >= cost.value);
</script>

<template>
  <div class="panel locked-skill">
    <div class="page-title">
      <span class="icon">{{ def.icon }}</span>
      <div>
        <h2>{{ def.name }} <span class="tag">🔒 未解锁</span></h2>
        <div class="muted small">{{ def.description }}</div>
      </div>
    </div>
    <p>冒险模式下，技能需要使用金币逐个解锁。每解锁一个技能，下一个技能的价格都会提高。</p>
    <div class="kv mb">
      <span>已解锁技能</span><span>{{ unlockedCount }} / {{ C.skillOrder.length }}</span>
      <span>解锁价格</span><span class="gold">🪙 {{ full(cost) }}</span>
      <span>当前金币</span><span :class="affordable ? 'good' : 'bad'">🪙 {{ full(g.state.currencies.gp) }}</span>
    </div>
    <button class="primary" :disabled="!affordable" @click="store.act(() => unlockSkill(g, skill))">解锁{{ def.name }}</button>
  </div>
</template>
