<script setup lang="ts">
// 法术、祈祷、宠物、商店、任务、成就、扩展与模式
import { computed, nextTick, onMounted, watch } from 'vue';
import { C, href, EXPANSION_NAMES, reqText } from '../data';
import type { SpellBook } from '@/game/core/types';
import { EXPANSIONS } from '@/content/expansions';
import { formatModifiers } from '@/game/ui/combatHelpers';
import { describeObjective, rewardParts } from '@/game/ui/metaHelpers';
import { full } from '@/app/format';
import WLink from '../WLink.vue';

const props = defineProps<{ kind: string; id?: string }>();
const BOOK_NAMES: Record<SpellBook, string> = { standard: '标准法术', ancient: '远古法术', archaic: '古老法术', abyssal: '深渊法术', curse: '诅咒', aura: '光环', alt: '替代魔法' };
const PRAYER_BOOKS: Record<string, string> = { normal: '普通祈祷', unholy: '亵渎祈祷', abyssal: '深渊祈祷' };
const TITLES: Record<string, [string, string, string]> = {
  spell: ['法术', 'wand', '战斗中选择一个法术后，魔法攻击会消耗符文施放它。诅咒与光环可与战斗法术同时生效；替代魔法在战斗外使用，用于转化物品。'],
  prayer: ['祈祷', 'pray', '激活祈祷获得战斗增益，每次攻击消耗祈祷点（深渊祈祷消耗灵魂点）。埋葬骨头可获得祈祷点。'],
  pet: ['宠物', 'paw', '宠物在执行对应活动时有极小概率获得，获得后永久提供加成，无需装备。'],
  shop: ['商店', 'cart', '用金币、猎杀币或深渊碎片购买永久升级、工具、材料与装备。'],
  quest: ['任务', 'scroll', '按章节推进的任务线，完成目标获得金币、经验与物品奖励，部分任务会解锁新内容。'],
  achievement: ['成就', 'medal', '达成特定里程碑即可解锁成就，部分成就附带奖励。'],
  expansion: ['扩展与模式', 'galaxy', '游戏内容由基础游戏与三个扩展组成；创建角色时可选择不同的游戏模式。'],
};
const title = computed(() => TITLES[props.kind] ?? ['页面不存在', 'question', '']);

const group = <T,>(list: T[], key: (x: T) => string) => { const m = new Map<string, T[]>(); for (const x of list) { const k = key(x); if (!m.has(k)) m.set(k, []); m.get(k)!.push(x); } return [...m.entries()]; };
const spells = computed(() => group(Object.values(C.spells).sort((a, b) => a.level - b.level), (s) => s.book));
const prayers = computed(() => group(Object.values(C.prayers).sort((a, b) => a.level - b.level), (p) => p.book));
const pets = computed(() => Object.values(C.pets));
const shop = computed(() => group(Object.values(C.shop), (s) => s.category));
const quests = computed(() => group(Object.values(C.quests), (q) => q.chapter));
const achievements = computed(() => group(Object.values(C.achievements), (a) => a.category));
const costText = (c: Record<string, any>) => [c.gp && `[[coin]] ${full(c.gp)}`, c.slayerCoins && `[[skull]] ${full(c.slayerCoins)}`, c.abyssalPieces && `[[abyssal_piece]] ${full(c.abyssalPieces)}`, c.abyssalSlayerCoins && `[[abyssal_coin]] ${full(c.abyssalSlayerCoins)}`].filter(Boolean).join('  ');

// 带 id 的链接：滚动并高亮对应行
function focus() { if (!props.id) return; nextTick(() => { const el = document.getElementById(`row-${props.id}`); el?.scrollIntoView({ block: 'center' }); }); }
onMounted(focus);
watch(() => props.id, focus);
</script>

