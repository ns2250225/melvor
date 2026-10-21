<script setup lang="ts">
// 战斗页面：实时战斗面板、食物、攻击方式、战利品、战斗日志与区域 / 副本浏览
import { computed, ref } from 'vue';
import { C } from '@/content';
import { useGameStore } from '@/stores/game';
import { startCombat, stopCombat, areaEntryError, lootAll, effectName, toggleCorruption } from '@/game/combat/combat';
import { playerCombatStats, monsterCombatStats, hitChance, triangle, eatFood, foodHeal } from '@/game/combat/stats';
import { foodSlotCount } from '@/game/inventory/equipment';
import type { CombatAreaDef, DungeonDef, MonsterDef } from '@/game/core/types';
import type { ActiveEffect } from '@/game/core/state';
import { fmt, full, pct, fmtSec } from '@/app/format';
import { ATTACK_TYPE_NAMES, ATTACK_TYPE_ICONS, dropTableRows, fmtChance, specialAttacksOf, formatModifiers, EXPANSION_SHORT } from '@/game/ui/combatHelpers';
import ItemIcon from '@/components/ItemIcon.vue';
import ProgressBar from '@/components/ProgressBar.vue';
import Modal from '@/components/Modal.vue';
import Requirements from '@/components/Requirements.vue';
import ItemList from '@/components/ItemList.vue';

const store = useGameStore();
const g = computed(() => store.game!);
const s = computed(() => g.value.state);
const c = computed(() => s.value.combat);

// ------------------------------------------------------------------ 当前战斗
const enemyDef = computed<MonsterDef | null>(() => (c.value.enemy ? C.monsters[c.value.enemy.monsterId] ?? null : null));
const pstats = computed(() => { void store.frame; return playerCombatStats(g.value, enemyDef.value); });
const mstats = computed(() => {
  void store.frame;
  const e = c.value.enemy;
  return e && enemyDef.value ? monsterCombatStats(g.value, enemyDef.value, e) : null;
});
const playerHitChance = computed(() => (mstats.value ? hitChance(pstats.value.accuracy, mstats.value.evasion[pstats.value.attackType]) : 0));
const enemyHitChance = computed(() => (mstats.value && enemyDef.value ? hitChance(mstats.value.accuracy, pstats.value.evasion[enemyDef.value.attackType]) : 0));
const tri = computed(() => (enemyDef.value ? triangle(g.value, pstats.value.attackType, enemyDef.value.attackType) : { dmg: 1, dr: 1 }));
const playerTimer = computed(() => { void store.frame; const iv = pstats.value.attackInterval; return iv > 0 ? 1 - c.value.playerAttackTimer / iv : 0; });
const enemyTimer = computed(() => { void store.frame; const e = c.value.enemy; const iv = mstats.value?.attackInterval ?? 0; return e && iv > 0 ? 1 - e.attackTimer / iv : 0; });
const areaName = computed(() => {
  const a = c.value.area;
  if (!a) return '';
  return a.kind === 'dungeon' ? C.dungeons[a.id]?.name ?? a.id : C.areas[a.id]?.name ?? a.id;
});
const dungeon = computed<DungeonDef | null>(() => (c.value.area?.kind === 'dungeon' ? C.dungeons[c.value.area.id] ?? null : null));
const nextMonsters = computed(() => (dungeon.value ? dungeon.value.monsters.slice(c.value.dungeonIndex + 1, c.value.dungeonIndex + 6) : []));
const enemyCorruption = computed(() => (c.value.enemy?.corruption ?? []).map((id) => C.corruptionEffects[id]).filter(Boolean));
const hpPct = computed(() => (pstats.value.maxHp ? s.value.hp / pstats.value.maxHp : 0));

function effLabel(e: ActiveEffect) { return `${effectName(e.kind)}${e.value ? ` ${Math.round(e.value * 100) / 100}` : ''} · ${e.turns} 回合`; }
function stop() { store.act(() => stopCombat(g.value)); }

// ------------------------------------------------------------------ 食物与自动进食
const foodSlots = computed(() => s.value.food.slice(0, foodSlotCount(g.value)));
const autoEat = computed(() => { void store.frame; return { t: g.value.mods.get('autoEatThreshold'), lim: g.value.mods.get('autoEatLimit'), eff: g.value.mods.get('autoEatEfficiency') }; });
function selectFood(i: number) { s.value.selectedFood = i; store.requestSave(); }
function eat() { store.act(() => (eatFood(g.value, s.value.selectedFood) ? null : '无法进食（生命已满或该栏没有食物）')); }

