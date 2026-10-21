<script setup lang="ts">
// 危险操作二次确认按钮
import { ref } from 'vue';
const props = withDefaults(defineProps<{ label: string; confirmText?: string; danger?: boolean; small?: boolean; disabled?: boolean }>(), { confirmText: '确认执行？', danger: true, small: false, disabled: false });
const emit = defineEmits<{ confirm: [] }>();
const asking = ref(false);
let timer: ReturnType<typeof setTimeout> | null = null;
function click() {
  if (!asking.value) { asking.value = true; timer = setTimeout(() => (asking.value = false), 4000); return; }
  if (timer) clearTimeout(timer);
  asking.value = false;
  emit('confirm');
}
void props;
</script>

<template>
  <button :class="[{ danger: danger && asking, small }]" :disabled="disabled" @click="click">{{ asking ? confirmText : label }}</button>
</template>
