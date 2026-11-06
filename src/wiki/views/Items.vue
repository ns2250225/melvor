<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { C, href, EXPANSION_NAMES, droppedBy, producedBy, usedBy, skillName } from '../data';
import type { StatKey } from '@/game/core/types';
import { STAT_NAMES } from '@/game/combat/stats';
import { SLOT_NAMES, formatModifiers, dropTableRows, fmtChance, ATTACK_TYPE_NAMES } from '@/game/ui/combatHelpers';
import { full, fmtSec } from '@/app/format';
import WLink from '../WLink.vue';
import ItemIcon from '../WItem.vue';

const props = defineProps<{ id?: string }>();
const RARITY = ['普通', '稀有', '史诗', '传说'];
const RCOL = ['var(--muted)', '#4c8dff', '#b05cff', '#f2a93b'];

// ---------- 列表 ----------
const all = computed(() => Object.values(C.items));
const cats = computed(() => [...new Set(all.value.map((i) => i.category))]);
const cat = ref('');
const q = ref('');
const page = ref(0);
const PER = 120;
const filtered = computed(() => {
  const s = q.value.trim().toLowerCase();
  return all.value.filter((i) => (!cat.value || i.category === cat.value) && (!s || i.name.toLowerCase().includes(s) || i.id.includes(s)));
});
watch([cat, q], () => { page.value = 0; });
const shown = computed(() => filtered.value.slice(page.value * PER, (page.value + 1) * PER));
const pages = computed(() => Math.ceil(filtered.value.length / PER));

// ---------- 详情 ----------
const it = computed(() => (props.id ? C.items[props.id] : undefined));
const eq = computed(() => it.value?.equipment);
const stats = computed(() => Object.entries(eq.value?.stats ?? {}).filter(([, v]) => v) as [StatKey, number][]);
const chest = computed(() => dropTableRows(it.value?.dropTable));
const drops = computed(() => (props.id ? droppedBy(props.id) : []));
const made = computed(() => (props.id ? producedBy(props.id) : []));
const used = computed(() => (props.id ? usedBy(props.id) : []));
const shops = computed(() => Object.values(C.shop).filter((s) => s.grants?.some((g) => g.id === props.id)));
const notes = computed(() => (props.id ? C.itemSources[props.id] ?? [] : []));
</script>

