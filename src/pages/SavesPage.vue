<script setup lang="ts">
// 存档管理：保存、导出 / 导入、备份、离线结算记录、危险操作
import { computed, onMounted, ref } from 'vue';
import { C } from '@/content';
import { useGameStore } from '@/stores/game';
import { listBackups, deleteBackup, listEvents, type BackupRecord, type EventRecord } from '@/game/persistence/db';
import type { OfflineReport } from '@/game/offline/offline';
import { fmt, fmtMs, fmtDate } from '@/app/format';
import ConfirmButton from '@/components/ConfirmButton.vue';

const store = useGameStore();
const g = computed(() => store.game!);

const STATUS: Record<string, string> = { idle: '未保存', saving: '保存中…', saved: '已保存', error: '保存失败' };
const saving = ref(false);
async function saveNow() {
  saving.value = true;
  const ok = await store.save('manual');
  saving.value = false;
  if (ok) store.toast('已保存', 'success');
}

// ---------------------------------------------------------------- 导出
const exportText = ref('');
const exporting = ref(false);
async function doExport() {
  exporting.value = true;
  try { exportText.value = await store.exportCurrent(); }
  catch (e: any) { store.toast(`导出失败：${e?.message ?? e}`, 'error'); }
  finally { exporting.value = false; }
}
async function copyExport() {
  if (!exportText.value) return;
  try { await navigator.clipboard.writeText(exportText.value); store.toast('已复制到剪贴板', 'success'); }
  catch { store.toast('复制失败，请手动选择文本复制', 'error'); }
}
function downloadExport() {
  if (!exportText.value) return;
  const blob = new Blob([exportText.value], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const name = (g.value.state.player.name || 'save').replace(/[\\/:*?"<>|\s]+/g, '_');
  const d = new Date();
  a.href = url;
  a.download = `idle-realms-${name}-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---------------------------------------------------------------- 导入
const importText = ref('');
const importing = ref(false);
const importResult = ref<{ ok: boolean; target: string; errors: string[]; warnings: string[]; checksumOk: boolean; name: string } | null>(null);
async function onFile(ev: Event) {
  const input = ev.target as HTMLInputElement;
  const f = input.files?.[0];
  if (!f) return;
  try { importText.value = (await f.text()).trim(); }
  catch { store.toast('读取文件失败', 'error'); }
  input.value = '';
}
async function doImport(asNew: boolean) {
  const text = importText.value.trim();
  if (!text) return;
  importing.value = true;
  try {
    const r = asNew ? await store.importAsNew(text) : await store.importToCurrent(text);
    importResult.value = { ok: true, target: asNew ? '已导入为新角色（可在角色列表中进入）' : '已覆盖当前角色（导入前已自动备份）', errors: r.validation.errors, warnings: r.validation.warnings, checksumOk: r.checksumOk, name: r.state.player.name };
    store.toast(asNew ? '已导入为新角色' : '存档已导入', 'success');
    if (!asNew) importText.value = '';
    await refresh();
  } catch (e: any) {
    importResult.value = { ok: false, target: '', errors: [String(e?.message ?? e)], warnings: [], checksumOk: false, name: '' };
    store.toast('导入失败', 'error');
  } finally { importing.value = false; }
}

// ---------------------------------------------------------------- 备份与离线记录
const backups = ref<BackupRecord[]>([]);
const events = ref<EventRecord[]>([]);
const backupLabel = ref('');
async function refresh() {
  if (!store.slot) return;
  try {
    backups.value = await listBackups(store.slot);
    events.value = (await listEvents(store.slot)).filter((e) => e.kind === 'offline');
  } catch (e: any) { store.toast(`读取备份失败：${e?.message ?? e}`, 'error'); }
}
onMounted(refresh);
async function makeBackup() {
  await store.createBackup(backupLabel.value.trim() || '手动备份');
  backupLabel.value = '';
  await refresh();
}
async function restore(b: BackupRecord) {
  try { await store.restoreBackup(b); await refresh(); }
  catch (e: any) { store.toast(`恢复失败：${e?.message ?? e}`, 'error'); }
}
async function removeBackup(b: BackupRecord) {
  if (b.id === undefined) return;
  await deleteBackup(b.id);
  await refresh();
}
function backupInfo(b: BackupRecord) {
  try {
    const d = JSON.parse(b.data);
    let total = 0;
    for (const sk of Object.values(d.skills ?? {}) as any[]) total += sk?.level ?? 0;
    return `${d.player?.name ?? ''} · 总等级 ${total} · ${fmt(d.currencies?.gp ?? 0)} 金币`;
  } catch { return '数据无法解析'; }
}
function reportSummary(r: OfflineReport) {
  const top = [...(r.xp ?? [])].sort((a, b) => b.xp - a.xp)[0];
  return { top: top ? `${C.skills[top.skill]?.name ?? top.skill} +${fmt(top.xp)} 经验` : '无' };
}

// ---------------------------------------------------------------- 危险操作
async function reset() { await store.resetCharacter(); await refresh(); }
async function del() {
  const slot = store.slot;
  if (!slot) return;
  await store.deleteCharacter(slot);
}
</script>

<template>
  <div>
    <div class="page-title"><span class="icon">💾</span><h2>存档管理</h2></div>

    <div class="panel">
      <h3>保存</h3>
      <div class="row">
        <button class="primary" :disabled="saving" @click="saveNow">立即保存</button>
        <span class="small">状态：<span :class="{ good: store.saveStatus === 'saved', bad: store.saveStatus === 'error' }">{{ STATUS[store.saveStatus] }}</span></span>
        <span class="small muted">上次保存：{{ store.lastSaved ? fmtDate(store.lastSaved) : '—' }}</span>
      </div>
      <div v-if="store.saveError" class="small bad mt">{{ store.saveError }}</div>
      <div class="small muted mt">存档保存在本浏览器的 IndexedDB 中，每次保存会保留上一版本用于异常恢复。清除浏览器数据会导致存档丢失，请定期导出备份。</div>
    </div>

    <div class="panel">
      <h3>导出存档</h3>
      <div class="row mb">
        <button :disabled="exporting" @click="doExport">{{ exportText ? '重新生成' : '生成导出文本' }}</button>
        <button :disabled="!exportText" @click="copyExport">复制到剪贴板</button>
        <button :disabled="!exportText" @click="downloadExport">下载 .txt 文件</button>
      </div>
      <textarea v-if="exportText" readonly :value="exportText" @focus="($event.target as HTMLTextAreaElement).select()" />
      <div class="tiny muted">导出文本包含校验和，用于检测传输中的损坏。</div>
    </div>

    <div class="panel">
      <h3>导入存档</h3>
      <textarea v-model="importText" placeholder="粘贴导出的存档文本（Base64 或 JSON）…" />
      <div class="row mt">
        <label class="btn">📂 选择文件<input type="file" accept=".txt,.json,text/plain,application/json" style="display: none" @change="onFile" /></label>
        <ConfirmButton label="导入并覆盖当前角色" confirm-text="确认覆盖当前角色？" :disabled="!importText.trim() || importing" @confirm="doImport(false)" />
        <button :disabled="!importText.trim() || importing" @click="doImport(true)">导入为新角色</button>
      </div>
      <div class="tiny muted mt">覆盖当前角色前会自动创建一个备份，可在下方备份列表中恢复。</div>
      <div v-if="importResult" class="result mt">
        <div v-if="importResult.ok" class="good">✓ {{ importResult.target }}（角色：{{ importResult.name }}）</div>
        <div v-else class="bad">✗ 导入失败</div>
        <div v-if="importResult.ok" class="small" :class="importResult.checksumOk ? 'good' : 'warn'">校验和：{{ importResult.checksumOk ? '通过' : '不匹配（存档可能被修改或损坏，已尽可能修复）' }}</div>
        <div v-for="(e, i) in importResult.errors" :key="'e' + i" class="small bad">错误：{{ e }}</div>
        <div v-for="(w, i) in importResult.warnings" :key="'w' + i" class="small warn">警告：{{ w }}</div>
      </div>
    </div>

    <div class="panel">
      <div class="row between mb"><h3>备份</h3><span class="small muted">每个角色最多保留 20 个</span></div>
      <div class="row mb">
        <input v-model="backupLabel" class="grow" maxlength="40" placeholder="备份名称（可选）" />
        <button class="primary" @click="makeBackup">创建备份</button>
      </div>
      <div v-if="!backups.length" class="empty small">暂无备份</div>
      <div v-for="b in backups" :key="b.id" class="row between bk">
        <div class="grow">
          <div class="bold small">{{ b.label }}</div>
          <div class="tiny muted">{{ fmtDate(b.createdAt) }} · {{ backupInfo(b) }}</div>
        </div>
        <div class="row">
          <ConfirmButton label="恢复" confirm-text="确认恢复？" small @confirm="restore(b)" />
          <ConfirmButton label="删除" confirm-text="确认删除？" small @confirm="removeBackup(b)" />
        </div>
      </div>
    </div>

    <div class="panel">
      <div class="row between mb"><h3>离线结算记录</h3><button class="small" @click="refresh">刷新</button></div>
      <div v-if="!events.length" class="empty small">暂无离线结算记录</div>
      <div v-else class="scroll">
        <table>
          <thead><tr><th>时间</th><th>离线时长</th><th>活动</th><th class="right">动作</th><th class="right">击杀</th><th>最多经验</th></tr></thead>
          <tbody>
            <tr v-for="e in events" :key="e.id">
              <td class="small" style="white-space: nowrap">{{ fmtDate(e.t) }}</td>
              <td class="small">{{ fmtMs((e.payload as OfflineReport).simulatedMs) }}<span v-if="(e.payload as OfflineReport).capped" class="warn">（已达上限）</span></td>
              <td class="small">{{ (e.payload as OfflineReport).activity || '—' }}</td>
              <td class="right">{{ fmt((e.payload as OfflineReport).actions) }}</td>
              <td class="right">{{ fmt((e.payload as OfflineReport).kills) }}</td>
              <td class="small">{{ reportSummary(e.payload as OfflineReport).top }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="panel danger-zone">
      <h3 class="bad">危险操作</h3>
      <div class="small muted mb">重置会将当前角色恢复为全新状态（保留名称与模式，重置前自动备份）。删除会永久移除该角色及其全部备份与记录，无法撤销。</div>
      <div class="row">
        <ConfirmButton label="重置角色" confirm-text="确认重置全部进度？" @confirm="reset" />
        <ConfirmButton label="删除角色" confirm-text="确认永久删除？" @confirm="del" />
      </div>
    </div>

    <div class="panel">
      <h3>关于存档安全</h3>
      <div class="small muted">本游戏为纯前端单机游戏，存档完全保存在你的设备上。导出文本中的校验和只用于检测意外损坏，玩家仍可以修改本地存档，因此不存在绝对的防篡改机制。导入时会进行结构校验与自动修复，以防止无效数据导致游戏崩溃。</div>
    </div>
  </div>
</template>

<style scoped>
.bk { padding: 8px 0; border-bottom: 1px solid var(--border); flex-wrap: nowrap; }
.result { padding: 10px; border: 1px solid var(--border); border-radius: 8px; background: var(--bg2); }
.danger-zone { border-color: var(--bad); }
</style>
