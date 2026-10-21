import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

/** 构建完成后生成 Service Worker 预缓存清单，保证首次访问后可完整断网启动 */
function precacheManifest() {
  return {
    name: 'precache-manifest',
    apply: 'build' as const,
    closeBundle() {
      const dist = fileURLToPath(new URL('./dist', import.meta.url));
      const files: string[] = [];
      const walk = (dir: string) => {
        for (const f of readdirSync(dir)) {
          const p = join(dir, f);
          if (statSync(p).isDirectory()) walk(p);
          else files.push('./' + relative(dist, p).split('\\').join('/'));
        }
      };
      walk(dist);
      const list = files.filter((f) => !f.endsWith('sw.js') && !f.endsWith('precache.json'));
      writeFileSync(join(dist, 'precache.json'), JSON.stringify({ version: Date.now().toString(36), files: list }));
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [vue(), precacheManifest()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  worker: { format: 'es' },
  build: { target: 'es2020', chunkSizeWarningLimit: 4000 },
  test: { environment: 'node', include: ['src/tests/**/*.test.ts'] },
} as any);