<template>
  <div v-if="!id">
    <h1><Icon name="box" size="36" /> 物品</h1>
    <p class="lead">共 {{ all.length }} 件物品。可按银行分类筛选，或输入名称搜索。</p>
    <div class="filters">
      <input v-model="q" placeholder="搜索物品名称" style="min-width: 200px" />
      <button :class="{ on: !cat }" @click="cat = ''">全部</button>
      <button v-for="c in cats" :key="c" :class="{ on: cat === c }" @click="cat = c">{{ c }}</button>
    </div>
    <div class="grid">
      <a v-for="i in shown" :key="i.id" :href="href('item', i.id)" class="card">
        <div class="ct"><ItemIcon :id="i.id" :size="34" /> <span>{{ i.name }}<div class="cs">{{ i.category }} · <Icon name="coin" /> {{ full(i.sellPrice) }}</div></span></div>
      </a>
    </div>
    <div v-if="pages > 1" class="filters">
      <button v-for="p in pages" :key="p" :class="{ on: page === p - 1 }" @click="page = p - 1">{{ p }}</button>
    </div>
  </div>

  <div v-else-if="it">
    <aside class="infobox">
      <div class="ih"><ItemIcon :id="it.id" :size="88" /><div style="font-weight: 700; margin-top: 6px">{{ it.name }}</div></div>
      <dl>
        <dt>分类</dt><dd>{{ it.category }}</dd>
        <dt>稀有度</dt><dd :style="{ color: RCOL[it.rarity ?? 0] }">{{ RARITY[it.rarity ?? 0] }}</dd>
        <dt>出售价格</dt><dd>{{ it.noSell ? '不可出售' : '' }}<template v-if="!it.noSell"><Icon name="coin" /> {{ full(it.sellPrice) }}</template></dd>
        <template v-if="eq"><dt>装备栏位</dt><dd>{{ SLOT_NAMES[eq.slot] }}{{ eq.twoHanded ? '（双手）' : '' }}</dd></template>
        <template v-if="eq?.attackType"><dt>攻击方式</dt><dd>{{ ATTACK_TYPE_NAMES[eq.attackType] }}</dd></template>
        <template v-if="it.healsFor"><dt>恢复生命</dt><dd class="good">{{ it.healsFor }}</dd></template>
        <template v-if="it.prayerPoints"><dt>祈祷点</dt><dd>{{ it.prayerPoints }}</dd></template>
        <template v-if="it.soulPoints"><dt>灵魂点</dt><dd class="abyss">{{ it.soulPoints }}</dd></template>
        <dt>来源</dt><dd>{{ EXPANSION_NAMES[it.expansion] }}</dd>
        <dt>ID</dt><dd class="muted">{{ it.id }}</dd>
      </dl>
    </aside>
    <h1><ItemIcon :id="it.id" :size="40" /> {{ it.name }}</h1>
    <p v-if="it.description" class="lead">{{ it.description }}</p>

    <template v-if="eq">
      <h2><Icon name="shield" /> 装备属性</h2>
      <p v-if="eq.requirements.length">装备需求：<span v-for="(r, i) in eq.requirements" :key="i" class="tag">{{ skillName(r.skill) }} {{ r.abyssal ? '深渊 ' : '' }}{{ r.level }} 级</span></p>
      <div v-if="stats.length" class="tw" style="max-width: 420px"><table><tbody>
        <tr v-for="[k, v] in stats" :key="k"><td>{{ STAT_NAMES[k] }}</td><td class="num" :class="v > 0 ? 'good' : ''">{{ k === 'attackSpeed' ? fmtSec(v) : (v > 0 ? '+' : '') + v }}</td></tr>
      </tbody></table></div>
      <p v-if="eq.modifiers">特效：<span v-for="m in formatModifiers(eq.modifiers)" :key="m" class="tag">{{ m }}</span></p>
    </template>
    <template v-if="it.potion">
      <h2><Icon name="potion" /> 药水效果</h2>
      <p>{{ it.potion.skill === 'combat' ? '战斗' : skillName(it.potion.skill) }}药水 · {{ it.potion.charges }} 次充能 · <span v-for="m in formatModifiers(it.potion.modifiers)" :key="m" class="tag">{{ m }}</span></p>
    </template>
    <template v-if="chest.length">
      <h2><Icon name="chest" /> 开启可得</h2>
      <div class="tw"><table><thead><tr><th>物品</th><th class="num">数量</th><th class="num">几率</th></tr></thead><tbody>
        <tr v-for="r in chest" :key="r.id"><td><WLink kind="item" :id="r.id" /></td><td class="num">{{ r.min === r.max ? r.min : `${r.min}–${r.max}` }}</td><td class="num">{{ fmtChance(r.chance) }}</td></tr>
      </tbody></table></div>
    </template>

    <h2><Icon name="map" /> 获取途径</h2>
    <ul>
      <li v-for="a in made" :key="a"><WLink kind="skill" :id="C.actions[a].skill" /> · {{ C.actions[a].name }}（{{ C.actions[a].level }} 级）</li>
      <li v-for="d in drops.slice(0, 30)" :key="d.monster">掉落自 <WLink kind="monster" :id="d.monster" />（{{ d.chance >= 1 ? '必掉' : fmtChance(d.chance) }}）</li>
      <li v-if="drops.length > 30" class="muted">……另有 {{ drops.length - 30 }} 种怪物</li>
      <li v-for="s in shops" :key="s.id">商店「{{ s.name }}」<template v-if="s.cost.gp">：<Icon name="coin" /> {{ full(s.cost.gp) }}</template></li>
      <li v-for="n in notes" :key="n" class="muted">{{ n }}</li>
      <li v-if="!made.length && !drops.length && !shops.length && !notes.length" class="muted">暂无记录</li>
    </ul>
    <div class="clear" />
    <template v-if="used.length">
      <h2><Icon name="hammer" /> 用于制作</h2>
      <div class="tw"><table><thead><tr><th>技能</th><th>动作</th><th class="num">等级</th><th>产出</th></tr></thead><tbody>
        <tr v-for="a in used" :key="a"><td><WLink kind="skill" :id="C.actions[a].skill" /></td><td>{{ C.actions[a].name }}</td><td class="num">{{ C.actions[a].level }}</td>
          <td><span v-for="o in C.actions[a].outputs" :key="o.id" class="tag"><WLink kind="item" :id="o.id" :qty="o.qty" /></span></td></tr>
      </tbody></table></div>
    </template>
  </div>
  <p v-else>未找到物品「{{ id }}」。<a :href="href('item')">返回物品列表</a></p>
</template>
