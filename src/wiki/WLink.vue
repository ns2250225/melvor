<script setup lang="ts">
// 百科内部链接：图标 + 名称，自动从内容注册表取名称与图标
import { computed } from 'vue';
import { C, href, type Kind } from './data';

const props = defineProps<{ kind: Kind; id: string; qty?: number | string; noIcon?: boolean }>();
const info = computed(() => {
  const id = props.id;
  switch (props.kind) {
    case 'skill': { const d = C.skills[id as keyof typeof C.skills]; return { name: d?.name, icon: d?.icon }; }
    case 'item': { const d = C.items[id]; return { name: d?.name, icon: d?.icon, tint: d?.color }; }
    case 'monster': return { name: C.monsters[id]?.name, icon: C.monsters[id]?.icon };
    case 'area': return { name: C.areas[id]?.name, icon: C.areas[id]?.icon };
    case 'dungeon': return { name: C.dungeons[id]?.name, icon: C.dungeons[id]?.icon };
    case 'spell': return { name: C.spells[id]?.name, icon: C.spells[id]?.icon };
    case 'prayer': return { name: C.prayers[id]?.name, icon: C.prayers[id]?.icon };
    case 'pet': return { name: C.pets[id]?.name, icon: C.pets[id]?.icon };
    case 'familiar': return { name: C.familiars[id]?.name, icon: C.familiars[id]?.icon };
    case 'quest': return { name: C.quests[id]?.name, icon: 'scroll' };
    default: return { name: id, icon: 'question' };
  }
});
const target = computed(() => (props.kind === 'familiar' ? href('skill', 'summoning') : href(props.kind, props.id)));
</script>

<template>
  <a class="wlink" :href="target"><Icon v-if="!noIcon" :name="info.icon ?? 'question'" :seed="id" :tint="info.tint" />{{ info.name ?? id }}<span v-if="qty !== undefined" class="q">×{{ qty }}</span></a>
</template>

<style scoped>
.wlink { display: inline-flex; align-items: center; gap: 4px; color: var(--text); text-decoration: none; border-bottom: 1px dashed transparent; }
.wlink:hover { color: var(--accent); border-bottom-color: var(--accent); }
.q { color: var(--muted); font-size: 12px; }
</style>
