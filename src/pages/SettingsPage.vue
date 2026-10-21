<script setup lang="ts">
// 设置：界面、声音、通知、自动保存、游戏行为、版本与数据信息
import { computed, onMounted, ref } from 'vue';
import { CONTENT_MANIFEST } from '@/content';
import { useGameStore } from '@/stores/game';
import type { Settings } from '@/game/core/state';
import { SCHEMA_VERSION, GAME_VERSION } from '@/game/core/state';
import { fmtDate } from '@/app/format';

const store = useGameStore();
const g = computed(() => store.game!);
const st = computed(() => g.value.state.settings);

function set<K extends keyof Settings>(key: K, value: Settings[K]) {
  g.value.state.settings[key] = value;
  store.applySettings();
  store.requestSave();
}

const TOGGLES: [keyof Settings, string, string][] = [
  ['notifications', '游戏通知', '升级、掉落、任务等弹出提示（错误提示始终显示）'],
  ['showCombatLog', '战斗日志', '在战斗与总览页面显示战斗日志'],
  ['confirmSell', '出售确认', '出售物品前需要二次确认'],
  ['compactNumbers', '紧凑数字', '大数字以“万 / 亿”显示'],
  ['autoRestartDungeon', '自动重开副本', '通关副本后自动再次挑战'],
  ['autoLoot', '自动拾取', '战利品自动放入银行'],
  ['offlineReport', '离线结算报告', '回到游戏时弹出离线收益报告'],
];
function toggle(key: keyof Settings, ev: Event) { set(key, (ev.target as HTMLInputElement).checked as never); }

const standalone = ref(false);
const storage = ref<{ usage: number; quota: number } | null>(null);
const persisted = ref<boolean | null>(null);
onMounted(async () => {
  standalone.value = !!window.matchMedia?.('(display-mode: standalone)').matches || (navigator as any).standalone === true;
  try {
    const e = await navigator.storage?.estimate?.();
    if (e) storage.value = { usage: e.usage ?? 0, quota: e.quota ?? 0 };
    persisted.value = (await navigator.storage?.persisted?.()) ?? null;
  } catch { /* 浏览器不支持 */ }
});
async function requestPersist() {
  try {
    const ok = await navigator.storage?.persist?.();
    persisted.value = !!ok;
    store.toast(ok ? '已启用持久化存储' : '浏览器拒绝了持久化存储请求', ok ? 'success' : 'warning');
  } catch { store.toast('当前浏览器不支持持久化存储', 'error'); }
}
function mb(n: number) { return `${(n / 1024 / 1024).toFixed(n < 1024 * 1024 * 10 ? 2 : 0)} MB`; }
</script>

<template>
  <div>
    <div class="page-title"><span class="icon">⚙️</span><h2>设置</h2></div>

    <div class="panel">
      <h3>界面</h3>
      <div class="row">
        <span class="lbl">主题</span>
        <div class="tabs" style="margin: 0">
          <button :class="{ on: st.theme === 'dark' }" @click="set('theme', 'dark')">🌙 深色</button>
          <button :class="{ on: st.theme === 'light' }" @click="set('theme', 'light')">☀️ 浅色</button>
          <button :class="{ on: st.theme === 'auto' }" @click="set('theme', 'auto')">🖥️ 跟随系统</button>
        </div>
      </div>
    </div>

    <div class="panel">
      <h3>声音</h3>
      <label class="row"><input type="checkbox" :checked="st.sound" @change="toggle('sound', $event)" /> 启用音效</label>
      <div class="row mt">
        <span class="lbl">音量</span>
        <input type="range" min="0" max="1" step="0.05" class="grow" style="max-width: 280px" :value="st.volume" :disabled="!st.sound" @change="set('volume', Number(($event.target as HTMLInputElement).value))" />
        <span class="small">{{ Math.round(st.volume * 100) }}%</span>
      </div>
    </div>

    <div class="panel">
      <h3>游戏行为</h3>
      <div class="col">
        <label v-for="[key, label, desc] in TOGGLES" :key="key" class="row nowrap opt">
          <input type="checkbox" :checked="!!st[key]" @change="toggle(key, $event)" />
          <span class="grow"><span>{{ label }}</span><br /><span class="tiny muted">{{ desc }}</span></span>
        </label>
      </div>
      <div class="row mt">
        <span class="lbl">自动保存间隔</span>
        <input type="range" min="5" max="60" step="5" class="grow" style="max-width: 280px" :value="st.autoSaveSeconds" @change="set('autoSaveSeconds', Number(($event.target as HTMLInputElement).value))" />
        <span class="small">{{ st.autoSaveSeconds }} 秒</span>
      </div>
      <div class="tiny muted">无论间隔多少，升级、通关、页面切到后台等关键事件都会立即保存。</div>
    </div>

    <div class="panel">
      <h3>数据</h3>
      <div class="kv">
        <span>上次保存</span><span>{{ store.lastSaved ? fmtDate(store.lastSaved) : '尚未保存' }}</span>
        <span>应用模式</span><span>{{ standalone ? '已安装（独立窗口运行）' : '浏览器标签页' }}</span>
        <span>存储占用</span><span>{{ storage ? `${mb(storage.usage)} / ${mb(storage.quota)}` : '无法获取' }}</span>
        <span>持久化存储</span><span>{{ persisted === null ? '未知' : persisted ? '已启用' : '未启用（浏览器可能在空间不足时清理数据）' }}</span>
      </div>
      <div v-if="!standalone" class="tiny muted mt">可通过浏览器菜单「安装应用 / 添加到主屏幕」将游戏安装为 PWA，支持离线游玩。</div>
      <div class="row mt">
        <button @click="store.go('saves')">💾 存档管理</button>
        <button v-if="persisted === false" @click="requestPersist">申请持久化存储</button>
        <button @click="store.exitToMenu()">返回角色列表</button>
      </div>
    </div>

    <div class="panel">
      <h3>版本信息</h3>
      <div class="kv small">
        <span>游戏版本</span><span>{{ CONTENT_MANIFEST.gameVersion }}</span>
        <span>引擎版本</span><span>{{ GAME_VERSION }}</span>
        <span>内容清单版本</span><span>{{ CONTENT_MANIFEST.contentManifestVersion }}</span>
        <span>规则版本</span><span>{{ CONTENT_MANIFEST.rulesVersion }}</span>
        <span>经验曲线</span><span>{{ CONTENT_MANIFEST.xpCurveVersion }}</span>
        <span>离线规则版本</span><span>{{ CONTENT_MANIFEST.offlineRulesVersion }}</span>
        <span>存档结构版本</span><span>{{ g.state.schemaVersion }}（当前支持 {{ SCHEMA_VERSION }}）</span>
        <span>存档游戏版本</span><span>{{ g.state.gameVersion }}</span>
        <span>已载入扩展</span><span>{{ CONTENT_MANIFEST.expansions.join('、') }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lbl { min-width: 96px; color: var(--muted); }
.opt { padding: 4px 0; cursor: pointer; }
</style>
