<script setup lang="ts">
defineProps<{ title?: string; wide?: boolean }>();
const emit = defineEmits<{ close: [] }>();
</script>

<template>
  <Teleport to="body">
    <div class="backdrop" @click.self="emit('close')">
      <div class="modal" :class="{ wide }" role="dialog">
        <div class="head">
          <h3>{{ title }}</h3>
          <button class="ghost small" aria-label="关闭" @click="emit('close')">✕</button>
        </div>
        <div class="body"><slot /></div>
        <div v-if="$slots.footer" class="foot"><slot name="footer" /></div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.backdrop { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.55); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 16px; }
.modal { background: var(--panel); border: 1px solid var(--border); border-radius: 14px; width: min(520px, 100%); max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 10px 40px rgba(0,0,0,.4); }
.modal.wide { width: min(860px, 100%); }
.head { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid var(--border); }
.head h3 { margin: 0; }
.body { padding: 14px 16px; overflow: auto; }
.foot { padding: 10px 16px; border-top: 1px solid var(--border); display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap; }
</style>
