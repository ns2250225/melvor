<script setup lang="ts">
// 技能页通用头部：等级、经验、深渊等级、掌握度池与检查点、药水、技能统计
import { computed, ref } from 'vue';
import type { SkillId } from '@/game/core/types';
import { C } from '@/content';
import { useGameStore } from '@/stores/game';
import { xpForLevel, levelProgress, abyssalXpForLevel, MASTERY_CHECKPOINTS } from '@/game/core/xp';
import { CHECKPOINT_DESCRIPTIONS } from '@/game/effects/modifiers';
import { usePotion, removePotion } from '@/game/inventory/equipment';
import { fmt, full, pct, fmtMs } from '@/app/format';
import ProgressBar from './ProgressBar.vue';
import ItemIcon from './ItemIcon.vue';
import Modal from './Modal.vue';

const props = defineProps<{ skill: SkillId }>();
const store = useGameStore();
const g = computed(() => store.game!);
const def = computed(() => C.skills[props.skill]);
const st = computed(() => g.value.state.skills[props.skill]);
const cap = computed(() => { void store.frame; return g.value.levelCap(props.skill); });
const progress = computed(() => levelProgress(st.value.xp, st.value.level, cap.value));
const nextXp = computed(() => (st.value.level >= cap.value ? 0 : xpForLevel(st.value.level + 1)));
const showAbyss = computed(() => def.value.abyssalEnabled && g.value.inAbyss());
const abyssCap = computed(() => g.value.abyssalLevelCap());
const abyssProgress = computed(() => levelProgress(st.value.abyssalXp, st.value.abyssalLevel, abyssCap.value, true));
const poolCap = computed(() => (def.value.masteryEnabled ? g.value.poolCap(props.skill) : 0));
const poolPct = computed(() => (poolCap.value ? st.value.masteryPoolXp / poolCap.value : 0));
const potion = computed(() => g.value.state.potions[props.skill]);
const potionsInBank = computed(() => Object.keys(g.value.state.bank).filter((id) => C.items[id]?.potion?.skill === props.skill));
const showPotions = ref(false);
const showStats = ref(false);
const stats = computed(() => g.value.state.skillStats[props.skill] ?? {});
const totalMastery = computed(() => { void store.frame; return def.value.masteryEnabled ? g.value.totalMasteryLevels(props.skill) : 0; });
const masteryMax = computed(() => g.value.skillMasteryActions(props.skill).length * 99);
const STAT_LABELS: Record<string, string> = { actions: '完成动作', timeSpent: '累计耗时', itemsProduced: '产出物品', itemsPreserved: '材料节省次数', successes: '成功', fails: '失败', specials: '特殊物品', junk: '杂物', rocksDepleted: '矿脉耗尽', harvested: '收获', planted: '种植', cropsDied: '作物枯萎', coursesCompleted: '完成路线', obstaclesBuilt: '建造障碍', artifacts: '发现文物', mapsCreated: '制作地图', altCasts: '替代魔法施放', buildingsBuilt: '建造建筑', ticks: '城镇结算', taxCollected: '税收' };
</script>

