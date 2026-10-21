<script setup lang="ts">
// 全局物品详情：属性、来源、用途与银行操作（出售、装备、使用、开启、埋葬、捐赠、锁定）
import { computed, ref, watch } from 'vue';
import { C } from '@/content';
import { useGameStore } from '@/stores/game';
import { equip, equipFood, usePotion, equipRequirementsMet } from '@/game/inventory/equipment';
import { openChest } from '@/game/combat/loot';
import { buryBones } from '@/game/combat/combat';
import { donateArtifact } from '@/game/production/special';
import { STAT_NAMES } from '@/game/combat/stats';
import { describeMods } from '@/game/ui/skillHelpers';
import { fmt, full } from '@/app/format';
import type { StatKey } from '@/game/core/types';
import Modal from './Modal.vue';
import ItemIcon from './ItemIcon.vue';

const store = useGameStore();
const g = computed(() => store.game!);
const id = computed(() => store.inspect!);
const it = computed(() => C.items[id.value]);
const owned = computed(() => { void store.frame; return g.value.qty(id.value); });
const qty = ref(1);
watch(id, () => { qty.value = 1; });
const RARITY = ['普通', '稀有', '史诗', '传说'];
const SLOT: Record<string, string> = { helmet: '头盔', body: '身体', legs: '腿部', boots: '靴子', gloves: '手套', cape: '披风', amulet: '项链', ring: '戒指', weapon: '武器', shield: '副手', quiver: '箭袋', passive: '被动', summon1: '召唤', summon2: '召唤', consumable: '消耗品', gem: '宝石' };
const reqErr = computed(() => (it.value?.equipment ? equipRequirementsMet(g.value, id.value) : null));
const sources = computed(() => C.itemSources[id.value] ?? []);
const uses = computed(() => (C.itemUses[id.value] ?? []).filter((u) => u !== '出售'));
const locked = computed(() => !!g.value.state.bankLocked[id.value]);
const lastOpened = ref<{ id: string; qty: number }[]>([]);
const confirmSell = ref(false);

function amount(all = false) { return all ? owned.value : Math.max(1, Math.min(owned.value, Math.floor(qty.value) || 1)); }
function sell(all = false) {
  if (g.value.state.settings.confirmSell && !confirmSell.value && (it.value.rarity || all)) { confirmSell.value = true; return; }
  confirmSell.value = false;
  store.act(() => (g.value.sellItem(id.value, amount(all)) ? null : '无法出售'));
}
function open(all = false) {
  const r = openChest(g.value, id.value, amount(all));
  if (typeof r === 'string') store.act(() => r); else { lastOpened.value = r; store.act(() => null); }
}
function toggleLock() { g.value.state.bankLocked[id.value] = !locked.value; store.requestSave(); }
</script>

