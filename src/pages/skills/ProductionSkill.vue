<script setup lang="ts">
// 通用技能动作页面：采集 / 制造 / 偷窃 / 召唤 / 占星 等，以分类标签组织动作卡片
import { computed, reactive, ref } from 'vue';
import type { SkillId, SkillActionDef, ItemQty, ConstellationDef } from '@/game/core/types';
import { C } from '@/content';
import { useGameStore } from '@/stores/game';
import { scaledInterval, doubleChance, preservationChance, pickInputs, rockState, astroMaxLevel, astroCost } from '@/game/production/actions';
import { lightBonfire, setPassiveCooking, buyAstroModifier } from '@/game/production/special';
import { FISHING_AREAS, THIEVING_AREAS } from '@/content/recipes/gathering';
import { MARK_LEVELS } from '@/content/recipes/support';
import { playerMaxHp } from '@/game/combat/stats';
import { categoryName, describeMods, describeMod, modLabel, thievingSuccess, herbloreTier, runeMultiplier, synergyActive, equippedFamiliars } from '@/game/ui/skillHelpers';
import { fmt, pct, fmtMs, fmtSec } from '@/app/format';
import SkillHeader from '@/components/SkillHeader.vue';
import ItemIcon from '@/components/ItemIcon.vue';
import ItemList from '@/components/ItemList.vue';
import ProgressBar from '@/components/ProgressBar.vue';
import MasteryBar from '@/components/MasteryBar.vue';
import Requirements from '@/components/Requirements.vue';

const props = withDefaults(defineProps<{ skill: SkillId; only?: string; embedded?: boolean }>(), { only: '', embedded: false });
const store = useGameStore();
const g = computed(() => store.game!);
const s = computed(() => g.value.state);

// ------------------------------------------------------------------ 动作与分类
const actions = computed<SkillActionDef[]>(() => (C.actionsBySkill[props.skill] ?? []).filter((a) => !props.only || a.category === props.only));
const categories = computed<string[]>(() => {
  if (props.only) return [];
  const seen: string[] = [];
  for (const a of actions.value) if (a.category && !seen.includes(a.category)) seen.push(a.category);
  if (props.skill === 'fishing') return FISHING_AREAS.map((x) => x.id).filter((id) => seen.includes(id));
  if (props.skill === 'thieving') return THIEVING_AREAS.map((x) => x.id).filter((id) => seen.includes(id));
  if (props.skill === 'cooking') return ['fire', 'furnace', 'pot'].filter((id) => seen.includes(id));
  return seen;
});
const activeHere = computed(() => (s.value.activeAction?.skill === props.skill ? s.value.activeAction : null));
const activeDef = computed(() => (activeHere.value ? C.actions[activeHere.value.actionId] : null));
const tab = ref('');
const curTab = computed(() => {
  if (categories.value.includes(tab.value)) return tab.value;
  const ac = activeDef.value?.category;
  if (ac && categories.value.includes(ac)) return ac;
  return categories.value[0] ?? '';
});
const shown = computed(() => (categories.value.length ? actions.value.filter((a) => a.category === curTab.value) : actions.value));

// ------------------------------------------------------------------ 通用计算
function iv(a: SkillActionDef): number { void store.frame; return scaledInterval(g.value, props.skill, a.interval); }
function ivMax(a: SkillActionDef): number { void store.frame; return a.intervalMax ? scaledInterval(g.value, props.skill, a.intervalMax) : 0; }
function abyssHidden(a: SkillActionDef): boolean { return a.realm === 'abyssal' && !g.value.inAbyss(); }
function lockMsg(a: SkillActionDef): string | null {
  void store.frame;
  if (abyssHidden(a)) return '需要开启深渊之门';
  const e = g.value.actionUnlocked(a.id);
  if (e) return e;
  if (props.skill === 'fishing') {
    const area = FISHING_AREAS.find((x) => x.id === a.category);
    if (area && !g.value.meetsAll(area.requirements)) return `钓区「${area.name}」未解锁`;
  }
  if (props.skill === 'summoning') {
    const fam = C.familiars[a.data?.familiar];
    if (fam && g.value.markLevel(fam.id) < 1) return `尚未发现${fam.name}的印记`;
  }
  return null;
}
function isActive(a: SkillActionDef) { return activeHere.value?.actionId === a.id; }
function isSecondary(a: SkillActionDef) { return props.skill === 'woodcutting' && !!activeHere.value?.secondaryId && activeHere.value.secondaryId === a.id; }
function dbl(a: SkillActionDef) { void store.frame; return doubleChance(g.value, props.skill, a.id); }
function pres(a: SkillActionDef) { void store.frame; return preservationChance(g.value, props.skill, a.id); }
const hasInputs = (a: SkillActionDef) => a.inputs.length > 0 || !!a.altInputs?.length;
const largeCards = computed(() => props.skill === 'summoning' || props.skill === 'thieving' || shown.value.some((a) => !!a.altInputs?.length));

