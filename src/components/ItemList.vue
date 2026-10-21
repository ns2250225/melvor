<script setup lang="ts">
// 物品数量列表（材料 / 产出预览），自动标红不足项
import ItemIcon from './ItemIcon.vue';
import type { ItemQty } from '@/game/core/types';
import { C } from '@/content';
import { useGame } from '@/stores/game';
const props = withDefaults(defineProps<{ items: ItemQty[]; check?: boolean; size?: number; showName?: boolean }>(), { check: false, size: 30, showName: false });
const { g } = useGame();
void props;
</script>

<template>
  <div class="row il">
    <div v-for="i in items" :key="i.id" class="row nowrap entry" :class="{ lack: check && g.qty(i.id) < i.qty }">
      <ItemIcon :id="i.id" :size="size" />
      <span class="small">
        <template v-if="showName">{{ C.items[i.id]?.name }} </template>×{{ i.qty }}
        <span v-if="check" class="muted tiny">（{{ g.qty(i.id) }}）</span>
      </span>
    </div>
  </div>
</template>

<style scoped>
.il { gap: 10px; }
.entry { gap: 4px; }
.lack span { color: var(--bad); }
</style>
