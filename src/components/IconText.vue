<script setup lang="ts">
// 渲染内嵌图标标记的文本：「[[coin]] 100 金币」中的 [[名称]] 会被替换为程序化图标。
import { computed } from 'vue';

const props = defineProps<{ text: string | null | undefined }>();
const parts = computed(() => {
  const out: { icon?: string; text?: string }[] = [];
  const re = /\[\[([a-z0-9_]+)\]\]/g;
  const s = props.text ?? '';
  let last = 0;
  for (let m = re.exec(s); m; m = re.exec(s)) {
    if (m.index > last) out.push({ text: s.slice(last, m.index) });
    out.push({ icon: m[1] });
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push({ text: s.slice(last) });
  return out;
});
</script>

<template>
  <span class="itext"><template v-for="(p, i) in parts" :key="i"><Icon v-if="p.icon" :name="p.icon" /><template v-else>{{ p.text }}</template></template></span>
</template>
