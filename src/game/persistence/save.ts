// 存档格式、版本迁移、结构校验、导入导出
import { C } from '@/content';
import { createNewState, SCHEMA_VERSION, GAME_VERSION, OFFLINE_RULES_VERSION, defaultSettings, defaultTownship, defaultCombat, type GameState } from '../core/state';
import { FARMING_PLOTS } from '@/content/recipes/support';
import { seedFromNumber, randomSeed } from '../core/rng';
import { EQUIP_SLOTS } from '../core/types';

export const SAVE_FORMAT = 'idle-realms-save';

export interface SaveEnvelope {
  format: string;
  schemaVersion: number;
  gameVersion: string;
  contentManifestVersion: string;
  savedAt: number;
  checksum: string;
  state: GameState;
}

// ---------------------------------------------------------------------------- 迁移
type Migration = (s: any) => any;
export const MIGRATIONS: Record<number, Migration> = {
  // 1 → 2：增加深渊状态与技能树
  1: (s) => {
    for (const sk of Object.values<any>(s.skills ?? {})) {
      sk.abyssalXp ??= 0; sk.abyssalLevel ??= 1; sk.treePoints ??= 0; sk.treeNodes ??= [];
    }
    s.currencies ??= {};
    s.currencies.abyssalPieces ??= 0; s.currencies.abyssalSlayerCoins ??= 0; s.currencies.soulPoints ??= 0;
    s.harvesting ??= { intensity: {} };
    s.corruption ??= { enabled: [] };
    s.schemaVersion = 2;
    return s;
  },
  // 2 → 3：增加制图/考古与城镇任务状态
  2: (s) => {
    s.cartography ??= { pos: [0, 0], hexes: {}, surveyed: ['0,0'], target: null, discovered: [], maps: {} };
    s.archaeology ??= { tools: { tiny: 0, small: 0, medium: 0, large: 0 }, museum: {}, museumRewards: 0 };
    s.township ??= defaultTownship();
    s.township.tasksCompleted ??= [];
    s.schemaVersion = 3;
    return s;
  },
};

export function migrate(raw: any): GameState {
  let s = raw;
  let v = Number(s.schemaVersion ?? 1);
  if (v > SCHEMA_VERSION) throw new Error(`存档版本 ${v} 高于当前游戏支持的版本 ${SCHEMA_VERSION}，为保护数据拒绝加载`);
  while (v < SCHEMA_VERSION) {
    const m = MIGRATIONS[v];
    if (!m) throw new Error(`缺少存档迁移 ${v} → ${v + 1}`);
    s = m(s);
    v = s.schemaVersion;
  }
  return normalize(s);
}

/** 补齐缺失字段（内容扩充后的前向兼容），并修复非法数值 */
export function normalize(s: any): GameState {
  const fresh = createNewState(s.player?.name ?? '冒险者', s.player?.mode ?? 'standard', s.player?.createdAt ?? Date.now(), randomSeed());
  const out: any = { ...fresh, ...s };
  out.player = { ...fresh.player, ...s.player };
  out.currencies = { ...fresh.currencies, ...s.currencies };
  out.settings = { ...defaultSettings(), ...s.settings };
  out.combat = { ...defaultCombat(), ...s.combat, log: Array.isArray(s.combat?.log) ? s.combat.log.slice(0, 60) : [] };
  out.township = { ...defaultTownship(), ...s.township };
  out.cooking = { ...fresh.cooking, ...s.cooking };
  for (const id of C.skillOrder) out.skills[id] = { ...fresh.skills[id], ...(s.skills?.[id] ?? {}) };
  // 农业地块
  const plots = Array.isArray(s.farming?.plots) ? s.farming.plots : [];
  out.farming = { plots: FARMING_PLOTS.map((p) => plots.find((x: any) => x.id === p.id) ?? fresh.farming.plots.find((x) => x.id === p.id)) };
  // 占星
  for (const c of Object.values(C.constellations)) {
    const cur = s.astrology?.[c.id];
    out.astrology[c.id] = { std: c.standard.map((_, i) => cur?.std?.[i] ?? 0), uniq: c.unique.map((_, i) => cur?.uniq?.[i] ?? 0) };
  }
  // 装备方案
  out.equipmentSets = [0, 1, 2].map((i) => {
    const set = s.equipmentSets?.[i] ?? {};
    const o: any = {};
    for (const slot of EQUIP_SLOTS) o[slot] = set[slot] && C.items[set[slot].id] ? set[slot] : null;
    return o;
  });
  if (!Array.isArray(out.food) || out.food.length < 3) out.food = [...(out.food ?? []), null, null, null].slice(0, 3);
  if (!Array.isArray(out.rngState) || out.rngState.length !== 4) out.rngState = seedFromNumber(randomSeed());
  out.schemaVersion = SCHEMA_VERSION;
  out.gameVersion = GAME_VERSION;
  out.offlineRulesVersion = OFFLINE_RULES_VERSION;
  return out as GameState;
}

