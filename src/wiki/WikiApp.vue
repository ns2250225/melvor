<script setup lang="ts">
// Idle Realms 游戏百科：独立页面（wiki.html），哈希路由，数据直接取自游戏内容注册表
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { searchIndex, href, KIND_NAMES } from './data';
import Home from './views/Home.vue';
import Guide from './views/Guide.vue';
import Skills from './views/Skills.vue';
import Items from './views/Items.vue';
import Monsters from './views/Monsters.vue';
import Places from './views/Places.vue';
import Lists from './views/Lists.vue';

const NAV = [
  { group: '入门', links: [['home', '首页', 'home'], ['guide', '游戏机制', 'book']] },
  { group: '数据库', links: [['skill', '技能', 'trophy'], ['item', '物品', 'box'], ['monster', '怪物', 'dragon'], ['area', '战斗区域', 'swords'], ['dungeon', '副本', 'castle']] },
  { group: '系统', links: [['spell', '法术', 'wand'], ['prayer', '祈祷', 'pray'], ['pet', '宠物', 'paw'], ['shop', '商店', 'cart'], ['quest', '任务', 'scroll'], ['achievement', '成就', 'medal'], ['expansion', '扩展与模式', 'galaxy']] },
] as const;

const hash = ref(location.hash);
const onHash = () => { hash.value = location.hash; navOpen.value = false; window.scrollTo(0, 0); };
onMounted(() => window.addEventListener('hashchange', onHash));
onUnmounted(() => window.removeEventListener('hashchange', onHash));
const route = computed(() => {
  const [kind = 'home', id] = hash.value.replace(/^#\/?/, '').split('/');
  return { kind: kind || 'home', id: id ? decodeURIComponent(id) : undefined };
});

// 主题：与游戏共享设置
try { const t = localStorage.getItem('idle-realms-theme'); if (t && t !== 'auto') document.documentElement.dataset.theme = t; } catch { /* 忽略 */ }

// 全局搜索
const q = ref('');
const navOpen = ref(false);
const results = computed(() => {
  const s = q.value.trim().toLowerCase();
  if (!s) return [];
  return searchIndex().filter((e) => e.name.toLowerCase().includes(s) || e.id.includes(s)).slice(0, 30);
});
watch(() => route.value, () => { q.value = ''; });
</script>

<template>
  <div class="wiki">
    <header class="top">
      <button class="burger" aria-label="菜单" @click="navOpen = !navOpen">☰</button>
      <a class="brand" href="#/home"><Icon name="swords" size="28" /><span>Idle Realms 百科</span></a>
      <div class="search">
        <Icon name="search" class="sicon" />
        <input v-model="q" type="search" placeholder="搜索物品、怪物、技能、副本…" aria-label="搜索" />
        <div v-if="results.length" class="results">
          <a v-for="r in results" :key="r.kind + r.id" :href="href(r.kind, r.id)" class="res">
            <Icon :name="r.icon" :seed="r.seed" :tint="r.tint" size="22" />
            <span class="rn">{{ r.name }}</span><span class="rk">{{ KIND_NAMES[r.kind] }} · {{ r.sub }}</span>
          </a>
        </div>
      </div>
      <a class="play" href="./index.html">进入游戏 →</a>
    </header>
    <div class="body">
      <nav class="side" :class="{ open: navOpen }">
        <div v-for="g in NAV" :key="g.group" class="grp">
          <div class="gt">{{ g.group }}</div>
          <a v-for="[k, label, icon] in g.links" :key="k" :href="href(k)" class="nl" :class="{ on: route.kind === k }"><Icon :name="icon" /> {{ label }}</a>
        </div>
      </nav>
      <main class="main">
        <Home v-if="route.kind === 'home'" />
        <Guide v-else-if="route.kind === 'guide'" />
        <Skills v-else-if="route.kind === 'skill'" :id="route.id" />
        <Items v-else-if="route.kind === 'item'" :id="route.id" />
        <Monsters v-else-if="route.kind === 'monster'" :id="route.id" />
        <Places v-else-if="route.kind === 'area' || route.kind === 'dungeon'" :kind="route.kind" :id="route.id" />
        <Lists v-else :kind="route.kind" :id="route.id" />
      </main>
    </div>
    <footer class="foot">本百科由游戏内容数据自动生成，所有图标均为程序化生成的 SVG。</footer>
  </div>
</template>

<style>
.wiki { min-height: 100%; display: flex; flex-direction: column; }
.wiki .top { position: sticky; top: 0; z-index: 20; display: flex; align-items: center; gap: 16px; padding: 10px 20px; background: var(--bg2); border-bottom: 1px solid var(--border); }
.wiki .brand { display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 18px; color: var(--text); text-decoration: none; white-space: nowrap; }
.wiki .burger { display: none; background: none; border: 1px solid var(--border); color: var(--text); border-radius: 8px; padding: 4px 10px; font-size: 16px; }
.wiki .search { position: relative; flex: 1; max-width: 560px; }
.wiki .search input { width: 100%; padding: 8px 12px 8px 34px; border-radius: 8px; border: 1px solid var(--border); background: var(--panel); color: var(--text); font: inherit; }
.wiki .search .sicon { position: absolute; left: 9px; top: 9px; }
.wiki .results { position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: var(--panel); border: 1px solid var(--border); border-radius: 8px; box-shadow: var(--shadow); max-height: 60vh; overflow: auto; }
.wiki .res { display: flex; align-items: center; gap: 8px; padding: 6px 10px; color: var(--text); text-decoration: none; }
.wiki .res:hover { background: var(--panel2); }
.wiki .rn { font-weight: 600; }
.wiki .rk { color: var(--muted); font-size: 12px; margin-left: auto; }
.wiki .play { margin-left: auto; color: var(--accent); text-decoration: none; font-weight: 600; white-space: nowrap; }
.wiki .body { display: flex; flex: 1; }
.wiki .side { width: 210px; flex-shrink: 0; padding: 14px 10px; border-right: 1px solid var(--border); background: var(--bg2); position: sticky; top: 57px; height: calc(100vh - 57px); overflow: auto; }
.wiki .gt { font-size: 12px; color: var(--muted); margin: 10px 8px 4px; }
.wiki .nl { display: flex; align-items: center; gap: 8px; padding: 6px 10px; border-radius: 8px; color: var(--text); text-decoration: none; }
.wiki .nl:hover { background: var(--panel2); }
.wiki .nl.on { background: var(--accent); color: #fff; }
.wiki .main { flex: 1; min-width: 0; padding: 20px 28px 40px; max-width: 1200px; }
.wiki .foot { text-align: center; color: var(--muted); font-size: 12px; padding: 16px; border-top: 1px solid var(--border); }
/* 通用内容样式 */
.wiki h1 { font-size: 26px; margin: 0 0 6px; display: flex; align-items: center; gap: 10px; }
.wiki h2 { overflow: hidden; font-size: 19px; margin: 26px 0 10px; padding-bottom: 6px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 8px; }
.wiki h3 { font-size: 15px; margin: 16px 0 6px; }
.wiki p, .wiki li { line-height: 1.75; }
.wiki .lead { color: var(--muted); margin: 0 0 14px; }
.wiki .muted { color: var(--muted); }
.wiki .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 10px; }
.wiki .card { background: var(--panel); border: 1px solid var(--border); border-radius: var(--radius); padding: 12px 14px; color: var(--text); text-decoration: none; display: block; }
a.card:hover { border-color: var(--accent); }
.wiki .card .ct { display: flex; align-items: center; gap: 8px; font-weight: 600; }
.wiki .card .cs { color: var(--muted); font-size: 12px; margin-top: 4px; }
.wiki table { width: 100%; border-collapse: collapse; background: var(--panel); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; font-size: 13px; }
.wiki th, .wiki td { padding: 7px 10px; border-bottom: 1px solid var(--border); text-align: left; vertical-align: top; }
.wiki th { background: var(--panel2); font-weight: 600; white-space: nowrap; }
.wiki tr:last-child td { border-bottom: 0; }
.wiki .tw { overflow-x: auto; }
.wiki .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
.wiki .tag { display: inline-flex; align-items: center; gap: 3px; padding: 1px 8px; border-radius: 999px; background: var(--panel2); border: 1px solid var(--border); font-size: 12px; margin: 1px 2px; }
.wiki .infobox { float: right; width: 280px; margin: 0 0 14px 20px; background: var(--panel); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
.wiki .infobox .ih { text-align: center; padding: 14px; background: var(--panel2); }
.wiki .infobox dl { margin: 0; padding: 8px 12px; display: grid; grid-template-columns: auto 1fr; gap: 4px 10px; font-size: 13px; }
.wiki .infobox dt { color: var(--muted); }
.wiki .infobox dd { margin: 0; }
.wiki .filters { display: flex; flex-wrap: wrap; gap: 6px; margin: 10px 0 14px; }
.wiki .filters button, .wiki .filters select, .wiki .filters input { background: var(--panel); border: 1px solid var(--border); color: var(--text); border-radius: 8px; padding: 5px 12px; font: inherit; font-size: 13px; cursor: pointer; }
.wiki .filters button.on { background: var(--accent); border-color: var(--accent); color: #fff; }
.wiki .clear { clear: both; }
.wiki .abyss { color: var(--abyss); }
.wiki .good { color: var(--good); }
.wiki .gold { color: var(--accent2); }
@media (max-width: 860px) {
  .wiki .burger { display: block; }
  .wiki .play { display: none; }
  .wiki .brand span { display: none; }
  .wiki .side { position: fixed; left: 0; top: 57px; z-index: 30; transform: translateX(-100%); transition: transform .2s; }
  .wiki .side.open { transform: none; box-shadow: var(--shadow); }
  .wiki .main { padding: 16px; }
  .wiki .infobox { float: none; width: auto; margin: 0 0 14px; }
}
</style>
