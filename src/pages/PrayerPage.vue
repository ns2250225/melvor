<script setup lang="ts">
// 祈祷页面：祈祷点 / 灵魂点、埋葬骨头、祈祷列表（普通 / 亵渎 / 深渊）
import { computed, ref } from 'vue';
import { C } from '@/content';
import { useGameStore } from '@/stores/game';
import { togglePrayer, buryBones } from '@/game/combat/combat';
import type { PrayerDef } from '@/game/core/types';
import { fmt } from '@/app/format';
import { formatModifiers, EXPANSION_SHORT } from '@/game/ui/combatHelpers';
import SkillHeader from '@/components/SkillHeader.vue';
import ItemIcon from '@/components/ItemIcon.vue';
import Requirements from '@/components/Requirements.vue';

const store = useGameStore();
const g = computed(() => store.game!);
const s = computed(() => g.value.state);

const bones = computed(() => {
  void store.frame;
  return Object.keys(s.value.bank).filter((id) => C.items[id]?.prayerPoints || C.items[id]?.soulPoints)
    .sort((a, b) => (C.items[b].prayerPoints ?? C.items[b].soulPoints ?? 0) - (C.items[a].prayerPoints ?? C.items[a].soulPoints ?? 0));
});
const buryQty = ref(1);
function bury(id: string, all: boolean) {
  const q = all ? g.value.qty(id) : Math.max(1, Math.floor(buryQty.value || 1));
  store.act(() => buryBones(g.value, id, q));
}
const gainMult = computed(() => { void store.frame; return 1 + g.value.mods.get('prayerPointsGain') / 100; });

const BOOKS: { id: PrayerDef['book']; name: string; note: string }[] = [
  { id: 'normal', name: '🙏 普通祈祷', note: '消耗祈祷点' },
  { id: 'unholy', name: '😈 亵渎祈祷（Throne of the Herald）', note: '消耗祈祷点，需要通关「使者之门」' },
  { id: 'abyssal', name: '🌀 深渊祈祷（Into the Abyss）', note: '消耗灵魂点，需要深渊祈祷等级' },
];
const prayersOf = (book: PrayerDef['book']) => Object.values(C.prayers).filter((p) => p.book === book).sort((a, b) => a.level - b.level);
function lockReason(p: PrayerDef): string | null {
  void store.frame;
  if (p.book === 'abyssal' && !g.value.inAbyss()) return '需要开启深渊之门';
  if (g.value.level('prayer') < p.level) return `需要祈祷 ${p.level} 级`;
  if (!g.value.meetsAll(p.requirements)) return '祈祷未解锁';
  return null;
}
const isOn = (p: PrayerDef) => s.value.prayers.includes(p.id);
const isProtect = (p: PrayerDef) => !!p.modifiers.protectFrom;
function toggle(p: PrayerDef) { store.act(() => togglePrayer(g.value, p.id)); }
const activeCost = computed(() => {
  let pp = 0, pe = 0;
  for (const id of s.value.prayers) { const p = C.prayers[id]; if (p) { pp += p.pointsPerPlayer; pe += p.pointsPerEnemy; } }
  return { pp, pe };
});
</script>

<template>
  <div>
    <SkillHeader skill="prayer" />

    <div class="top">
      <div class="panel">
        <h3>✨ 点数</h3>
        <div class="kv">
          <span>🙏 祈祷点</span><span class="bold">{{ fmt(s.currencies.prayerPoints) }}</span>
          <span>⚱️ 灵魂点</span><span class="bold abyss">{{ g.inAbyss() ? fmt(s.currencies.soulPoints) : '🔒 需要开启深渊之门' }}</span>
          <span>已启用</span><span>{{ s.prayers.length }} / 3</span>
          <span>每次攻击消耗</span><span>玩家攻击 {{ activeCost.pp }} · 敌人攻击 {{ activeCost.pe }}</span>
          <span v-if="gainMult !== 1">点数获取</span><span v-if="gainMult !== 1" class="good">×{{ gainMult.toFixed(2) }}</span>
        </div>
        <div class="tiny muted mt">最多同时启用 3 个祈祷；守护类祈祷互相排斥（启用新的会替换旧的）；战斗结束时所有祈祷自动关闭。点数不足时祈祷会自动关闭。</div>
      </div>

      <div class="panel">
        <div class="row between">
          <h3>🦴 埋葬骨头</h3>
          <label class="row small">数量 <input v-model.number="buryQty" type="number" min="1" style="width: 90px" /></label>
        </div>
        <div class="bones">
          <div v-if="!bones.length" class="muted small">银行中没有骨头或骨灰。击败怪物可以获得骨头。</div>
          <div v-for="id in bones" :key="id" class="brow row nowrap">
            <ItemIcon :id="id" :qty="g.qty(id)" :size="34" />
            <div class="grow small">
              <div>{{ C.items[id].name }}</div>
              <div class="tiny muted">
                <template v-if="C.items[id].prayerPoints">每个 {{ C.items[id].prayerPoints }} 祈祷点</template>
                <template v-if="C.items[id].soulPoints"><span class="abyss">每个 {{ C.items[id].soulPoints }} 灵魂点</span></template>
              </div>
            </div>
            <button class="small" :disabled="!!C.items[id].soulPoints && !g.inAbyss()" @click="bury(id, false)">埋葬 {{ Math.min(g.qty(id), Math.max(1, Math.floor(buryQty || 1))) }}</button>
            <button class="small primary" :disabled="!!C.items[id].soulPoints && !g.inAbyss()" @click="bury(id, true)">全部</button>
          </div>
        </div>
      </div>
    </div>

    <div v-for="b in BOOKS" :key="b.id" class="panel">
      <div class="row between">
        <h3>{{ b.name }}</h3>
        <span class="small muted">{{ b.note }}</span>
      </div>
      <div class="cards">
        <div v-for="p in prayersOf(b.id)" :key="p.id" class="card" :class="{ active: isOn(p), locked: !!lockReason(p) }">
          <div class="row between">
            <b>{{ p.icon }} {{ p.name }}</b>
            <div class="row">
              <span v-if="isProtect(p)" class="tag">守护</span>
              <span v-if="EXPANSION_SHORT[p.expansion]" class="tag abyss">{{ EXPANSION_SHORT[p.expansion] }}</span>
            </div>
          </div>
          <div class="small">祈祷 {{ p.level }} 级</div>
          <div class="tiny muted">{{ p.description }}</div>
          <div class="row tiny"><span v-for="t in formatModifiers(p.modifiers)" :key="t" class="tag">{{ t }}</span></div>
          <div class="tiny">消耗：玩家攻击 <b>{{ p.pointsPerPlayer }}</b> · 敌人攻击 <b>{{ p.pointsPerEnemy }}</b> {{ p.book === 'abyssal' ? '灵魂点' : '祈祷点' }}</div>
          <Requirements :reqs="p.requirements" />
          <button :class="isOn(p) ? 'good' : 'primary'" :disabled="!isOn(p) && !!lockReason(p)" @click="toggle(p)">
            {{ isOn(p) ? '✔ 已启用（点击关闭）' : lockReason(p) ?? '启用' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.top { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 12px 0; }
.top .panel + .panel { margin-top: 0; }
.bones { max-height: 300px; overflow: auto; }
.brow { padding: 5px 0; border-bottom: 1px dashed var(--border); }
@media (max-width: 760px) { .top { grid-template-columns: 1fr; } }
</style>
