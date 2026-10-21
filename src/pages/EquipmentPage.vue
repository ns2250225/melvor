<script setup lang="ts">
// 装备页面：装备方案、装备栏、装备选择器、属性汇总、修饰符来源、食物栏、药水与手套充能
import { computed, ref } from 'vue';
import { C } from '@/content';
import { useGameStore } from '@/stores/game';
import { EQUIP_SLOTS, type EquipSlot, type StatKey } from '@/game/core/types';
import {
  equip, unequip, equipSetCount, switchSet, foodSlotCount, equipFood, unequipFood, removePotion, equipRequirementsMet, slotsFor, isStackableSlot,
} from '@/game/inventory/equipment';
import { gearStats, playerCombatStats, combatLevel, STAT_KEYS, STAT_NAMES, foodHeal } from '@/game/combat/stats';
import { fmt, full, pct, fmtSec } from '@/app/format';
import { SLOT_NAMES, SLOT_ICONS, ATTACK_TYPE_NAMES, formatModifiers } from '@/game/ui/combatHelpers';
import ItemIcon from '@/components/ItemIcon.vue';

const store = useGameStore();
const g = computed(() => store.game!);
const s = computed(() => g.value.state);
const set = computed(() => s.value.equipmentSets[s.value.activeSet]);
const setCount = computed(() => equipSetCount(g.value));
const inDungeon = computed(() => s.value.combat.active && s.value.combat.area?.kind === 'dungeon');

// ------------------------------------------------------------------ 装备栏与选择器
const selected = ref<EquipSlot>('weapon');
const search = ref('');
const candidates = computed(() => {
  void store.frame;
  const q = search.value.trim().toLowerCase();
  return Object.keys(s.value.bank)
    .filter((id) => slotsFor(id).includes(selected.value) && (!q || (C.items[id]?.name ?? id).toLowerCase().includes(q)))
    .map((id) => ({ id, err: equipRequirementsMet(g.value, id) }))
    .sort((a, b) => (a.err ? 1 : 0) - (b.err ? 1 : 0) || (C.items[a.id].name < C.items[b.id].name ? -1 : 1));
});
function doEquip(id: string) {
  const qty = isStackableSlot(selected.value) ? Infinity : 1;
  store.act(() => equip(g.value, id, qty, selected.value));
}
function doUnequip(slot: EquipSlot) { store.act(() => unequip(g.value, slot)); }
function statLine(id: string): string {
  const st = C.items[id]?.equipment?.stats ?? {};
  return Object.entries(st).filter(([, v]) => v).slice(0, 4)
    .map(([k, v]) => (k === 'attackSpeed' ? `${STAT_NAMES[k as StatKey]} ${fmtSec(v as number)}` : `${STAT_NAMES[k as StatKey]} ${(v as number) > 0 ? '+' : ''}${v}`)).join(' · ');
}

// ------------------------------------------------------------------ 属性
const gear = computed(() => { void store.frame; return gearStats(g.value); });
const derived = computed(() => { void store.frame; return playerCombatStats(g.value, null); });
const cbLevel = computed(() => { void store.frame; return combatLevel(g.value); });
const sources = computed(() => { void store.frame; return g.value.mods.sources.filter((x) => Object.keys(x.modifiers).length); });
const showAllSources = ref(false);

// ------------------------------------------------------------------ 食物
const foodCount = computed(() => foodSlotCount(g.value));
const foodTarget = ref(0);
const foodQty = ref<number | null>(null);
const bankFoods = computed(() => { void store.frame; return Object.keys(s.value.bank).filter((id) => C.items[id]?.healsFor).sort((a, b) => (C.items[b].healsFor ?? 0) - (C.items[a].healsFor ?? 0)); });
function addFood(id: string) {
  const q = foodQty.value && foodQty.value > 0 ? Math.floor(foodQty.value) : g.value.qty(id);
  store.act(() => equipFood(g.value, id, q, Math.min(foodTarget.value, foodCount.value - 1)));
}
function selectFood(i: number) { s.value.selectedFood = i; foodTarget.value = i; store.requestSave(); }

// ------------------------------------------------------------------ 药水与手套
const potions = computed(() => Object.entries(s.value.potions));
const potionKeyName = (k: string) => (k === 'combat' ? '战斗' : (C.skills as Record<string, { name: string }>)[k]?.name ?? k);
const gloves = computed(() => Object.entries(s.value.glovesCharges).filter(([, v]) => v > 0));
</script>

