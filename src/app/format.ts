// 数字与时间格式化
let compact = true;
export function setCompact(v: boolean) { compact = v; }

export function fmt(n: number | undefined | null, digits = 1): string {
  if (n === undefined || n === null || !Number.isFinite(n)) return '0';
  const neg = n < 0;
  const a = Math.abs(n);
  let out: string;
  if (!compact || a < 10000) out = a >= 100 || Number.isInteger(a) ? Math.floor(a).toLocaleString('zh-CN') : a.toFixed(digits);
  else if (a < 1e8) out = (a / 1e4).toFixed(a < 1e5 ? 1 : 0).replace(/\.0$/, '') + '万';
  else out = (a / 1e8).toFixed(2).replace(/\.?0+$/, '') + '亿';
  return (neg ? '-' : '') + out;
}

export function full(n: number): string { return Math.floor(n).toLocaleString('zh-CN'); }

export function pct(n: number, digits = 1): string { return `${(Number.isFinite(n) ? n : 0).toFixed(digits).replace(/\.0$/, '')}%`; }

export function fmtMs(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '0 秒';
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (d) return `${d} 天 ${h} 小时`;
  if (h) return `${h} 小时 ${m} 分`;
  if (m) return `${m} 分 ${sec} 秒`;
  return ms < 10000 ? `${(ms / 1000).toFixed(1).replace(/\.0$/, '')} 秒` : `${sec} 秒`;
}

export function fmtSec(ms: number): string { return `${(ms / 1000).toFixed(2).replace(/\.?0+$/, '')}s`; }

export function fmtDate(t: number): string {
  const d = new Date(t);
  const p = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
