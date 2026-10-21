<script setup lang="ts">
// 扩展内容：清单、等级上限、深渊（技能树、腐化）与终局进度
import { computed, ref } from 'vue';
import { C } from '@/content';
import { EXPANSIONS } from '@/content/expansions';
import { EXPANSION_NAMES } from '@/content/registry';
import { useGameStore } from '@/stores/game';
import type { SkillId, SkillTreeNodeDef } from '@/game/core/types';
import { treeNodeAvailable, unlockTreeNode, resetTree } from '@/game/production/special';
import { toggleCorruption } from '@/game/combat/combat';
import { fmt, full } from '@/app/format';
import { CURRENCY_LABELS } from '@/game/ui/metaHelpers';
import ConfirmButton from '@/components/ConfirmButton.vue';
import ProgressBar from '@/components/ProgressBar.vue';

const store = useGameStore();
const g = computed(() => store.game!);
const s = computed(() => g.value.state);

// ---------------------------------------------------------------- 等级上限
const levelCap = computed(() => { void store.frame; return g.value.levelCap('attack'); });
const insights = [1, 2, 3].map((i) => `herald_insight_${i}`);
const inAbyss = computed(() => { void store.frame; return g.value.inAbyss(); });
const abyssCap = computed(() => { void store.frame; return g.value.abyssalLevelCap(); });

// ---------------------------------------------------------------- 终局目标（副本 ID 或成就 ID）
function endgameInfo(id: string) {
  const d = C.dungeons[id];
  if (d) { const n = s.value.dungeonCompletions[id] || 0; return { name: `${d.icon} ${d.name}`, done: n > 0, detail: `通关 ${full(n)} 次` }; }
  const a = C.achievements[id];
  if (a) { const t = s.value.achievements[id]; return { name: `${a.icon} ${a.name}`, done: !!t, detail: t ? '已达成' : a.description }; }
  return { name: id, done: false, detail: '' };
}

const capeSkills = computed(() => C.skillOrder.filter((sid) => sid !== 'township'));
const endgame = computed(() => {
  void store.frame;
  const dungeons = EXPANSIONS.flatMap((e) => e.endgame).map(endgameInfo);
  const at120 = capeSkills.value.filter((sid) => s.value.skills[sid].level >= 120).length;
  const pets = Object.keys(C.pets);
  const petsOwned = pets.filter((p) => s.value.pets[p]).length;
  return { dungeons, at120, petsOwned, petsTotal: pets.length };
});

// ---------------------------------------------------------------- 技能树
const treeSkills = C.skillOrder.filter((sid) => C.skills[sid].abyssalEnabled);
const treeSkill = ref<SkillId>(treeSkills[0] ?? 'attack');
const sk = computed(() => s.value.skills[treeSkill.value]);
const TIERS = [['root'], ['a1', 'b1'], ['a2', 'b2'], ['cap']];
const tree = computed(() => {
  void store.frame;
  const nodes = Object.values(C.skillTree).filter((n) => n.skill === treeSkill.value);
  const byKey = (k: string) => nodes.find((n) => n.id === `tree_${treeSkill.value}_${k}`);
  const used = new Set<string>();
  const tiers: SkillTreeNodeDef[][] = TIERS.map((keys) => keys.map(byKey).filter((n): n is SkillTreeNodeDef => !!n));
  tiers.forEach((t) => t.forEach((n) => used.add(n.id)));
  const extra = nodes.filter((n) => !used.has(n.id));
  if (extra.length) tiers.push(extra);
  return tiers.filter((t) => t.length).map((t) => t.map((n) => ({ n, unlocked: sk.value.treeNodes.includes(n.id), err: treeNodeAvailable(g.value, n.id) })));
});
const spentPoints = computed(() => sk.value.treeNodes.reduce((a, id) => a + (C.skillTree[id]?.cost ?? 0), 0));
function parentNames(n: SkillTreeNodeDef) { return n.parents.map((p) => C.skillTree[p]?.name ?? p).join('、'); }

