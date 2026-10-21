<script setup lang="ts">
// 总览：角色概况、当前活动、货币、近期收获、任务进度、技能网格
import { computed } from 'vue';
import { C } from '@/content';
import { useGameStore } from '@/stores/game';
import type { SkillId } from '@/game/core/types';
import { levelProgress } from '@/game/core/xp';
import { combatLevel, playerMaxHp } from '@/game/combat/stats';
import { questProgress } from '@/game/quests/quests';
import { completion } from '@/game/achievements/achievements';
import { plotStatus } from '@/game/production/farming';
import { SEASONS, DEITIES } from '@/content/recipes/support';
import { fmt, full, pct, fmtMs, fmtDate } from '@/app/format';
import { skillPage, describeObjective, CURRENCY_LABELS } from '@/game/ui/metaHelpers';
import ItemIcon from '@/components/ItemIcon.vue';
import ProgressBar from '@/components/ProgressBar.vue';

const store = useGameStore();
const g = computed(() => store.game!);
const s = computed(() => g.value.state);

const modeName = computed(() => C.gameModes[s.value.player.mode]?.name ?? s.value.player.mode);
const totalLevel = computed(() => { void store.frame; return g.value.totalLevel(); });
const cbLevel = computed(() => { void store.frame; return combatLevel(g.value); });
const maxHp = computed(() => { void store.frame; return playerMaxHp(g.value); });
const activity = computed(() => { void store.frame; return g.value.activityLabel(); });
const inAbyss = computed(() => { void store.frame; return g.value.inAbyss(); });

const activityProgress = computed(() => {
  void store.frame;
  const st = s.value;
  if (st.combat.active) {
    const e = st.combat.enemy;
    return e ? { value: e.hp / Math.max(1, e.maxHp), label: `${C.monsters[e.monsterId]?.name ?? ''} ${fmt(e.hp)} / ${fmt(e.maxHp)}`, color: 'var(--hp)' } : { value: 0, label: '寻找敌人…', color: 'var(--hp)' };
  }
  const a = st.activeAction;
  if (a) return { value: a.progress / Math.max(1, a.interval), label: `已完成 ${fmt(a.completed)} 次`, color: 'var(--accent)' };
  return null;
});

function gotoActivity() {
  const st = s.value;
  if (st.combat.active) { store.go('combat'); return; }
  if (st.activeAction) { const p = skillPage(st.activeAction.skill); store.go(p.page, p.skill); }
}
function gotoSkill(id: SkillId) { const p = skillPage(id); store.go(p.page, p.skill); }

const currencies = computed(() => Object.entries(s.value.currencies).filter(([k, v]) => k === 'gp' || v > 0));

const activeQuests = computed(() => {
  void store.frame;
  return Object.entries(s.value.quests)
    .filter(([id, q]) => q.status === 'active' && C.quests[id])
    .map(([id]) => ({ id, def: C.quests[id], prog: questProgress(g.value, id) }));
});

const log = computed(() => s.value.combat.log.slice(0, 8));
const slayer = computed(() => s.value.slayer.task);

const skills = computed(() => {
  void store.frame;
  const abyss = inAbyss.value;
  const acap = g.value.abyssalLevelCap();
  return C.skillOrder.map((id) => {
    const st = s.value.skills[id];
    const def = C.skills[id];
    const cap = g.value.levelCap(id);
    return {
      id, def, st, cap,
      progress: levelProgress(st.xp, st.level, cap),
      abyssal: abyss && def.abyssalEnabled,
      abyssProgress: levelProgress(st.abyssalXp, st.abyssalLevel, acap, true),
    };
  });
});

const comp = computed(() => { void store.frame; return completion(g.value); });
const compRows = computed(() => [
  ['物品', comp.value.items], ['怪物', comp.value.monsters], ['宠物', comp.value.pets],
  ['技能', comp.value.skills], ['掌握度', comp.value.mastery], ['副本', comp.value.dungeons],
] as [string, number][]);

const farming = computed(() => {
  void store.frame;
  let ready = 0, growing = 0, empty = 0, unlocked = 0;
  for (const p of s.value.farming.plots) {
    const st = plotStatus(g.value, p.id).state;
    if (st === 'locked') continue;
    unlocked++;
    if (st === 'ready') ready++; else if (st === 'growing') growing++; else empty++;
  }
  return { ready, growing, empty, unlocked };
});

const town = computed(() => {
  const t = s.value.township;
  const season = SEASONS[t.season % SEASONS.length];
  const deity = DEITIES.find((d) => d.id === t.deity);
  const res = Object.entries(t.resources).filter(([, v]) => v > 0).slice(0, 6);
  return { t, season, deity, res, level: s.value.skills.township.level };
});

