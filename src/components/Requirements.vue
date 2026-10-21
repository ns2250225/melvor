<script setup lang="ts">
import type { Requirement } from '@/game/core/types';
import { useGame } from '@/stores/game';
defineProps<{ reqs?: Requirement[] }>();
const { g } = useGame();
</script>

<template>
  <div v-if="reqs?.length" class="row small">
    <span v-for="(r, i) in reqs" :key="i" class="tag" :class="g.meets(r) ? 'good' : 'bad'">{{ g.describeReq(r) }}</span>
  </div>
</template>
