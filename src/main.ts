import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import './assets/main.css';
import '@/content';
import { useGameStore } from './stores/game';

try {
  const t = localStorage.getItem('idle-realms-theme');
  if (t) document.documentElement.dataset.theme = t;
} catch { /* ignore */ }

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.mount('#app');
document.getElementById('splash')?.remove();

// PWA：注册 Service Worker，检测新版本
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then((reg) => {
      const store = useGameStore();
      const check = (w: ServiceWorker | null) => {
        if (!w) return;
        w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) store.updateAvailable = true; });
      };
      if (reg.waiting && navigator.serviceWorker.controller) store.updateAvailable = true;
      reg.addEventListener('updatefound', () => check(reg.installing));
      setInterval(() => reg.update().catch(() => undefined), 60 * 60 * 1000);
    }).catch(() => undefined);
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (!refreshing) { refreshing = true; location.reload(); } });
  });
  (navigator as any).storage?.persist?.().catch(() => undefined);
}
