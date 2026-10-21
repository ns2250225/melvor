<script setup lang="ts">
import { computed } from 'vue';
import { C } from '@/content';
import { useGameStore } from '@/stores/game';
import { playerMaxHp } from '@/game/combat/stats';
import { fmt, fmtMs } from '@/app/format';
import ProgressBar from './ProgressBar.vue';

const store = useGameStore();
const g = computed(() => store.game!);
const s = computed(() => g.value.state);
const maxHp = computed(() => { void store.frame; return playerMaxHp(g.value); });
const action = computed(() => { void store.frame; const a = s.value.activeAction; return a ? { label: g.value.activityLabel(), p: a.progress / Math.max(1, a.interval) } : null; });
const saveText = computed(() => ({ idle: '', saving: '保存中…', saved: '已保存', error: '保存失败' })[store.saveStatus]);
function applyUpdate() {
  window.navigator.serviceWorker?.getRegistration().then((r) => r?.waiting?.postMessage('SKIP_WAITING'));
}
function goActivity() {
  if (s.value.combat.active) store.go('combat');
  else if (s.value.activeAction) store.go(s.value.activeAction.skill === 'magic' ? 'magic' : 'skill', s.value.activeAction.skill);
}
</script>

<template>
  <header class="topbar">
    <button class="ghost burger" aria-label="菜单" @click="store.navOpen = !store.navOpen">☰</button>
    <div class="activity" @click="goActivity">
      <div class="small bold ellipsis">{{ g.activityLabel() }}</div>
      <ProgressBar v-if="action" :value="action.p" :height="5" color="var(--good)" />
      <div v-else-if="s.combat.active && s.combat.enemy" class="tiny muted ellipsis">{{ C.monsters[s.combat.enemy.monsterId].name }} {{ fmt(s.combat.enemy.hp) }}/{{ fmt(s.combat.enemy.maxHp) }}</div>
    </div>
    <div class="hp" :title="`生命 ${s.hp}/${maxHp}`">
      <span class="tiny">❤️ {{ fmt(s.hp) }}/{{ fmt(maxHp) }}</span>
      <ProgressBar :value="s.hp / maxHp" color="var(--hp)" :height="5" />
    </div>
    <div class="cur">
      <span class="tag" title="金币">🪙 {{ fmt(s.currencies.gp) }}</span>
      <span class="tag hide-sm" title="猎杀币">💀 {{ fmt(s.currencies.slayerCoins) }}</span>
      <span class="tag hide-sm" title="祈祷点">🙏 {{ fmt(s.currencies.prayerPoints) }}</span>
      <span v-if="g.inAbyss()" class="tag abyss hide-sm" title="深渊碎片">🟣 {{ fmt(s.currencies.abyssalPieces) }}</span>
      <span class="tag hide-sm" title="银行容量" :class="{ bad: g.bankUsed() >= g.bankCapacity() }">🏦 {{ g.bankUsed() }}/{{ g.bankCapacity() }}</span>
      <span class="tiny muted save" :class="{ bad: store.saveStatus === 'error' }" :title="store.saveError">{{ saveText }}</span>
    </div>
  </header>
  <div v-if="store.anomaly" class="banner warn" @click="store.anomaly = null">⚠️ {{ store.anomaly }}（点击关闭）</div>
  <div v-if="store.updateAvailable" class="banner" @click="applyUpdate">🔄 发现新版本，点击更新</div>
  <div v-if="s.bonfire.endsAt > s.clock" class="banner fire">🔥 篝火燃烧中：生火经验 +{{ s.bonfire.bonus }}%，剩余 {{ fmtMs(s.bonfire.endsAt - s.clock) }}</div>
</template>

<style scoped>
.topbar { height: 56px; display: flex; align-items: center; gap: 12px; padding: 0 14px; border-bottom: 1px solid var(--border); background: var(--bg2); flex-shrink: 0; }
.burger { display: none; font-size: 18px; }
.activity { flex: 1; min-width: 0; cursor: pointer; display: flex; flex-direction: column; gap: 2px; max-width: 360px; }
.hp { width: 150px; display: flex; flex-direction: column; gap: 2px; }
.cur { display: flex; gap: 6px; align-items: center; margin-left: auto; flex-wrap: nowrap; }
.ellipsis { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.save { min-width: 44px; text-align: right; }
.banner { background: var(--panel2); border-bottom: 1px solid var(--border); padding: 6px 14px; font-size: 13px; cursor: pointer; }
.banner.warn { color: var(--warn); }
.banner.fire { color: var(--accent2); cursor: default; }
@media (max-width: 900px) { .burger { display: inline-flex; } }
@media (max-width: 640px) { .hide-sm { display: none; } .hp { width: 90px; } .topbar { gap: 8px; padding: 0 8px; } }
</style>
