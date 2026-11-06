<script setup lang="ts">
import { computed, ref } from 'vue';
import { C, href, EXPANSION_NAMES, monsterLevel, monsterLocations } from '../data';
import { ATTACK_TYPE_NAMES, ATTACK_TYPE_ICONS, dropTableRows, fmtChance, specialAttacksOf, formatModifiers } from '@/game/ui/combatHelpers';
import { full, fmtSec } from '@/app/format';
import WLink from '../WLink.vue';

const props = defineProps<{ id?: string }>();
const realm = ref<'all' | 'melvor' | 'abyssal'>('all');
const type = ref<'all' | 'melee' | 'ranged' | 'magic' | 'boss'>('all');
const q = ref('');
const list = computed(() => {
  const s = q.value.trim();
  return Object.values(C.monsters)
    .filter((m) => (realm.value === 'all' || (m.realm ?? 'melvor') === realm.value)
      && (type.value === 'all' || (type.value === 'boss' ? m.isBoss : m.attackType === type.value))
      && (!s || m.name.includes(s)))
    .sort((a, b) => monsterLevel(a) - monsterLevel(b));
});

const m = computed(() => (props.id ? C.monsters[props.id] : undefined));
const drops = computed(() => dropTableRows(m.value?.drops));
const specials = computed(() => specialAttacksOf(m.value?.specialAttacks));
const locs = computed(() => (props.id ? monsterLocations(props.id) : []));
</script>

<template>
  <div v-if="!id">
    <h1><Icon name="dragon" size="36" /> 怪物</h1>
    <p class="lead">共 {{ Object.keys(C.monsters).length }} 种怪物，按战斗等级排序。生命值为实际数值（等级 × 10）。</p>
    <div class="filters">
      <input v-model="q" placeholder="搜索怪物" />
      <button :class="{ on: realm === 'all' }" @click="realm = 'all'">全部领域</button>
      <button :class="{ on: realm === 'melvor' }" @click="realm = 'melvor'">普通领域</button>
      <button :class="{ on: realm === 'abyssal' }" @click="realm = 'abyssal'">深渊</button>
      <span style="width: 12px" />
      <button v-for="t in (['all', 'melee', 'ranged', 'magic', 'boss'] as const)" :key="t" :class="{ on: type === t }" @click="type = t">{{ t === 'all' ? '全部类型' : t === 'boss' ? '首领' : ATTACK_TYPE_NAMES[t] }}</button>
    </div>
    <div class="tw"><table>
      <thead><tr><th>怪物</th><th class="num">等级</th><th class="num">生命</th><th>攻击</th><th class="num">攻速</th><th class="num">金币</th><th>标记</th></tr></thead>
      <tbody><tr v-for="x in list" :key="x.id">
        <td><WLink kind="monster" :id="x.id" /></td><td class="num">{{ monsterLevel(x) }}</td><td class="num">{{ full(x.hitpoints * 10) }}</td>
        <td><Icon :name="ATTACK_TYPE_ICONS[x.attackType]" /> {{ ATTACK_TYPE_NAMES[x.attackType] }}</td><td class="num">{{ fmtSec(x.attackSpeed) }}</td>
        <td class="num">{{ x.gp[1] ? `${full(x.gp[0])}–${full(x.gp[1])}` : '—' }}</td>
        <td><span v-if="x.isBoss" class="tag gold">首领</span><span v-if="x.slayerTaskable" class="tag">猎杀</span><span v-if="x.realm === 'abyssal'" class="tag abyss">深渊</span></td>
      </tr></tbody>
    </table></div>
  </div>

  <div v-else-if="m">
    <aside class="infobox">
      <div class="ih"><Icon :name="m.icon" :seed="m.id" size="96" /><div style="font-weight: 700; margin-top: 6px">{{ m.name }}</div></div>
      <dl>
        <dt>战斗等级</dt><dd>{{ monsterLevel(m) }}</dd>
        <dt>生命值</dt><dd>{{ full(m.hitpoints * 10) }}</dd>
        <dt>攻击方式</dt><dd><Icon :name="ATTACK_TYPE_ICONS[m.attackType]" /> {{ ATTACK_TYPE_NAMES[m.attackType] }}</dd>
        <dt>攻击间隔</dt><dd>{{ fmtSec(m.attackSpeed) }}</dd>
        <dt>攻击 / 力量</dt><dd>{{ m.attack }} / {{ m.strength }}</dd>
        <dt>防御</dt><dd>{{ m.defence }}</dd>
        <dt>远程 / 魔法</dt><dd>{{ m.ranged }} / {{ m.magic }}</dd>
        <template v-if="m.maxHitOverride"><dt>最大伤害</dt><dd>{{ m.maxHitOverride }}</dd></template>
        <template v-if="m.barrier"><dt>屏障</dt><dd class="abyss">{{ full(m.barrier) }}</dd></template>
        <dt>金币</dt><dd><Icon name="coin" /> {{ full(m.gp[0]) }}–{{ full(m.gp[1]) }}</dd>
        <dt>领域</dt><dd :class="{ abyss: m.realm === 'abyssal' }">{{ m.realm === 'abyssal' ? '深渊' : '普通' }}</dd>
        <dt>来源</dt><dd>{{ EXPANSION_NAMES[m.expansion] }}</dd>
      </dl>
    </aside>
    <h1><Icon :name="m.icon" :seed="m.id" size="40" /> {{ m.name }}</h1>
    <p class="lead"><span v-if="m.isBoss" class="tag gold">首领</span><span v-if="m.slayerTaskable" class="tag">可作为猎杀任务目标</span></p>

    <h2><Icon name="map" /> 出没地点</h2>
    <ul><li v-for="l in locs" :key="l.kind + l.id"><WLink :kind="l.kind" :id="l.id" /><span class="muted">（{{ l.kind === 'dungeon' ? '副本' : C.areas[l.id].type === 'slayer' ? '猎杀区域' : '战斗区域' }}）</span></li><li v-if="!locs.length" class="muted">暂无</li></ul>

    <template v-if="specials.length">
      <h2><Icon name="lightning" /> 特殊攻击</h2>
      <ul><li v-for="s in specials" :key="s.id"><b>{{ s.name }}</b>（{{ s.chance }}%）：{{ s.description }}</li></ul>
    </template>
    <template v-if="m.passives && Object.keys(m.passives).length">
      <h2><Icon name="sparkles" /> 被动效果</h2>
      <p><span v-for="p in formatModifiers(m.passives)" :key="p" class="tag">{{ p }}</span></p>
    </template>
    <div class="clear" />

    <h2><Icon name="chest" /> 掉落</h2>
    <p v-if="m.bones">必掉：<WLink kind="item" :id="m.bones" /></p>
    <p v-if="m.pet">宠物：<WLink kind="pet" :id="m.pet.id" />（{{ fmtChance(m.pet.chance) }}）</p>
    <div v-if="drops.length" class="tw"><table>
      <thead><tr><th>物品</th><th class="num">数量</th><th class="num">几率</th></tr></thead>
      <tbody><tr v-for="r in drops" :key="r.id"><td><WLink kind="item" :id="r.id" /></td><td class="num">{{ r.min === r.max ? r.min : `${r.min}–${r.max}` }}</td><td class="num">{{ fmtChance(r.chance) }}</td></tr></tbody>
    </table></div>
    <p v-else class="muted">没有额外掉落。</p>
  </div>
  <p v-else>未找到怪物「{{ id }}」。<a :href="href('monster')">返回怪物列表</a></p>
</template>