// 替代材料选择：undefined = 自动
const altSel = reactive<Record<string, number | undefined>>({});
function inputSets(a: SkillActionDef): ItemQty[][] { return [a.inputs, ...(a.altInputs ?? [])]; }
function shownInputs(a: SkillActionDef): ItemQty[] {
  const sel = altSel[a.id];
  if (sel !== undefined) return inputSets(a)[sel] ?? a.inputs;
  if (isActive(a) && activeHere.value?.target !== undefined && activeHere.value.target !== '') return inputSets(a)[Number(activeHere.value.target)] ?? a.inputs;
  void store.frame;
  return pickInputs(g.value, a) ?? a.inputs;
}
function setAlt(a: SkillActionDef, idx: number | undefined) { altSel[a.id] = idx; }

function start(a: SkillActionDef) {
  const sel = altSel[a.id];
  const target = sel === undefined ? undefined : String(sel);
  store.act(() => g.value.startAction(props.skill, a.id, target), { silent: true });
}
function stop() { store.act(() => { g.value.stopAction(); return null; }); }
/** 双树伐木：只保留主树 */
function dropSecondary() {
  const aa = activeHere.value;
  if (!aa) return;
  store.act(() => g.value.startAction('woodcutting', aa.actionId), { silent: true });
}
function startLabel(a: SkillActionDef) {
  if (props.skill === 'woodcutting' && activeHere.value && s.value.shop['multi_tree']) return '同时砍伐';
  return activeHere.value ? '切换' : '开始';
}
function progress(): number {
  const aa = activeHere.value;
  return aa && aa.interval ? aa.progress / aa.interval : 0;
}
function secondaryProgress(): number {
  const aa = activeHere.value;
  if (!aa?.secondaryId) return 0;
  const total = aa.secondaryInterval || scaledInterval(g.value, 'woodcutting', C.actions[aa.secondaryId].interval);
  return (aa.secondaryProgress || 0) / total;
}

// ------------------------------------------------------------------ 伐木
const multiTree = computed(() => !!s.value.shop['multi_tree']);
function nestChance(a: SkillActionDef) { return (a.extraDrops?.find((e) => e.id === 'bird_nest')?.chance ?? 0) * 100; }

// ------------------------------------------------------------------ 钓鱼
const fishingArea = computed(() => (props.skill === 'fishing' ? FISHING_AREAS.find((x) => x.id === curTab.value) ?? null : null));
const areaLocked = computed(() => {
  const a = fishingArea.value;
  if (!a) return null;
  if (a.realm === 'abyssal' && !g.value.inAbyss()) return '需要开启深渊之门';
  if (!g.value.meetsAll(a.requirements)) return '钓区未解锁';
  return null;
});
function junkChance(a: SkillActionDef) {
  void store.frame;
  const area = FISHING_AREAS.find((x) => x.id === a.category);
  return area ? area.junkChance * Math.max(0, 1 - g.value.masteryLevel(a.id) / 66) * 100 : 0;
}
const specialChance = computed(() => { void store.frame; const a = fishingArea.value; return a ? (a.specialChance + g.value.mods.get('fishingSpecialChance') / 100) * 100 : 0; });

// ------------------------------------------------------------------ 采矿
function rock(a: SkillActionDef) { void store.frame; return rockState(g.value, a.id); }
const gemChance = computed(() => { void store.frame; return 1 + g.value.mods.get('miningGemChance'); });

