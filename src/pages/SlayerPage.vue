<script setup lang="ts">
// 猎杀页面：当前任务、任务档位、自动猎杀、猎杀币与猎杀区域
import { computed } from 'vue';
import { C } from '@/content';
import { useGameStore } from '@/stores/game';
import { assignSlayerTask, slayerCandidates, goToSlayerTarget, areaEntryError } from '@/game/combat/combat';
import type { SlayerTierDef } from '@/game/core/types';
import { fmt, full } from '@/app/format';
import { ATTACK_TYPE_NAMES, EXPANSION_SHORT } from '@/game/ui/combatHelpers';
import SkillHeader from '@/components/SkillHeader.vue';
import ProgressBar from '@/components/ProgressBar.vue';
import Requirements from '@/components/Requirements.vue';

const store = useGameStore();
const g = computed(() => store.game!);
const s = computed(() => g.value.state);
const task = computed(() => s.value.slayer.task);
const taskMonster = computed(() => (task.value ? C.monsters[task.value.monsterId] : null));
const taskTier = computed(() => (task.value ? C.slayerTiers.find((t) => t.id === task.value!.tier) : undefined));
const onTarget = computed(() => !!task.value && s.value.combat.active && s.value.combat.enemy?.monsterId === task.value.monsterId);
const hasAuto = computed(() => (s.value.shop['auto_slayer'] || 0) > 0);

const tiers = computed(() => {
  void store.frame;
  return C.slayerTiers.map((t) => ({ t, cands: slayerCandidates(g.value, t.id), err: tierError(t) }));
});
function tierError(t: SlayerTierDef): string | null {
  if (t.realm === 'abyssal' && !g.value.inAbyss()) return '需要开启深渊之门';
  if (g.value.level('slayer') < t.slayerLevel) return `需要猎杀 ${t.slayerLevel} 级`;
  const have = s.value.currencies[t.currency];
  if (have < t.cost) return t.currency === 'slayerCoins' ? '猎杀币不足' : '深渊猎杀币不足';
  return null;
}
const curName = (t: SlayerTierDef) => (t.currency === 'slayerCoins' ? '猎杀币' : '深渊猎杀币');
function assign(t: SlayerTierDef) { store.act(() => assignSlayerTask(g.value, t.id)); }
function goTarget() { store.act(() => goToSlayerTarget(g.value)); }
function toggleAuto() { s.value.slayer.autoSlayer = !s.value.slayer.autoSlayer; store.requestSave(); }

const slayerAreas = computed(() => {
  void store.frame;
  return Object.values(C.areas).filter((a) => a.type === 'slayer' && (a.realm === 'melvor' || g.value.inAbyss()))
    .map((a) => ({ a, err: areaEntryError(g.value, 'slayer', a.id) }));
});
const hiddenAbyssAreas = computed(() => (g.value.inAbyss() ? 0 : Object.values(C.areas).filter((a) => a.type === 'slayer' && a.realm === 'abyssal').length));
</script>

