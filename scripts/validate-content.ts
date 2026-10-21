// 开发/构建阶段的内容校验工具：npm run validate:content
// 生成 content-report.json（内容清单计数、错误、警告），存在错误时以非零状态退出。
import { writeFileSync } from 'node:fs';
import '../src/content';
import { checkContent } from '../src/game/core/contentCheck';
import { C } from '../src/content/registry';
import { EXPANSIONS } from '../src/content/expansions';

const report = checkContent();
const byExpansion: Record<string, Record<string, number>> = {};
for (const [kind, map] of [['items', C.items], ['actions', C.actions], ['monsters', C.monsters], ['dungeons', C.dungeons], ['areas', C.areas]] as const) {
  for (const v of Object.values(map as Record<string, { expansion: string }>)) {
    (byExpansion[v.expansion] ||= {})[kind] = ((byExpansion[v.expansion] ||= {})[kind] || 0) + 1;
  }
}
const out = {
  generatedAt: new Date().toISOString(),
  expansions: EXPANSIONS.map((e) => ({ id: e.id, name: e.name, version: e.version, content: byExpansion[e.id] ?? {} })),
  inventory: {
    skills: C.skillOrder,
    dungeons: Object.keys(C.dungeons),
    areas: Object.keys(C.areas),
  },
  ...report,
};
writeFileSync('content-report.json', JSON.stringify(out, null, 2));
console.log('内容计数：', report.counts);
console.log(`错误 ${report.errors.length} 条，警告 ${report.warnings.length} 条，详见 content-report.json`);
for (const e of report.errors.slice(0, 50)) console.error('  ✗', e);
if (!report.ok) process.exit(1);
