<script setup lang="ts">
// 考古：发掘点挖掘、工具升级、博物馆捐赠与代币商店
import { computed, ref } from 'vue';
import { C } from '@/content';
import { useGameStore } from '@/stores/game';
import type { ArtifactSize, DigSiteDef } from '@/game/core/types';
import { ARCH_TOOLS, ARTIFACT_BASE_CHANCE, MAP_TIERS } from '@/content/recipes/support';
import { scaledInterval, mapBonus, doubleChance } from '@/game/production/actions';
import { upgradeTool, toolUpgradeCost, donateArtifact, MUSEUM_SHOP, museumBuy, MUSEUM_MILESTONES } from '@/game/production/special';
import { fmt, full, fmtSec, pct } from '@/app/format';
import SkillHeader from '@/components/SkillHeader.vue';
import ItemIcon from '@/components/ItemIcon.vue';
import ItemList from '@/components/ItemList.vue';
import ProgressBar from '@/components/ProgressBar.vue';
import MasteryBar from '@/components/MasteryBar.vue';

const store = useGameStore();
const g = computed(() => store.game!);
const s = computed(() => g.value.state);
const SIZES: ArtifactSize[] = ['tiny', 'small', 'medium', 'large'];
const SIZE_NAMES: Record<ArtifactSize, string> = { tiny: '微小', small: '小型', medium: '中型', large: '大型' };

const section = ref<'dig' | 'tools' | 'museum'>('dig');
const sites = computed(() => Object.values(C.digSites));
const active = computed(() => (s.value.activeAction?.skill === 'archaeology' ? s.value.activeAction : null));
function actionId(site: DigSiteDef) { return `dig_${site.id}`; }
function abyssHidden(site: DigSiteDef) { return site.realm === 'abyssal' && !g.value.inAbyss(); }
function discovered(site: DigSiteDef) { return s.value.cartography.discovered.includes(`poi_${site.id}`); }
function map(site: DigSiteDef) { return s.value.cartography.maps[site.id]; }
function lockMsg(site: DigSiteDef): string | null {
  void store.frame;
  if (abyssHidden(site)) return '需要开启深渊之门';
  const e = g.value.actionUnlocked(actionId(site));
  if (e) return e;
  if ((map(site)?.charges || 0) <= 0) return '需要该发掘点的地图（在制图技能中制作）';
  return null;
}
function iv(site: DigSiteDef) { void store.frame; return scaledInterval(g.value, 'archaeology', C.actions[actionId(site)].interval); }
function chances(site: DigSiteDef) {
  void store.frame;
  const bonus = (g.value.mods.get('artifactChance') + mapBonus(map(site)?.tier ?? 1)) / 100 + g.value.masteryLevel(actionId(site)) / 400;
  return SIZES.map((size) => ({ size, chance: ARTIFACT_BASE_CHANCE[size] * (1 + s.value.archaeology.tools[size] * 0.25) * (1 + bonus) * 100 }));
}
function dbl(site: DigSiteDef) { void store.frame; return doubleChance(g.value, 'archaeology', actionId(site)); }
function start(site: DigSiteDef) { store.act(() => g.value.startAction('archaeology', actionId(site)), { silent: true }); }
function stop() { store.act(() => { g.value.stopAction(); return null; }); }

// 工具
function toolCost(size: ArtifactSize) { void store.frame; return toolUpgradeCost(g.value, size); }
function toolLvlReq(size: ArtifactSize) { return (s.value.archaeology.tools[size] + 1) * 15; }
function canUpgrade(size: ArtifactSize) {
  const c = toolCost(size);
  return !!c && g.value.level('archaeology') >= toolLvlReq(size) && s.value.currencies.gp >= c.gp && g.value.hasItems(c.items);
}

// 博物馆
const allArtifacts = computed(() => sites.value.flatMap((site) => SIZES.flatMap((size) => site.artifacts[size])));
const donatedCount = computed(() => Object.keys(s.value.archaeology.museum).length);
const museumSite = ref(sites.value[0]?.id ?? '');
const museumSiteDef = computed(() => C.digSites[museumSite.value]);
function siteDonated(site: DigSiteDef) { return SIZES.flatMap((sz) => site.artifacts[sz]).filter((id) => s.value.archaeology.museum[id]).length; }
function siteTotal(site: DigSiteDef) { return SIZES.reduce((n, sz) => n + site.artifacts[sz].length, 0); }
</script>

