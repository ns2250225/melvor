<script setup lang="ts">
import { useGameStore } from '@/stores/game';
const store = useGameStore();
</script>

<template>
  <div class="toasts">
    <TransitionGroup name="t">
      <div v-for="t in store.toasts" :key="t.id" class="toast" :class="t.kind" @click="store.toasts = store.toasts.filter((x) => x.id !== t.id)">
        <span v-if="t.icon">{{ t.icon }}</span>{{ t.text }}
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toasts { position: fixed; right: 16px; bottom: 16px; display: flex; flex-direction: column; gap: 6px; z-index: 200; max-width: min(360px, calc(100vw - 32px)); }
.toast { background: var(--panel); border: 1px solid var(--border); border-left: 4px solid var(--accent); padding: 8px 12px; border-radius: 8px; box-shadow: var(--shadow); font-size: 13px; display: flex; gap: 6px; cursor: pointer; }
.toast.success { border-left-color: var(--good); }
.toast.error { border-left-color: var(--bad); }
.toast.warning { border-left-color: var(--warn); }
.toast.level { border-left-color: var(--accent2); }
.t-enter-active, .t-leave-active { transition: all 0.2s; }
.t-enter-from, .t-leave-to { opacity: 0; transform: translateX(20px); }
</style>
