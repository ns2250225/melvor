<script setup lang="ts">
// 制图：六角格地图勘测、兴趣点、纸墨制作与发掘地图
import { computed, ref } from 'vue';
import { C } from '@/content';
import { useGameStore } from '@/stores/game';
import { MAP_RADIUS, MAP_TIERS, surveyXpForHex } from '@/content/recipes/support';
import { allHexes, hexKey, hexDist, poisAt, canSurveyHex, hexLevelReq, setSurveyTarget, mapCreateCheck, createMap, parseHex, type Hex } from '@/game/production/cartography';
import { scaledInterval, mapBonus } from '@/game/production/actions';
import { describeMods } from '@/game/ui/skillHelpers';
import { fmt, fmtSec, pct } from '@/app/format';
import SkillHeader from '@/components/SkillHeader.vue';
import ProgressBar from '@/components/ProgressBar.vue';
import ProductionSkill from './ProductionSkill.vue';

const store = useGameStore();
const g = computed(() => store.game!);
const cs = computed(() => g.value.state.cartography);

// ------------------------------------------------------------------ 地图几何（尖顶六角格，轴坐标）
const SIZE = 10;
const SQ3 = Math.sqrt(3);
const HEXES = allHexes();
function center(h: Hex) { return { x: SIZE * SQ3 * (h[0] + h[1] / 2), y: SIZE * 1.5 * h[1] }; }
function points(cx: number, cy: number, r: number) {
  const out: string[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 30);
    out.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return out.join(' ');
}
const viewBox = (() => {
  const w = SIZE * SQ3 * (MAP_RADIUS + 1);
  const h = SIZE * (1.5 * MAP_RADIUS + 1.2);
  return `${-w} ${-h} ${2 * w} ${2 * h}`;
})();

interface HexView { key: string; hex: Hex; x: number; y: number; dist: number; surveyed: boolean; can: boolean; pois: { id: string; icon: string }[] }
const hexViews = computed<HexView[]>(() => {
  const surveyed = new Set(cs.value.surveyed);
  const discovered = new Set(cs.value.discovered);
  void g.value.level('cartography');
  return HEXES.map((h) => {
    const key = hexKey(h);
    const c = center(h);
    const isSurveyed = surveyed.has(key);
    return {
      key, hex: h, x: c.x, y: c.y, dist: hexDist(h, [0, 0]), surveyed: isSurveyed,
      can: !isSurveyed && canSurveyHex(g.value, h) === null,
      pois: poisAt(key).filter((p) => discovered.has(p.id)).map((p) => ({ id: p.id, icon: p.icon })),
    };
  });
});
function hexProgress(v: HexView) { return v.surveyed ? 1 : Math.min(1, (cs.value.hexes[v.key] || 0) / surveyXpForHex(v.dist)); }
function fill(v: HexView) {
  if (v.key === cs.value.target) return 'var(--accent)';
  if (v.surveyed) return v.pois.length ? 'var(--accent2)' : 'var(--good)';
  if (v.can) return 'var(--panel2)';
  return 'var(--bg2)';
}
function opacity(v: HexView) {
  if (v.key === cs.value.target) return 0.85;
  if (v.surveyed) return v.pois.length ? 0.55 : 0.4;
  return 1;
}

const selected = ref<string | null>(null);
const selView = computed(() => (selected.value ? hexViews.value.find((v) => v.key === selected.value) ?? null : null));
const selErr = computed(() => (selView.value ? canSurveyHex(g.value, selView.value.hex) : null));
function clickHex(v: HexView) {
  selected.value = v.key;
  if (v.can && cs.value.target !== v.key) store.act(() => setSurveyTarget(g.value, v.key));
}
function targetHex(key: string) { store.act(() => setSurveyTarget(g.value, key)); }

// ------------------------------------------------------------------ 勘测
const surveyAction = C.actions['carto_survey'];
const surveying = computed(() => (g.value.state.activeAction?.skill === 'cartography' && g.value.state.activeAction.actionId === 'carto_survey' ? g.value.state.activeAction : null));
const surveyInterval = computed(() => { void store.frame; return scaledInterval(g.value, 'cartography', surveyAction.interval); });
const targetInfo = computed(() => {
  const t = cs.value.target;
  if (!t) return null;
  const h = parseHex(t);
  const d = hexDist(h, [0, 0]);
  return { key: t, dist: d, xp: cs.value.hexes[t] || 0, need: surveyXpForHex(d) };
});
const surveyGain = computed(() => 10 * (1 + g.value.level('cartography') / 25));
function startSurvey() { store.act(() => g.value.startAction('cartography', 'carto_survey'), { silent: true }); }
function stop() { store.act(() => { g.value.stopAction(); return null; }); }
const surveyedCount = computed(() => cs.value.surveyed.length);

