<script setup lang="ts">
import { computed } from 'vue';
import { C } from '@/content';
import { useGameStore, type PageId } from '@/stores/game';
import type { SkillId } from '@/game/core/types';

const store = useGameStore();
const g = computed(() => store.game!);
const groups: { title: string; skills: SkillId[] }[] = [
  { title: '采集', skills: ['woodcutting', 'fishing', 'mining', 'thieving', 'farming', 'archaeology', 'harvesting'] },
  { title: '制造', skills: ['firemaking', 'cooking', 'smithing', 'fletching', 'crafting', 'runecrafting', 'herblore', 'summoning'] },
  { title: '综合', skills: ['agility', 'astrology', 'township', 'cartography'] },
];
const combatSkills: SkillId[] = ['attack', 'strength', 'defence', 'hitpoints', 'ranged', 'magic', 'prayer', 'slayer', 'corruption'];
const sys: { id: PageId; name: string; icon: string }[] = [
  { id: 'bank', name: '银行', icon: 'bank' }, { id: 'shop', name: '商店', icon: 'cart' }, { id: 'quests', name: '任务', icon: 'scroll' },
  { id: 'achievements', name: '成就', icon: 'trophy' }, { id: 'pets', name: '宠物', icon: 'paw' }, { id: 'collection', name: '图鉴', icon: 'book' },
  { id: 'expansions', name: '扩展内容', icon: 'galaxy' }, { id: 'statistics', name: '统计', icon: 'chart' }, { id: 'settings', name: '设置', icon: 'gear' }, { id: 'saves', name: '存档', icon: 'save' },
];
const activeSkill = computed(() => g.value.state.activeAction?.skill);
function lvl(id: SkillId) { const s = g.value.state.skills[id]; return s.unlocked ? s.level : 'lock'; }
function isOn(p: PageId, skill?: SkillId) { return store.page === p && (!skill || store.skillPage === skill); }
</script>

<template>
  <nav class="sidebar" :class="{ open: store.navOpen }">
    <div class="brand" @click="store.go('overview')"><Icon name="swords" /> <span>Idle Realms</span></div>
    <div class="scroll navscroll">
      <a class="nav" :class="{ on: isOn('overview') }" @click="store.go('overview')"><Icon name="home" /> 总览</a>
      <div class="gtitle">战斗</div>
      <a class="nav" :class="{ on: isOn('combat'), running: g.state.combat.active }" @click="store.go('combat')"><Icon name="swords" /> 战斗 <span class="lv">{{ g.state.combat.active ? '●' : '' }}</span></a>
      <a class="nav" :class="{ on: isOn('slayer') }" @click="store.go('slayer')"><Icon name="skull" /> 猎杀任务 <span class="lv">{{ lvl('slayer') }}</span></a>
      <a class="nav" :class="{ on: isOn('equipment') }" @click="store.go('equipment')"><Icon name="shield" /> 装备</a>
      <a class="nav" :class="{ on: isOn('magic') }" @click="store.go('magic')"><Icon name="crystal_ball" /> 魔法 <span class="lv">{{ lvl('magic') }}</span></a>
      <a class="nav" :class="{ on: isOn('prayer') }" @click="store.go('prayer')"><Icon name="pray" /> 祈祷 <span class="lv">{{ lvl('prayer') }}</span></a>
      <div class="combat-levels">
        <span v-for="sid in combatSkills" :key="sid" v-show="C.skills[sid]" class="cl" :title="C.skills[sid].name"><Icon :name="C.skills[sid]?.icon" :seed="sid" />{{ lvl(sid) }}</span>
      </div>
      <template v-for="grp in groups" :key="grp.title">
        <div class="gtitle">{{ grp.title }}</div>
        <a v-for="sid in grp.skills" :key="sid" class="nav" :class="{ on: isOn('skill', sid), running: activeSkill === sid, locked: !g.state.skills[sid].unlocked }" @click="store.go('skill', sid)">
          <Icon :name="C.skills[sid]?.icon" :seed="sid" /> {{ C.skills[sid].name }} <span class="lv">{{ lvl(sid) }}</span>
        </a>
      </template>
      <div class="gtitle">系统</div>
      <a v-for="p in sys" :key="p.id" class="nav" :class="{ on: isOn(p.id) }" @click="store.go(p.id)"><Icon :name="p.icon" /> {{ p.name }}</a>
      <a class="nav" href="./wiki.html" target="_blank" rel="noopener"><Icon name="books" /> 游戏百科 <span class="lv">↗</span></a>
    </div>
  </nav>
  <div v-if="store.navOpen" class="scrim" @click="store.navOpen = false" />
</template>

<style scoped>
.sidebar { width: var(--sidebar); background: var(--bg2); border-right: 1px solid var(--border); display: flex; flex-direction: column; height: 100%; flex-shrink: 0; }
.brand { padding: 14px 16px; font-size: 18px; font-weight: 750; cursor: pointer; border-bottom: 1px solid var(--border); }
.navscroll { flex: 1; padding: 6px 8px 24px; }
.gtitle { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; margin: 12px 8px 4px; }
.nav { display: flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 8px; color: var(--text); text-decoration: none; cursor: pointer; font-size: 14px; }
.nav:hover { background: var(--panel); }
.nav.on { background: var(--accent); color: #fff; }
.nav.running:not(.on) { box-shadow: inset 3px 0 0 var(--good); }
.nav.locked { opacity: 0.6; }
.lv { margin-left: auto; font-size: 12px; opacity: 0.85; }
.combat-levels { display: flex; flex-wrap: wrap; gap: 4px; padding: 4px 8px; font-size: 12px; }
.cl { background: var(--panel); border-radius: 6px; padding: 1px 5px; }
.scrim { display: none; }
@media (max-width: 900px) {
  .sidebar { position: fixed; left: 0; top: 0; bottom: 0; z-index: 60; transform: translateX(-100%); transition: transform 0.2s; }
  .sidebar.open { transform: none; }
  .scrim { display: block; position: fixed; inset: 0; background: rgba(0,0,0,.4); z-index: 55; }
}
</style>
