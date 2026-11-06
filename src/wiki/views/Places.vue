<script setup lang="ts">
// 战斗区域、猎杀区域与副本
import { computed } from 'vue';
import { C, href, EXPANSION_NAMES, reqText, monsterLevel } from '../data';
import { dropTableRows, fmtChance } from '@/game/ui/combatHelpers';
import WLink from '../WLink.vue';

const props = defineProps<{ kind: 'area' | 'dungeon'; id?: string }>();
const areas = computed(() => Object.values(C.areas));
const groups = computed(() => [
  { t: '战斗区域', icon: 'swords', list: areas.value.filter((a) => a.type === 'combat' && a.realm !== 'abyssal') },
  { t: '猎杀区域', icon: 'skull', list: areas.value.filter((a) => a.type === 'slayer' && a.realm !== 'abyssal') },
  { t: '深渊区域', icon: 'vortex', list: areas.value.filter((a) => a.realm === 'abyssal') },
]);
const dungeons = computed(() => Object.values(C.dungeons));
const lvRange = (ids: string[]) => { const l = ids.map((i) => (C.monsters[i] ? monsterLevel(C.monsters[i]) : 0)); return `Lv ${Math.min(...l)}–${Math.max(...l)}`; };

const area = computed(() => (props.kind === 'area' && props.id ? C.areas[props.id] : undefined));
const dg = computed(() => (props.kind === 'dungeon' && props.id ? C.dungeons[props.id] : undefined));
const seq = computed(() => {
  if (!dg.value) return [];
  const out: { id: string; n: number }[] = [];
  for (const m of dg.value.monsters) { const last = out[out.length - 1]; if (last?.id === m) last.n++; else out.push({ id: m, n: 1 }); }
  return out;
});
const chest = computed(() => dropTableRows(dg.value?.rewardTable));
</script>