// ---------------------------------------------------------------------------- 校验
export interface ValidationResult { ok: boolean; errors: string[]; warnings: string[] }

const isNum = (v: any) => typeof v === 'number' && Number.isFinite(v);

export function validateState(s: any, repair = false): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!s || typeof s !== 'object') return { ok: false, errors: ['存档不是有效对象'], warnings };
  if (!s.player || !s.skills || !s.bank || !s.currencies) errors.push('存档缺少必要字段（player/skills/bank/currencies）');
  if (errors.length) return { ok: false, errors, warnings };
  for (const [id, qty] of Object.entries<any>(s.bank)) {
    if (!C.items[id]) { warnings.push(`未知物品 ID：${id}`); if (repair) delete s.bank[id]; continue; }
    if (!isNum(qty) || qty < 0 || Math.floor(qty) !== qty) { errors.push(`物品数量非法：${id}=${qty}`); if (repair) s.bank[id] = Math.max(0, Math.floor(Number(qty) || 0)); }
    if (qty === 0 && repair) delete s.bank[id];
  }
  for (const [k, v] of Object.entries<any>(s.currencies)) if (!isNum(v) || v < 0) { errors.push(`货币数值非法：${k}`); if (repair) s.currencies[k] = 0; }
  for (const [id, sk] of Object.entries<any>(s.skills)) {
    if (!C.skills[id as keyof typeof C.skills]) { warnings.push(`未知技能：${id}`); continue; }
    if (!isNum(sk.xp) || sk.xp < 0) { errors.push(`技能经验非法：${id}`); if (repair) sk.xp = 0; }
  }
  for (const id of Object.keys(s.mastery ?? {})) if (!C.actions[id]) { warnings.push(`未知动作掌握度：${id}`); if (repair) delete s.mastery[id]; }
  if (!isNum(s.lastSettledAt)) errors.push('缺少最后结算时间');
  return { ok: repair ? true : errors.length === 0, errors, warnings };
}

// ---------------------------------------------------------------------------- 序列化
async function sha256(text: string): Promise<string> {
  try {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    let h = 0;
    for (let i = 0; i < text.length; i++) h = (Math.imul(31, h) + text.charCodeAt(i)) | 0;
    return `fnv-${(h >>> 0).toString(16)}`;
  }
}

/** 去除 Vue 代理并序列化 */
export function serializeState(state: GameState): string {
  return JSON.stringify(state);
}

export async function makeEnvelope(state: GameState): Promise<SaveEnvelope> {
  const json = serializeState(state);
  const plain = JSON.parse(json) as GameState;
  return { format: SAVE_FORMAT, schemaVersion: SCHEMA_VERSION, gameVersion: GAME_VERSION, contentManifestVersion: plain.contentManifestVersion, savedAt: Date.now(), checksum: await sha256(json), state: plain };
}

/** 导出为可复制的文本（Base64 编码的 JSON） */
export async function exportSave(state: GameState): Promise<string> {
  const env = await makeEnvelope(state);
  const json = JSON.stringify(env);
  return btoa(unescape(encodeURIComponent(json)));
}

export async function parseImport(text: string): Promise<{ state: GameState; validation: ValidationResult; checksumOk: boolean }> {
  text = text.trim();
  let obj: any;
  try { obj = JSON.parse(text); }
  catch {
    try { obj = JSON.parse(decodeURIComponent(escape(atob(text)))); }
    catch { throw new Error('无法解析存档：既不是 JSON 也不是有效的 Base64 文本'); }
  }
  let rawState: any;
  let checksumOk = true;
  if (obj.format === SAVE_FORMAT) {
    rawState = obj.state;
    const sum = await sha256(JSON.stringify(rawState));
    checksumOk = sum === obj.checksum;
    if (obj.schemaVersion > SCHEMA_VERSION) throw new Error(`存档版本 ${obj.schemaVersion} 高于当前支持版本 ${SCHEMA_VERSION}`);
  } else rawState = obj;
  const pre = validateState(rawState, false);
  if (!rawState?.player || !rawState?.skills) throw new Error(pre.errors.join('；') || '存档结构无效');
  const state = migrate(rawState);
  const validation = validateState(state, true);
  validation.errors.unshift(...pre.errors.filter((e) => !validation.errors.includes(e)));
  return { state, validation, checksumOk };
}

export function loadFromRecord(data: string): GameState {
  const raw = JSON.parse(data);
  const state = migrate(raw);
  const v = validateState(state, true);
  if (!v.ok) throw new Error(v.errors.join('；'));
  return state;
}
