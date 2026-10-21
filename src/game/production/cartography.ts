// 制图：六角格地图、勘测、兴趣点发现、发掘地图制作
import type { Game } from '../core/game';
import { C } from '@/content';
import { MAP_RADIUS, MAP_TIERS } from '@/content/recipes/support';

export type Hex = [number, number];
export const hexKey = (h: Hex) => `${h[0]},${h[1]}`;
export const parseHex = (k: string): Hex => k.split(',').map(Number) as Hex;
export const hexDist = (a: Hex, b: Hex) => (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[0] + a[1] - b[0] - b[1])) / 2;
export const hexInMap = (h: Hex) => hexDist(h, [0, 0]) <= MAP_RADIUS;
const DIRS: Hex[] = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
export const neighbors = (h: Hex): Hex[] => DIRS.map((d) => [h[0] + d[0], h[1] + d[1]] as Hex).filter(hexInMap);

export function allHexes(): Hex[] {
  const out: Hex[] = [];
  for (let q = -MAP_RADIUS; q <= MAP_RADIUS; q++) for (let r = -MAP_RADIUS; r <= MAP_RADIUS; r++) if (hexInMap([q, r])) out.push([q, r]);
  return out;
}

export function poisAt(key: string) { return Object.values(C.pois).filter((p) => hexKey(p.hex) === key); }

/** 勘测该格所需制图等级 */
export function hexLevelReq(h: Hex): number { return Math.max(1, (hexDist(h, [0, 0]) - 1) * 12); }

function hexIsAbyssal(key: string) {
  return poisAt(key).some((p) => p.kind === 'portal' || (p.digSite && C.digSites[p.digSite]?.realm === 'abyssal'));
}

export function canSurveyHex(g: Game, h: Hex): string | null {
  const key = hexKey(h);
  if (!hexInMap(h)) return '超出地图范围';
  if (g.state.cartography.surveyed.includes(key)) return '已勘测';
  if (!neighbors(h).some((n) => g.state.cartography.surveyed.includes(hexKey(n)))) return '需要先勘测相邻区域';
  if (g.level('cartography') < hexLevelReq(h)) return `需要制图 ${hexLevelReq(h)} 级`;
  if (hexIsAbyssal(key) && !g.inAbyss()) return '需要开启深渊之门';
  return null;
}

export function frontier(g: Game): Hex[] {
  const surveyed = new Set(g.state.cartography.surveyed);
  const out: Hex[] = [];
  for (const h of allHexes()) {
    const k = hexKey(h);
    if (surveyed.has(k)) continue;
    if (!canSurveyHex(g, h)) out.push(h);
  }
  return out;
}

export function nextSurveyTarget(g: Game): Hex | null {
  const t = g.state.cartography.target;
  if (t) { const h = parseHex(t); if (!canSurveyHex(g, h)) return h; }
  const f = frontier(g);
  if (!f.length) return null;
  f.sort((a, b) => hexDist(a, [0, 0]) - hexDist(b, [0, 0]) || hexKey(a).localeCompare(hexKey(b)));
  g.state.cartography.target = hexKey(f[0]);
  return f[0];
}

export function setSurveyTarget(g: Game, key: string): string | null {
  const err = canSurveyHex(g, parseHex(key));
  if (err) return err;
  g.state.cartography.target = key;
  return null;
}

export function revealAround(g: Game, center: Hex, radius: number) {
  for (const h of allHexes()) {
    if (hexDist(h, center) > radius) continue;
    const k = hexKey(h);
    if (g.state.cartography.surveyed.includes(k) || hexIsAbyssal(k) && !g.inAbyss()) continue;
    g.state.cartography.surveyed.push(k);
    onHexSurveyed(g, k);
  }
}

export function onHexSurveyed(g: Game, key: string) {
  for (const p of poisAt(key)) {
    if (g.state.cartography.discovered.includes(p.id)) continue;
    g.state.cartography.discovered.push(p.id);
    g.notify(`发现兴趣点：${p.name}`, 'success', p.icon);
    g.events.emit('poiDiscovered', { poiId: p.id });
    g.addXp('cartography', 50 + hexDist(p.hex, [0, 0]) * 25);
    if (p.reward) {
      if (p.reward.gp) g.addGp(p.reward.gp, 'poi');
      for (const i of p.reward.items ?? []) g.addItem(i.id, i.qty, 'poi');
    }
    if (p.modifiers) g.invalidate();
    if (p.kind === 'watchtower') revealAround(g, p.hex, 2);
  }
}

export function mapCreateCheck(g: Game, siteId: string, tier: number): string | null {
  const site = C.digSites[siteId];
  const t = MAP_TIERS.find((x) => x.tier === tier);
  if (!site || !t) return '无效地图';
  if (!g.state.cartography.discovered.includes(`poi_${siteId}`)) return '尚未发现该发掘点';
  const lvlReq = site.realm === 'abyssal' ? 99 : Math.max(1, site.level - 5) + (tier - 1) * 10;
  if (g.level('cartography') < Math.min(120, lvlReq)) return `需要制图 ${Math.min(120, lvlReq)} 级`;
  if (site.abyssalLevel && g.abyssalLevel('cartography') < site.abyssalLevel) return `需要制图深渊 ${site.abyssalLevel} 级`;
  if (g.qty('paper') < t.paper) return '纸张不足';
  if (g.qty('ink') < t.ink) return '墨水不足';
  return null;
}

export function createMap(g: Game, siteId: string, tier: number): string | null {
  const err = mapCreateCheck(g, siteId, tier);
  if (err) return err;
  const t = MAP_TIERS.find((x) => x.tier === tier)!;
  g.removeItems([{ id: 'paper', qty: t.paper }, ...(t.ink ? [{ id: 'ink', qty: t.ink }] : [])], 'cartography');
  const cur = g.state.cartography.maps[siteId];
  g.state.cartography.maps[siteId] = { tier: Math.max(cur?.tier ?? 0, tier), charges: (cur?.charges ?? 0) + t.charges };
  const site = C.digSites[siteId];
  g.addXp('cartography', 20 * tier * (1 + site.level / 20));
  if (site.abyssalLevel) g.addAbyssalXp('cartography', 100 * tier);
  g.skillStat('cartography', 'mapsCreated');
  g.notify(`制作了「${site.name}」${t.name}`, 'success', '🗺️');
  return null;
}
