<script setup lang="ts">
// 商店页面：按分类浏览，显示费用、拥有数量、需求、升级状态与购买
import { computed, ref } from 'vue';
import { C } from '@/content';
import { useGameStore } from '@/stores/game';
import { buy, canBuy, shopCost } from '@/game/inventory/shop';
import type { ShopItemDef } from '@/game/core/types';
import { fmt } from '@/app/format';
import { CURRENCY_LABELS, EXPANSION_SHORT, formatModifiers } from '@/game/ui/combatHelpers';
import ItemIcon from '@/components/ItemIcon.vue';
import ItemList from '@/components/ItemList.vue';
import Requirements from '@/components/Requirements.vue';

const store = useGameStore();
const g = computed(() => store.game!);
const s = computed(() => g.value.state);

const ORDER = ['通用', '技能升级', '材料', '魔法', '手套', '技能披风', '猎杀', '扩展', '深渊'];
const categories = computed(() => {
  const all = [...new Set(Object.values(C.shop).map((x) => x.category))];
  return [...ORDER.filter((c) => all.includes(c)), ...all.filter((c) => !ORDER.includes(c))];
});
const tab = ref('通用');
const search = ref('');
const hideOwned = ref(false);
const qtys = ref<Record<string, number>>({});

const owned = (d: ShopItemDef) => s.value.shop[d.id] || 0;
const maxed = (d: ShopItemDef) => d.buyLimit > 0 && owned(d) >= d.buyLimit;
const upgradedBy = (d: ShopItemDef) => Object.values(C.shop).find((x) => x.replaces === d.id && owned(x) > 0);
const multi = (d: ShopItemDef) => d.buyLimit === 0 || d.buyLimit > 1;
function qtyOf(d: ShopItemDef): number {
  if (!multi(d)) return 1;
  let q = Math.floor(qtys.value[d.id] || 1);
  if (q < 1) q = 1;
  if (d.buyLimit > 0) q = Math.min(q, Math.max(1, d.buyLimit - owned(d)));
  return q;
}
const items = computed(() => {
  void store.frame;
  const q = search.value.trim().toLowerCase();
  return Object.values(C.shop).filter((d) => {
    if (q) { if (!d.name.toLowerCase().includes(q) && !d.description.toLowerCase().includes(q)) return false; }
    else if (d.category !== tab.value) return false;
    if (hideOwned.value && (maxed(d) || upgradedBy(d))) return false;
    return true;
  }).map((d) => {
    const qty = qtyOf(d);
    return { d, qty, cost: shopCost(g.value, d, qty), err: maxed(d) ? null : canBuy(g.value, d, qty), up: upgradedBy(d) };
  });
});
function doBuy(d: ShopItemDef, qty: number) { store.act(() => buy(g.value, d.id, qty)); }
const CUR_KEYS = ['gp', 'slayerCoins', 'abyssalPieces', 'abyssalSlayerCoins'] as const;
const costParts = (c: ReturnType<typeof shopCost>) => CUR_KEYS.filter((k) => c[k] > 0).map((k) => ({ k, v: c[k] }));
const curEnough = (k: (typeof CUR_KEYS)[number], v: number) => s.value.currencies[k] >= v;
</script>