// ------------------------------------------------------------------ 兴趣点
const KIND: Record<string, string> = { digSite: '发掘点', watchtower: '瞭望塔', portal: '传送门', treasure: '宝藏', landmark: '地标', hiddenHole: '隐秘洞穴' };
const discoveredPois = computed(() => cs.value.discovered.map((id) => C.pois[id]).filter(Boolean));

// ------------------------------------------------------------------ 地图制作
const sites = computed(() => Object.values(C.digSites).filter((s) => cs.value.discovered.includes(`poi_${s.id}`)));
function mapCheck(siteId: string, tier: number) { void store.frame; return mapCreateCheck(g.value, siteId, tier); }
function make(siteId: string, tier: number) { store.act(() => createMap(g.value, siteId, tier), { silent: true }); }
const section = ref<'map' | 'craft' | 'maps' | 'pois'>('map');
</script>

<template>
  <div>
    <SkillHeader skill="cartography" />

    <div class="panel">
      <div class="row between">
        <div>
          <h3>🧭 勘测</h3>
          <div class="small muted">
            已勘测 {{ surveyedCount }} / {{ HEXES.length }} 格 · 每次勘测 {{ fmtSec(surveyInterval) }}，获得 {{ fmt(surveyGain) }} 勘测进度
          </div>
          <div class="small">
            当前目标：
            <template v-if="targetInfo"><b>({{ targetInfo.key }})</b> <span class="muted">距离 {{ targetInfo.dist }} · {{ fmt(targetInfo.xp) }} / {{ fmt(targetInfo.need) }}</span></template>
            <span v-else class="muted">自动选择最近的可勘测区域</span>
          </div>
        </div>
        <button v-if="surveying" class="danger" @click="stop">停止</button>
        <button v-else class="primary" @click="startSurvey">开始勘测</button>
      </div>
      <ProgressBar v-if="targetInfo" class="mt" :value="targetInfo.xp / targetInfo.need" color="var(--good)" :height="6" />
      <ProgressBar v-if="surveying" class="mt" :value="surveying.interval ? surveying.progress / surveying.interval : 0" :height="6" />
    </div>

    <div class="tabs mt">
      <button :class="{ on: section === 'map' }" @click="section = 'map'">🗺️ 世界地图</button>
      <button :class="{ on: section === 'pois' }" @click="section = 'pois'">📍 兴趣点（{{ discoveredPois.length }}）</button>
      <button :class="{ on: section === 'craft' }" @click="section = 'craft'">📜 纸墨制作</button>
      <button :class="{ on: section === 'maps' }" @click="section = 'maps'">🗺️ 发掘地图</button>
    </div>

    <div v-if="section === 'map'" class="panel">
      <div class="row small legend">
        <span><i style="background: var(--good); opacity: .5" /> 已勘测</span>
        <span><i style="background: var(--accent2); opacity: .6" /> 兴趣点</span>
        <span><i style="background: var(--accent)" /> 勘测目标</span>
        <span><i style="background: var(--panel2); border-color: var(--accent)" /> 可勘测</span>
        <span><i style="background: var(--bg2)" /> 未探索</span>
      </div>
      <div class="map-wrap">
        <svg :viewBox="viewBox" class="map" preserveAspectRatio="xMidYMid meet" role="img" aria-label="世界地图">
          <g v-for="v in hexViews" :key="v.key" class="hex" @click="clickHex(v)">
            <polygon :points="points(v.x, v.y, SIZE * 0.96)" :fill="fill(v)" :fill-opacity="opacity(v)"
              :stroke="selected === v.key ? 'var(--text)' : v.can ? 'var(--accent)' : 'var(--border)'" :stroke-width="selected === v.key ? 1.4 : 0.6" />
            <polygon v-if="!v.surveyed && hexProgress(v) > 0" :points="points(v.x, v.y, SIZE * 0.9 * hexProgress(v))" fill="var(--good)" fill-opacity="0.6" />
            <text v-if="v.pois.length" :x="v.x" :y="v.y + 3" text-anchor="middle" font-size="9">{{ v.pois[0].icon }}</text>
            <text v-else-if="v.dist === 0" :x="v.x" :y="v.y + 3" text-anchor="middle" font-size="8">🏠</text>
          </g>
        </svg>
      </div>
      <div v-if="selView" class="sel mt">
        <div class="row between">
          <b>区域 ({{ selView.key }})</b>
          <span class="tag" :class="{ good: selView.surveyed }">{{ selView.surveyed ? '已勘测' : selView.can ? '可勘测' : '不可勘测' }}</span>
        </div>
        <div class="kv">
          <span>距离</span><span>{{ selView.dist }}</span>
          <span>需要等级</span><span>制图 {{ hexLevelReq(selView.hex) }} 级</span>
          <span>勘测进度</span><span>{{ pct(hexProgress(selView) * 100) }}</span>
        </div>
        <div v-if="!selView.surveyed && selErr" class="small bad">{{ selErr }}</div>
        <div v-for="pid in selView.pois" :key="pid.id" class="small">{{ C.pois[pid.id].icon }} <b>{{ C.pois[pid.id].name }}</b> <span class="muted">{{ C.pois[pid.id].description }}</span></div>
        <button v-if="selView.can && cs.target !== selView.key" class="small primary mt" @click="targetHex(selView.key)">设为勘测目标</button>
      </div>
      <div v-else class="small muted mt">点击地图上的六角格查看详情；点击可勘测的格子会将其设为勘测目标。</div>
    </div>

    <div v-else-if="section === 'pois'" class="panel">
      <div v-if="!discoveredPois.length" class="empty">尚未发现任何兴趣点。勘测地图以发现发掘点、瞭望塔、宝藏与地标。</div>
      <div class="cards">
        <div v-for="p in discoveredPois" :key="p.id" class="card">
          <div class="row between nowrap"><b>{{ p.icon }} {{ p.name }}</b><span class="tag">{{ KIND[p.kind] ?? p.kind }}</span></div>
          <div class="small muted">{{ p.description }}</div>
          <div class="tiny muted">位置 ({{ p.hex[0] }},{{ p.hex[1] }})</div>
          <div v-if="p.modifiers" class="row tiny"><span v-for="d in describeMods(p.modifiers)" :key="d" class="tag good">{{ d }}</span></div>
          <button v-if="p.kind === 'digSite'" class="small" @click="store.go('skill', 'archaeology')">⛏️ 前往考古</button>
        </div>
      </div>
    </div>

    <div v-else-if="section === 'craft'">
      <ProductionSkill skill="cartography" only="paper" embedded />
    </div>

    <div v-else class="panel">
      <div class="small muted mb">为已发现的发掘点制作地图。地图提供考古发掘次数（充能），更高品阶的地图提供更多充能与文物几率加成。持有：📜 纸张 {{ fmt(g.qty('paper')) }} · 🖋️ 墨水 {{ fmt(g.qty('ink')) }}</div>
      <div v-if="!sites.length" class="empty">尚未发现任何发掘点</div>
      <div class="cards lg">
        <div v-for="site in sites" :key="site.id" class="card">
          <div class="row between nowrap">
            <b>{{ site.icon }} {{ site.name }}</b>
            <span class="tiny muted">考古 {{ site.level }}<span v-if="site.abyssalLevel" class="abyss"> · 深渊 {{ site.abyssalLevel }}</span></span>
          </div>
          <div class="small">
            当前地图：
            <template v-if="cs.maps[site.id]">{{ MAP_TIERS.find((t) => t.tier === cs.maps[site.id].tier)?.name }} · 剩余 <b>{{ cs.maps[site.id].charges }}</b> 次 · 文物几率 +{{ mapBonus(cs.maps[site.id].tier) }}%</template>
            <span v-else class="muted">无</span>
          </div>
          <div v-for="t in MAP_TIERS" :key="t.tier" class="row between tier">
            <div class="small">
              <b>{{ t.name }}</b>
              <div class="tiny muted">📜 {{ t.paper }}<template v-if="t.ink"> · 🖋️ {{ t.ink }}</template> · {{ t.charges }} 次 · +{{ t.bonus }}%</div>
              <div v-if="mapCheck(site.id, t.tier)" class="tiny bad">{{ mapCheck(site.id, t.tier) }}</div>
            </div>
            <button class="small primary" :disabled="!!mapCheck(site.id, t.tier)" @click="make(site.id, t.tier)">制作</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.map-wrap { width: 100%; max-width: 720px; margin: 0 auto; }
.map { width: 100%; height: auto; display: block; touch-action: manipulation; }
.hex { cursor: pointer; }
.legend { gap: 12px; }
.legend i { display: inline-block; width: 12px; height: 12px; border-radius: 3px; border: 1px solid var(--border); vertical-align: -2px; margin-right: 4px; }
.sel { background: var(--panel2); border-radius: 8px; padding: 10px; }
.tier { padding: 6px 0; border-top: 1px solid var(--border); flex-wrap: nowrap; }
</style>