<template>
  <div>
    <SkillHeader skill="slayer" />

    <div class="panel">
      <div class="row between">
        <h3>💀 当前猎杀任务</h3>
        <div class="row">
          <span class="tag">💀 猎杀币 {{ fmt(s.currencies.slayerCoins) }}</span>
          <span v-if="g.inAbyss()" class="tag abyss">🟪 深渊猎杀币 {{ fmt(s.currencies.abyssalSlayerCoins) }}</span>
        </div>
      </div>
      <template v-if="task && taskMonster">
        <div class="row nowrap mt">
          <span class="bigicon">{{ taskMonster.icon }}</span>
          <div class="grow">
            <div class="bold">{{ taskMonster.name }} <span class="muted small">Lv {{ taskMonster.level }} · {{ ATTACK_TYPE_NAMES[taskMonster.attackType] }}</span></div>
            <div class="small">
              剩余 <b>{{ task.remaining }}</b> / {{ task.total }} ·
              档位 {{ taskTier?.name ?? task.tier }} ·
              <span :class="task.realm === 'abyssal' ? 'abyss' : ''">{{ task.realm === 'abyssal' ? '深渊' : '梅尔沃' }}</span>
              <span v-if="onTarget" class="good"> · 正在猎杀</span>
            </div>
            <ProgressBar :value="(task.total - task.remaining) / task.total" color="var(--good)" :height="8" />
          </div>
        </div>
        <div class="row mt">
          <button class="primary" :disabled="onTarget" @click="goTarget">🎯 前往目标</button>
          <button v-if="taskTier" :disabled="!!tierError(taskTier)" :title="tierError(taskTier) ?? ''" @click="assign(taskTier)">🔄 重新分配（{{ taskTier.cost ? `${fmt(taskTier.cost)} ${curName(taskTier)}` : '免费' }}）</button>
        </div>
      </template>
      <div v-else class="empty">暂无猎杀任务，从下方选择档位接取任务</div>
      <div class="sep" />
      <div class="row between">
        <div class="small">
          <b>🤖 自动猎杀</b>
          <span class="muted">：任务完成后自动接取同档位新任务并前往目标</span>
        </div>
        <label v-if="hasAuto" class="row small"><input type="checkbox" :checked="s.slayer.autoSlayer" @change="toggleAuto" /> 启用</label>
        <button v-else class="small" @click="store.go('shop')">🔒 在商店购买（{{ fmt(C.shop['auto_slayer']?.cost.slayerCoins ?? 0) }} 猎杀币）</button>
      </div>
    </div>

    <div class="panel">
      <h3>📋 任务档位</h3>
      <div class="cards">
        <div v-for="{ t, cands, err } in tiers" :key="t.id" class="card" :class="{ locked: (t.realm === 'abyssal' && !g.inAbyss()) || g.level('slayer') < t.slayerLevel, active: task?.tier === t.id }">
          <div class="row between">
            <b :class="t.realm === 'abyssal' ? 'abyss' : ''">{{ t.name }}</b>
            <span class="tag">已完成 {{ s.slayer.tasksCompleted[t.id] || 0 }}</span>
          </div>
          <div class="kv">
            <span>费用</span><span :class="t.currency === 'abyssalSlayerCoins' ? 'abyss' : 'gold'">{{ t.cost ? `${fmt(t.cost)} ${curName(t)}` : '免费' }}</span>
            <span>猎杀等级</span><span :class="g.level('slayer') >= t.slayerLevel ? 'good' : 'bad'">{{ t.slayerLevel }}</span>
            <span>怪物等级</span><span>{{ t.minLevel }} - {{ t.maxLevel >= 999 ? '∞' : t.maxLevel }}</span>
            <span>击杀数量</span><span>{{ t.killsMin }} - {{ t.killsMax }}</span>
            <span>可选目标</span><span :class="cands.length ? '' : 'bad'">{{ cands.length }} 种</span>
          </div>
          <div v-if="cands.length" class="row tiny">
            <span v-for="m in cands.slice(0, 8)" :key="m" class="tag">{{ C.monsters[m]?.icon }} {{ C.monsters[m]?.name }}</span>
            <span v-if="cands.length > 8" class="muted">等 {{ cands.length }} 种</span>
          </div>
          <button class="primary" :disabled="!!err || !cands.length" @click="assign(t)">{{ task ? '接取任务（替换当前）' : '接取任务' }}</button>
          <div v-if="err" class="tiny bad">{{ err }}</div>
          <div v-else-if="!cands.length" class="tiny bad">没有可分配的目标（需要解锁更多区域）</div>
        </div>
      </div>
    </div>

    <div class="panel">
      <div class="row between">
        <h3>🗺️ 猎杀区域</h3>
        <button class="small" @click="store.go('combat')">前往战斗页面</button>
      </div>
      <div class="muted small mb">在猎杀区域击杀任意怪物都可获得猎杀经验（非任务目标为一半）。部分区域需要装备特定物品才能进入。</div>
      <div class="cards lg">
        <div v-for="{ a, err } in slayerAreas" :key="a.id" class="card" :class="{ locked: !!err }">
          <div class="row between">
            <b>{{ a.icon }} {{ a.name }}</b>
            <span v-if="EXPANSION_SHORT[a.expansion]" class="tag abyss">{{ EXPANSION_SHORT[a.expansion] }}</span>
          </div>
          <Requirements :reqs="a.requirements" />
          <div v-if="a.entryEquipment?.length" class="row small">
            <span class="muted">需装备：</span>
            <span v-for="e in a.entryEquipment" :key="e" class="tag" :class="g.meets({ type: 'equipped', id: e }) ? 'good' : 'bad'">{{ C.items[e]?.name ?? e }}</span>
          </div>
          <div v-if="a.areaEffect" class="small warn">区域效果：{{ a.areaEffect.description }}</div>
          <div class="row tiny">
            <span v-for="m in a.monsters" :key="m" class="tag">{{ C.monsters[m]?.icon }} {{ C.monsters[m]?.name }} Lv{{ C.monsters[m]?.level }} · 击杀 {{ full(s.monsterKills[m] || 0) }}</span>
          </div>
          <div v-if="err" class="tiny bad">{{ err }}</div>
          <button class="small" @click="store.go('combat')">前往战斗</button>
        </div>
      </div>
      <div v-if="hiddenAbyssAreas" class="muted small mt">🔒 另有 {{ hiddenAbyssAreas }} 个深渊猎杀区域，开启深渊之门后显示。</div>
    </div>
  </div>
</template>

<style scoped>
.bigicon { font-size: 40px; }
</style>
