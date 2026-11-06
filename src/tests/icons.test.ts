import { describe, it, expect } from 'vitest';
import { C } from '@/content';
import { ICONS } from '@/app/icons/registry';
import { iconSvg, iconInner } from '@/app/icons';
import { SLOT_ICONS, ATTACK_TYPE_ICONS } from '@/game/ui/combatHelpers';

const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/u;

describe('程序化图标', () => {
  it('所有内容数据的 icon 都能在注册表中找到，且不含 emoji', () => {
    const missing: string[] = [];
    for (const [coll, map] of Object.entries(C as unknown as Record<string, Record<string, unknown>>)) {
      if (!map || typeof map !== 'object') continue;
      for (const [id, def] of Object.entries(map)) {
        const icon = (def as { icon?: unknown })?.icon;
        if (typeof icon !== 'string') continue;
        if (EMOJI.test(icon) || !(icon in ICONS)) missing.push(`${coll}.${id}: ${icon}`);
      }
    }
    for (const v of [...Object.values(SLOT_ICONS), ...Object.values(ATTACK_TYPE_ICONS)]) if (!(v in ICONS)) missing.push(v);
    expect(missing).toEqual([]);
  });

  it('每个注册图标都能生成合法 SVG，且结果确定', () => {
    for (const name of Object.keys(ICONS)) {
      const svg = iconSvg(name, 'seed');
      expect(svg.startsWith('<svg')).toBe(true);
      expect(svg).not.toMatch(/NaN|undefined/);
      expect(iconInner(name, 'seed')).toBe(iconInner(name, 'seed'));
    }
  });

  it('不同种子会产生不同细节', () => {
    expect(iconInner('wolf', 'a')).not.toBe(iconInner('wolf', 'b'));
  });
});
