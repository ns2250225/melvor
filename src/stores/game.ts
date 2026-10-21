// Pinia 状态管理：持有 GameFacade 实例、主循环、自动保存、离线结算与存档管理
import { defineStore } from 'pinia';
import { ref, shallowRef, reactive, markRaw, computed, watch } from 'vue';
import { Game } from '@/game/core/game';
import { createNewState, type GameState, type Notification } from '@/game/core/state';
import type { GameMode, SkillId } from '@/game/core/types';
import { C } from '@/content';
import * as db from '@/game/persistence/db';
import { exportSave, parseImport, loadFromRecord, serializeState } from '@/game/persistence/save';
import { computeOfflineWindow, simulateOfflineAsync, verifyResult, type OfflineReport } from '@/game/offline/offline';
import { play, configureSound } from '@/app/sound';
import { setCompact } from '@/app/format';

export type PageId =
  | 'overview' | 'skill' | 'combat' | 'bank' | 'equipment' | 'magic' | 'prayer' | 'summoning' | 'shop' | 'quests'
  | 'achievements' | 'pets' | 'collection' | 'expansions' | 'statistics' | 'settings' | 'saves' | 'slayer';

const LOOP_MS = 50;
const OFFLINE_THRESHOLD_MS = 60_000;

export const useGameStore = defineStore('game', () => {
  const game = shallowRef<Game | null>(null);
  const slot = ref<string | null>(null);
  const frame = ref(0);
  const page = ref<PageId>('overview');
  const skillPage = ref<SkillId>('woodcutting');
  const characters = ref<db.SaveRecord[]>([]);
  const toasts = ref<Notification[]>([]);
  const saveStatus = ref<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const saveError = ref('');
  const lastSaved = ref(0);
  const lockedOut = ref(false);
  const navOpen = ref(false);
  const updateAvailable = ref(false);
  const offline = reactive({ running: false, done: 0, total: 0, report: null as OfflineReport | null, error: '' });
  const anomaly = ref<string | null>(null);
  /** 当前查看详情的物品 */
  const inspect = ref<string | null>(null);

  let loopTimer: ReturnType<typeof setInterval> | null = null;
  let autosaveTimer: ReturnType<typeof setInterval> | null = null;
  let saveDebounce: ReturnType<typeof setTimeout> | null = null;
  let saving: Promise<void> | null = null;
  let pendingSave = false;
  let releaseLock: (() => void) | null = null;
  let worker: Worker | null = null;
  let toastId = 1;

  const s = computed(() => game.value?.state as GameState | undefined);

  // ------------------------------------------------------------------ 导航
  function go(p: PageId, skill?: SkillId) {
    page.value = p;
    if (skill) skillPage.value = skill;
    navOpen.value = false;
  }

  // ------------------------------------------------------------------ 通知
  function toast(text: string, kind: Notification['kind'] = 'info', icon?: string) {
    if (game.value && !game.value.state.settings.notifications && kind !== 'error') return;
    const n = { id: toastId++, text, kind, icon, t: Date.now() };
    toasts.value.push(n);
    if (toasts.value.length > 5) toasts.value.splice(0, toasts.value.length - 5);
    setTimeout(() => { toasts.value = toasts.value.filter((x) => x.id !== n.id); }, kind === 'error' ? 4000 : 3000);
  }

  /** 执行一条游戏命令：返回错误时提示，成功时请求保存 */
  function act(fn: () => string | null | void | unknown, opts: { silent?: boolean; save?: boolean } = {}): boolean {
    if (!game.value) return false;
    const r = fn();
    if (typeof r === 'string' && r) {
      if (!opts.silent) { toast(r, 'error'); play('error'); }
      return false;
    }
    frame.value++;
    if (opts.save !== false) requestSave(1500);
    return true;
  }

  // ------------------------------------------------------------------ 游戏实例绑定
  function bind(state: GameState) {
    const g = markRaw(new Game(reactive(state) as GameState));
    g.events.on('notify', (n) => {
      toast(n.text, n.kind, n.icon);
      if (n.kind === 'level') play('level');
      else if (n.kind === 'success') play('success');
    });
    for (const ev of ['levelUp', 'dungeonCompleted', 'questCompleted', 'achievementCompleted', 'petUnlocked', 'combatEnd', 'activityStopped', 'playerDeath'] as const) {
      g.events.on(ev, () => requestSave(1000));
    }
    g.events.on('playerDeath', () => play('death'));
    game.value = g;
    applySettings();
    return g;
  }

  function applySettings() {
    const st = game.value?.state.settings;
    if (!st) return;
    configureSound(st.sound, st.volume);
    setCompact(st.compactNumbers);
    const theme = st.theme === 'auto' ? (window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : st.theme;
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('idle-realms-theme', theme); } catch { /* ignore */ }
    restartAutosave();
  }

  // ------------------------------------------------------------------ 主循环（统一调度器）
  function startLoop() {
    stopLoop();
    loopTimer = setInterval(loopStep, LOOP_MS);
    restartAutosave();
  }
  function stopLoop() {
    if (loopTimer) clearInterval(loopTimer);
    loopTimer = null;
  }
  function restartAutosave() {
    if (autosaveTimer) clearInterval(autosaveTimer);
    const sec = game.value?.state.settings.autoSaveSeconds ?? 10;
    autosaveTimer = setInterval(() => { if (game.value && !offline.running) save('auto'); }, Math.max(5, sec) * 1000);
  }

  function loopStep() {
    const g = game.value;
    if (!g || offline.running || lockedOut.value) return;
    const now = Date.now();
    const dt = now - g.state.clock;
    if (dt < -1000) {
      // 系统时间倒退：不回滚进度，重设游戏时钟
      anomaly.value = `检测到系统时间倒退 ${Math.round(-dt / 1000)} 秒，已重设游戏时钟（不会获得额外收益）`;
      g.state.clock = now;
      g.state.lastSettledAt = now;
      requestSave(0);
      return;
    }
    if (dt > OFFLINE_THRESHOLD_MS) { settleOffline(); return; }
    if (dt > 0) g.advance(dt);
    frame.value++;
  }

  // ------------------------------------------------------------------ 保存
  function requestSave(delay = 1000) {
    if (saveDebounce) clearTimeout(saveDebounce);
    saveDebounce = setTimeout(() => { saveDebounce = null; save('event'); }, delay);
  }

  async function save(_reason = 'manual'): Promise<boolean> {
    const g = game.value;
    if (!g || !slot.value || lockedOut.value) return false;
    if (saving) { pendingSave = true; await saving; return true; }
    saveStatus.value = 'saving';
    const st = g.state;
    st.lastSettledAt = st.clock;
    st.rngState = g.rng.getState();
    const rec = { slot: slot.value, data: serializeState(st), savedAt: Date.now(), settlementId: st.settlementId, name: st.player.name, mode: st.player.mode, totalLevel: g.totalLevel() };
    let ok = true;
    saving = db.putSave(rec, st.settlementId).then(() => {
      saveStatus.value = 'saved';
      lastSaved.value = Date.now();
      saveError.value = '';
    }).catch((e) => {
      ok = false;
      saveStatus.value = 'error';
      saveError.value = String(e?.message ?? e);
      if (e instanceof db.SaveConflictError) { lockedOut.value = true; stopLoop(); }
      toast(`保存失败：${saveError.value}`, 'error');
    });
    await saving;
    saving = null;
    if (pendingSave) { pendingSave = false; return save('pending'); }
    return ok;
  }

  // ------------------------------------------------------------------ 离线结算
  async function settleOffline() {
    const g = game.value;
    if (!g || offline.running) return;
    stopLoop();
    offline.running = true;
    offline.error = '';
    offline.done = 0;
    g.state.lastSettledAt = g.state.clock;
    const now = Date.now();
    const win = computeOfflineWindow(g.state, now);
    try {
      if (win.anomaly === 'rollback') {
        anomaly.value = '检测到系统时间早于最后一次结算时间，本次不发放离线收益';
        g.state.clock = now; g.state.lastSettledAt = now;
        await save('rollback');
      } else if (win.ms < 3000) {
        g.advance(win.ms);
      } else {
        offline.total = win.ms;
        const expected = g.state.settlementId;
        const raw = serializeState(g.state);
        const { state: out, report } = await runSimulation(raw, win.ms, { capped: win.capped, anomaly: win.anomaly, requested: win.requested });
        // 超出上限或取消的部分时间不再结算
        out.clock = Math.max(out.clock, Date.now());
        out.lastSettledAt = out.clock;
        const g2 = bind(out);
        void g2;
        if (slot.value) {
          await db.putSave({ slot: slot.value, data: serializeState(out), savedAt: Date.now(), settlementId: out.settlementId, name: out.player.name, mode: out.player.mode, totalLevel: game.value!.totalLevel() }, expected)
            .catch((e) => { offline.error = `结算结果保存失败：${e?.message ?? e}（进度保留在内存中，将自动重试）`; requestSave(5000); });
          db.addEvent({ slot: slot.value, t: Date.now(), kind: 'offline', payload: report }).catch(() => undefined);
        }
        if (win.anomaly === 'jump') anomaly.value = `离线时长超过上限（24 小时），已按上限结算`;
        if (report.simulatedMs > 10_000 && (game.value!.state.settings.offlineReport)) offline.report = report;
        game.value!.events.emit('offlineSettled', { ms: report.simulatedMs });
      }
    } catch (e: any) {
      offline.error = `离线结算失败：${e?.message ?? e}`;
      toast(offline.error, 'error');
      const g3 = game.value!;
      g3.state.clock = Date.now(); g3.state.lastSettledAt = g3.state.clock;
    } finally {
      offline.running = false;
      worker = null;
      frame.value++;
      startLoop();
    }
  }

  function runSimulation(raw: string, ms: number, meta: { capped: boolean; anomaly: OfflineReport['anomaly']; requested: number }): Promise<{ state: GameState; report: OfflineReport }> {
    if (typeof Worker === 'undefined') {
      return simulateOfflineAsync(JSON.parse(raw), ms, meta, { onProgress: (d) => { offline.done = d; } });
    }
    return new Promise((resolve, reject) => {
      try {
        worker = new Worker(new URL('../workers/offline.worker.ts', import.meta.url), { type: 'module' });
      } catch {
        simulateOfflineAsync(JSON.parse(raw), ms, meta, { onProgress: (d) => { offline.done = d; } }).then(resolve, reject);
        return;
      }
      const w = worker;
      w.onmessage = (e) => {
        const m = e.data;
        if (m.type === 'progress') offline.done = m.done;
        else if (m.type === 'done') { w.terminate(); const st = JSON.parse(m.state) as GameState; const err = verifyResult(st); if (err) reject(new Error(err)); else resolve({ state: st, report: m.report }); }
        else if (m.type === 'error') { w.terminate(); reject(new Error(m.error)); }
      };
      w.onerror = (e) => { w.terminate(); reject(new Error(e.message || 'Worker 错误')); };
      w.postMessage({ type: 'simulate', state: raw, ms, meta });
    });
  }

  function cancelOffline() { worker?.postMessage({ type: 'cancel' }); }

  // ------------------------------------------------------------------ 标签页锁（防止多标签页重复结算）
  async function acquireLock(slotId: string): Promise<boolean> {
    releaseLock?.();
    releaseLock = null;
    const locks = (navigator as any).locks;
    if (!locks?.request) return true;
    return new Promise<boolean>((resolve) => {
      locks.request(`idle-realms-${slotId}`, { ifAvailable: true }, (lock: unknown) => {
        if (!lock) { resolve(false); return; }
        resolve(true);
        return new Promise<void>((release) => { releaseLock = release; });
      });
    });
  }

  // ------------------------------------------------------------------ 角色管理
  async function refreshCharacters() {
    try { characters.value = (await db.listSaves()).sort((a, b) => b.savedAt - a.savedAt); }
    catch (e: any) { toast(`读取存档失败：${e?.message ?? e}`, 'error'); }
  }

  async function createCharacter(name: string, mode: GameMode) {
    const st = createNewState(name, mode);
    const id = `slot-${Date.now().toString(36)}`;
    await db.putSave({ slot: id, data: serializeState(st), savedAt: Date.now(), settlementId: 0, name: st.player.name, mode, totalLevel: 0 });
    await refreshCharacters();
    await loadCharacter(id);
  }

  async function loadCharacter(id: string) {
    const rec = await db.getSave(id);
    if (!rec) { toast('存档不存在', 'error'); return; }
    let state: GameState;
    try { state = loadFromRecord(rec.data); }
    catch (e: any) {
      if (rec.prev) {
        try { state = loadFromRecord(rec.prev); toast('当前存档损坏，已从上一次保存恢复', 'warning'); }
        catch { toast(`存档损坏：${e?.message ?? e}`, 'error'); return; }
      } else { toast(`存档无法加载：${e?.message ?? e}`, 'error'); return; }
    }
    const ok = await acquireLock(id);
    slot.value = id;
    lockedOut.value = !ok;
    if (!ok) { bind(state); return; }
    bind(state);
    page.value = 'overview';
    await db.setMeta('lastSlot', id).catch(() => undefined);
    await settleOffline();
    await save('load');
  }

  async function exitToMenu() {
    await save('exit');
    stopLoop();
    releaseLock?.();
    releaseLock = null;
    game.value = null;
    slot.value = null;
    lockedOut.value = false;
    await refreshCharacters();
  }

  async function deleteCharacter(id: string) {
    if (slot.value === id) { stopLoop(); releaseLock?.(); game.value = null; slot.value = null; }
    await db.deleteSave(id);
    await refreshCharacters();
  }

  async function createBackup(label = '手动备份') {
    const g = game.value;
    if (!g || !slot.value) return;
    await db.addBackup({ slot: slot.value, createdAt: Date.now(), label, data: serializeState(g.state) });
    toast('已创建备份', 'success');
  }

  async function restoreBackup(b: db.BackupRecord) {
    if (!slot.value) return;
    const state = loadFromRecord(b.data);
    await createBackup('恢复前自动备份');
    replaceState(state);
    await save('restore');
    toast('已恢复备份', 'success');
  }

  function replaceState(state: GameState) {
    const prevSettlement = game.value?.state.settlementId ?? 0;
    state.settlementId = Math.max(state.settlementId, prevSettlement) + 1;
    state.clock = Date.now();
    state.lastSettledAt = state.clock;
    bind(state);
    frame.value++;
  }

  async function resetCharacter() {
    const g = game.value;
    if (!g) return;
    await createBackup('重置前自动备份');
    const st = createNewState(g.state.player.name, g.state.player.mode);
    replaceState(st);
    await save('reset');
    toast('角色已重置', 'warning');
  }

  async function exportCurrent(): Promise<string> {
    const g = game.value;
    if (!g) return '';
    g.state.rngState = g.rng.getState();
    return exportSave(g.state);
  }

  async function importToCurrent(text: string) {
    const r = await parseImport(text);
    await createBackup('导入前自动备份');
    replaceState(r.state);
    await save('import');
    return r;
  }

  async function importAsNew(text: string) {
    const r = await parseImport(text);
    const id = `slot-${Date.now().toString(36)}`;
    r.state.clock = Date.now();
    r.state.lastSettledAt = r.state.clock;
    await db.putSave({ slot: id, data: serializeState(r.state), savedAt: Date.now(), settlementId: r.state.settlementId, name: r.state.player.name, mode: r.state.player.mode, totalLevel: Object.values(r.state.skills).reduce((a, x) => a + x.level, 0) });
    await refreshCharacters();
    return r;
  }

  // 页面进入后台前保存；返回前台时进行离线结算
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (!game.value) return;
      if (document.visibilityState === 'hidden') save('hidden');
      else if (Date.now() - game.value.state.clock > OFFLINE_THRESHOLD_MS) settleOffline();
    });
    window.addEventListener('pagehide', () => { if (game.value) save('pagehide'); });
  }

  watch(() => game.value?.state.settings, () => applySettings(), { deep: true });

  return {
    inspect, game, slot, frame, page, skillPage, characters, toasts, saveStatus, saveError, lastSaved, lockedOut, navOpen, updateAvailable, offline, anomaly, s,
    go, toast, act, save, requestSave, settleOffline, cancelOffline, refreshCharacters, createCharacter, loadCharacter, exitToMenu, deleteCharacter,
    createBackup, restoreBackup, resetCharacter, exportCurrent, importToCurrent, importAsNew, applySettings,
    skills: () => C.skillOrder,
  };
});

/** 组件中便捷访问：g 为 GameFacade，s 为响应式状态，tick 用于派生数据的刷新依赖 */
export function useGame() {
  const store = useGameStore();
  return {
    store,
    get g() { return store.game as Game; },
    get s() { return store.game!.state; },
  };
}