// ------------------------------------------------------------------ 攻击方式
const MELEE_STYLES = [
  { id: 'stab', name: '刺击', xp: '攻击经验' },
  { id: 'slash', name: '劈砍', xp: '力量经验' },
  { id: 'block', name: '格挡', xp: '防御经验' },
] as const;
const RANGED_STYLES = [
  { id: 'accurate', name: '精准', xp: '远程经验 · 命中 +3 等级' },
  { id: 'rapid', name: '快速', xp: '远程经验 · 攻击间隔 -0.4s' },
  { id: 'longrange', name: '远距', xp: '远程/防御经验 · 防御 +3 等级' },
] as const;
const MAGIC_STYLES = [
  { id: 'magic', name: '魔法', xp: '魔法经验' },
  { id: 'defensive', name: '防御', xp: '魔法/防御经验 · 防御 +3 等级' },
] as const;
function setMelee(v: (typeof MELEE_STYLES)[number]['id']) { c.value.meleeStyle = v; g.value.invalidate(); store.requestSave(); }
function setRanged(v: (typeof RANGED_STYLES)[number]['id']) { c.value.rangedStyle = v; g.value.invalidate(); store.requestSave(); }
function setMagic(v: (typeof MAGIC_STYLES)[number]['id']) { c.value.magicStyle = v; g.value.invalidate(); store.requestSave(); }

// ------------------------------------------------------------------ 设置
function toggleAutoLoot() { s.value.settings.autoLoot = !s.value.settings.autoLoot; store.requestSave(); }
function toggleAutoRestart() { s.value.settings.autoRestartDungeon = !s.value.settings.autoRestartDungeon; store.requestSave(); }

// ------------------------------------------------------------------ 区域浏览
type Tab = 'combat' | 'slayer' | 'dungeon' | 'abyss';
const tab = ref<Tab>('combat');
const search = ref('');
const onlyUnlocked = ref(false);
const TABS: { id: Tab; name: string }[] = [
  { id: 'combat', name: '⚔️ 战斗区域' }, { id: 'slayer', name: '💀 猎杀区域' }, { id: 'dungeon', name: '🏰 副本' }, { id: 'abyss', name: '🌀 深渊' },
];
function match(name: string, monsters: string[]) {
  const q = search.value.trim().toLowerCase();
  if (!q) return true;
  return name.toLowerCase().includes(q) || monsters.some((m) => C.monsters[m]?.name.toLowerCase().includes(q));
}
const areaKind = (a: CombatAreaDef) => (a.type === 'slayer' ? 'slayer' : 'area') as 'slayer' | 'area';
const areaErr = (a: CombatAreaDef) => { void store.frame; return areaEntryError(g.value, areaKind(a), a.id); };
const dungeonErr = (d: DungeonDef) => { void store.frame; return areaEntryError(g.value, 'dungeon', d.id); };
const shownAreas = computed(() => {
  void store.frame;
  const realm = tab.value === 'abyss' ? 'abyssal' : 'melvor';
  return Object.values(C.areas).filter((a) => {
    if (a.realm !== realm) return false;
    if (tab.value === 'combat' && a.type !== 'combat') return false;
    if (tab.value === 'slayer' && a.type !== 'slayer') return false;
    if (tab.value === 'dungeon') return false;
    if (onlyUnlocked.value && areaErr(a)) return false;
    return match(a.name, a.monsters);
  });
});
const shownDungeons = computed(() => {
  void store.frame;
  if (tab.value !== 'dungeon' && tab.value !== 'abyss') return [];
  const realm = tab.value === 'abyss' ? 'abyssal' : 'melvor';
  return Object.values(C.dungeons).filter((d) => d.realm === realm && (!onlyUnlocked.value || !dungeonErr(d)) && match(d.name, d.monsters));
});
const bossOf = (d: DungeonDef) => {
  const id = d.monsters[d.monsters.length - 1];
  return id ? C.monsters[id] : undefined;
};
const uniqueMonsters = (d: DungeonDef) => [...new Set(d.monsters)];
const isActiveArea = (kind: 'area' | 'slayer' | 'dungeon', id: string, monster?: string) => c.value.active && c.value.area?.kind === kind && c.value.area.id === id && (!monster || c.value.area.monster === monster);
function fight(a: CombatAreaDef, m: string) { store.act(() => startCombat(g.value, areaKind(a), a.id, m)); }
function enterDungeon(d: DungeonDef) { store.act(() => startCombat(g.value, 'dungeon', d.id)); }
const corruptionList = computed(() => Object.values(C.corruptionEffects).sort((a, b) => a.level - b.level));