<template>
  <Modal v-if="it" :title="it.name" @close="store.inspect = null">
    <div class="row nowrap">
      <ItemIcon :id="id" :size="64" :clickable="false" />
      <div class="col grow">
        <div class="row small">
          <span class="tag">{{ it.category }}</span>
          <span v-if="it.rarity" class="tag gold">{{ RARITY[it.rarity] }}</span>
          <span v-if="it.expansion !== 'base'" class="tag abyss">{{ { toth: 'TotH', aod: 'AoD', ita: 'ItA' }[it.expansion] }}</span>
          <span v-if="it.equipment" class="tag">{{ SLOT[it.equipment.slot] }}</span>
        </div>
        <div v-if="it.description" class="small">{{ it.description }}</div>
        <div class="small muted">拥有：<b>{{ full(owned) }}</b> · 售价：<span class="gold">{{ it.noSell ? '不可出售' : fmt(g.sellPrice(id)) + ' 金币' }}</span></div>
      </div>
    </div>
    <div v-if="it.healsFor" class="mt small">❤️ 恢复 <b>{{ it.healsFor }}</b> 点生命</div>
    <div v-if="it.prayerPoints" class="mt small">🙏 埋葬获得 <b>{{ it.prayerPoints }}</b> 祈祷点</div>
    <div v-if="it.soulPoints" class="mt small abyss">⚱️ 获得 <b>{{ it.soulPoints }}</b> 灵魂点</div>
    <div v-if="it.potion" class="mt small">🧪 {{ it.potion.skill === 'combat' ? '战斗' : C.skills[it.potion.skill].name }}药水 · {{ it.potion.charges }} 次充能</div>
    <template v-if="it.equipment">
      <div class="sep" />
      <div class="kv">
        <template v-for="(v, k) in it.equipment.stats" :key="k">
          <template v-if="v"><span>{{ STAT_NAMES[k as StatKey] }}</span><span :class="v > 0 ? 'good' : 'bad'">{{ k === 'attackSpeed' ? (v / 1000).toFixed(1) + 's' : (v > 0 ? '+' : '') + v }}</span></template>
        </template>
      </div>
      <div v-if="describeMods(it.equipment.modifiers).length" class="row small mt"><span v-for="m in describeMods(it.equipment.modifiers)" :key="m" class="tag good">{{ m }}</span></div>
      <div v-if="it.equipment.twoHanded" class="small warn mt">双手武器（无法同时装备副手）</div>
      <div v-if="it.equipment.ammoType" class="small muted">弹药类型：{{ { arrow: '箭矢', bolt: '弩矢', javelin: '标枪', knife: '飞刀' }[it.equipment.ammoType] }}</div>
      <div v-if="it.equipment.providesRunes?.length" class="small good">提供无限：{{ it.equipment.providesRunes.map((r) => C.items[r].name).join('、') }}</div>
      <div v-if="it.equipment.specialAttacks?.length" class="small">特殊攻击：<span v-for="sa in it.equipment.specialAttacks" :key="sa" class="tag">{{ C.specialAttacks[sa]?.name }}（{{ C.specialAttacks[sa]?.chance }}%）</span></div>
      <div v-if="it.equipment.requirements.length" class="row small mt">
        <span v-for="r in it.equipment.requirements" :key="r.skill + r.abyssal" class="tag" :class="(r.abyssal ? g.abyssalLevel(r.skill) : g.level(r.skill)) >= r.level ? 'good' : 'bad'">{{ C.skills[r.skill].name }}{{ r.abyssal ? '深渊' : '' }} {{ r.level }}</span>
      </div>
    </template>
    <div class="sep" />
    <div class="small"><b>获取来源</b></div>
    <div class="row small"><span v-for="s in sources.slice(0, 12)" :key="s" class="tag">{{ s }}</span><span v-if="!sources.length" class="muted">未知</span></div>
    <div v-if="uses.length" class="small mt"><b>用途</b></div>
    <div class="row small"><span v-for="u in uses.slice(0, 12)" :key="u" class="tag">{{ u }}</span></div>
    <div v-if="lastOpened.length" class="mt">
      <div class="small"><b>开启获得</b></div>
      <div class="row"><ItemIcon v-for="o in lastOpened" :key="o.id" :id="o.id === '$gp' ? 'coin_pouch' : o.id" :qty="o.qty" :size="32" /></div>
    </div>
    <template #footer>
      <template v-if="owned > 0">
        <input v-model.number="qty" type="number" min="1" :max="owned" style="width: 90px" />
        <button v-if="it.equipment" class="primary" :disabled="!!reqErr" :title="reqErr ?? ''" @click="store.act(() => equip(g, id, ['quiver', 'summon1', 'summon2', 'consumable'].includes(it.equipment!.slot) ? amount(true) : 1))">装备{{ reqErr ? `（${reqErr}）` : '' }}</button>
        <button v-if="it.healsFor" @click="store.act(() => equipFood(g, id, amount(true)))">放入食物栏</button>
        <button v-if="it.potion" @click="store.act(() => usePotion(g, id))">使用</button>
        <button v-if="it.dropTable" @click="open(false)">开启</button>
        <button v-if="it.dropTable" @click="open(true)">全部开启</button>
        <button v-if="it.prayerPoints || it.soulPoints" @click="store.act(() => buryBones(g, id, amount()))">埋葬</button>
        <button v-if="it.prayerPoints || it.soulPoints" @click="store.act(() => buryBones(g, id, owned))">全部埋葬</button>
        <button v-if="it.artifact && !g.state.archaeology.museum[id]" @click="store.act(() => donateArtifact(g, id))">捐赠博物馆</button>
        <button v-if="!it.noSell" :disabled="locked" @click="sell(false)">出售 {{ amount() }}</button>
        <button v-if="!it.noSell" :class="{ danger: confirmSell }" :disabled="locked" @click="sell(true)">{{ confirmSell ? '确认出售？' : '全部出售' }}</button>
        <button class="ghost" @click="toggleLock">{{ locked ? '🔒 已锁定' : '🔓 锁定' }}</button>
      </template>
      <span v-else class="muted small">银行中没有该物品</span>
    </template>
  </Modal>
</template>
