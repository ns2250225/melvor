// 可测试、可序列化的伪随机数生成器（xoshiro128**）。
// 所有游戏随机事件都必须通过此接口，便于固定种子测试和离线重放。

export type RngState = [number, number, number, number];

export function seedFromNumber(seed: number): RngState {
  // splitmix32 扩展种子
  let s = seed >>> 0;
  const next = () => {
    s = (s + 0x9e3779b9) >>> 0;
    let z = s;
    z = Math.imul(z ^ (z >>> 16), 0x85ebca6b) >>> 0;
    z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35) >>> 0;
    return (z ^ (z >>> 16)) >>> 0;
  };
  return [next(), next(), next(), next() || 1];
}

export function randomSeed(): number {
  try {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return a[0];
  } catch {
    return (Math.random() * 0xffffffff) >>> 0;
  }
}

export class Rng {
  s: RngState;
  constructor(state?: RngState | number[]) {
    this.s = (state && state.length === 4 ? [...state] : seedFromNumber(randomSeed())) as RngState;
  }
  private nextU32(): number {
    const s = this.s;
    const result = Math.imul(rotl(Math.imul(s[1], 5), 7), 9) >>> 0;
    const t = (s[1] << 9) >>> 0;
    s[2] ^= s[0]; s[3] ^= s[1]; s[1] ^= s[2]; s[0] ^= s[3];
    s[2] ^= t;
    s[3] = rotl(s[3], 11);
    s[0] >>>= 0; s[1] >>>= 0; s[2] >>>= 0; s[3] >>>= 0;
    return result;
  }
  /** [0,1) */
  next(): number { return this.nextU32() / 4294967296; }
  /** [min,max] 整数 */
  int(min: number, max: number): number {
    if (max <= min) return min;
    return min + Math.floor(this.next() * (max - min + 1));
  }
  /** 概率判定，p 为 0-1 */
  chance(p: number): boolean { return p >= 1 ? true : p <= 0 ? false : this.next() < p; }
  /** 百分比判定，p 为 0-100 */
  percent(p: number): boolean { return this.chance(p / 100); }
  pick<T>(arr: T[]): T { return arr[Math.floor(this.next() * arr.length)]; }
  weighted<T extends { weight: number }>(arr: T[]): T | null {
    let total = 0;
    for (const e of arr) total += e.weight;
    if (total <= 0) return null;
    let r = this.next() * total;
    for (const e of arr) { r -= e.weight; if (r < 0) return e; }
    return arr[arr.length - 1];
  }
  /** 二项分布抽样（批量结算用；n 较大时使用正态近似） */
  binomial(n: number, p: number): number {
    if (n <= 0 || p <= 0) return 0;
    if (p >= 1) return n;
    if (n < 60) { let k = 0; for (let i = 0; i < n; i++) if (this.next() < p) k++; return k; }
    const mean = n * p, sd = Math.sqrt(n * p * (1 - p));
    const u1 = Math.max(1e-12, this.next()), u2 = this.next();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return Math.max(0, Math.min(n, Math.round(mean + z * sd)));
  }
  getState(): RngState { return [...this.s] as RngState; }
}

function rotl(x: number, k: number): number { return ((x << k) | (x >>> (32 - k))) >>> 0; }