<template>
  <div>
    <div class="page-title">
      <span class="icon">🛒</span>
      <div class="grow">
        <h2>商店</h2>
        <div class="muted small">购买永久升级、材料、装备与扩展内容</div>
      </div>
    </div>

    <div class="panel row">
      <span class="tag gold">{{ CURRENCY_LABELS.gp }} {{ fmt(s.currencies.gp) }}</span>
      <span class="tag">{{ CURRENCY_LABELS.slayerCoins }} {{ fmt(s.currencies.slayerCoins) }}</span>
      <span class="tag abyss">{{ CURRENCY_LABELS.abyssalPieces }} {{ fmt(s.currencies.abyssalPieces) }}</span>
      <span class="tag abyss">{{ CURRENCY_LABELS.abyssalSlayerCoins }} {{ fmt(s.currencies.abyssalSlayerCoins) }}</span>
      <span class="tag">🏦 银行 {{ g.bankUsed() }} / {{ g.bankCapacity() }}</span>
    </div>

    <div class="panel">
      <div class="tabs">
        <button v-for="c in categories" :key="c" :class="{ on: tab === c && !search.trim() }" @click="tab = c; search = ''">{{ c }}</button>
      </div>
      <div class="row mb">
        <input v-model="search" placeholder="搜索全部商品" class="grow" />
        <label class="row small"><input v-model="hideOwned" type="checkbox" /> 隐藏已购买 / 已升级</label>
      </div>

      <div v-if="!items.length" class="empty">没有商品</div>
      <div class="cards lg">
        <div v-for="{ d, qty, cost, err, up } in items" :key="d.id" class="card" :class="{ locked: !!err && !maxed(d) && !g.meetsAll(d.requirements), active: maxed(d) }">
          <div class="row nowrap">
            <ItemIcon v-if="d.grants?.length" :id="d.grants[0].id" :size="42" />
            <span v-else class="bigicon">{{ d.icon }}</span>
            <div class="grow">
              <div class="row between">
                <b>{{ d.name }}</b>
                <div class="row">
                  <span v-if="EXPANSION_SHORT[d.expansion]" class="tag abyss">{{ EXPANSION_SHORT[d.expansion] }}</span>
                  <span v-if="search.trim()" class="tag">{{ d.category }}</span>
                </div>
              </div>
              <div class="tiny muted">{{ d.description }}</div>
            </div>
          </div>
          <div v-if="d.upgrade?.modifiers" class="row tiny"><span v-for="t in formatModifiers(d.upgrade.modifiers)" :key="t" class="tag good">{{ t }}</span></div>
          <div v-if="d.grants?.length" class="small">获得：<ItemList :items="d.grants.map((x) => ({ id: x.id, qty: x.qty * qty }))" :size="24" show-name /></div>
          <div v-if="d.charges" class="tiny good">每次购买 +{{ d.charges }} 充能（当前 {{ fmt(d.grants?.[0] ? s.glovesCharges[d.grants[0].id] || 0 : 0) }}）</div>
          <div v-if="d.replaces" class="tiny muted">升级自「{{ C.shop[d.replaces]?.name }}」</div>
          <Requirements :reqs="d.requirements" />
          <div class="row small cost">
            <span class="muted">费用{{ qty > 1 ? `（×${qty}）` : '' }}：</span>
            <span v-for="p in costParts(cost)" :key="p.k" :class="curEnough(p.k, p.v) ? '' : 'bad'">{{ CURRENCY_LABELS[p.k] }} {{ fmt(p.v) }}</span>
            <span v-if="!costParts(cost).length && !cost.items.length" class="good">免费</span>
          </div>
          <ItemList v-if="cost.items.length" :items="cost.items" check :size="24" />
          <div class="row between">
            <span class="tiny muted">
              已拥有 {{ owned(d) }}{{ d.buyLimit > 0 ? ` / ${d.buyLimit}` : '' }}
              <template v-if="d.buyLimit === 0"> · 无购买上限</template>
            </span>
            <span v-if="up" class="tag good">已升级 → {{ up.name }}</span>
            <span v-else-if="maxed(d)" class="tag good">{{ d.buyLimit === 1 ? '已拥有' : '已达上限' }}</span>
          </div>
          <div v-if="!maxed(d)" class="row nowrap">
            <input v-if="multi(d)" v-model.number="qtys[d.id]" type="number" min="1" :max="d.buyLimit > 0 ? d.buyLimit - owned(d) : undefined" placeholder="1" class="qty" />
            <button class="primary grow" :disabled="!!err" @click="doBuy(d, qty)">{{ err ?? `购买${qty > 1 ? ` ×${qty}` : ''}` }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bigicon { font-size: 32px; width: 42px; text-align: center; }
.cost { gap: 10px; }
.qty { width: 90px; }
</style>
