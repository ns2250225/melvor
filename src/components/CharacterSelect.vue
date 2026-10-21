<script setup lang="ts">
// 角色选择与创建（首次启动）
import { onMounted, ref } from 'vue';
import { C } from '@/content';
import { useGameStore } from '@/stores/game';
import type { GameMode } from '@/game/core/types';
import { fmtDate } from '@/app/format';
import ConfirmButton from './ConfirmButton.vue';

const store = useGameStore();
const name = ref('');
const mode = ref<GameMode>('standard');
const importText = ref('');
const showImport = ref(false);
const busy = ref(false);
const MODE_NAMES: Record<string, string> = { standard: '标准', hardcore: '硬核', adventure: '冒险' };
onMounted(() => store.refreshCharacters());

async function create() {
  busy.value = true;
  try { await store.createCharacter(name.value.trim() || '冒险者', mode.value); } finally { busy.value = false; }
}
async function doImport() {
  try {
    const r = await store.importAsNew(importText.value);
    store.toast(`导入成功${r.validation.warnings.length ? `（${r.validation.warnings.length} 条警告）` : ''}${r.checksumOk ? '' : '，校验和不匹配'}`, r.checksumOk ? 'success' : 'warning');
    showImport.value = false; importText.value = '';
  } catch (e: any) { store.toast(`导入失败：${e?.message ?? e}`, 'error'); }
}
function onFile(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0];
  if (f) f.text().then((t) => { importText.value = t; });
}
</script>

<template>
  <div class="select">
    <div class="hero">
      <div class="logo">⚔️</div>
      <h1>Idle Realms · 放置王国</h1>
      <div class="muted">纯前端离线放置 RPG —— 28 项技能、自动战斗、副本、扩展与终局。所有数据保存在本地浏览器。</div>
    </div>
    <div class="cols">
      <div class="panel">
        <h3>继续游戏</h3>
        <div v-if="!store.characters.length" class="empty">还没有角色，创建一个开始冒险吧</div>
        <div v-for="c in store.characters" :key="c.slot" class="char row between">
          <div>
            <div class="bold">{{ c.name }} <span class="tag">{{ MODE_NAMES[c.mode] ?? c.mode }}</span></div>
            <div class="muted small">总等级 {{ c.totalLevel }} · 最后保存 {{ fmtDate(c.savedAt) }}</div>
          </div>
          <div class="row">
            <button class="primary" @click="store.loadCharacter(c.slot)">进入</button>
            <ConfirmButton label="删除" confirm-text="确认删除？" small @confirm="store.deleteCharacter(c.slot)" />
          </div>
        </div>
        <button class="mt" @click="showImport = !showImport">📥 导入存档</button>
        <div v-if="showImport" class="col mt">
          <input type="file" accept=".txt,.json,.save" @change="onFile" />
          <textarea v-model="importText" placeholder="粘贴导出的存档文本" />
          <button class="primary" :disabled="!importText.trim()" @click="doImport">导入为新角色</button>
        </div>
      </div>
      <div class="panel">
        <h3>创建新角色</h3>
        <label class="col">角色名<input v-model="name" maxlength="20" placeholder="冒险者" /></label>
        <div class="col mt">
          <span>游戏模式</span>
          <label v-for="m in Object.values(C.gameModes)" :key="m.id" class="mode" :class="{ on: mode === m.id }">
            <input v-model="mode" type="radio" :value="m.id" />
            <div><div class="bold">{{ m.name }}</div><div class="muted small">{{ m.description }}</div></div>
          </label>
        </div>
        <button class="primary mt" :disabled="busy" @click="create">开始冒险</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.select { max-width: 980px; margin: 0 auto; padding: 32px 16px; }
.hero { text-align: center; margin-bottom: 24px; }
.logo { font-size: 64px; }
.cols { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
@media (max-width: 760px) { .cols { grid-template-columns: 1fr; } }
.cols .panel + .panel { margin-top: 0; }
.char { padding: 10px 0; border-bottom: 1px solid var(--border); }
.mode { display: flex; gap: 10px; align-items: flex-start; padding: 10px; border: 1px solid var(--border); border-radius: 10px; cursor: pointer; }
.mode.on { border-color: var(--accent); }
.mode input { margin-top: 4px; }
</style>