// ------------------------------------------------------------------ 生火
const bonfireLeft = computed(() => { void store.frame; return Math.max(0, s.value.bonfire.endsAt - s.value.clock); });
function bonfire(a: SkillActionDef) { store.act(() => lightBonfire(g.value, a.id)); }

// ------------------------------------------------------------------ 烹饪
const COOK_CATS = ['fire', 'furnace', 'pot'];
const activeCookCat = computed(() => (props.skill === 'cooking' ? activeDef.value?.category ?? null : null));
function passiveOptions(cat: string) { return actions.value.filter((a) => a.category === cat && !lockMsg(a)); }
function passiveRecipe(cat: string) { const id = s.value.cooking.passive[cat]; return id ? C.actions[id] : null; }
function passiveProgress(cat: string) {
  void store.frame;
  const a = passiveRecipe(cat);
  if (!a) return 0;
  return (s.value.cooking.timers[cat] || 0) / (scaledInterval(g.value, 'cooking', a.interval) * 5);
}
function setPassive(cat: string, ev: Event) {
  const v = (ev.target as HTMLSelectElement).value;
  store.act(() => setPassiveCooking(g.value, cat, v || null));
}

// ------------------------------------------------------------------ 药剂 / 符文
function tierInfo(a: SkillActionDef) {
  void store.frame;
  const tiers = (a.data?.tiers as string[] | undefined) ?? [];
  const req = (a.data?.tierMastery as number[] | undefined) ?? [];
  const t = herbloreTier(g.value, a);
  return { item: tiers[t], tier: t + 1, next: req[t + 1] };
}
function rcInfo(a: SkillActionDef) {
  const levels = (a.data?.multiplierLevels as number[] | undefined) ?? [];
  const mult = runeMultiplier(g.value, a);
  const next = levels.find((l) => g.value.level('runecrafting') < l);
  return { mult, next, has: levels.length > 0 };
}

// ------------------------------------------------------------------ 召唤
function familiarOf(a: SkillActionDef) { return C.familiars[a.data?.familiar as string]; }
function marks(fid: string) { return s.value.summoning.marks[fid] || 0; }
function nextMark(fid: string) { const lv = g.value.markLevel(fid); return MARK_LEVELS[lv] ?? null; }
const tabletBonus = computed(() => Math.floor(g.value.level('summoning') / 10));
const equippedFams = computed(() => equippedFamiliars(g.value));
const showSynergies = ref(false);

// ------------------------------------------------------------------ 偷窃
const maxHp = computed(() => { void store.frame; return playerMaxHp(g.value); });
const thievingArea = computed(() => (props.skill === 'thieving' ? THIEVING_AREAS.find((x) => x.id === curTab.value) ?? null : null));
function successChance(a: SkillActionDef) { void store.frame; return thievingSuccess(g.value, a); }
function oneIn(chance: number) { return chance > 0 ? `1/${fmt(Math.round(1 / chance))}` : '—'; }

// ------------------------------------------------------------------ 收割
function intensity(a: SkillActionDef) { return s.value.harvesting.intensity[a.id] || 0; }

// ------------------------------------------------------------------ 占星
const selectedCons = ref('');
const consAction = computed(() => {
  if (props.skill !== 'astrology') return null;
  const id = selectedCons.value || activeHere.value?.actionId || actions.value[0]?.id;
  return id ? C.actions[id] : null;
});
const cons = computed<ConstellationDef | null>(() => (consAction.value ? C.constellations[consAction.value.data?.constellation] ?? null : null));
function astroCurrency(c: ConstellationDef, unique: boolean) { return c.realm === 'abyssal' ? 'abyssal_stardust' : unique ? 'golden_stardust' : 'stardust'; }
function astroPrice(c: ConstellationDef, unique: boolean, cur: number) { return c.realm === 'abyssal' ? Math.ceil(astroCost(cur, unique) / 10) : astroCost(cur, unique); }
function astroCap(c: ConstellationDef, unique: boolean) { void store.frame; return astroMaxLevel(g.value, c.id, unique); }
function astroLevel(c: ConstellationDef, unique: boolean, idx: number) { const st = s.value.astrology[c.id]; return (unique ? st?.uniq[idx] : st?.std[idx]) ?? 0; }
function buyAstro(c: ConstellationDef, unique: boolean, idx: number) { store.act(() => buyAstroModifier(g.value, c.id, unique, idx)); }
function stardustChances(a: SkillActionDef) {
  void store.frame;
  const m = g.value.masteryLevel(a.id);
  if (a.realm === 'abyssal') return [{ id: 'abyssal_stardust', chance: 5 + m / 10 }];
  return [{ id: 'stardust', chance: 30 + m / 5 }, { id: 'golden_stardust', chance: 2 + m / 20 }];
}
function skillNames(list: SkillId[]) { return list.map((x) => C.skills[x]?.name ?? x).join('、'); }
</script>

