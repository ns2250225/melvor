<script setup lang="ts">
// 离线结算进度与报告
import { computed } from 'vue';
import { C } from '@/content';
import { useGameStore } from '@/stores/game';
import { fmt, fmtMs, full } from '@/app/format';
import Modal from './Modal.vue';
import ItemIcon from './ItemIcon.vue';
import ProgressBar from './ProgressBar.vue';

const store = useGameStore();
const r = computed(() => store.offline.report);
const CUR: Record<string, string> = { gp: '🪙 金币', slayerCoins: '💀 猎杀币', abyssalPieces: '🟣 深渊碎片', abyssalSlayerCoins: '🟪 深渊猎杀币', prayerPoints: '🙏 祈祷点', soulPoints: '⚱️ 灵魂点' };
</script>

<template>
  <Teleport to="body">
    <div v-if="store.offline.running && store.offline.total > 0" class="overlay">
      <div class="panel box">
        <h3>⏳ 正在结算离线进度…</h3>
        <div class="muted small mb">已模拟 {{ fmtMs(store.offline.done) }} / {{ fmtMs(store.offline.total) }}（Web Worker 后台计算）</div>
        <ProgressBar :value="store.offline.done / store.offline.total" :height="12" color="var(--good)" />
        <div class="row mt"><button @click="store.cancelOffline()">取消（剩余时间不结算）</button></div>
      </div>
    </div>
  </Teleport>
  <Modal v-if="r" title="欢迎回来！离线结算报告" wide @close="store.offline.report = null">
    <div class="kv mb">
      <span>离线时长</span><span>{{ fmtMs(r.requestedMs) }}<span v-if="r.capped" class="warn">（超过 24 小时上限，仅结算 {{ fmtMs(r.simulatedMs) }}）</span><span v-if="r.cancelled" class="warn">（已取消，结算 {{ fmtMs(r.simulatedMs) }}）</span></span>
      <span>离线活动</span><span>{{ r.activity }}</span>
      <span>完成动作</span><span>{{ full(r.actions) }}</span>
      <span v-if="r.kills">击杀数量</span><span v-if="r.kills">{{ full(r.kills) }}</span>
      <span v-if="r.deaths">死亡次数</span><span v-if="r.deaths" class="bad">{{ r.deaths }}</span>
      <span>当前生命</span><span>{{ r.hpEnd }}</span>
    </div>
    <div v-if="r.stopReasons.length" class="panel mb">
      <b class="warn">活动停止原因</b>
      <div v-for="(x, i) in r.stopReasons" :key="i" class="small">{{ x }}</div>
    </div>
    <div v-if="r.xp.length">
      <h4>技能经验</h4>
      <table>
        <tr><th>技能</th><th>经验</th><th>等级</th></tr>
        <tr v-for="x in r.xp" :key="x.skill">
          <td>{{ C.skills[x.skill].icon }} {{ C.skills[x.skill].name }}</td>
          <td>+{{ fmt(x.xp) }}<span v-if="x.abyssalXp" class="abyss"> · +{{ fmt(x.abyssalXp) }} AXP</span></td>
          <td>{{ x.fromLevel }}<span v-if="x.levelsGained" class="good"> → {{ x.toLevel }}（+{{ x.levelsGained }}）</span><span v-if="x.abyssalLevelsGained" class="abyss"> 深渊 +{{ x.abyssalLevelsGained }}</span></td>
        </tr>
      </table>
    </div>
    <div v-if="r.mastery.length" class="mt small">
      <b>掌握度提升：</b><span v-for="m in r.mastery" :key="m.skill" class="tag">{{ C.skills[m.skill].name }} +{{ m.levels }} 级</span>
    </div>
    <div v-if="Object.keys(r.currencies).length" class="row mt">
      <span v-for="(v, k) in r.currencies" :key="k" class="tag" :class="v > 0 ? 'good' : 'bad'">{{ CUR[k] ?? k }} {{ v > 0 ? '+' : '' }}{{ fmt(v) }}</span>
    </div>
    <div v-if="r.itemsGained.length" class="mt">
      <h4>获得物品</h4>
      <div class="row"><ItemIcon v-for="i in r.itemsGained" :key="i.id" :id="i.id" :qty="i.qty" :size="40" /></div>
    </div>
    <div v-if="r.itemsLost.length" class="mt">
      <h4>消耗物品</h4>
      <div class="row"><ItemIcon v-for="i in r.itemsLost" :key="i.id" :id="i.id" :qty="i.qty" :size="40" dim /></div>
    </div>
    <div v-if="r.dungeons.length" class="mt small"><b>副本通关：</b><span v-for="d in r.dungeons" :key="d.id" class="tag">{{ C.dungeons[d.id].name }} ×{{ d.count }}</span></div>
    <div v-if="r.quests.length" class="mt small"><b>完成任务：</b><span v-for="q in r.quests" :key="q" class="tag good">{{ C.quests[q].name }}</span></div>
    <div v-if="r.achievements.length" class="mt small"><b>达成成就：</b><span v-for="a in r.achievements" :key="a" class="tag good">{{ C.achievements[a].name }}</span></div>
    <div v-if="r.pets.length" class="mt small"><b>获得宠物：</b><span v-for="p in r.pets" :key="p" class="tag good">{{ C.pets[p].icon }} {{ C.pets[p].name }}</span></div>
    <template #footer><button class="primary" @click="store.offline.report = null">继续游戏</button></template>
  </Modal>
</template>

<style scoped>
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,.6); z-index: 150; display: flex; align-items: center; justify-content: center; padding: 16px; }
.box { width: min(460px, 100%); }
</style>