<template>
  <div class="panel skill-header">
    <div class="row between">
      <div class="row">
        <span class="sicon" :style="{ background: def.color + '33' }">{{ def.icon }}</span>
        <div>
          <h2>{{ def.name }}</h2>
          <div class="muted small">{{ def.description }}</div>
        </div>
      </div>
      <div class="row">
        <button class="small" @click="showStats = true">📊 统计</button>
        <button v-if="potionsInBank.length || potion" class="small" @click="showPotions = true">
          🧪 {{ potion ? `${C.items[potion.itemId].name}（${potion.charges}）` : '使用药水' }}
        </button>
      </div>
    </div>
    <div class="grid mt" :class="{ two: showAbyss || def.masteryEnabled }">
      <div class="col">
        <div class="row between small">
          <span><b>等级 {{ st.level }}</b> <span class="muted">/ {{ cap }}</span></span>
          <span class="muted">{{ full(st.xp) }}{{ nextXp ? ` / ${full(nextXp)} XP` : ' XP（已达上限）' }}</span>
        </div>
        <ProgressBar :value="progress" color="var(--xp)" :height="10" />
        <template v-if="showAbyss">
          <div class="row between small">
            <span class="abyss"><b>深渊等级 {{ st.abyssalLevel }}</b> / {{ abyssCap }}</span>
            <span class="muted">{{ full(st.abyssalXp) }} / {{ full(abyssalXpForLevel(st.abyssalLevel + 1)) }} AXP · 技能点 {{ st.treePoints }}</span>
          </div>
          <ProgressBar :value="abyssProgress" color="var(--abyss)" :height="8" />
        </template>
      </div>
      <div v-if="def.masteryEnabled" class="col">
        <div class="row between small">
          <span><b>掌握度池</b> <span class="muted">{{ pct(poolPct * 100, 2) }}</span></span>
          <span class="muted">{{ fmt(st.masteryPoolXp) }} / {{ fmt(poolCap) }} · 总掌握 {{ totalMastery }}/{{ masteryMax }}</span>
        </div>
        <div class="pool">
          <ProgressBar :value="poolPct" color="var(--mastery)" :height="10" />
          <span v-for="(c, i) in MASTERY_CHECKPOINTS" :key="c" class="cp" :class="{ on: poolPct >= c }" :style="{ left: `${c * 100}%` }" :title="`${c * 100}%：${CHECKPOINT_DESCRIPTIONS[i]}`" />
        </div>
        <div class="row tiny muted">
          <span v-for="(c, i) in MASTERY_CHECKPOINTS" :key="c" :class="{ good: poolPct >= c }">{{ c * 100 }}% {{ CHECKPOINT_DESCRIPTIONS[i] }}</span>
        </div>
      </div>
    </div>
    <Modal v-if="showPotions" title="药水" @close="showPotions = false">
      <div v-if="potion" class="row between mb">
        <div class="row"><ItemIcon :id="potion.itemId" /><span>{{ C.items[potion.itemId].name }} · 剩余 {{ potion.charges }} 次</span></div>
        <button class="small" @click="store.act(() => removePotion(g, skill)); showPotions = false">移除</button>
      </div>
      <div v-if="!potionsInBank.length" class="empty">银行中没有该技能的药水</div>
      <div v-for="id in potionsInBank" :key="id" class="row between list-gap">
        <div class="row"><ItemIcon :id="id" :qty="g.qty(id)" /><div><div>{{ C.items[id].name }}</div><div class="muted small">{{ C.items[id].description }} · {{ C.items[id].potion?.charges }} 次</div></div></div>
        <button class="primary small" @click="store.act(() => usePotion(g, id)); showPotions = false">使用</button>
      </div>
    </Modal>
    <Modal v-if="showStats" :title="`${def.name}统计`" @close="showStats = false">
      <div class="kv">
        <template v-for="(v, k) in stats" :key="k">
          <span>{{ STAT_LABELS[k] ?? k }}</span><span>{{ k === 'timeSpent' ? fmtMs(v) : full(v) }}</span>
        </template>
      </div>
      <div v-if="!Object.keys(stats).length" class="empty">暂无统计</div>
    </Modal>
  </div>
</template>

<style scoped>
.sicon { font-size: 30px; width: 52px; height: 52px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
.grid.two { grid-template-columns: 1fr 1fr; }
@media (max-width: 760px) { .grid.two { grid-template-columns: 1fr; } }
.pool { position: relative; }
.cp { position: absolute; top: -2px; width: 3px; height: 14px; background: var(--border); transform: translateX(-1px); border-radius: 2px; }
.cp.on { background: var(--good); }
.tiny span + span::before { content: '·'; margin: 0 4px; color: var(--muted); }
</style>
