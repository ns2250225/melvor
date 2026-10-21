<script setup lang="ts">
// 魔法页面：战斗法术、诅咒、光环与替代魔法
import { computed, ref } from 'vue';
import { C } from '@/content';
import { useGameStore } from '@/stores/game';
import { selectSpell } from '@/game/combat/combat';
import { playerCombatStats } from '@/game/combat/stats';
import { spellRunesAvailable, providedRunes, superheatRecipe } from '@/game/production/actions';
import { BARS } from '@/content/items/materials';
import type { SpellBook, SpellDef } from '@/game/core/types';
import { fmt, fmtSec } from '@/app/format';
import { EXPANSION_SHORT, formatModifiers } from '@/game/ui/combatHelpers';
import SkillHeader from '@/components/SkillHeader.vue';
import ItemIcon from '@/components/ItemIcon.vue';
import ItemList from '@/components/ItemList.vue';
import ProgressBar from '@/components/ProgressBar.vue';
import Requirements from '@/components/Requirements.vue';

const store = useGameStore();
const g = computed(() => store.game!);
const s = computed(() => g.value.state);

type Tab = 'combat' | 'curse' | 'aura' | 'alt';
const tab = ref<Tab>('combat');
const TABS: { id: Tab; name: string }[] = [
  { id: 'combat', name: '🔥 战斗法术' }, { id: 'curse', name: '🙈 诅咒' }, { id: 'aura', name: '🌟 光环' }, { id: 'alt', name: '🪙 替代魔法' },
];
const BOOK_NAMES: Record<SpellBook, string> = { standard: '标准法术', ancient: '远古法术', archaic: '古老法术', abyssal: '深渊法术', curse: '诅咒', aura: '光环', alt: '替代魔法' };
const COMBAT_BOOKS: SpellBook[] = ['standard', 'ancient', 'archaic', 'abyssal'];

const spellsOf = (book: SpellBook) => Object.values(C.spells).filter((x) => x.book === book).sort((a, b) => a.level - b.level);
const provided = computed(() => { void store.frame; return providedRunes(g.value); });
const pstats = computed(() => { void store.frame; return playerCombatStats(g.value, null); });
const magicLevel = computed(() => g.value.level('magic'));

function lockReason(sp: SpellDef): string | null {
  void store.frame;
  if (magicLevel.value < sp.level) return `需要魔法 ${sp.level} 级`;
  if (!g.value.meetsAll(sp.requirements)) return '法术未解锁';
  return null;
}
const canCast = (sp: SpellDef) => { void store.frame; return spellRunesAvailable(g.value, sp.runes); };
const kindOf = (t: Tab): 'spell' | 'curse' | 'aura' => (t === 'curse' ? 'curse' : t === 'aura' ? 'aura' : 'spell');
function isSelected(sp: SpellDef) {
  const m = s.value.magic;
  return m.spell === sp.id || m.curse === sp.id || m.aura === sp.id;
}
function toggle(sp: SpellDef, kind: 'spell' | 'curse' | 'aura') {
  const cur = s.value.magic[kind];
  store.act(() => selectSpell(g.value, cur === sp.id && kind !== 'spell' ? null : sp.id, kind));
}

