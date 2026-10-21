<script setup lang="ts">
// 技能页面分发：根据当前选择的技能渲染对应页面
import { computed } from 'vue';
import { useGameStore, type PageId } from '@/stores/game';
import type { SkillId } from '@/game/core/types';
import { C } from '@/content';
import SkillHeader from '@/components/SkillHeader.vue';
import LockedSkill from './skills/LockedSkill.vue';
import ProductionSkill from './skills/ProductionSkill.vue';
import FarmingSkill from './skills/FarmingSkill.vue';
import AgilitySkill from './skills/AgilitySkill.vue';
import TownshipSkill from './skills/TownshipSkill.vue';
import CartographySkill from './skills/CartographySkill.vue';
import ArchaeologySkill from './skills/ArchaeologySkill.vue';

const store = useGameStore();
const g = computed(() => store.game!);
const skill = computed<SkillId>(() => (store.page === 'summoning' ? 'summoning' : store.skillPage));
const unlocked = computed(() => g.value.state.skills[skill.value]?.unlocked ?? false);

const COMBAT_LINKS: Partial<Record<SkillId, { text: string; links: { page: PageId; label: string }[] }>> = {
  attack: { text: '攻击等级提高近战命中率，并解锁更高阶的近战武器。在战斗中使用近战「刺」风格获得攻击经验。', links: [{ page: 'combat', label: '⚔️ 前往战斗' }, { page: 'equipment', label: '🛡️ 装备' }] },
  strength: { text: '力量等级提高近战最大伤害。在战斗中使用近战「砍」风格获得力量经验。', links: [{ page: 'combat', label: '⚔️ 前往战斗' }, { page: 'equipment', label: '🛡️ 装备' }] },
  defence: { text: '防御等级提高闪避并解锁更高阶护甲。在战斗中使用「格挡」风格或防御型远程/魔法风格获得防御经验。', links: [{ page: 'combat', label: '⚔️ 前往战斗' }, { page: 'equipment', label: '🛡️ 装备' }] },
  hitpoints: { text: '每级生命等级提供 10 点最大生命值。造成伤害时同时获得生命经验。', links: [{ page: 'combat', label: '⚔️ 前往战斗' }] },
  ranged: { text: '远程等级影响远程命中与伤害。装备弓弩与弹药后在战斗中获得远程经验。', links: [{ page: 'combat', label: '⚔️ 前往战斗' }, { page: 'equipment', label: '🛡️ 装备' }] },
  magic: { text: '魔法等级解锁战斗法术、诅咒、光环与替代魔法。', links: [{ page: 'magic', label: '🔮 魔法与法术' }, { page: 'combat', label: '⚔️ 前往战斗' }] },
  prayer: { text: '埋葬骨头获得祈祷点与经验，在战斗中激活祈祷获得强力加成。', links: [{ page: 'prayer', label: '🙏 祈祷' }, { page: 'bank', label: '🏦 银行（埋葬骨头）' }] },
  slayer: { text: '接取猎杀任务击败指定怪物以获得猎杀币与经验，并解锁猎杀区域。', links: [{ page: 'slayer', label: '💀 猎杀任务' }, { page: 'combat', label: '⚔️ 前往战斗' }] },
  corruption: { text: '腐化技能（Into the Abyss）：对深渊敌人施加腐化效果，削弱其属性。', links: [{ page: 'expansions', label: '🌌 扩展内容' }, { page: 'combat', label: '⚔️ 前往战斗' }] },
};
const combatInfo = computed(() => COMBAT_LINKS[skill.value]);
const special: Partial<Record<SkillId, unknown>> = {
  farming: FarmingSkill, agility: AgilitySkill, township: TownshipSkill, cartography: CartographySkill, archaeology: ArchaeologySkill,
};
const comp = computed(() => special[skill.value] ?? null);
</script>

<template>
  <div v-if="!C.skills[skill]" class="empty">未知技能</div>
  <LockedSkill v-else-if="!unlocked" :key="`locked-${skill}`" :skill="skill" />
  <div v-else-if="combatInfo" :key="`combat-${skill}`">
    <SkillHeader :skill="skill" />
    <div class="panel">
      <p class="muted">{{ combatInfo.text }}</p>
      <div class="row">
        <button v-for="l in combatInfo.links" :key="l.page" class="primary" @click="store.go(l.page)">{{ l.label }}</button>
      </div>
    </div>
  </div>
  <component :is="comp" v-else-if="comp" :key="`special-${skill}`" />
  <ProductionSkill v-else :key="`prod-${skill}`" :skill="skill" />
</template>