// ---------------------------------------------------------------- 腐化
const corrLevel = computed(() => s.value.skills.corruption?.level ?? 1);
const corrEffects = computed(() => Object.values(C.corruptionEffects).sort((a, b) => a.level - b.level));
const corrEnabled = computed(() => new Set(s.value.corruption.enabled));
</script>

<template>
  <div>
    <div class="page-title"><span class="icon">🧩</span><h2>扩展内容</h2></div>

    <div class="cards lg">
      <div v-for="e in EXPANSIONS" :key="e.id" class="card">
        <div class="row between"><h3>{{ e.name }}</h3><span class="tag">v{{ e.version }}</span></div>
        <div class="small muted">{{ e.description }}</div>
        <div class="small"><span class="muted">依赖：</span>{{ e.dependencies.length ? e.dependencies.map((d) => EXPANSION_NAMES[d]).join('、') : '无' }}</div>
        <div v-if="e.skills.length" class="row small">
          <span class="muted">技能：</span>
          <span v-for="sid in e.skills" :key="sid" class="tag">{{ C.skills[sid as SkillId]?.icon }} {{ C.skills[sid as SkillId]?.name ?? sid }}</span>
        </div>
        <div class="small muted">特殊规则</div>
        <ul class="rules small"><li v-for="r in e.specialRules" :key="r">{{ r }}</li></ul>
        <div class="small muted">终局目标</div>
        <div v-for="id in e.endgame" :key="id" class="row between small">
          <span>{{ endgameInfo(id).name }}</span>
          <span :class="endgameInfo(id).done ? 'good' : 'muted'">{{ endgameInfo(id).done ? '✓ ' : '' }}{{ endgameInfo(id).detail }}</span>
        </div>
      </div>
    </div>

    <div class="panel mt">
      <h3>🔱 等级上限（Throne of the Herald）</h3>
      <div class="kv">
        <span>当前技能等级上限</span><span class="bold">{{ levelCap }}</span>
        <span>游戏模式基础上限</span><span>{{ C.gameModes[s.player.mode]?.levelCapBase }}</span>
        <span>城镇等级上限</span><span>99</span>
      </div>
      <div class="row mt">
        <span v-for="(id, i) in insights" :key="id" class="tag" :class="{ good: s.shop[id] }">{{ C.shop[id]?.name ?? `使者启示 ${i + 1}` }}：{{ s.shop[id] ? '已拥有' : '未购买' }}</span>
      </div>
      <div class="small muted mt">使者启示可在商店「扩展」分类中购买，每级上限 +7，最高 120。</div>
      <button class="small mt" @click="store.go('shop')">前往商店</button>
    </div>

    <div class="panel">
      <h3 class="abyss">🌀 深渊（Into the Abyss）</h3>
      <div v-if="!inAbyss" class="col">
        <div class="bad">深渊之门尚未开启。</div>
        <div class="small muted">在商店购买「{{ C.shop['abyss_gate']?.name ?? '开启深渊之门' }}」（需要通关「暗黑降临」）后解锁深渊领域、深渊等级与技能树。</div>
        <div><button class="primary" @click="store.go('shop')">前往商店</button></div>
      </div>
      <div v-else class="kv">
        <span>深渊之门</span><span class="good">已开启</span>
        <span>深渊等级上限</span><span class="bold abyss">{{ abyssCap }}</span>
      </div>
      <div class="kv mt">
        <span>{{ CURRENCY_LABELS.abyssalPieces }}</span><span>{{ fmt(s.currencies.abyssalPieces) }}</span>
        <span>{{ CURRENCY_LABELS.abyssalSlayerCoins }}</span><span>{{ fmt(s.currencies.abyssalSlayerCoins) }}</span>
        <span>{{ CURRENCY_LABELS.soulPoints }}</span><span>{{ fmt(s.currencies.soulPoints) }}</span>
      </div>
    </div>

    <div class="panel">
      <h3>🌳 深渊技能树</h3>
      <div class="small muted mb">每提升 1 个深渊等级获得 1 技能点。节点需按前置关系依次解锁；重置会返还全部点数，费用 1,000,000 金币。</div>
      <div class="row mb">
        <select v-model="treeSkill">
          <option v-for="sid in treeSkills" :key="sid" :value="sid">{{ C.skills[sid].icon }} {{ C.skills[sid].name }}</option>
        </select>
        <span class="tag abyss">可用点数 {{ sk.treePoints }}</span>
        <span class="tag">已用 {{ spentPoints }}</span>
        <span class="tag">深渊等级 {{ sk.abyssalLevel }}</span>
        <ConfirmButton label="重置技能树（100万金币）" confirm-text="确认花费 1,000,000 金币重置？" small :disabled="!sk.treeNodes.length" @confirm="store.act(() => resetTree(g, treeSkill))" />
      </div>
      <div v-if="!tree.length" class="empty">该技能没有技能树节点</div>
      <div class="tree">
        <div v-for="(tier, ti) in tree" :key="ti" class="tier">
          <div v-for="x in tier" :key="x.n.id" class="card node" :class="{ active: x.unlocked, locked: !x.unlocked && !!x.err && x.err !== '技能点不足' }">
            <div class="row between nowrap"><span class="bold small">{{ x.n.name }}</span><span class="tag">{{ x.n.cost }} 点</span></div>
            <div class="small">{{ x.n.description }}</div>
            <div v-if="x.n.parents.length" class="tiny muted">前置：{{ parentNames(x.n) }}</div>
            <div v-if="x.unlocked" class="small good">✓ 已解锁</div>
            <template v-else>
              <button class="small primary" :disabled="!!x.err || !inAbyss" @click="store.act(() => unlockTreeNode(g, x.n.id))">解锁</button>
              <div v-if="x.err" class="tiny bad">{{ x.err }}</div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <div class="panel">
      <h3>☣️ 腐化</h3>
      <div class="small muted mb">启用的腐化效果会施加于深渊敌人身上（削弱敌人），同时提高击败它们获得的腐化经验。腐化等级越高可解锁越多效果。</div>
      <div class="row mb"><span class="tag">腐化等级 {{ corrLevel }}</span><span class="tag">已启用 {{ corrEnabled.size }} 项</span></div>
      <div class="cards">
        <div v-for="e in corrEffects" :key="e.id" class="card" :class="{ locked: corrLevel < e.level, active: corrEnabled.has(e.id) }">
          <div class="row between"><span class="bold">{{ e.name }}</span><span class="tag">Lv.{{ e.level }}</span></div>
          <div class="small">{{ e.description }}</div>
          <label class="row small">
            <input type="checkbox" :checked="corrEnabled.has(e.id)" :disabled="corrLevel < e.level" @change="store.act(() => toggleCorruption(g, e.id))" />
            {{ corrLevel < e.level ? `需要腐化 ${e.level} 级` : corrEnabled.has(e.id) ? '已启用' : '未启用' }}
          </label>
        </div>
      </div>
    </div>

    <div class="panel">
      <h3>🏁 终局进度</h3>
      <div v-for="(d, i) in endgame.dungeons" :key="i" class="row between small">
        <span>{{ d.name }}</span><span :class="d.done ? 'good' : 'muted'">{{ d.done ? '✓' : '✗' }} {{ d.detail }}</span>
      </div>
      <div class="sep" />
      <div class="row between small"><span>120 级技能（披风）</span><span>{{ endgame.at120 }} / {{ capeSkills.length }}</span></div>
      <ProgressBar :value="endgame.at120 / Math.max(1, capeSkills.length)" color="var(--accent2)" />
      <div class="row between small mt"><span>全部宠物</span><span>{{ endgame.petsOwned }} / {{ endgame.petsTotal }}</span></div>
      <ProgressBar :value="endgame.petsOwned / Math.max(1, endgame.petsTotal)" color="var(--good)" />
    </div>
  </div>
</template>

<style scoped>
.rules { margin: 0; padding-left: 18px; }
.tree { display: flex; flex-direction: column; gap: 10px; align-items: center; }
.tier { display: flex; gap: 10px; justify-content: center; width: 100%; flex-wrap: wrap; }
.node { width: min(260px, 100%); }
</style>