// ------------------------------------------------------------------ 怪物详情
const detail = ref<string | null>(null);
const detailDef = computed(() => (detail.value ? C.monsters[detail.value] : null));
const detailStats = computed(() => { void store.frame; return detailDef.value ? monsterCombatStats(g.value, detailDef.value) : null; });
const detailDrops = computed(() => (detailDef.value ? dropTableRows(detailDef.value.drops) : []));
const detailPlayer = computed(() => { void store.frame; return detailDef.value ? playerCombatStats(g.value, detailDef.value) : null; });
const LOG_CLASS: Record<string, string> = { player: 'good', enemy: 'bad', info: 'muted', loot: 'gold', xp: 'xp', danger: 'bad bold' };
</script>

<template>
  <div class="combat-page">
    <div class="page-title">
      <span class="icon">⚔️</span>
      <div class="grow">
        <h2>战斗</h2>
        <div class="muted small">{{ c.active ? `正在 ${areaName} 战斗 · 本次击杀 ${c.killsThisRun}` : '选择区域中的怪物或进入副本开始自动战斗' }}</div>
      </div>
      <button v-if="c.active" class="danger" @click="stop">🏃 逃跑 / 停止战斗</button>
    </div>

    <!-- ================================================================ 战斗面板 -->
    <div v-if="c.active" class="fight">
      <div class="panel">
        <div class="row between">
          <h3>🧑 {{ s.player.name }}</h3>
          <span class="tag">{{ ATTACK_TYPE_ICONS[pstats.attackType] }} {{ ATTACK_TYPE_NAMES[pstats.attackType] }}</span>
        </div>
        <ProgressBar :value="hpPct" color="var(--hp)" :height="16" :label="`${full(s.hp)} / ${full(pstats.maxHp)}`" />
        <div class="tiny muted mt">攻击计时 · {{ fmtSec(Math.max(0, c.playerAttackTimer)) }}</div>
        <ProgressBar :value="playerTimer" color="var(--accent)" :height="6" />
        <div v-if="pstats.problem" class="bad small mt">⚠ {{ pstats.problem }}</div>
        <div class="kv mt">
          <span>攻击间隔</span><span>{{ fmtSec(pstats.attackInterval) }}</span>
          <span>命中值</span><span>{{ fmt(pstats.accuracy) }}</span>
          <span>最大伤害</span><span>{{ fmt(Math.floor(pstats.maxHit * tri.dmg)) }}<span v-if="tri.dmg !== 1" class="tiny" :class="tri.dmg > 1 ? 'good' : 'bad'">（三角 ×{{ tri.dmg }}）</span></span>
          <span>命中率</span><span>{{ pct(playerHitChance * 100) }}</span>
          <span>闪避</span><span class="small">近 {{ fmt(pstats.evasion.melee) }} / 远 {{ fmt(pstats.evasion.ranged) }} / 魔 {{ fmt(pstats.evasion.magic) }}</span>
          <span>伤害减免</span><span>{{ pct(pstats.damageReduction) }}<span v-if="tri.dr !== 1" class="tiny" :class="tri.dr > 1 ? 'good' : 'bad'">（三角 ×{{ tri.dr }}）</span></span>
          <span>深渊抗性</span><span class="abyss">{{ pstats.abyssalResistance }}</span>
          <span v-if="pstats.summonMaxHit">召唤兽伤害</span><span v-if="pstats.summonMaxHit">{{ pstats.summonMaxHit }}</span>
          <span v-if="pstats.spell">法术</span><span v-if="pstats.spell">{{ pstats.spell.icon }} {{ pstats.spell.name }}</span>
          <span v-if="pstats.ammoId">弹药</span><span v-if="pstats.ammoId">{{ C.items[pstats.ammoId]?.name }} ×{{ fmt(s.equipmentSets[s.activeSet].quiver?.qty ?? 0) }}</span>
        </div>
        <div v-if="c.playerEffects.length" class="row mt">
          <span v-for="(e, i) in c.playerEffects" :key="i" class="tag">{{ effLabel(e) }}</span>
        </div>
      </div>

      <div class="panel">
        <template v-if="c.enemy && enemyDef && mstats">
          <div class="row between">
            <h3 class="row nowrap"><span class="micon">{{ enemyDef.icon }}</span> {{ enemyDef.name }} <span class="muted small">Lv {{ enemyDef.level }}</span></h3>
            <div class="row">
              <span v-if="enemyDef.isBoss" class="tag bad">首领</span>
              <span class="tag">{{ ATTACK_TYPE_ICONS[enemyDef.attackType] }} {{ ATTACK_TYPE_NAMES[enemyDef.attackType] }}</span>
              <button class="small ghost" @click="detail = enemyDef.id">详情</button>
            </div>
          </div>
          <ProgressBar :value="c.enemy.maxHp ? c.enemy.hp / c.enemy.maxHp : 0" color="var(--hp)" :height="16" :label="`${full(c.enemy.hp)} / ${full(c.enemy.maxHp)}`" />
          <template v-if="c.enemy.maxBarrier > 0">
            <div class="tiny abyss mt">屏障</div>
            <ProgressBar :value="c.enemy.barrier / c.enemy.maxBarrier" color="var(--abyss)" :height="10" :label="`${full(c.enemy.barrier)} / ${full(c.enemy.maxBarrier)}`" />
          </template>
          <div class="tiny muted mt">攻击计时 · {{ fmtSec(Math.max(0, c.enemy.attackTimer)) }}</div>
          <ProgressBar :value="enemyTimer" color="var(--bad)" :height="6" />
          <div class="kv mt">
            <span>攻击间隔</span><span>{{ fmtSec(mstats.attackInterval) }}</span>
            <span>最大伤害</span><span>{{ fmt(mstats.maxHit) }}</span>
            <span>命中你的几率</span><span :class="enemyHitChance > 0.5 ? 'bad' : 'good'">{{ pct(enemyHitChance * 100) }}</span>
            <span>伤害减免</span><span>{{ pct(mstats.damageReduction) }}</span>
          </div>
          <div v-if="c.enemy.effects.length" class="row mt">
            <span v-for="(e, i) in c.enemy.effects" :key="i" class="tag">{{ effLabel(e) }}</span>
          </div>
          <div v-if="enemyCorruption.length" class="mt">
            <div class="small abyss bold">腐化效果</div>
            <div class="row"><span v-for="ce in enemyCorruption" :key="ce.id" class="tag abyss" :title="ce.description">{{ ce.name }}</span></div>
          </div>
          <div v-if="enemyDef.specialAttacks?.length" class="mt">
            <div class="small bold">特殊攻击</div>
            <div v-for="sa in specialAttacksOf(enemyDef.specialAttacks)" :key="sa.id" class="tiny">
              <b>{{ sa.name }}</b> <span class="muted">（{{ sa.chance }}%）{{ sa.description }}</span>
            </div>
          </div>
        </template>
        <div v-else class="empty">🔍 正在寻找敌人… {{ fmtSec(Math.max(0, c.spawnTimer)) }}</div>
      </div>
    </div>

    <div v-if="c.active && dungeon" class="panel">
      <div class="row between">
        <b>{{ dungeon.icon }} {{ dungeon.name }} · 进度 {{ c.dungeonIndex }} / {{ dungeon.monsters.length }}</b>
        <span class="small muted">已通关 {{ s.dungeonCompletions[dungeon.id] || 0 }} 次</span>
      </div>
      <ProgressBar :value="c.dungeonIndex / dungeon.monsters.length" color="var(--good)" :height="8" />
      <div v-if="nextMonsters.length" class="row small mt">
        <span class="muted">接下来：</span>
        <span v-for="(m, i) in nextMonsters" :key="i" class="tag">{{ C.monsters[m]?.icon }} {{ C.monsters[m]?.name }}</span>
      </div>
    </div>

    <!-- ================================================================ 战斗辅助 -->
    <div class="aux">
      <div class="panel">
        <div class="row between"><h3>🍖 食物</h3><button class="small ghost" @click="store.go('equipment')">管理</button></div>
        <div class="row">
          <button v-for="(f, i) in foodSlots" :key="i" class="foodslot" :class="{ on: s.selectedFood === i }" @click="selectFood(i)">
            <template v-if="f"><ItemIcon :id="f.id" :qty="f.qty" :size="32" :clickable="false" /> <span class="tiny">+{{ foodHeal(g, f.id) }}</span></template>
            <span v-else class="muted tiny">空栏 {{ i + 1 }}</span>
          </button>
        </div>
        <button class="good mt" :disabled="!s.food[s.selectedFood]" @click="eat">🍴 进食</button>
        <div class="small mt">
          <template v-if="autoEat.t > 0">自动进食：生命低于 <b>{{ autoEat.t }}%</b> 时进食至 {{ Math.max(autoEat.t, autoEat.lim) }}%，效率 {{ autoEat.eff || 100 }}%</template>
          <span v-else class="muted">未购买自动进食 · <a href="#" @click.prevent="store.go('shop')">前往商店</a></span>
        </div>
      </div>

      <div class="panel">
        <h3>🎯 攻击方式（{{ ATTACK_TYPE_NAMES[pstats.attackType] }}）</h3>
        <div class="col">
          <template v-if="pstats.attackType === 'melee'">
            <button v-for="st in MELEE_STYLES" :key="st.id" class="style" :class="{ primary: c.meleeStyle === st.id }" @click="setMelee(st.id)">{{ st.name }} <span class="tiny">→ {{ st.xp }}</span></button>
          </template>
          <template v-else-if="pstats.attackType === 'ranged'">
            <button v-for="st in RANGED_STYLES" :key="st.id" class="style" :class="{ primary: c.rangedStyle === st.id }" @click="setRanged(st.id)">{{ st.name }} <span class="tiny">→ {{ st.xp }}</span></button>
          </template>
          <template v-else>
            <button v-for="st in MAGIC_STYLES" :key="st.id" class="style" :class="{ primary: c.magicStyle === st.id }" @click="setMagic(st.id)">{{ st.name }} <span class="tiny">→ {{ st.xp }}</span></button>
          </template>
        </div>
        <div class="tiny muted mt">所有攻击方式还会获得生命值经验。</div>
      </div>

      <div class="panel">
        <h3>✨ 法术与祈祷</h3>
        <div class="kv">
          <span>战斗法术</span><span>{{ s.magic.spell ? C.spells[s.magic.spell]?.name : '无' }}</span>
          <span>诅咒</span><span>{{ s.magic.curse ? C.spells[s.magic.curse]?.name : '无' }}</span>
          <span>光环</span><span>{{ s.magic.aura ? C.spells[s.magic.aura]?.name : '无' }}</span>
          <span>祈祷</span><span>{{ s.prayers.length ? s.prayers.map((p) => C.prayers[p]?.name).join('、') : '无' }}</span>
          <span>祈祷点</span><span>{{ fmt(s.currencies.prayerPoints) }}<span v-if="g.inAbyss()" class="abyss"> · 灵魂 {{ fmt(s.currencies.soulPoints) }}</span></span>
        </div>
        <div class="row mt">
          <button class="small" @click="store.go('magic')">🪄 魔法</button>
          <button class="small" @click="store.go('prayer')">🙏 祈祷</button>
          <button class="small" @click="store.go('equipment')">🛡️ 装备</button>
          <button class="small" @click="store.go('slayer')">💀 猎杀</button>
        </div>
      </div>

      <div class="panel">
        <div class="row between">
          <h3>🎁 战利品（{{ c.loot.length }}）</h3>
          <button class="small primary" :disabled="!c.loot.length" @click="store.act(() => lootAll(g))">全部拾取</button>
        </div>
        <div v-if="c.loot.length" class="row loot"><ItemIcon v-for="l in c.loot" :key="l.id" :id="l.id" :qty="l.qty" :size="36" /></div>
        <div v-else class="muted small">暂无战利品</div>
        <label class="row small mt"><input type="checkbox" :checked="s.settings.autoLoot" @change="toggleAutoLoot" /> 自动拾取（银行有空位时直接入库）</label>
        <label class="row small"><input type="checkbox" :checked="s.settings.autoRestartDungeon" @change="toggleAutoRestart" /> 副本通关后自动重新开始</label>
      </div>
    </div>

    <div v-if="s.settings.showCombatLog && c.log.length" class="panel">
      <h3>📜 战斗日志</h3>
      <div class="log">
        <div v-for="(l, i) in c.log" :key="i" class="tiny" :class="LOG_CLASS[l.kind]">{{ l.text }}</div>
      </div>
    </div>

    <!-- ================================================================ 区域浏览 -->
    <div class="panel">
      <div class="tabs">
        <button v-for="t in TABS" :key="t.id" :class="{ on: tab === t.id }" @click="tab = t.id">{{ t.name }}</button>
      </div>
      <div class="row mb">
        <input v-model="search" placeholder="搜索区域或怪物" class="grow" />
        <label class="row small"><input v-model="onlyUnlocked" type="checkbox" /> 仅显示可进入</label>
      </div>

      <div v-if="tab === 'abyss' && !g.inAbyss()" class="panel locked-note">
        🔒 深渊领域尚未开启。通关「{{ C.dungeons['dg_chaos']?.name }}」后可在商店购买「开启深渊之门」（Into the Abyss）。
        <button class="small mt" @click="store.go('shop')">前往商店</button>
      </div>

      <template v-else>
        <div v-if="tab === 'abyss' && corruptionList.length" class="panel mb">
          <div class="row between"><b class="abyss">🦠 腐化效果（深渊敌人生成时施加）</b><span class="small muted">腐化 {{ g.level('corruption') }} 级</span></div>
          <div class="row mt">
            <button v-for="ce in corruptionList" :key="ce.id" class="small" :class="{ primary: s.corruption.enabled.includes(ce.id) }" :disabled="g.level('corruption') < ce.level" :title="ce.description" @click="store.act(() => toggleCorruption(g, ce.id))">
              {{ ce.name }} <span class="tiny">Lv{{ ce.level }}</span>
            </button>
          </div>
        </div>

        <div class="cards lg">
          <div v-for="a in shownAreas" :key="a.id" class="card" :class="{ locked: !!areaErr(a), active: isActiveArea(areaKind(a), a.id) }">
            <div class="row between">
              <b>{{ a.icon }} {{ a.name }}</b>
              <div class="row">
                <span v-if="EXPANSION_SHORT[a.expansion]" class="tag abyss">{{ EXPANSION_SHORT[a.expansion] }}</span>
                <span v-if="a.type === 'slayer'" class="tag">猎杀</span>
              </div>
            </div>
            <div v-if="a.description" class="tiny muted">{{ a.description }}</div>
            <Requirements :reqs="a.requirements" />
            <div v-if="a.entryEquipment?.length" class="row small">
              <span class="muted">需装备：</span>
              <span v-for="e in a.entryEquipment" :key="e" class="tag" :class="g.meets({ type: 'equipped', id: e }) ? 'good' : 'bad'">{{ C.items[e]?.name ?? e }}</span>
            </div>
            <div v-if="a.areaEffect" class="small warn">区域效果（{{ a.areaEffect.target === 'player' ? '玩家' : '敌人' }}）：{{ a.areaEffect.description }}</div>
            <div class="sep" />
            <div v-for="mid in a.monsters" :key="mid" class="mrow row between nowrap">
              <div class="row nowrap grow" @click="detail = mid">
                <span class="micon">{{ C.monsters[mid]?.icon }}</span>
                <div class="grow">
                  <div class="small bold">{{ C.monsters[mid]?.name }} <span v-if="C.monsters[mid]?.isBoss" class="tag bad">首领</span></div>
                  <div class="tiny muted">Lv {{ C.monsters[mid]?.level }} · 生命 {{ fmt((C.monsters[mid]?.hitpoints ?? 0) * 10) }} · {{ ATTACK_TYPE_NAMES[C.monsters[mid]?.attackType ?? 'melee'] }} · 击杀 {{ full(s.monsterKills[mid] || 0) }}</div>
                </div>
              </div>
              <button class="small" @click="detail = mid">详情</button>
              <button class="small primary" :disabled="!!areaErr(a) || isActiveArea(areaKind(a), a.id, mid)" @click="fight(a, mid)">{{ isActiveArea(areaKind(a), a.id, mid) ? '战斗中' : '战斗' }}</button>
            </div>
            <div v-if="areaErr(a)" class="tiny bad">{{ areaErr(a) }}</div>
          </div>

          <div v-for="d in shownDungeons" :key="d.id" class="card" :class="{ locked: !!dungeonErr(d), active: isActiveArea('dungeon', d.id) }">
            <div class="row between">
              <b>{{ d.icon }} {{ d.name }}</b>
              <div class="row">
                <span v-if="d.isEndgame" class="tag gold">终局</span>
                <span v-if="d.noFoodAllowed" class="tag bad">禁止进食</span>
                <span v-if="EXPANSION_SHORT[d.expansion]" class="tag abyss">{{ EXPANSION_SHORT[d.expansion] }}</span>
              </div>
            </div>
            <div v-if="d.description" class="tiny muted">{{ d.description }}</div>
            <div class="small">怪物 {{ d.monsters.length }} 只 · 首领：<a v-if="bossOf(d)" href="#" @click.prevent="detail = bossOf(d)!.id">{{ bossOf(d)!.icon }} {{ bossOf(d)!.name }}（Lv {{ bossOf(d)!.level }}）</a></div>
            <div class="row tiny">
              <a v-for="m in uniqueMonsters(d)" :key="m" href="#" class="tag" @click.prevent="detail = m">{{ C.monsters[m]?.icon }} {{ C.monsters[m]?.name }} ×{{ d.monsters.filter((x) => x === m).length }}</a>
            </div>
            <Requirements :reqs="d.requirements" />
            <div class="small muted">通关奖励</div>
            <ItemList :items="d.rewards" :size="28" />
            <template v-if="d.rewardTable">
              <div class="small muted">奖励宝箱（{{ C.dropTables[d.rewardTable]?.rolls ?? 1 }} 次掷骰）</div>
              <div class="row">
                <div v-for="r in dropTableRows(d.rewardTable)" :key="r.id" class="row nowrap tiny">
                  <ItemIcon :id="r.id" :size="26" /> <span>{{ r.min === r.max ? r.min : `${r.min}-${r.max}` }} · {{ fmtChance(r.chance) }}</span>
                </div>
              </div>
            </template>
            <div v-if="d.pet" class="small">🐾 宠物：{{ C.pets[d.pet.id]?.name ?? d.pet.id }} <span class="muted">（通关 {{ d.pet.completions }} 次必得）</span> <span v-if="s.pets[d.pet.id]" class="good">已获得</span></div>
            <div v-if="d.unlocks" class="tiny good">解锁：{{ d.unlocks }}</div>
            <div class="row between">
              <span class="small">已通关 <b>{{ s.dungeonCompletions[d.id] || 0 }}</b> 次</span>
              <button class="primary" :disabled="!!dungeonErr(d) || isActiveArea('dungeon', d.id)" @click="enterDungeon(d)">{{ isActiveArea('dungeon', d.id) ? '进行中' : '进入' }}</button>
            </div>
            <div v-if="dungeonErr(d)" class="tiny bad">{{ dungeonErr(d) }}</div>
          </div>
        </div>
        <div v-if="!shownAreas.length && !shownDungeons.length" class="empty">没有符合条件的区域</div>
      </template>
    </div>

    <!-- ================================================================ 怪物详情 -->
    <Modal v-if="detailDef && detailStats" :title="`${detailDef.icon} ${detailDef.name}`" wide @close="detail = null">
      <div class="row mb">
        <span class="tag">Lv {{ detailDef.level }}</span>
        <span class="tag">{{ ATTACK_TYPE_ICONS[detailDef.attackType] }} {{ ATTACK_TYPE_NAMES[detailDef.attackType] }}</span>
        <span v-if="detailDef.isBoss" class="tag bad">首领</span>
        <span v-if="detailDef.realm === 'abyssal'" class="tag abyss">深渊</span>
        <span v-if="detailDef.slayerTaskable" class="tag">可作为猎杀目标</span>
        <span class="tag">已击杀 {{ full(s.monsterKills[detailDef.id] || 0) }}</span>
      </div>
      <div class="detail-grid">
        <div class="kv">
          <span>生命</span><span>{{ full(detailStats.maxHp) }}</span>
          <span v-if="detailDef.barrier">屏障</span><span v-if="detailDef.barrier" class="abyss">{{ full(detailDef.barrier * 10) }}</span>
          <span>攻击间隔</span><span>{{ fmtSec(detailStats.attackInterval) }}</span>
          <span>最大伤害</span><span>{{ fmt(detailStats.maxHit) }}</span>
          <span>命中值</span><span>{{ fmt(detailStats.accuracy) }}</span>
          <span>闪避</span><span class="small">近 {{ fmt(Math.round(detailStats.evasion.melee)) }} / 远 {{ fmt(Math.round(detailStats.evasion.ranged)) }} / 魔 {{ fmt(Math.round(detailStats.evasion.magic)) }}</span>
          <span>伤害减免</span><span>{{ pct(detailStats.damageReduction) }}</span>
          <span>{{ detailDef.realm === 'abyssal' ? '深渊碎片' : '金币' }}</span><span class="gold">{{ detailDef.gp[0] }} - {{ detailDef.gp[1] }}</span>
          <span>骨头</span><span>{{ detailDef.bones ? C.items[detailDef.bones]?.name : '无' }}</span>
        </div>
        <div v-if="detailPlayer" class="kv">
          <span>你的命中率</span><span>{{ pct(hitChance(detailPlayer.accuracy, detailStats.evasion[detailPlayer.attackType]) * 100) }}</span>
          <span>你的最大伤害</span><span>{{ fmt(Math.floor(detailPlayer.maxHit * triangle(g, detailPlayer.attackType, detailDef.attackType).dmg)) }}</span>
          <span>敌人命中你</span><span>{{ pct(hitChance(detailStats.accuracy, detailPlayer.evasion[detailDef.attackType]) * 100) }}</span>
          <span>属性</span><span class="small">攻 {{ detailDef.attack }} · 力 {{ detailDef.strength }} · 防 {{ detailDef.defence }} · 远 {{ detailDef.ranged }} · 魔 {{ detailDef.magic }}</span>
        </div>
      </div>
      <div v-if="detailDef.passives" class="mt small"><b>被动：</b><span v-for="t in formatModifiers(detailDef.passives)" :key="t" class="tag">{{ t }}</span></div>
      <div v-if="detailDef.specialAttacks?.length" class="mt">
        <div class="small bold">特殊攻击</div>
        <div v-for="sa in specialAttacksOf(detailDef.specialAttacks)" :key="sa.id" class="small"><b>{{ sa.name }}</b> <span class="muted">（{{ sa.chance }}%）{{ sa.description }}</span></div>
      </div>
      <div v-if="detailDef.pet" class="mt small">🐾 宠物：{{ C.pets[detailDef.pet.id]?.name }}（{{ fmtChance(detailDef.pet.chance) }}）<span v-if="s.pets[detailDef.pet.id]" class="good">已获得</span></div>
      <div class="sep" />
      <div class="small bold mb">掉落表<span v-if="detailDef.drops && C.dropTables[detailDef.drops]" class="muted">（每次击杀 {{ C.dropTables[detailDef.drops].rolls ?? 1 }} 次掷骰{{ C.dropTables[detailDef.drops].chance !== undefined ? `，触发率 ${fmtChance(C.dropTables[detailDef.drops].chance!)}` : '' }}）</span></div>
      <div v-if="!detailDrops.length" class="muted small">无掉落</div>
      <table v-else>
        <tr><th>物品</th><th>数量</th><th>几率（每次）</th><th>已获得</th></tr>
        <tr v-for="r in detailDrops" :key="r.id">
          <td><div class="row nowrap"><ItemIcon :id="r.id" :size="26" /> <span class="small">{{ C.items[r.id]?.name ?? r.id }}</span></div></td>
          <td>{{ r.min === r.max ? r.min : `${r.min}-${r.max}` }}</td>
          <td>{{ fmtChance(r.chance) }}</td>
          <td>{{ s.itemsFound[r.id] ? '✔' : '—' }}</td>
        </tr>
      </table>
    </Modal>
  </div>
</template>

<style scoped>
.fight { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
.fight .panel + .panel { margin-top: 0; }
.aux { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; margin: 12px 0; }
.aux .panel + .panel { margin-top: 0; }
.micon { font-size: 22px; }
.foodslot { min-height: 46px; padding: 4px 8px; }
.foodslot.on { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent) inset; }
.style { justify-content: flex-start; }
.loot { max-height: 160px; overflow: auto; }
.log { max-height: 220px; overflow: auto; display: flex; flex-direction: column; gap: 2px; }
.xp { color: var(--xp); }
.mrow { padding: 4px 0; border-bottom: 1px dashed var(--border); cursor: pointer; }
.mrow:last-of-type { border-bottom: none; }
.locked-note { text-align: center; }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
@media (max-width: 760px) {
  .fight, .detail-grid { grid-template-columns: 1fr; }
}
</style>
