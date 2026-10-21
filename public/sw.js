/* Idle Realms Service Worker：预缓存全部构建产物，缓存优先，支持断网启动与版本更新提示 */
const CACHE_PREFIX = 'idle-realms-';
let currentCache = null;

async function loadPrecache() {
  const res = await fetch('./precache.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('precache.json missing');
  return res.json();
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    try {
      const manifest = await loadPrecache();
      const cache = await caches.open(CACHE_PREFIX + manifest.version);
      await cache.addAll(['./', ...manifest.files]);
    } catch (e) {
      // 开发模式下没有 precache.json，退化为运行时缓存
    }
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    const sorted = keys.filter((k) => k.startsWith(CACHE_PREFIX));
    currentCache = sorted[sorted.length - 1] || CACHE_PREFIX + 'runtime';
    let latest = null;
    try { latest = CACHE_PREFIX + (await loadPrecache()).version; } catch (e) { /* offline */ }
    if (latest) {
      await Promise.all(sorted.filter((k) => k !== latest).map((k) => caches.delete(k)));
      currentCache = latest;
    }
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith('precache.json')) return;
  event.respondWith((async () => {
    const cached = await caches.match(req, { ignoreSearch: true });
    if (cached) return cached;
    try {
      const res = await fetch(req);
      if (res.ok) {
        const keys = await caches.keys();
        const name = keys.filter((k) => k.startsWith(CACHE_PREFIX)).pop() || CACHE_PREFIX + 'runtime';
        const cache = await caches.open(name);
        cache.put(req, res.clone());
      }
      return res;
    } catch (e) {
      if (req.mode === 'navigate') {
        const index = await caches.match('./', { ignoreSearch: true });
        if (index) return index;
      }
      throw e;
    }
  })());
});