<template>
  <div>
    <div class="page-title">
      <span class="icon">🛡️</span>
      <div class="grow">
        <h2>装备</h2>
        <div class="muted small">战斗等级 <b>{{ cbLevel }}</b> · 攻击方式 {{ ATTACK_TYPE_NAMES[derived.attackType] }}<span v-if="inDungeon" class="warn"> · 副本中无法更换装备</span></div>
      </div>
    </div>

    <div class="tabs">
      <button v-for="i in 3" :key="i" :class="{ on: s.activeSet === i - 1 }" :disabled="i - 1 >= setCount" @click="store.act(() => switchSet(g, i - 1))">
        {{ i - 1 >= setCount ? '🔒 ' : '' }}方案 {{ i }}
      </button>
      <button v-if="setCount < 3" class="ghost small" @click="store.go('shop')">在商店解锁更多方案</button>
    </div>

    <div class="layout">
      <div class="panel">
        <h3>装备栏</h3>
        <div class="slots">
          <div v-for="slot in EQUIP_SLOTS" :key="slot" class="slot" :class="{ on: selected === slot }" @click="selected = slot">
            <div class="tiny muted">{{ SLOT_NAMES[slot] }}</div>
            <ItemIcon v-if="set[slot]" :id="set[slot]!.id" :qty="isStackableSlot(slot) ? set[slot]!.qty : null" :size="44" />
            <div v-else class="emptyslot">{{ SLOT_ICONS[slot] }}</div>
            <div class="tiny name">{{ set[slot] ? C.items[set[slot]!.id]?.name : '空' }}</div>
            <button v-if="set[slot]" class="small ghost" :disabled="inDungeon" @click.stop="doUnequip(slot)">卸下</button>
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="row between">
          <h3>{{ SLOT_ICONS[selected] }} 选择{{ SLOT_NAMES[selected] }}</h3>
          <span class="small muted">{{ candidates.length }} 件可用</span>
        </div>
        <input v-model="search" placeholder="搜索装备" class="full mb" />
        <div class="picker">
          <div v-if="!candidates.length" class="empty">银行中没有可装备到该栏的物品</div>
          <div v-for="c in candidates" :key="c.id" class="prow row nowrap">
            <ItemIcon :id="c.id" :qty="g.qty(c.id)" :size="36" />
            <div class="grow">
              <div class="small bold">{{ C.items[c.id].name }} <span v-if="C.items[c.id].equipment?.twoHanded" class="tag">双手</span></div>
              <div class="tiny muted">{{ statLine(c.id) }}</div>
              <div v-if="c.err" class="tiny bad">{{ c.err }}</div>
            </div>
            <button class="small primary" :disabled="!!c.err || inDungeon" @click="doEquip(c.id)">{{ isStackableSlot(selected) ? '全部装备' : '装备' }}</button>
          </div>
        </div>
      </div>
    </div>

    <div class="layout">
      <div class="panel">
        <h3>📊 装备属性</h3>
        <div class="kv">
          <template v-for="k in STAT_KEYS" :key="k">
            <template v-if="gear[k]">
              <span>{{ STAT_NAMES[k] }}</span>
              <span :class="(gear[k] ?? 0) > 0 ? 'good' : 'bad'">{{ k === 'attackSpeed' ? fmtSec(gear[k]!) : `${gear[k]! > 0 ? '+' : ''}${gear[k]}` }}</span>
            </template>
          </template>
        </div>
        <div v-if="!STAT_KEYS.some((k) => gear[k])" class="muted small">未装备任何提供属性的物品</div>
      </div>
      <div class="panel">
        <h3>⚔️ 战斗属性</h3>
        <div class="kv">
          <span>战斗等级</span><span>{{ cbLevel }}</span>
          <span>最大生命</span><span>{{ full(derived.maxHp) }}</span>
          <span>攻击方式</span><span>{{ ATTACK_TYPE_NAMES[derived.attackType] }}</span>
          <span>攻击间隔</span><span>{{ fmtSec(derived.attackInterval) }}</span>
          <span>命中值</span><span>{{ fmt(derived.accuracy) }}</span>
          <span>最大伤害</span><span>{{ fmt(derived.maxHit) }}</span>
          <span>近战闪避</span><span>{{ fmt(derived.evasion.melee) }}</span>
          <span>远程闪避</span><span>{{ fmt(derived.evasion.ranged) }}</span>
          <span>魔法闪避</span><span>{{ fmt(derived.evasion.magic) }}</span>
          <span>伤害减免</span><span>{{ pct(derived.damageReduction) }}</span>
          <span>深渊抗性</span><span class="abyss">{{ derived.abyssalResistance }}</span>
          <span v-if="derived.summonMaxHit">召唤兽最大伤害</span><span v-if="derived.summonMaxHit">{{ derived.summonMaxHit }}</span>
          <span v-if="derived.spell">战斗法术</span><span v-if="derived.spell">{{ derived.spell.name }}</span>
        </div>
        <div v-if="derived.problem" class="bad small mt">⚠ {{ derived.problem }}</div>
      </div>
    </div>

    <div class="panel">
      <div class="row between">
        <h3>✨ 生效中的修饰符（{{ sources.length }} 个来源）</h3>
        <button v-if="sources.length > 8" class="small ghost" @click="showAllSources = !showAllSources">{{ showAllSources ? '收起' : '展开全部' }}</button>
      </div>
      <div v-if="!sources.length" class="muted small">暂无修饰符</div>
      <div class="sources">
        <div v-for="(src, i) in showAllSources ? sources : sources.slice(0, 8)" :key="i" class="srow">
          <b class="small">{{ src.name }}</b>
          <div class="row tiny"><span v-for="t in formatModifiers(src.modifiers)" :key="t" class="tag">{{ t }}</span></div>
        </div>
      </div>
    </div>

    <div class="layout">
      <div class="panel">
        <h3>🍖 食物栏</h3>
        <div class="row">
          <div v-for="i in 3" :key="i" class="foodslot" :class="{ on: s.selectedFood === i - 1, locked: i > foodCount }" @click="i <= foodCount && selectFood(i - 1)">
            <template v-if="i > foodCount"><span class="tiny muted">🔒 未解锁</span></template>
            <template v-else-if="s.food[i - 1]">
              <ItemIcon :id="s.food[i - 1]!.id" :qty="s.food[i - 1]!.qty" :size="36" />
              <div class="tiny">+{{ foodHeal(g, s.food[i - 1]!.id) }}</div>
              <button class="small ghost" @click.stop="store.act(() => unequipFood(g, i - 1))">取下</button>
            </template>
            <span v-else class="tiny muted">空栏 {{ i }}</span>
          </div>
        </div>
        <div class="row small mt">
          <span>放入栏位</span>
          <select v-model.number="foodTarget">
            <option v-for="i in foodCount" :key="i" :value="i - 1">栏位 {{ i }}</option>
          </select>
          <input v-model.number="foodQty" type="number" min="1" placeholder="数量（默认全部）" style="width: 150px" />
        </div>
        <div class="picker small-picker mt">
          <div v-if="!bankFoods.length" class="muted small">银行中没有食物</div>
          <div v-for="id in bankFoods" :key="id" class="prow row nowrap">
            <ItemIcon :id="id" :qty="g.qty(id)" :size="32" />
            <div class="grow small">{{ C.items[id].name }} <span class="muted tiny">恢复 {{ foodHeal(g, id) }}</span></div>
            <button class="small primary" @click="addFood(id)">放入</button>
          </div>
        </div>
      </div>

      <div class="panel">
        <h3>🧪 生效药水</h3>
        <div v-if="!potions.length" class="muted small">没有生效中的药水（在银行中点击药水使用）</div>
        <div v-for="[k, p] in potions" :key="k" class="prow row nowrap">
          <ItemIcon :id="p.itemId" :size="32" />
          <div class="grow small">{{ C.items[p.itemId]?.name }} <span class="muted tiny">（{{ potionKeyName(k) }}）剩余 {{ p.charges }} 次</span></div>
          <button class="small" @click="store.act(() => removePotion(g, k))">移除</button>
        </div>
        <h3 class="mt">🧤 手套充能</h3>
        <div v-if="!gloves.length" class="muted small">没有充能手套</div>
        <div v-for="[id, n] in gloves" :key="id" class="prow row nowrap">
          <ItemIcon :id="id" :size="32" />
          <div class="grow small">{{ C.items[id]?.name ?? id }}</div>
          <span class="small">{{ full(n) }} 次</span>
          <span v-if="set.gloves?.id === id" class="tag good">已装备</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.layout { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
.layout .panel + .panel { margin-top: 0; }
.slots { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.slot { border: 1px solid var(--border); border-radius: 10px; padding: 6px; display: flex; flex-direction: column; align-items: center; gap: 3px; cursor: pointer; min-height: 110px; }
.slot.on { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent) inset; }
.slot .name { text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%; }
.emptyslot { width: 44px; height: 44px; border: 1px dashed var(--border); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 20px; opacity: 0.5; }
.full { width: 100%; }
.picker { max-height: 380px; overflow: auto; }
.small-picker { max-height: 220px; }
.prow { padding: 5px 0; border-bottom: 1px dashed var(--border); }
.sources { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 8px; }
.srow { border: 1px solid var(--border); border-radius: 8px; padding: 6px 8px; }
.foodslot { border: 1px solid var(--border); border-radius: 10px; padding: 6px; display: flex; flex-direction: column; align-items: center; gap: 2px; min-width: 80px; min-height: 90px; cursor: pointer; justify-content: center; }
.foodslot.on { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent) inset; }
.foodslot.locked { opacity: 0.5; cursor: not-allowed; }
@media (max-width: 760px) {
  .layout { grid-template-columns: 1fr; }
  .slots { grid-template-columns: repeat(3, 1fr); }
}
</style>