<template>
  <div class="prod">
    <SkillHeader v-if="!embedded" :skill="skill" />

    <!-- 当前动作 -->
    <div v-if="!embedded && activeHere && activeDef" class="panel">
      <div class="row between">
        <div class="row">
          <span class="big">{{ activeDef.icon }}</span>
          <div>
            <div><b>正在进行：{{ activeDef.name }}</b><span v-if="activeHere.secondaryId" class="muted"> ＋ {{ C.actions[activeHere.secondaryId]?.name }}</span></div>
            <div class="muted small">本次已完成 {{ fmt(activeHere.completed) }} 次 · 耗时 {{ fmtSec(activeHere.interval) }}</div>
          </div>
        </div>
        <button class="danger" @click="stop">停止</button>
      </div>
      <ProgressBar class="mt" :value="progress()" :height="8" />
      <ProgressBar v-if="activeHere.secondaryId" class="mt" :value="secondaryProgress()" color="var(--good)" :height="6" />
    </div>

    <!-- 技能专属信息面板 -->
    <div v-if="skill === 'woodcutting'" class="panel small">
      <div v-if="multiTree" class="good">🌲 已解锁双树伐木：砍伐时点击另一棵树的「同时砍伐」，两棵树将各自独立计时。</div>
      <div v-else class="muted">在商店购买「双树伐木」升级后可同时砍伐两棵树。</div>
      <div class="muted">每次砍伐有几率获得 <ItemIcon id="bird_nest" :size="18" /> 鸟巢（内含种子），双倍产出同样适用于木材。</div>
    </div>

    <div v-if="skill === 'mining'" class="panel small muted">
      ⛏️ 采矿（非符文精华矿脉）时每次有 <b class="gold">{{ pct(gemChance) }}</b> 几率额外获得宝石。矿脉耗尽后需等待重生，掌握度越高矿脉生命越多、重生越快。
    </div>

    <div v-if="skill === 'firemaking'" class="panel">
      <div class="row between">
        <div>
          <h3>🔥 篝火</h3>
          <div v-if="bonfireLeft > 0" class="good small">篝火燃烧中：生火经验 +{{ s.bonfire.bonus }}% · 剩余 {{ fmtMs(bonfireLeft) }}</div>
          <div v-else class="muted small">篝火未点燃。在下方木材卡片上点击「篝火」消耗 10 个木材点燃篝火，持续期间生火经验提高。</div>
        </div>
        <span v-if="bonfireLeft > 0" class="tag good">燃烧中</span>
      </div>
    </div>

    <div v-if="skill === 'cooking'" class="panel">
      <h3>🍲 被动烹饪</h3>
      <div class="muted small mb">主动烹饪时，另外两个烹饪设施可以以 5 倍耗时同时进行被动烹饪（成功率 -10%）。仅在主动烹饪期间运行。</div>
      <div class="cards sm">
        <div v-for="cat in COOK_CATS" :key="cat" class="card">
          <div class="row between"><b>{{ categoryName(cat) }}</b><span v-if="activeCookCat === cat" class="tag good">主动烹饪中</span></div>
          <select :value="s.cooking.passive[cat] ?? ''" :disabled="activeCookCat === cat" @change="setPassive(cat, $event)">
            <option value="">— 不使用 —</option>
            <option v-for="o in passiveOptions(cat)" :key="o.id" :value="o.id">{{ o.name }}（{{ g.qty(o.inputs[0]?.id ?? '') }}）</option>
          </select>
          <template v-if="passiveRecipe(cat)">
            <ItemList :items="passiveRecipe(cat)!.inputs" check :size="22" />
            <ProgressBar :value="activeCookCat && activeCookCat !== cat ? passiveProgress(cat) : 0" color="var(--warn)" :height="6" />
            <div class="tiny muted">每次 {{ fmtSec(iv(passiveRecipe(cat)!) * 5) }}{{ !activeCookCat ? ' · 暂停（未在主动烹饪）' : activeCookCat === cat ? ' · 暂停（该设施正在主动烹饪）' : '' }}</div>
          </template>
        </div>
      </div>
    </div>

    <div v-if="skill === 'thieving'" class="panel small">
      <div class="row between">
        <span>❤️ 当前生命 <b :class="s.hp < maxHp * 0.3 ? 'bad' : ''">{{ fmt(s.hp) }}</b> / {{ fmt(maxHp) }}</span>
        <span class="muted">偷窃失败会受到伤害并被击晕 3 秒；成功率 = (100 + 潜行) / (100 + 感知)</span>
      </div>
      <div class="muted">潜行 = 偷窃等级 {{ g.level('thieving') }} + 掌握度 + 加成 {{ g.mods.get('thievingStealth') }}</div>
    </div>

    <div v-if="skill === 'summoning'" class="panel small">
      <div class="row between">
        <div>
          <div>使用对应技能时有几率发现召唤兽印记；至少拥有 1 个印记才能制作召唤石板。印记等级 ≥ 3 的两只召唤兽同时装备时激活协同效果。</div>
          <div class="muted">当前装备：
            <template v-if="equippedFams.length"><span v-for="f in equippedFams" :key="f" class="tag">{{ C.familiars[f].icon }} {{ C.familiars[f].name }}</span></template>
            <span v-else>无</span>
          </div>
        </div>
        <div class="row">
          <button class="small" @click="showSynergies = !showSynergies">{{ showSynergies ? '隐藏协同' : '🔗 协同效果' }}</button>
          <button class="small primary" @click="store.go('equipment')">🛡️ 装备石板</button>
        </div>
      </div>
      <div v-if="showSynergies" class="mt">
        <table>
          <thead><tr><th>召唤兽组合</th><th>效果</th><th>状态</th></tr></thead>
          <tbody>
            <tr v-for="(syn, i) in C.synergies" :key="i">
              <td class="nowrap">
                {{ C.familiars[syn.a]?.icon }} {{ C.familiars[syn.a]?.name }} <span class="tiny muted">印记 {{ g.markLevel(syn.a) }}</span>
                ＋ {{ C.familiars[syn.b]?.icon }} {{ C.familiars[syn.b]?.name }} <span class="tiny muted">印记 {{ g.markLevel(syn.b) }}</span>
              </td>
              <td>{{ syn.description }}</td>
              <td><span v-if="synergyActive(g, syn)" class="tag good">生效中</span><span v-else class="tag">未激活</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 分类标签 -->
    <div v-if="categories.length > 1" class="tabs mt">
      <button v-for="c in categories" :key="c" :class="{ on: c === curTab }" @click="tab = c">
        {{ skill === 'fishing' ? FISHING_AREAS.find((x) => x.id === c)?.icon : skill === 'thieving' ? THIEVING_AREAS.find((x) => x.id === c)?.icon : '' }} {{ categoryName(c) }}
      </button>
    </div>

    <div v-if="fishingArea" class="panel small">
      <div class="row between">
        <b>{{ fishingArea.icon }} {{ fishingArea.name }}</b>
        <span v-if="areaLocked" class="tag bad">🔒 {{ areaLocked }}</span>
      </div>
      <Requirements :reqs="fishingArea.requirements" />
      <div class="muted">基础杂物几率 {{ pct(fishingArea.junkChance * 100) }}（掌握度越高越低） · 特殊物品几率 {{ pct(specialChance, 2) }}</div>
    </div>

    <div v-if="thievingArea" class="panel small row">
      <b>{{ thievingArea.icon }} {{ thievingArea.name }}</b>
      <span class="muted">区域珍宝：</span>
      <ItemIcon :id="thievingArea.unique.id" :size="24" />
      <span>{{ C.items[thievingArea.unique.id]?.name }} · {{ oneIn(thievingArea.unique.chance) }}</span>
      <span class="muted tiny">{{ C.items[thievingArea.unique.id]?.description }}</span>
    </div>

    <!-- 占星：星座详情 -->
    <div v-if="skill === 'astrology' && cons && consAction" class="panel">
      <div class="row between">
        <div>
          <h3>{{ cons.icon }} {{ cons.name }}</h3>
          <div class="muted small">关联技能：{{ skillNames(cons.skills) }} · 掌握度 {{ g.masteryLevel(consAction.id) }}</div>
        </div>
        <div class="row small">
          <span v-for="cur in (cons.realm === 'abyssal' ? ['abyssal_stardust'] : ['stardust', 'golden_stardust'])" :key="cur" class="row nowrap">
            <ItemIcon :id="cur" :size="22" /> {{ fmt(g.qty(cur)) }}
          </span>
        </div>
      </div>
      <div class="muted tiny mb">标准修饰：每 20 掌握度可多购买 1 级（最高 5 级）；独特修饰：掌握度 50 起解锁，之后每 10 级 +1。</div>
      <template v-for="unique in [false, true]" :key="String(unique)">
        <h4>{{ unique ? '独特修饰' : '标准修饰' }} <span class="muted small">（当前可购买至 {{ astroCap(cons, unique) }} 级）</span></h4>
        <div class="col mb">
          <div v-for="(m, idx) in (unique ? cons.unique : cons.standard)" :key="m.key" class="row between astro-row">
            <div class="grow">
              <div>{{ modLabel(m.key) }} {{ m.perLevel > 0 ? '+' : '' }}{{ m.perLevel }}/级</div>
              <div class="tiny muted">等级 {{ astroLevel(cons, unique, idx) }} / {{ m.maxLevel }} · 当前效果：{{ astroLevel(cons, unique, idx) ? describeMod(m.key, m.perLevel * astroLevel(cons, unique, idx)) : '无' }}</div>
            </div>
            <template v-if="astroLevel(cons, unique, idx) < m.maxLevel">
              <span class="row nowrap small"><ItemIcon :id="astroCurrency(cons, unique)" :size="20" /> {{ fmt(astroPrice(cons, unique, astroLevel(cons, unique, idx))) }}</span>
              <button class="small primary" :disabled="astroLevel(cons, unique, idx) >= astroCap(cons, unique) || g.qty(astroCurrency(cons, unique)) < astroPrice(cons, unique, astroLevel(cons, unique, idx))" @click="buyAstro(cons, unique, idx)">升级</button>
            </template>
            <span v-else class="tag good">已满级</span>
          </div>
        </div>
      </template>
    </div>

    <!-- 动作卡片 -->
    <div v-if="!shown.length" class="empty">没有可用的动作</div>
    <div class="cards" :class="{ lg: largeCards }">
      <template v-for="a in shown" :key="a.id">
        <!-- 深渊动作（未开启深渊） -->
        <div v-if="abyssHidden(a)" class="card locked">
          <div class="row"><span class="big">{{ a.icon }}</span><b>{{ a.name }}</b></div>
          <div class="abyss small">🔒 需要开启深渊之门</div>
        </div>
        <div v-else class="card" :class="{ active: isActive(a) || isSecondary(a), locked: !!lockMsg(a) }">
          <div class="row between nowrap">
            <div class="row nowrap">
              <span class="big">{{ a.icon }}</span>
              <div>
                <b>{{ a.name }}</b>
                <div class="tiny muted">
                  Lv {{ a.level }}<span v-if="a.abyssalLevel" class="abyss"> · 深渊 {{ a.abyssalLevel }}</span>
                  · {{ a.intervalMax ? `${fmtSec(iv(a))}–${fmtSec(ivMax(a))}` : fmtSec(iv(a)) }}
                  · {{ fmt(a.xp) }} XP<span v-if="a.abyssalXp" class="abyss"> · {{ fmt(a.abyssalXp) }} AXP</span>
                  <span v-if="a.gp"> · 🪙{{ fmt(a.gp) }}</span>
                </div>
              </div>
            </div>
            <span v-if="isActive(a)" class="tag good">进行中</span>
            <span v-else-if="isSecondary(a)" class="tag good">第二棵树</span>
          </div>

          <div v-if="lockMsg(a)" class="bad small">🔒 {{ lockMsg(a) }}</div>
          <Requirements v-if="a.requirements?.length" :reqs="a.requirements" />

          <!-- 召唤兽信息 -->
          <template v-if="skill === 'summoning' && familiarOf(a)">
            <div class="small">
              印记 <b class="gold">{{ marks(familiarOf(a).id) }}</b> · 印记等级 <b>{{ g.markLevel(familiarOf(a).id) }}</b> / {{ MARK_LEVELS.length }}
              <span v-if="nextMark(familiarOf(a).id)" class="muted">（下一级需 {{ nextMark(familiarOf(a).id) }} 个）</span>
            </div>
            <div class="tiny muted">印记来源：{{ skillNames(familiarOf(a).markSkills) }}</div>
            <div class="tiny">
              <span v-if="familiarOf(a).combat" class="tag">⚔️ 战斗召唤兽 · 最大伤害 {{ familiarOf(a).combat!.maxHit }}</span>
              <span v-for="d in describeMods(familiarOf(a).modifiers)" :key="d" class="tag">{{ d }}</span>
            </div>
          </template>

          <!-- 偷窃 NPC 信息 -->
          <template v-if="skill === 'thieving' && a.data">
            <div class="kv">
              <span>成功率</span><span :class="successChance(a) >= 90 ? 'good' : successChance(a) < 60 ? 'bad' : ''">{{ pct(successChance(a)) }}</span>
              <span>感知</span><span>{{ a.data.perception }}</span>
              <span>最大伤害</span><span>{{ fmt(a.data.maxHit) }}<span v-if="s.hp <= a.data.maxHit" class="bad tiny"> ⚠️ 当前生命可能不足</span></span>
              <span v-if="a.data.gpMax > 0">金币</span><span v-if="a.data.gpMax > 0">🪙 1–{{ fmt(a.data.gpMax) }}</span>
              <span v-if="a.data.abyssalPiecesMax > 0">深渊碎片</span><span v-if="a.data.abyssalPiecesMax > 0" class="abyss">1–{{ a.data.abyssalPiecesMax }}</span>
            </div>
            <div class="row small">
              <span class="muted">稀有：</span><ItemIcon :id="a.data.unique.id" :size="24" />
              <span>{{ C.items[a.data.unique.id]?.name }} · {{ oneIn(a.data.unique.chance) }}</span>
            </div>
          </template>

          <!-- 材料 -->
          <template v-if="hasInputs(a)">
            <div v-if="a.altInputs?.length" class="row tiny alt">
              <span class="muted">材料方案：</span>
              <button class="small" :class="{ primary: altSel[a.id] === undefined }" @click="setAlt(a, undefined)">自动</button>
              <button v-for="(_, i) in inputSets(a)" :key="i" class="small" :class="{ primary: altSel[a.id] === i }" @click="setAlt(a, i)">{{ i === 0 ? '主配方' : `替代 ${i}` }}</button>
            </div>
            <div class="small muted">材料</div>
            <ItemList :items="shownInputs(a)" check :size="28" />
          </template>

          <!-- 产出 -->
          <template v-if="skill === 'herblore' && a.data?.tiers">
            <div class="small muted">产出（品阶 {{ tierInfo(a).tier }}<span v-if="tierInfo(a).next"> · 掌握度 {{ tierInfo(a).next }} 升阶</span>）</div>
            <ItemList :items="[{ id: tierInfo(a).item, qty: 1 }]" :size="28" show-name />
          </template>
          <template v-else-if="skill === 'summoning'">
            <div class="small muted">产出（召唤等级加成 +{{ tabletBonus }}）</div>
            <ItemList :items="a.outputs.map((o) => ({ id: o.id, qty: o.qty + tabletBonus }))" :size="28" show-name />
          </template>
          <template v-else-if="skill === 'runecrafting' && rcInfo(a).has">
            <div class="small muted">产出 ×{{ rcInfo(a).mult }}<span v-if="rcInfo(a).next"> · 符文制作 {{ rcInfo(a).next }} 级时提升</span></div>
            <ItemList :items="a.outputs.map((o) => ({ id: o.id, qty: o.qty * rcInfo(a).mult }))" :size="28" show-name />
          </template>
          <template v-else-if="skill === 'astrology'">
            <div class="small muted">每次观测几率获得</div>
            <div class="row small">
              <span v-for="c in stardustChances(a)" :key="c.id" class="row nowrap"><ItemIcon :id="c.id" :size="22" /> {{ pct(c.chance) }}</span>
            </div>
          </template>
          <template v-else-if="a.outputs.length">
            <div class="small muted">产出</div>
            <ItemList :items="a.outputs" :size="28" show-name />
          </template>

          <!-- 技能专属 -->
          <div v-if="skill === 'woodcutting'" class="tiny muted">鸟巢几率 {{ pct(nestChance(a), 2) }}</div>
          <div v-if="skill === 'fishing'" class="tiny muted">杂物几率 {{ pct(junkChance(a)) }}</div>
          <template v-if="skill === 'mining' && !a.data?.isEssence">
            <div class="row between tiny"><span>矿脉 {{ rock(a).hp }} / {{ rock(a).maxHp }}</span><span v-if="rock(a).respawnIn > 0" class="warn">重生中 {{ fmtMs(rock(a).respawnIn) }}</span></div>
            <ProgressBar :value="rock(a).hp / rock(a).maxHp" :color="rock(a).respawnIn > 0 ? 'var(--bad)' : 'var(--good)'" :height="5" />
          </template>
          <template v-if="skill === 'harvesting'">
            <div class="row between tiny"><span>强度 {{ fmt(intensity(a)) }} / {{ fmt(a.data?.maxIntensity ?? 10000) }}</span><span class="muted">产量 ×{{ 1 + Math.floor(intensity(a) / 2500) }}</span></div>
            <ProgressBar :value="intensity(a) / (a.data?.maxIntensity ?? 10000)" color="var(--abyss)" :height="5" />
          </template>

          <div v-if="skill !== 'thieving' && skill !== 'astrology'" class="tiny muted">
            双倍 {{ pct(dbl(a)) }}<template v-if="hasInputs(a)"> · 节省 {{ pct(pres(a)) }}</template>
          </div>
          <div v-else-if="skill === 'thieving'" class="tiny muted">双倍掉落 {{ pct(dbl(a)) }}</div>

          <MasteryBar :action-id="a.id" />
          <ProgressBar v-if="isActive(a)" :value="progress()" :height="6" />
          <ProgressBar v-else-if="isSecondary(a)" :value="secondaryProgress()" color="var(--good)" :height="6" />

          <div class="row">
            <button v-if="isActive(a)" class="danger small grow" @click="stop">停止</button>
            <button v-else-if="isSecondary(a)" class="small grow" @click="dropSecondary">停止此树</button>
            <button v-else class="primary small grow" :disabled="!!lockMsg(a) || (skill === 'fishing' && !!areaLocked)" @click="start(a)">{{ startLabel(a) }}</button>
            <button v-if="skill === 'firemaking'" class="small" :disabled="!!lockMsg(a) || bonfireLeft > 0 || g.qty(a.inputs[0]?.id ?? '') < (a.data?.bonfireLogs ?? 10)" @click="bonfire(a)">🔥 篝火（{{ a.data?.bonfireLogs ?? 10 }}）</button>
            <button v-if="skill === 'astrology'" class="small" :class="{ primary: consAction?.id === a.id }" @click="selectedCons = a.id">✨ 修饰</button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.big { font-size: 26px; line-height: 1; }
.alt { gap: 4px; }
.astro-row { padding: 6px 0; border-bottom: 1px solid var(--border); }
.nowrap { white-space: nowrap; }
td.nowrap { white-space: normal; }
.panel + .cards, .tabs + .cards, .panel + .empty { margin-top: 12px; }
.prod > .panel { margin-top: 12px; }
.prod > .panel:first-child { margin-top: 0; }
</style>