<template>
  <div>
    <SkillHeader skill="archaeology" />

    <div v-if="active" class="panel">
      <div class="row between">
        <div>
          <b>正在发掘：{{ C.actions[active.actionId]?.name }}</b>
          <div class="small muted">地图剩余 {{ s.cartography.maps[C.actions[active.actionId]?.data?.digSite]?.charges ?? 0 }} 次 · 本次已完成 {{ active.completed }} 次</div>
        </div>
        <button class="danger" @click="stop">停止</button>
      </div>
      <ProgressBar class="mt" :value="active.interval ? active.progress / active.interval : 0" :height="8" />
    </div>

    <div class="tabs mt">
      <button :class="{ on: section === 'dig' }" @click="section = 'dig'">⛏️ 发掘点</button>
      <button :class="{ on: section === 'tools' }" @click="section = 'tools'">🧰 工具</button>
      <button :class="{ on: section === 'museum' }" @click="section = 'museum'">🏛️ 博物馆（{{ donatedCount }}/{{ allArtifacts.length }}）</button>
    </div>

    <template v-if="section === 'dig'">
      <div class="panel small muted">发掘需要先在制图技能中勘测发现发掘点，并为其制作地图；每次发掘消耗 1 次地图充能。文物几率受工具等级、地图品阶、掌握度与加成影响。</div>
      <div class="cards lg mt">
        <template v-for="site in sites" :key="site.id">
          <div v-if="abyssHidden(site)" class="card locked">
            <b>{{ site.icon }} {{ site.name }}</b>
            <div class="abyss small">🔒 需要开启深渊之门</div>
          </div>
          <div v-else class="card" :class="{ active: active?.actionId === actionId(site), locked: !!lockMsg(site) }">
            <div class="row between nowrap">
              <b>{{ site.icon }} {{ site.name }}</b>
              <span class="tiny muted">Lv {{ site.level }}<span v-if="site.abyssalLevel" class="abyss"> · 深渊 {{ site.abyssalLevel }}</span></span>
            </div>
            <div class="tiny muted">{{ fmtSec(iv(site)) }} · {{ site.xp }} XP<span v-if="C.actions[actionId(site)].abyssalXp" class="abyss"> · {{ C.actions[actionId(site)].abyssalXp }} AXP</span> · 双倍 {{ pct(dbl(site)) }}</div>
            <div class="row tiny">
              <span class="tag" :class="discovered(site) ? 'good' : 'bad'">{{ discovered(site) ? '已发现' : '未发现（需在制图中勘测）' }}</span>
              <span class="tag" :class="(map(site)?.charges || 0) > 0 ? 'good' : 'bad'">
                地图：{{ map(site) ? `${MAP_TIERS.find((t) => t.tier === map(site)!.tier)?.name} ×${map(site)!.charges}` : '无' }}
              </span>
            </div>
            <div v-if="lockMsg(site)" class="small bad">🔒 {{ lockMsg(site) }}</div>
            <div class="chances">
              <div v-for="c in chances(site)" :key="c.size" class="row between tiny">
                <span>{{ SIZE_NAMES[c.size] }}文物</span>
                <span class="row nowrap">
                  <ItemIcon v-for="id in site.artifacts[c.size]" :key="id" :id="id" :size="20" :dim="!s.itemsFound[id]" />
                  <b>{{ pct(c.chance, 2) }}</b>
                </span>
              </div>
            </div>
            <MasteryBar :action-id="actionId(site)" />
            <ProgressBar v-if="active?.actionId === actionId(site)" :value="active.interval ? active.progress / active.interval : 0" :height="6" />
            <div class="row">
              <button v-if="active?.actionId === actionId(site)" class="danger small grow" @click="stop">停止</button>
              <button v-else class="primary small grow" :disabled="!!lockMsg(site)" @click="start(site)">{{ active ? '切换' : '开始发掘' }}</button>
              <button v-if="!discovered(site) || !map(site)?.charges" class="small" @click="store.go('skill', 'cartography')">🧭 制图</button>
            </div>
          </div>
        </template>
      </div>
    </template>

    <div v-else-if="section === 'tools'" class="panel">
      <div class="small muted mb">每级工具使对应尺寸文物的发现几率 +25%。升级到第 N 级需要考古 N×15 级。</div>
      <div class="cards">
        <div v-for="t in ARCH_TOOLS" :key="t.id" class="card">
          <div class="row between"><b>{{ t.icon }} {{ t.name }}</b><span class="tag">等级 {{ s.archaeology.tools[t.id] }} / {{ t.costs.length }}</span></div>
          <div class="tiny muted">{{ SIZE_NAMES[t.id] }}文物几率 +{{ s.archaeology.tools[t.id] * 25 }}%</div>
          <template v-if="toolCost(t.id)">
            <div class="small">升级需要考古 <b :class="g.level('archaeology') >= toolLvlReq(t.id) ? 'good' : 'bad'">{{ toolLvlReq(t.id) }}</b> 级</div>
            <div class="small">费用 <span :class="s.currencies.gp >= toolCost(t.id)!.gp ? 'gold' : 'bad'">🪙 {{ full(toolCost(t.id)!.gp) }}</span></div>
            <ItemList :items="toolCost(t.id)!.items" check :size="26" />
            <button class="primary small" :disabled="!canUpgrade(t.id)" @click="store.act(() => upgradeTool(g, t.id))">升级</button>
          </template>
          <span v-else class="tag good">已满级</span>
        </div>
      </div>
    </div>

    <template v-else>
      <div class="panel">
        <div class="row between">
          <div>
            <h3>🏛️ 博物馆</h3>
            <div class="small muted">捐赠每种文物各一件，获得博物馆代币与考古经验。已收藏 {{ donatedCount }} / {{ allArtifacts.length }}。</div>
          </div>
          <span class="row nowrap"><ItemIcon id="museum_token" :size="28" /> {{ fmt(g.qty('museum_token')) }}</span>
        </div>
        <h4 class="mt">里程碑</h4>
        <div class="col">
          <div v-for="(m, i) in MUSEUM_MILESTONES" :key="m.count" class="row between small">
            <span>
              <b>{{ m.count }} 件藏品</b>：
              <span v-if="m.reward.gp">🪙 {{ full(m.reward.gp) }}</span>
              <span v-for="it in m.reward.items ?? []" :key="it.id"> · {{ C.items[it.id]?.name }} ×{{ it.qty }}</span>
              <span v-if="m.pet"> · 宠物：{{ C.pets[m.pet]?.name ?? m.pet }}</span>
            </span>
            <span class="tag" :class="{ good: s.archaeology.museumRewards > i }">{{ s.archaeology.museumRewards > i ? '已领取' : `${Math.min(donatedCount, m.count)}/${m.count}` }}</span>
          </div>
        </div>
      </div>

      <div class="panel">
        <h3>🪙 代币商店</h3>
        <div class="cards sm">
          <div v-for="it in MUSEUM_SHOP" :key="it.id" class="card">
            <div class="row nowrap"><ItemIcon :id="it.grants.id" :qty="it.grants.qty" :size="32" /><b class="small">{{ it.name }}</b></div>
            <div class="small">价格：{{ it.cost }} 代币</div>
            <button class="small primary" :disabled="g.qty('museum_token') < it.cost" @click="store.act(() => museumBuy(g, it.id))">购买</button>
          </div>
        </div>
      </div>

      <div class="tabs mt">
        <button v-for="site in sites" :key="site.id" :class="{ on: museumSite === site.id }" @click="museumSite = site.id">
          {{ site.icon }} {{ site.name }} <span class="tiny">{{ siteDonated(site) }}/{{ siteTotal(site) }}</span>
        </button>
      </div>
      <div v-if="museumSiteDef" class="panel">
        <template v-for="size in SIZES" :key="size">
          <h4>{{ SIZE_NAMES[size] }}文物</h4>
          <div class="cards sm mb">
            <div v-for="id in museumSiteDef.artifacts[size]" :key="id" class="card" :class="{ active: s.archaeology.museum[id] }">
              <div class="row nowrap">
                <ItemIcon :id="id" :qty="g.qty(id)" :size="34" :dim="!s.itemsFound[id]" />
                <div class="small">{{ s.itemsFound[id] ? C.items[id]?.name : '？？？' }}</div>
              </div>
              <span v-if="s.archaeology.museum[id]" class="tag good">已收藏</span>
              <button v-else class="small primary" :disabled="g.qty(id) <= 0" @click="store.act(() => donateArtifact(g, id))">捐赠</button>
            </div>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>

<style scoped>
.chances { display: flex; flex-direction: column; gap: 2px; }
.chances .row.nowrap { gap: 2px; }
</style>