function resName(id: string) { return C.townshipResources[id]?.name ?? (id === 'gp' ? '金币' : id); }
const logColor: Record<string, string> = { player: 'var(--good)', enemy: 'var(--bad)', info: 'var(--muted)', loot: 'var(--accent2)', xp: 'var(--xp)', danger: 'var(--warn)' };
</script>

<template>
  <div class="overview">
    <div class="page-title"><span class="icon">🏠</span><h2>总览</h2></div>

    <div class="cards lg">
      <div class="card">
        <div class="row between">
          <h3>{{ s.player.name }}</h3>
          <span class="tag" :class="{ bad: s.player.mode === 'hardcore' }">{{ modeName }}</span>
        </div>
        <div class="kv">
          <span>游戏时长</span><span>{{ fmtMs(s.playTime) }}</span>
          <span>创建时间</span><span>{{ fmtDate(s.player.createdAt) }}</span>
          <span>总等级</span><span class="bold">{{ full(totalLevel) }}</span>
          <span>战斗等级</span><span class="bold">{{ cbLevel }}</span>
          <span>所在领域</span><span :class="{ abyss: s.player.realm === 'abyssal' }">{{ s.player.realm === 'abyssal' ? '深渊' : '梅尔沃' }}</span>
        </div>
        <div class="small muted">生命值 {{ fmt(s.hp) }} / {{ fmt(maxHp) }}</div>
        <ProgressBar :value="s.hp / Math.max(1, maxHp)" color="var(--hp)" :height="10" />
      </div>

      <div class="card">
        <h3>当前活动</h3>
        <div class="bold" :class="{ muted: activity === '空闲' }">{{ activity }}</div>
        <template v-if="activityProgress">
          <ProgressBar :value="activityProgress.value" :color="activityProgress.color" :height="12" :label="activityProgress.label" />
          <button class="primary" @click="gotoActivity">前往查看</button>
        </template>
        <div v-else class="small muted">当前没有进行中的活动，点击下方技能开始挂机。</div>
      </div>

      <div class="card">
        <h3>货币与银行</h3>
        <div class="kv">
          <template v-for="[k, v] in currencies" :key="k">
            <span>{{ CURRENCY_LABELS[k] ?? k }}</span><span class="bold" :class="{ gold: k === 'gp', abyss: k.startsWith('abyssal') }">{{ fmt(v) }}</span>
          </template>
        </div>
        <div class="small muted mt">银行空间 {{ g.bankUsed() }} / {{ g.bankCapacity() }}</div>
        <ProgressBar :value="g.bankUsed() / Math.max(1, g.bankCapacity())" :color="g.bankUsed() >= g.bankCapacity() ? 'var(--bad)' : 'var(--accent2)'" />
        <button class="small" @click="store.go('bank')">打开银行</button>
      </div>
    </div>

    <div class="cards lg mt">
      <div class="card">
        <h3>最近获得物品</h3>
        <div v-if="s.recent.items.length" class="row">
          <ItemIcon v-for="(r, i) in s.recent.items" :key="i" :id="r.id" :qty="r.qty" :size="38" />
        </div>
        <div v-else class="empty small">暂无</div>
      </div>
      <div class="card">
        <h3>最近升级</h3>
        <div v-if="s.recent.levels.length" class="col small">
          <div v-for="(l, i) in s.recent.levels" :key="i" class="row between">
            <span>{{ C.skills[l.skill]?.icon }} {{ C.skills[l.skill]?.name }}<span v-if="l.abyssal" class="abyss">（深渊）</span></span>
            <span class="bold" :class="{ abyss: l.abyssal }">Lv.{{ l.level }}</span>
          </div>
        </div>
        <div v-else class="empty small">暂无</div>
      </div>
      <div class="card">
        <div class="row between"><h3>进行中的任务</h3><button class="small" @click="store.go('quests')">任务列表</button></div>
        <div v-if="activeQuests.length" class="col">
          <div v-for="q in activeQuests" :key="q.id" class="col">
            <div class="bold small">{{ q.def.name }}</div>
            <div v-for="(o, i) in q.def.objectives" :key="i" class="col" style="gap: 2px">
              <div class="row between tiny"><span>{{ describeObjective(o) }}</span><span>{{ fmt(Math.min(q.prog[i].cur, q.prog[i].target)) }} / {{ fmt(q.prog[i].target) }}</span></div>
              <ProgressBar :value="q.prog[i].cur / Math.max(1, q.prog[i].target)" :color="q.prog[i].cur >= q.prog[i].target ? 'var(--good)' : 'var(--accent)'" :height="6" />
            </div>
          </div>
        </div>
        <div v-else class="empty small">没有进行中的任务</div>
      </div>
    </div>

    <div class="cards lg mt">
      <div class="card">
        <div class="row between"><h3>猎杀任务</h3><button class="small" @click="store.go('slayer')">前往</button></div>
        <template v-if="slayer">
          <div class="row">
            <span style="font-size: 24px">{{ C.monsters[slayer.monsterId]?.icon }}</span>
            <div class="grow">
              <div class="bold" :class="{ abyss: slayer.realm === 'abyssal' }">{{ C.monsters[slayer.monsterId]?.name }}</div>
              <div class="small muted">剩余 {{ slayer.remaining }} / {{ slayer.total }}</div>
            </div>
          </div>
          <ProgressBar :value="(slayer.total - slayer.remaining) / Math.max(1, slayer.total)" color="var(--bad)" />
        </template>
        <div v-else class="small muted">当前没有猎杀任务</div>
      </div>
      <div class="card">
        <div class="row between"><h3>🌱 农业</h3><button class="small" @click="store.go('skill', 'farming')">前往</button></div>
        <div class="kv">
          <span>可收获</span><span :class="{ good: farming.ready > 0 }" class="bold">{{ farming.ready }}</span>
          <span>生长中</span><span>{{ farming.growing }}</span>
          <span>空闲地块</span><span>{{ farming.empty }}</span>
          <span>已解锁地块</span><span>{{ farming.unlocked }} / {{ s.farming.plots.length }}</span>
        </div>
      </div>
      <div class="card">
        <div class="row between"><h3>🏘️ 城镇</h3><button class="small" @click="store.go('skill', 'township')">前往</button></div>
        <div class="kv">
          <span>城镇等级</span><span>{{ town.level }}</span>
          <span>人口</span><span>{{ fmt(town.t.population) }}</span>
          <span>幸福 / 健康</span><span>{{ fmt(town.t.happiness) }} / {{ fmt(town.t.health) }}</span>
          <span>季节</span><span>{{ town.season.icon }} {{ town.season.name }}</span>
          <span>信仰</span><span>{{ town.deity?.name ?? '无' }}</span>
        </div>
        <div v-if="town.res.length" class="row small">
          <span v-for="[k, v] in town.res" :key="k" class="tag">{{ resName(k) }} {{ fmt(v) }}</span>
        </div>
      </div>
    </div>

    <div class="cards lg mt">
      <div class="card">
        <div class="row between"><h3>完成度</h3><button class="small" @click="store.go('collection')">图鉴</button></div>
        <div class="row between"><span class="bold">总计</span><span class="bold gold">{{ pct(comp.total, 2) }}</span></div>
        <ProgressBar :value="comp.total / 100" color="var(--accent2)" :height="10" />
        <div v-for="[label, v] in compRows" :key="label" class="col" style="gap: 2px">
          <div class="row between small"><span>{{ label }}</span><span>{{ pct(v) }}</span></div>
          <ProgressBar :value="v / 100" :height="5" />
        </div>
      </div>
      <div v-if="s.settings.showCombatLog" class="card">
        <div class="row between"><h3>战斗日志</h3><button class="small" @click="store.go('combat')">战斗</button></div>
        <div v-if="log.length" class="col tiny">
          <div v-for="(e, i) in log" :key="i" :style="{ color: logColor[e.kind] }">{{ e.text }}</div>
        </div>
        <div v-else class="empty small">暂无战斗记录</div>
      </div>
    </div>

    <div class="panel mt">
      <h3>全部技能</h3>
      <div class="skill-grid">
        <div v-for="sk in skills" :key="sk.id" class="card clickable skill" :class="{ locked: !sk.st.unlocked }" @click="gotoSkill(sk.id)">
          <div class="row nowrap">
            <span class="sicon">{{ sk.def.icon }}</span>
            <div class="grow">
              <div class="row between nowrap">
                <span class="small bold name">{{ sk.def.name }}</span>
                <span class="small">{{ sk.st.level }}<span class="muted">/{{ sk.cap }}</span></span>
              </div>
              <ProgressBar :value="sk.progress" :color="sk.def.color || 'var(--xp)'" :height="5" />
              <template v-if="sk.abyssal">
                <div class="row between nowrap tiny abyss"><span>深渊</span><span>{{ sk.st.abyssalLevel }}</span></div>
                <ProgressBar :value="sk.abyssProgress" color="var(--abyss)" :height="4" />
              </template>
            </div>
          </div>
          <span v-if="!sk.st.unlocked" class="tiny muted">未解锁</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.skill-grid { display: grid; gap: 8px; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); }
.skill { padding: 8px 10px; gap: 2px; }
.sicon { font-size: 22px; width: 28px; text-align: center; }
.name { overflow: hidden; text-overflow: ellipsis; }
@media (max-width: 760px) { .skill-grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); } }
</style>
