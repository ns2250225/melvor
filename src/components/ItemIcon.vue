<script setup lang="ts">
import { computed } from 'vue';
import { C } from '@/content';
import { fmt } from '@/app/format';
import { useGameStore } from '@/stores/game';

const props = withDefaults(defineProps<{ id: string; qty?: number | null; size?: number; clickable?: boolean; dim?: boolean }>(), { qty: null, size: 40, clickable: true, dim: false });
const store = useGameStore();
const it = computed(() => C.items[props.id]);
const rarityColor = ['transparent', '#4c8dff', '#b05cff', '#f2a93b'];
const style = computed(() => ({
  width: `${props.size}px`, height: `${props.size}px`, fontSize: `${Math.round(props.size * 0.55)}px`,
  background: it.value?.color ? `linear-gradient(135deg, ${it.value.color}55, ${it.value.color}22)` : 'var(--panel2)',
  borderColor: it.value?.rarity ? rarityColor[it.value.rarity] : 'var(--border)',
}));
function open(e: MouseEvent) { if (props.clickable && it.value) { e.stopPropagation(); store.inspect = props.id; } }
</script>

<template>
  <div class="item-icon" :class="{ clickable, dim }" :style="style" :title="it ? `${it.name}${qty !== null ? ' ×' + qty : ''}` : id" @click="open">
    <span class="emoji">{{ it?.icon ?? '❓' }}</span>
    <span v-if="qty !== null" class="qty">{{ fmt(qty) }}</span>
  </div>
</template>

<style scoped>
.item-icon { position: relative; border: 1px solid var(--border); border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; user-select: none; }
.item-icon.clickable { cursor: pointer; }
.item-icon.clickable:hover { filter: brightness(1.15); }
.item-icon.dim { opacity: 0.4; }
.emoji { line-height: 1; }
.qty { position: absolute; right: 2px; bottom: 0; font-size: 11px; font-weight: 700; text-shadow: 0 0 3px #000, 0 0 2px #000; color: #fff; }
</style>
