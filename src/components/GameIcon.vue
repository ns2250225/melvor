<script setup lang="ts">
// 程序化图标组件：<Icon name="sword" /> 或 <Icon :name="item.icon" :seed="item.id" :tint="item.color" />
// size 默认为 1.25em，随文字大小缩放；传入数字时按像素计算。
import { computed } from 'vue';
import { iconSvg } from '@/app/icons';

const props = withDefaults(defineProps<{ name?: string | null; seed?: string; tint?: string; size?: number | string }>(), { name: '', seed: '', tint: undefined, size: undefined });
const svg = computed(() => (props.name ? iconSvg(props.name, props.seed, props.tint) : ''));
const style = computed(() => {
  if (props.size === undefined) return undefined;
  const v = typeof props.size === 'number' || /^\d+(\.\d+)?$/.test(props.size) ? `${props.size}px` : props.size;
  return { width: v, height: v };
});
</script>

<template>
  <span v-if="name" class="gicon" :style="style" v-html="svg" />
</template>

<style>
.gicon { display: inline-block; width: 1.25em; height: 1.25em; vertical-align: -0.28em; flex-shrink: 0; line-height: 0; }
.gicon > svg { width: 100%; height: 100%; display: block; }
</style>
