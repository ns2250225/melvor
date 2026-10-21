<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue';
import { useGameStore } from '@/stores/game';
import CharacterSelect from '@/components/CharacterSelect.vue';
import Sidebar from '@/components/Sidebar.vue';
import TopBar from '@/components/TopBar.vue';
import Toasts from '@/components/Toasts.vue';
import ItemModal from '@/components/ItemModal.vue';
import OfflineReport from '@/components/OfflineReport.vue';
import ConfirmButton from '@/components/ConfirmButton.vue';
import OverviewPage from '@/pages/OverviewPage.vue';
import SkillPage from '@/pages/SkillPage.vue';
import CombatPage from '@/pages/CombatPage.vue';
import SlayerPage from '@/pages/SlayerPage.vue';
import EquipmentPage from '@/pages/EquipmentPage.vue';
import MagicPage from '@/pages/MagicPage.vue';
import PrayerPage from '@/pages/PrayerPage.vue';
import BankPage from '@/pages/BankPage.vue';
import ShopPage from '@/pages/ShopPage.vue';

const QuestsPage = defineAsyncComponent(() => import('@/pages/QuestsPage.vue'));
const AchievementsPage = defineAsyncComponent(() => import('@/pages/AchievementsPage.vue'));
const PetsPage = defineAsyncComponent(() => import('@/pages/PetsPage.vue'));
const CollectionPage = defineAsyncComponent(() => import('@/pages/CollectionPage.vue'));
const ExpansionsPage = defineAsyncComponent(() => import('@/pages/ExpansionsPage.vue'));
const StatisticsPage = defineAsyncComponent(() => import('@/pages/StatisticsPage.vue'));
const SettingsPage = defineAsyncComponent(() => import('@/pages/SettingsPage.vue'));
const SavesPage = defineAsyncComponent(() => import('@/pages/SavesPage.vue'));

const store = useGameStore();
const pages = {
  overview: OverviewPage, skill: SkillPage, summoning: SkillPage, combat: CombatPage, slayer: SlayerPage, equipment: EquipmentPage,
  magic: MagicPage, prayer: PrayerPage, bank: BankPage, shop: ShopPage, quests: QuestsPage, achievements: AchievementsPage,
  pets: PetsPage, collection: CollectionPage, expansions: ExpansionsPage, statistics: StatisticsPage, settings: SettingsPage, saves: SavesPage,
} as const;
const current = computed(() => pages[store.page] ?? OverviewPage);
const dead = computed(() => !!store.game?.state.player.dead);
</script>

<template>
  <CharacterSelect v-if="!store.game" />
  <div v-else-if="dead" class="center-screen">
    <div class="panel box center">
      <div style="font-size: 64px">💀</div>
      <h2>硬核角色已死亡</h2>
      <p class="muted">{{ store.game.state.player.name }} 在硬核模式中阵亡。根据永久死亡规则，该角色无法继续游戏。</p>
      <div class="row" style="justify-content: center">
        <button @click="store.exitToMenu()">返回角色列表</button>
        <ConfirmButton label="删除该角色" confirm-text="确认永久删除？" @confirm="store.deleteCharacter(store.slot!)" />
      </div>
    </div>
  </div>
  <div v-else-if="store.lockedOut" class="center-screen">
    <div class="panel box center">
      <div style="font-size: 48px">🔒</div>
      <h2>游戏正在其他标签页运行</h2>
      <p class="muted">为防止重复结算与存档冲突，同一角色只能在一个标签页中运行。请关闭其他标签页后重新进入。</p>
      <button @click="store.exitToMenu()">返回角色列表</button>
    </div>
  </div>
  <div v-else class="layout">
    <Sidebar />
    <div class="main">
      <TopBar />
      <main class="content">
        <KeepAlive :max="6">
          <component :is="current" :key="store.page === 'skill' || store.page === 'summoning' ? 'skill' : store.page" />
        </KeepAlive>
      </main>
    </div>
    <ItemModal v-if="store.inspect" />
    <OfflineReport />
  </div>
  <Toasts />
</template>

<style scoped>
.layout { display: flex; height: 100%; }
.main { flex: 1; min-width: 0; display: flex; flex-direction: column; height: 100%; }
.content { flex: 1; overflow: auto; padding: 16px; }
.center-screen { height: 100%; display: flex; align-items: center; justify-content: center; padding: 16px; }
.box { width: min(480px, 100%); }
@media (max-width: 640px) { .content { padding: 10px; } }
</style>
