<script setup lang="ts">
import { computed } from 'vue';
import { C, href } from '../data';
import { EXPANSIONS } from '@/content/expansions';

const stats = computed(() => [
  ['技能', C.skillOrder.length, 'skill', 'trophy'],
  ['物品', Object.keys(C.items).length, 'item', 'box'],
  ['怪物', Object.keys(C.monsters).length, 'monster', 'dragon'],
  ['战斗区域', Object.keys(C.areas).length, 'area', 'swords'],
  ['副本', Object.keys(C.dungeons).length, 'dungeon', 'castle'],
  ['法术', Object.keys(C.spells).length, 'spell', 'wand'],
  ['宠物', Object.keys(C.pets).length, 'pet', 'paw'],
  ['任务', Object.keys(C.quests).length, 'quest', 'scroll'],
  ['成就', Object.keys(C.achievements).length, 'achievement', 'medal'],
] as const);
const CATS: [string, string][] = [['combat', '战斗技能'], ['gathering', '采集技能'], ['artisan', '制造技能'], ['support', '辅助技能'], ['passive', '被动技能']];
const skillsOf = (cat: string) => C.skillOrder.filter((s) => C.skills[s].category === cat);
</script>

<template>
  <div>
    <h1><Icon name="swords" size="40" /> Idle Realms · 放置王国</h1>
    <p class="lead">一款纯前端、可离线运行的放置 RPG。选择一项活动，角色就会自动反复执行：砍树、钓鱼、锻造、战斗……即使关掉浏览器，回来时也会按真实经过的时间结算收益。</p>

    <div class="grid">
      <a v-for="[n, v, k, ic] in stats" :key="k" :href="href(k)" class="card"><div class="ct"><Icon :name="ic" size="26" /> {{ v }} <span class="muted">{{ n }}</span></div></a>
    </div>

    <h2><Icon name="compass" /> 新手入门</h2>
    <ol>
      <li><b>创建角色：</b>选择标准、硬核或冒险模式（见 <a :href="href('expansion')">扩展与模式</a>）。</li>
      <li><b>从采集开始：</b>在 <a :href="href('skill', 'woodcutting')">伐木</a>、<a :href="href('skill', 'fishing')">钓鱼</a>、<a :href="href('skill', 'mining')">采矿</a> 中挑一项点击「开始」，同一时间只能进行一项活动。</li>
      <li><b>加工材料：</b>把原木、矿石、鱼交给 <a :href="href('skill', 'firemaking')">生火</a>、<a :href="href('skill', 'smithing')">锻造</a>、<a :href="href('skill', 'cooking')">烹饪</a>，产出装备与食物。</li>
      <li><b>开始战斗：</b>装备武器护甲、准备食物，前往 <a :href="href('area')">战斗区域</a>。击败怪物获得战斗经验、金币与掉落。</li>
      <li><b>挑战副本：</b>副本按顺序刷出一组怪物并以首领收尾，通关奖励稀有物品与宠物。</li>
      <li><b>长期成长：</b>提升技能掌握度、完成任务与成就、收集宠物、解锁扩展内容。</li>
    </ol>

    <h2><Icon name="trophy" /> 技能一览</h2>
    <div v-for="[cat, name] in CATS" :key="cat">
      <h3 v-if="skillsOf(cat).length">{{ name }}</h3>
      <div class="grid">
        <a v-for="s in skillsOf(cat)" :key="s" :href="href('skill', s)" class="card">
          <div class="ct"><Icon :name="C.skills[s].icon" size="24" /> {{ C.skills[s].name }}</div>
          <div class="cs">{{ C.skills[s].description }}</div>
        </a>
      </div>
    </div>

    <h2><Icon name="galaxy" /> 内容扩展</h2>
    <div class="grid">
      <a v-for="e in EXPANSIONS" :key="e.id" :href="href('expansion')" class="card">
        <div class="ct">{{ e.name }}</div>
        <div class="cs">{{ e.description }}</div>
      </a>
    </div>
  </div>
</template>
