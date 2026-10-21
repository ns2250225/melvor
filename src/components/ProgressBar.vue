<script setup lang="ts">
withDefaults(defineProps<{ value: number; color?: string; height?: number; label?: string; striped?: boolean }>(), { color: 'var(--accent)', height: 8, label: '', striped: false });
</script>

<template>
  <div class="pbar" :style="{ height: `${height}px` }">
    <div class="fill" :class="{ striped }" :style="{ width: `${Math.max(0, Math.min(1, value || 0)) * 100}%`, background: color }" />
    <span v-if="label" class="label">{{ label }}</span>
  </div>
</template>

<style scoped>
.pbar { position: relative; width: 100%; background: var(--bg2); border-radius: 999px; overflow: hidden; border: 1px solid var(--border); }
.fill { height: 100%; border-radius: 999px; transition: width 0.1s linear; }
.fill.striped { background-image: linear-gradient(45deg, rgba(255,255,255,.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.15) 50%, rgba(255,255,255,.15) 75%, transparent 75%) !important; background-size: 16px 16px; }
.label { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; text-shadow: 0 0 3px rgba(0,0,0,.8); color: #fff; }
</style>
