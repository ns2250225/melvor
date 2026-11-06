<script setup lang="ts">
// 百科用物品图标框（与游戏内 ItemIcon 外观一致，但不依赖存档状态）
import { computed } from 'vue';
import { C } from './data';

const props = withDefaults(defineProps<{ id: string; size?: number }>(), { size: 40 });
const it = computed(() => C.items[props.id]);
const RC = ['var(--border)', '#4c8dff', '#b05cff', '#f2a93b'];
const style = computed(() => ({
  width: `${props.size}px`, height: `${props.size}px`,
  background: it.value?.color ? `linear-gradient(135deg, ${it.value.color}55, ${it.value.color}22)` : 'var(--panel2)',
  borderColor: RC[it.value?.rarity ?? 0],
}));
</script>

<template>
  <span class="witem" :style="style" :title="it?.name"><Icon :name="it?.icon ?? 'question'" :seed="id" :tint="it?.color" size="80%" /></span>
</template>

<style scoped>
.witem { display: inline-flex; align-items: center; justify-content: center; border: 1px solid; border-radius: 8px; flex-shrink: 0; vertical-align: middle; }
</style>
