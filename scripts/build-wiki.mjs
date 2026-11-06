// 生成独立的游戏百科 wiki.html：JS 与 CSS 全部内联，可直接双击打开（file://）或放在任意静态服务器上。
// 百科数据来自游戏内容注册表，内容变更后重新运行：npm run build:wiki
import { build } from 'vite';
import vue from '@vitejs/plugin-vue';
import { writeFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = await build({
  root,
  configFile: false,
  logLevel: 'warn',
  plugins: [vue()],
  resolve: { alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) } },
  define: { 'process.env.NODE_ENV': '"production"' },
  build: {
    write: false,
    target: 'es2020',
    cssCodeSplit: false,
    modulePreload: false,
    rollupOptions: {
      input: fileURLToPath(new URL('../src/wiki/main.ts', import.meta.url)),
      output: { format: 'iife', inlineDynamicImports: true, entryFileNames: 'wiki.js', assetFileNames: '[name][extname]' },
    },
  },
});
const files = (Array.isArray(out) ? out : [out]).flatMap((o) => o.output);
const js = files.filter((f) => f.type === 'chunk').map((f) => f.code).join('\n');
const css = files.filter((f) => f.type === 'asset' && f.fileName.endsWith('.css')).map((f) => String(f.source)).join('\n');
const safe = (s) => s.replace(/<\/(script|style)/gi, '<\\/$1');

const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<meta name="theme-color" content="#1b1f2a" />
<meta name="description" content="Idle Realms 游戏百科：技能、物品、怪物、副本、法术与游戏机制" />
<title>Idle Realms 百科</title>
<!-- 此文件由 scripts/build-wiki.mjs 自动生成，请勿手动编辑 -->
<style>${safe(css)}</style>
</head>
<body>
<div id="wiki"></div>
<script>${safe(js)}</script>
</body>
</html>
`;
writeFileSync(fileURLToPath(new URL('../wiki.html', import.meta.url)), html);
console.log(`wiki.html 已生成（${(html.length / 1024).toFixed(0)} KB）`);
