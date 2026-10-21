// Web Worker：仅负责离线批量计算，不操作 DOM 与 IndexedDB
import { simulateOfflineAsync, verifyResult, type OfflineReport } from '@/game/offline/offline';
import type { GameState } from '@/game/core/state';

let cancel = false;

self.onmessage = async (e: MessageEvent) => {
  const msg = e.data;
  if (msg.type === 'cancel') { cancel = true; return; }
  if (msg.type !== 'simulate') return;
  cancel = false;
  try {
    const state = JSON.parse(msg.state) as GameState;
    const { state: out, report } = await simulateOfflineAsync(state, msg.ms, msg.meta, {
      onProgress: (done, total) => (self as any).postMessage({ type: 'progress', done, total }),
      shouldCancel: () => cancel,
    });
    const err = verifyResult(out);
    if (err) { (self as any).postMessage({ type: 'error', error: `离线结算校验失败：${err}` }); return; }
    (self as any).postMessage({ type: 'done', state: JSON.stringify(out), report: report as OfflineReport });
  } catch (err: any) {
    (self as any).postMessage({ type: 'error', error: String(err?.message ?? err) });
  }
};