<template>
  <div>
    <h1><Icon :name="title[1]" size="36" /> {{ title[0] }}</h1>
    <p class="lead">{{ title[2] }}</p>

    <template v-if="kind === 'spell'">
      <template v-for="[book, list] in spells" :key="book">
        <h2>{{ BOOK_NAMES[book as SpellBook] ?? book }}（{{ list.length }}）</h2>
        <div class="tw"><table>
          <thead><tr><th class="num">等级</th><th>法术</th><th>效果</th><th>符文消耗</th></tr></thead>
          <tbody><tr v-for="s in list" :id="`row-${s.id}`" :key="s.id" :class="{ hl: id === s.id }">
            <td class="num">{{ s.level }}</td><td><Icon :name="s.icon" :seed="s.id" /> <b>{{ s.name }}</b></td>
            <td>{{ s.description }}<template v-if="s.maxHit"> · 最大伤害 {{ s.maxHit }}</template><span v-for="m in formatModifiers(s.modifiers)" :key="m" class="tag">{{ m }}</span></td>
            <td><span v-for="r in s.runes" :key="r.id" class="tag"><WLink kind="item" :id="r.id" :qty="r.qty" /></span></td>
          </tr></tbody>
        </table></div>
      </template>
    </template>

    <template v-else-if="kind === 'prayer'">
      <template v-for="[book, list] in prayers" :key="book">
        <h2>{{ PRAYER_BOOKS[book] ?? book }}（{{ list.length }}）</h2>
        <div class="tw"><table>
          <thead><tr><th class="num">等级</th><th>祈祷</th><th>效果</th><th class="num">消耗 / 次</th></tr></thead>
          <tbody><tr v-for="p in list" :id="`row-${p.id}`" :key="p.id" :class="{ hl: id === p.id }">
            <td class="num">{{ p.level }}</td><td><Icon :name="p.icon" :seed="p.id" /> <b>{{ p.name }}</b><div v-if="p.requirements?.length" class="muted">{{ p.requirements.map(reqText).join('，') }}</div></td>
            <td>{{ p.description }} <span v-for="m in formatModifiers(p.modifiers)" :key="m" class="tag">{{ m }}</span></td>
            <td class="num">{{ p.pointsPerPlayer }} / {{ p.pointsPerEnemy }}</td>
          </tr></tbody>
        </table></div>
      </template>
    </template>

    <template v-else-if="kind === 'pet'">
      <div class="tw"><table>
        <thead><tr><th>宠物</th><th>获取方式</th><th>加成</th><th>来源</th></tr></thead>
        <tbody><tr v-for="p in pets" :id="`row-${p.id}`" :key="p.id" :class="{ hl: id === p.id }">
          <td><Icon :name="p.icon" :seed="p.id" size="28" /> <b>{{ p.name }}</b></td>
          <td>
            <WLink v-if="p.sourceType === 'skill' && p.sourceId" kind="skill" :id="p.sourceId" />
            <WLink v-else-if="p.sourceType === 'dungeon' && p.sourceId" kind="dungeon" :id="p.sourceId" />
            <WLink v-else-if="p.sourceType === 'monster' && p.sourceId" kind="monster" :id="p.sourceId" />
            <div class="muted">{{ p.source }}</div>
          </td>
          <td>{{ p.description }}</td><td class="muted">{{ EXPANSION_NAMES[p.expansion] }}</td>
        </tr></tbody>
      </table></div>
    </template>

    <template v-else-if="kind === 'shop'">
      <template v-for="[cat, list] in shop" :key="cat">
        <h2>{{ cat }}（{{ list.length }}）</h2>
        <div class="tw"><table>
          <thead><tr><th>商品</th><th>说明</th><th>价格</th><th>需求</th></tr></thead>
          <tbody><tr v-for="s in list" :id="`row-${s.id}`" :key="s.id" :class="{ hl: id === s.id }">
            <td><Icon :name="s.icon" :seed="s.id" /> <b>{{ s.name }}</b><div v-if="s.buyLimit" class="muted">限购 {{ s.buyLimit }}</div></td>
            <td>{{ s.description }}<div><span v-for="m in formatModifiers(s.upgrade?.modifiers)" :key="m" class="tag">{{ m }}</span></div></td>
            <td><IconText :text="costText(s.cost)" /><div v-if="s.cost.scaling" class="muted">价格随数量递增</div><div><span v-for="i in s.cost.items ?? []" :key="i.id" class="tag"><WLink kind="item" :id="i.id" :qty="i.qty" /></span></div></td>
            <td>{{ s.requirements.map(reqText).filter(Boolean).join('，') || '—' }}</td>
          </tr></tbody>
        </table></div>
      </template>
    </template>

    <template v-else-if="kind === 'quest'">
      <template v-for="[ch, list] in quests" :key="ch">
        <h2>{{ ch }}</h2>
        <div class="grid" style="grid-template-columns: repeat(auto-fill, minmax(320px, 1fr))">
          <div v-for="q in list" :id="`row-${q.id}`" :key="q.id" class="card" :class="{ hl: id === q.id }">
            <div class="ct"><Icon name="scroll" /> {{ q.name }}</div>
            <div class="cs">{{ q.description }}</div>
            <div v-if="q.prerequisites.length" class="cs">前置：<a v-for="p in q.prerequisites" :key="p" :href="href('quest', p)" class="tag">{{ C.quests[p]?.name ?? p }}</a></div>
            <ul style="margin: 6px 0; padding-left: 18px; font-size: 13px"><li v-for="(o, i) in q.objectives" :key="i">{{ describeObjective(o) }}</li></ul>
            <div><span v-for="(r, i) in rewardParts(q.rewards)" :key="i" class="tag"><IconText :text="r" /></span><span v-for="it in q.rewards.items ?? []" :key="it.id" class="tag"><WLink kind="item" :id="it.id" :qty="it.qty" /></span></div>
          </div>
        </div>
      </template>
    </template>

    <template v-else-if="kind === 'achievement'">
      <template v-for="[cat, list] in achievements" :key="cat">
        <h2>{{ cat }}（{{ list.length }}）</h2>
        <div class="grid">
          <div v-for="a in list" :key="a.id" class="card">
            <div class="ct"><Icon :name="a.hidden ? 'unknown' : a.icon" :seed="a.id" size="24" /> {{ a.name }}</div>
            <div class="cs">{{ a.hidden ? '隐藏成就' : a.description }}</div>
            <div v-if="a.reward"><span v-for="(r, i) in rewardParts(a.reward)" :key="i" class="tag"><IconText :text="r" /></span></div>
          </div>
        </div>
      </template>
    </template>

    <template v-else-if="kind === 'expansion'">
      <div v-for="e in EXPANSIONS" :key="e.id" class="card" style="margin-bottom: 10px">
        <div class="ct" style="font-size: 16px">{{ e.name }} <span class="tag">v{{ e.version }}</span></div>
        <p style="margin: 6px 0">{{ e.description }}</p>
        <div v-if="e.skills.length">新增技能：<span v-for="s in e.skills" :key="s" class="tag"><WLink kind="skill" :id="s" /></span></div>
        <div v-if="e.specialRules.length" style="margin-top: 4px">特色规则：<span v-for="r in e.specialRules" :key="r" class="tag">{{ r }}</span></div>
      </div>
      <h2><Icon name="crown" /> 游戏模式</h2>
      <div class="grid">
        <div v-for="m in Object.values(C.gameModes)" :key="m.id" class="card"><div class="ct">{{ m.name }}</div><div class="cs">{{ m.description }}</div></div>
      </div>
      <p class="muted">详见 <a :href="href('guide')">游戏机制</a>。</p>
    </template>

    <p v-else>页面不存在。<a :href="href('home')">返回首页</a></p>
  </div>
</template>

<style scoped>
.hl, tr.hl td { background: color-mix(in srgb, var(--accent) 16%, var(--panel)); }
</style>