<template>
  <!-- 区域列表 -->
  <div v-if="kind === 'area' && !id">
    <h1><Icon name="swords" size="36" /> 战斗区域</h1>
    <p class="lead">在区域中选择一只怪物即可开始反复战斗。猎杀区域需要猎杀等级，部分还要求装备特定物品。</p>
    <template v-for="g in groups" :key="g.t">
      <h2 v-if="g.list.length"><Icon :name="g.icon" /> {{ g.t }}（{{ g.list.length }}）</h2>
      <div class="grid">
        <a v-for="a in g.list" :key="a.id" :href="href('area', a.id)" class="card">
          <div class="ct"><Icon :name="a.icon" :seed="a.id" size="26" /> {{ a.name }}</div>
          <div class="cs">{{ a.monsters.length }} 种怪物 · {{ lvRange(a.monsters) }}<template v-if="a.requirements.length"> · {{ a.requirements.map(reqText).join('，') }}</template></div>
        </a>
      </div>
    </template>
  </div>

  <!-- 区域详情 -->
  <div v-else-if="area">
    <h1><Icon :name="area.icon" :seed="area.id" size="40" /> {{ area.name }}</h1>
    <p class="lead">{{ area.type === 'slayer' ? '猎杀区域' : '战斗区域' }} · {{ area.realm === 'abyssal' ? '深渊' : '普通领域' }} · {{ EXPANSION_NAMES[area.expansion] }}<template v-if="area.description"> · {{ area.description }}</template></p>
    <p v-if="area.requirements.length">进入需求：<span v-for="(r, i) in area.requirements" :key="i" class="tag">{{ reqText(r) }}</span></p>
    <p v-if="area.entryEquipment?.length">需要装备：<span v-for="e in area.entryEquipment" :key="e" class="tag"><WLink kind="item" :id="e" /></span></p>
    <p v-if="area.areaEffect">区域效果（作用于{{ area.areaEffect.target === 'player' ? '玩家' : '敌人' }}）：{{ area.areaEffect.description }}</p>
    <h2><Icon name="dragon" /> 怪物</h2>
    <div class="tw"><table>
      <thead><tr><th>怪物</th><th class="num">等级</th><th class="num">生命</th></tr></thead>
      <tbody><tr v-for="mid in area.monsters" :key="mid"><td><WLink kind="monster" :id="mid" /></td><td class="num">{{ C.monsters[mid] ? monsterLevel(C.monsters[mid]) : '?' }}</td><td class="num">{{ (C.monsters[mid]?.hitpoints ?? 0) * 10 }}</td></tr></tbody>
    </table></div>
  </div>

  <!-- 副本列表 -->
  <div v-else-if="kind === 'dungeon' && !id">
    <h1><Icon name="castle" size="36" /> 副本</h1>
    <p class="lead">副本会按顺序刷出一组怪物，最后通常是首领。中途离开或死亡会丢失进度；全部击败后发放通关奖励。</p>
    <div class="tw"><table>
      <thead><tr><th>副本</th><th class="num">敌人数</th><th>等级范围</th><th>进入需求</th><th>来源</th></tr></thead>
      <tbody><tr v-for="d in dungeons" :key="d.id">
        <td><WLink kind="dungeon" :id="d.id" /> <span v-if="d.isEndgame" class="tag gold">终局</span></td>
        <td class="num">{{ d.monsters.length }}</td><td>{{ lvRange(d.monsters) }}</td>
        <td>{{ d.requirements.map(reqText).filter(Boolean).join('，') || '—' }}</td><td class="muted">{{ EXPANSION_NAMES[d.expansion] }}</td>
      </tr></tbody>
    </table></div>
  </div>

  <!-- 副本详情 -->
  <div v-else-if="dg">
    <h1><Icon :name="dg.icon" :seed="dg.id" size="40" /> {{ dg.name }}</h1>
    <p class="lead">{{ dg.realm === 'abyssal' ? '深渊副本' : '副本' }} · {{ dg.monsters.length }} 个敌人 · {{ EXPANSION_NAMES[dg.expansion] }}<template v-if="dg.isEndgame"> · 终局内容</template><template v-if="dg.noFoodAllowed"> · 禁止使用食物</template></p>
    <p v-if="dg.description">{{ dg.description }}</p>
    <p v-if="dg.requirements.length">进入需求：<span v-for="(r, i) in dg.requirements" :key="i" class="tag">{{ reqText(r) }}</span></p>
    <p v-if="dg.unlocks">通关后解锁：{{ dg.unlocks }}</p>
    <h2><Icon name="dragon" /> 敌人序列</h2>
    <ol><li v-for="(s, i) in seq" :key="i"><WLink kind="monster" :id="s.id" /><span v-if="s.n > 1" class="muted"> ×{{ s.n }}</span><span v-if="C.monsters[s.id]?.isBoss" class="tag gold">首领</span></li></ol>
    <h2><Icon name="gift" /> 通关奖励</h2>
    <p v-if="dg.rewards.length"><span v-for="r in dg.rewards" :key="r.id" class="tag"><WLink kind="item" :id="r.id" :qty="r.qty" /></span></p>
    <p v-if="dg.pet">宠物：<WLink kind="pet" :id="dg.pet.id" />（通关 {{ dg.pet.completions }} 次后必得）</p>
    <div v-if="chest.length" class="tw"><table>
      <thead><tr><th>宝箱物品</th><th class="num">数量</th><th class="num">几率</th></tr></thead>
      <tbody><tr v-for="r in chest" :key="r.id"><td><WLink kind="item" :id="r.id" /></td><td class="num">{{ r.min === r.max ? r.min : `${r.min}–${r.max}` }}</td><td class="num">{{ fmtChance(r.chance) }}</td></tr></tbody>
    </table></div>
  </div>
  <p v-else>未找到「{{ id }}」。<a :href="href(kind)">返回列表</a></p>
</template>