// ------------------------------------------------------------------ 替代魔法
const altSpells = computed(() => spellsOf('alt'));
const altId = ref<string>('alt_low_alch');
const alt = computed(() => C.spells[altId.value] ?? altSpells.value[0]);
const altTarget = ref<string | null>(null);
const altSearch = ref('');
function pickAlt(id: string) { altId.value = id; altTarget.value = null; }
const alchItems = computed(() => {
  void store.frame;
  const q = altSearch.value.trim().toLowerCase();
  return Object.keys(s.value.bank)
    .filter((id) => { const it = C.items[id]; return it && !it.noSell && !s.value.bankLocked[id] && (!q || it.name.toLowerCase().includes(q)); })
    .sort((a, b) => C.items[b].sellPrice - C.items[a].sellPrice);
});
const superheatBars = computed(() => {
  void store.frame;
  if (!alt.value || alt.value.alt?.kind !== 'superheat') return [];
  return BARS.filter((b) => superheatRecipe(g.value, alt.value.id, `bar_${b.id}`)).map((b) => ({ b, id: `bar_${b.id}` }));
});
const active = computed(() => (s.value.activeAction?.skill === 'magic' ? s.value.activeAction : null));
const activeProgress = computed(() => { void store.frame; return active.value && active.value.interval ? active.value.progress / active.value.interval : 0; });
const needsTarget = computed(() => alt.value?.alt?.kind === 'alch' || alt.value?.alt?.kind === 'superheat');
function startAlt() {
  if (!alt.value) return;
  const sp = alt.value;
  const target = needsTarget.value ? altTarget.value ?? undefined : undefined;
  store.act(() => g.value.startAction('magic', sp.id, target));
}
function stopAlt() { store.act(() => g.value.stopAction()); }
const alchGp = (id: string) => Math.floor((C.items[id]?.sellPrice ?? 0) * (alt.value?.alt?.ratio ?? 1));
</script>

