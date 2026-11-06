<script setup lang="ts">
import { computed } from 'vue';
import { C, href, EXPANSION_NAMES } from '../data';
import type { SkillId, SkillActionDef } from '@/game/core/types';
import { categoryName } from '@/game/ui/skillHelpers';
import { formatModifiers } from '@/game/ui/combatHelpers';
import { fmtSec, full } from '@/app/format';
import WLink from '../WLink.vue';

const props = defineProps<{ id?: string }>();
const CAT: Record<string, string> = { combat: '战斗', gathering: '采集', artisan: '制造', support: '辅助', passive: '被动' };
const OFFLINE: Record<string, string> = { simulate: '完整模拟', passive: '被动推进', none: '不推进' };

const def = computed(() => (props.id ? C.skills[props.id as SkillId] : undefined));
const groups = computed(() => {
  if (!def.value) return [];
  const list = [...(C.actionsBySkill[def.value.id] ?? [])].sort((a, b) => (a.abyssalLevel ?? 0) - (b.abyssalLevel ?? 0) || a.level - b.level);
  const m = new Map<string, SkillActionDef[]>();
  for (const a of list) { const k = a.category ?? ''; if (!m.has(k)) m.set(k, []); m.get(k)!.push(a); }
  return [...m.entries()];
});
const pets = computed(() => Object.values(C.pets).filter((p) => p.sourceType === 'skill' && p.sourceId === props.id));
const familiars = computed(() => (props.id === 'summoning' ? Object.values(C.familiars).sort((a, b) => a.level - b.level) : []));
const spellsLink = computed(() => ['magic'].includes(props.id ?? ''));
const prayerLink = computed(() => props.id === 'prayer');
</script>

<template>
  <div v-if="!id">
    <h1><Icon name="trophy" size="36" /> 技能</h1>
    <p class="lead">共 {{ C.skillOrder.length }} 项技能。点击查看每项技能的全部动作、等级要求、耗时、经验与材料。</p>
    <div class="tw"><table>
      <thead><tr><th>技能</th><th>类别</th><th>说明</th><th class="num">动作数</th><th>来源</th></tr></thead>
      <tbody>
        <tr v-for="s in C.skillOrder" :key="s">
          <td><WLink kind="skill" :id="s" /></td><td>{{ CAT[C.skills[s].category] }}</td><td>{{ C.skills[s].description }}</td>
          <td class="num">{{ (C.actionsBySkill[s] ?? []).length || '—' }}</td><td class="muted">{{ EXPANSION_NAMES[C.skills[s].expansionId ?? 'base'] }}</td>
        </tr>
      </tbody>
    </table></div>
  </div>

  <div v-else-if="def">
    <aside class="infobox">
      <div class="ih"><Icon :name="def.icon" size="72" /><div style="font-weight: 700; margin-top: 6px">{{ def.name }}</div></div>
      <dl>
        <dt>类别</dt><dd>{{ CAT[def.category] }}技能</dd>
        <dt>基础上限</dt><dd>{{ def.maxLevel }} 级</dd>
        <dt>掌握度</dt><dd>{{ def.masteryEnabled ? '有' : '无' }}</dd>
        <dt>深渊等级</dt><dd>{{ def.abyssalEnabled ? '支持' : '不支持' }}</dd>
        <dt>离线</dt><dd>{{ OFFLINE[def.offlinePolicy] }}</dd>
        <dt>来源</dt><dd>{{ EXPANSION_NAMES[def.expansionId ?? 'base'] }}</dd>
        <dt>动作数</dt><dd>{{ (C.actionsBySkill[def.id] ?? []).length }}</dd>
      </dl>
    </aside>
    <h1><Icon :name="def.icon" size="36" /> {{ def.name }}</h1>
    <p class="lead">{{ def.description }}</p>
    <p v-if="spellsLink">相关：<a :href="href('spell')">全部法术</a></p>
    <p v-if="prayerLink">相关：<a :href="href('prayer')">全部祈祷</a></p>
    <p v-if="def.category === 'combat' && !groups.length" class="muted">战斗技能通过在战斗中使用对应攻击方式获得经验，请参阅 <a :href="href('guide')">游戏机制 · 战斗</a>。</p>
    <div v-if="pets.length">
      <h3>技能宠物</h3>
      <span v-for="p in pets" :key="p.id" class="tag"><WLink kind="pet" :id="p.id" /> · {{ p.source }}</span>
    </div>
    <div class="clear" />

    <template v-for="[cat, list] in groups" :key="cat">
      <h2>{{ cat ? categoryName(cat) : '动作' }} <span class="muted" style="font-size: 13px; font-weight: 400">（{{ list.length }}）</span></h2>
      <div class="tw"><table>
        <thead><tr><th class="num">等级</th><th>动作</th><th class="num">耗时</th><th class="num">经验</th><th>消耗</th><th>产出</th></tr></thead>
        <tbody>
          <tr v-for="a in list" :key="a.id">
            <td class="num">{{ a.level }}<div v-if="a.abyssalLevel" class="abyss">深渊 {{ a.abyssalLevel }}</div></td>
            <td><Icon :name="a.icon" :seed="a.id" /> {{ a.name }}<div v-if="a.description" class="muted" style="font-size: 12px">{{ a.description }}</div></td>
            <td class="num">{{ a.intervalMax ? `${fmtSec(a.interval)}–${fmtSec(a.intervalMax)}` : fmtSec(a.interval) }}</td>
            <td class="num">{{ full(a.xp) }}<div v-if="a.abyssalXp" class="abyss">{{ full(a.abyssalXp) }}</div></td>
            <td><span v-for="i in a.inputs" :key="i.id" class="tag"><WLink kind="item" :id="i.id" :qty="i.qty" /></span><span v-if="!a.inputs.length" class="muted">—</span></td>
            <td>
              <span v-for="o in a.outputs" :key="o.id" class="tag"><WLink kind="item" :id="o.id" :qty="o.qty" /></span>
              <span v-if="a.gp" class="tag"><Icon name="coin" /> {{ full(a.gp) }}</span>
              <span v-if="!a.outputs.length && !a.gp" class="muted">—</span>
            </td>
          </tr>
        </tbody>
      </table></div>
    </template>

    <template v-if="familiars.length">
      <h2><Icon name="paw" /> 召唤兽</h2>
      <div class="tw"><table>
        <thead><tr><th class="num">等级</th><th>召唤兽</th><th>效果</th><th>印记来源</th></tr></thead>
        <tbody><tr v-for="f in familiars" :key="f.id">
          <td class="num">{{ f.level }}</td><td><Icon :name="f.icon" :seed="f.id" /> {{ f.name }}<div v-if="f.combat" class="muted">战斗最大伤害 {{ f.combat.maxHit }}</div></td>
          <td><span v-for="m in formatModifiers(f.modifiers)" :key="m" class="tag">{{ m }}</span></td>
          <td><span v-for="s in f.markSkills" :key="s" class="tag"><WLink kind="skill" :id="s" /></span></td>
        </tr></tbody>
      </table></div>
    </template>
  </div>
  <p v-else>未找到技能「{{ id }}」。<a :href="href('skill')">返回技能列表</a></p>
</template>