<template>
  <div>
    <SkillHeader skill="magic" />

    <div class="tabs mt">
      <button v-for="t in TABS" :key="t.id" :class="{ on: tab === t.id }" @click="tab = t.id">{{ t.name }}</button>
    </div>

    <!-- ================================================================ 战斗法术 -->
    <template v-if="tab === 'combat'">
      <div class="panel mb small">
        当前战斗法术：<b>{{ s.magic.spell ? C.spells[s.magic.spell]?.name : '无' }}</b>
        <span v-if="pstats.attackType !== 'magic'" class="warn"> · 需要装备魔法武器（法杖/魔杖）才会使用战斗法术</span>
        <span v-else class="good"> · 当前最大伤害 {{ fmt(pstats.maxHit) }}</span>
        <span v-if="provided.size" class="muted"> · 武器提供无限：{{ [...provided].map((r) => C.items[r]?.name).join('、') }}</span>
      </div>
      <template v-for="book in COMBAT_BOOKS" :key="book">
        <div v-if="spellsOf(book).length && (book !== 'abyssal' || g.inAbyss())" class="panel">
          <h3>{{ BOOK_NAMES[book] }}</h3>
          <div class="cards">
            <div v-for="sp in spellsOf(book)" :key="sp.id" class="card" :class="{ active: isSelected(sp), locked: !!lockReason(sp) }">
              <div class="row between">
                <b>{{ sp.icon }} {{ sp.name }}</b>
                <span v-if="EXPANSION_SHORT[sp.expansion]" class="tag abyss">{{ EXPANSION_SHORT[sp.expansion] }}</span>
              </div>
              <div class="small">魔法 {{ sp.level }} 级 · 基础最大伤害 <b>{{ sp.maxHit ?? 0 }}</b></div>
              <div class="tiny muted">{{ sp.description }}</div>
              <div v-if="sp.specialAttack && C.specialAttacks[sp.specialAttack]" class="tiny good">特效：{{ C.specialAttacks[sp.specialAttack].name }} — {{ C.specialAttacks[sp.specialAttack].description }}</div>
              <div class="row runes">
                <div v-for="r in sp.runes" :key="r.id" class="row nowrap tiny" :class="provided.has(r.id) ? 'good' : g.qty(r.id) >= r.qty ? '' : 'bad'">
                  <ItemIcon :id="r.id" :size="24" />×{{ r.qty }} <span class="muted">（{{ provided.has(r.id) ? '∞' : fmt(g.qty(r.id)) }}）</span>
                </div>
              </div>
              <Requirements :reqs="sp.requirements" />
              <button :class="isSelected(sp) ? 'good' : 'primary'" :disabled="!!lockReason(sp) || isSelected(sp)" @click="toggle(sp, 'spell')">
                {{ isSelected(sp) ? '已选择' : lockReason(sp) ?? (canCast(sp) ? '选择' : '选择（符文不足）') }}
              </button>
            </div>
          </div>
        </div>
      </template>
      <div v-if="!g.inAbyss() && spellsOf('abyssal').length" class="muted small mt">🔒 深渊法术在开启深渊之门后显示。</div>
    </template>

    <!-- ================================================================ 诅咒 / 光环 -->
    <template v-else-if="tab === 'curse' || tab === 'aura'">
      <div class="panel mb small">
        当前{{ tab === 'curse' ? '诅咒' : '光环' }}：<b>{{ (tab === 'curse' ? s.magic.curse : s.magic.aura) ? C.spells[(tab === 'curse' ? s.magic.curse : s.magic.aura)!]?.name : '无' }}</b>
        <button v-if="tab === 'curse' ? s.magic.curse : s.magic.aura" class="small ghost" @click="store.act(() => selectSpell(g, null, kindOf(tab)))">取消</button>
        <span class="muted"> · {{ tab === 'curse' ? '攻击时若敌人身上没有同类诅咒则施放，并消耗符文' : '选择后修饰符持续生效' }}</span>
      </div>
      <div class="cards">
        <div v-for="sp in spellsOf(tab)" :key="sp.id" class="card" :class="{ active: isSelected(sp), locked: !!lockReason(sp) }">
          <div class="row between">
            <b>{{ sp.icon }} {{ sp.name }}</b>
            <span v-if="EXPANSION_SHORT[sp.expansion]" class="tag abyss">{{ EXPANSION_SHORT[sp.expansion] }}</span>
          </div>
          <div class="small">魔法 {{ sp.level }} 级</div>
          <div class="tiny muted">{{ sp.description }}</div>
          <div v-if="sp.modifiers" class="row tiny"><span v-for="t in formatModifiers(sp.modifiers)" :key="t" class="tag">{{ t }}</span></div>
          <div class="row runes">
            <div v-for="r in sp.runes" :key="r.id" class="row nowrap tiny" :class="provided.has(r.id) ? 'good' : g.qty(r.id) >= r.qty ? '' : 'bad'">
              <ItemIcon :id="r.id" :size="24" />×{{ r.qty }} <span class="muted">（{{ provided.has(r.id) ? '∞' : fmt(g.qty(r.id)) }}）</span>
            </div>
          </div>
          <Requirements :reqs="sp.requirements" />
          <button :class="isSelected(sp) ? 'good' : 'primary'" :disabled="!!lockReason(sp)" @click="toggle(sp, kindOf(tab))">
            {{ isSelected(sp) ? '取消选择' : lockReason(sp) ?? '选择' }}
          </button>
        </div>
      </div>
    </template>

    <!-- ================================================================ 替代魔法 -->
    <template v-else>
      <div v-if="active" class="panel mb">
        <div class="row between">
          <b>{{ C.spells[active.actionId]?.icon }} 正在施放：{{ C.spells[active.actionId]?.name }}<span v-if="active.target" class="muted">（{{ C.items[active.target]?.name }}）</span></b>
          <button class="danger small" @click="stopAlt">停止</button>
        </div>
        <ProgressBar :value="activeProgress" color="var(--xp)" :height="10" class="mt" />
        <div class="tiny muted mt">已完成 {{ active.completed }} 次 · 每次 {{ fmtSec(active.interval) }}</div>
      </div>
      <div class="alt-layout">
        <div class="panel">
          <h3>法术</h3>
          <div class="col">
            <button v-for="sp in altSpells" :key="sp.id" class="altbtn" :class="{ primary: alt?.id === sp.id }" :disabled="magicLevel < sp.level" @click="pickAlt(sp.id)">
              <span>{{ sp.icon }} {{ sp.name }}</span><span class="tiny">Lv {{ sp.level }}</span>
            </button>
          </div>
        </div>
        <div v-if="alt" class="panel">
          <div class="row between">
            <h3>{{ alt.icon }} {{ alt.name }}</h3>
            <span v-if="EXPANSION_SHORT[alt.expansion]" class="tag abyss">{{ EXPANSION_SHORT[alt.expansion] }}</span>
          </div>
          <div class="small muted">{{ alt.description }}</div>
          <div class="kv mt">
            <span>魔法等级</span><span :class="magicLevel >= alt.level ? 'good' : 'bad'">{{ alt.level }}</span>
            <span>经验</span><span>{{ alt.xp ?? 0 }} XP / 次</span>
            <span>耗时</span><span>{{ fmtSec(alt.interval ?? 2000) }}</span>
          </div>
          <div class="small mt">符文消耗</div>
          <div class="row runes">
            <div v-for="r in alt.runes" :key="r.id" class="row nowrap tiny" :class="provided.has(r.id) ? 'good' : g.qty(r.id) >= r.qty ? '' : 'bad'">
              <ItemIcon :id="r.id" :size="26" />×{{ r.qty }} <span class="muted">（{{ provided.has(r.id) ? '∞' : fmt(g.qty(r.id)) }}）</span>
            </div>
          </div>
          <Requirements :reqs="alt.requirements" />
          <div class="sep" />

          <template v-if="alt.alt?.kind === 'alch'">
            <div class="row between">
              <b class="small">选择炼金目标（已锁定与不可出售物品不显示）</b>
              <span v-if="altTarget" class="small gold">每次 +{{ fmt(alchGp(altTarget)) }} 金币</span>
            </div>
            <input v-model="altSearch" placeholder="搜索物品" class="full mt" />
            <div class="targets mt">
              <div v-if="!alchItems.length" class="muted small">没有可炼金的物品</div>
              <button v-for="id in alchItems" :key="id" class="target" :class="{ primary: altTarget === id }" @click="altTarget = id">
                <ItemIcon :id="id" :qty="g.qty(id)" :size="30" :clickable="false" />
                <span class="tiny">{{ C.items[id].name }}<br /><span class="gold">{{ fmt(alchGp(id)) }}</span></span>
              </button>
            </div>
          </template>

          <template v-else-if="alt.alt?.kind === 'superheat'">
            <b class="small">选择金属锭（产出 ×{{ alt.alt.ratio ?? 1 }}，同时获得锻造经验）</b>
            <div class="col mt">
              <div v-if="!superheatBars.length" class="muted small">没有可冶炼的金属锭</div>
              <div v-for="{ b, id } in superheatBars" :key="id" class="prow row nowrap" :class="{ sel: altTarget === id }">
                <ItemIcon :id="id" :qty="g.qty(id)" :size="32" />
                <div class="grow">
                  <div class="small bold">{{ C.items[id]?.name }} <span class="tiny" :class="g.level('smithing') >= b.level ? 'good' : 'bad'">锻造 {{ b.level }}</span></div>
                  <ItemList :items="b.ores" check :size="22" />
                </div>
                <button class="small" :class="{ primary: altTarget === id }" @click="altTarget = id">{{ altTarget === id ? '已选择' : '选择' }}</button>
              </div>
            </div>
          </template>

          <template v-else-if="alt.alt?.kind === 'convert'">
            <div class="small">消耗</div>
            <ItemList :items="alt.alt.consumes ?? []" check />
            <div class="small mt">产出</div>
            <ItemList :items="alt.alt.produces ?? []" />
          </template>

          <div class="row mt">
            <button class="primary" :disabled="magicLevel < alt.level || (needsTarget && !altTarget)" @click="startAlt">
              {{ active?.actionId === alt.id ? '重新开始施放' : '开始施放' }}
            </button>
            <button v-if="active" class="danger" @click="stopAlt">停止</button>
            <span v-if="needsTarget && !altTarget" class="small muted">请先选择目标</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.runes { gap: 10px; }
.alt-layout { display: grid; grid-template-columns: 260px 1fr; gap: 12px; }
.alt-layout .panel + .panel { margin-top: 0; }
.altbtn { justify-content: space-between; }
.full { width: 100%; }
.targets { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 6px; max-height: 360px; overflow: auto; }
.target { justify-content: flex-start; white-space: normal; text-align: left; min-height: 48px; }
.prow { padding: 5px; border: 1px solid var(--border); border-radius: 8px; }
.prow.sel { border-color: var(--accent); }
@media (max-width: 760px) { .alt-layout { grid-template-columns: 1fr; } }
</style>
