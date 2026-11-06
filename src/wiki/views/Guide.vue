<script setup lang="ts">
// 游戏机制说明：数值与公式直接引用引擎常量，保证与游戏一致
import { computed, ref } from 'vue';
import { C } from '../data';
import { xpForLevel, abyssalXpForLevel, MAX_STANDARD_LEVEL, MAX_MASTERY_LEVEL, MAX_ABYSSAL_LEVEL, MASTERY_CHECKPOINTS } from '@/game/core/xp';
import { BASE_BANK_SLOTS, MAX_OFFLINE_MS } from '@/game/core/game';
import { full } from '@/app/format';

const showAll = ref(false);
const xpRows = computed(() => {
  const lv = showAll.value ? Array.from({ length: MAX_STANDARD_LEVEL }, (_, i) => i + 1) : [1, 2, 5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 92, 99, 105, 110, 115, 120];
  return lv.map((l) => ({ l, xp: xpForLevel(l), d: l > 1 ? xpForLevel(l) - xpForLevel(l - 1) : 0, a: l <= MAX_ABYSSAL_LEVEL ? abyssalXpForLevel(l) : null }));
});
const modes = computed(() => Object.values(C.gameModes));
</script>

<template>
  <div>
    <h1><Icon name="book" size="36" /> 游戏机制</h1>
    <p class="lead">本页解释 Idle Realms 的核心规则。文中的数值直接取自游戏引擎，与实际玩法一致。</p>

    <h2><Icon name="refresh" /> 核心循环</h2>
    <ul>
      <li><b>基础循环：</b>选择技能或战斗 → 自动执行动作 → 获得经验与资源 → 提升等级和装备 → 解锁新内容。</li>
      <li><b>生产链：</b>采集原材料 → 加工 → 制造工具和装备 → 提高采集效率 → 解锁更高阶配方。</li>
      <li><b>战斗：</b>配置装备、食物、法术与祈祷 → 自动战斗 → 经验和掉落 → 挑战新区域与副本。</li>
      <li><b>长期成长：</b>等级 → 掌握度 → 永久加成 → 终局装备与扩展内容。</li>
    </ul>
    <p>同一时间只能进行<b>一项</b>主要活动（技能动作或战斗）。被动内容（农业作物生长、城镇税收等）会在后台独立推进。</p>

    <h2><Icon name="trend" /> 经验与等级</h2>
    <p>每项技能基础上限为 <b>99</b> 级，安装扩展后最高可达 <b>{{ MAX_STANDARD_LEVEL }}</b> 级；深渊等级是独立的第二条成长线，最高 <b>{{ MAX_ABYSSAL_LEVEL }}</b> 级。标准经验曲线为：</p>
    <p class="tag" style="font-size: 13px; padding: 6px 12px">等级 L 所需总经验 = ⌊ Σ<sub>x=1</sub><sup>L−1</sup> ⌊x + 300 · 2<sup>x/7</sup>⌋ ÷ 4 ⌋</p>
    <p>经验增长呈指数：92 级约为 99 级所需经验的一半。一次获得大量经验时会连续升级，溢出经验会保留。</p>
    <div class="filters"><button :class="{ on: !showAll }" @click="showAll = false">关键等级</button><button :class="{ on: showAll }" @click="showAll = true">全部 {{ MAX_STANDARD_LEVEL }} 级</button></div>
    <div class="tw">
      <table>
        <thead><tr><th>等级</th><th class="num">总经验</th><th class="num">比上一级多</th><th class="num">深渊总经验</th></tr></thead>
        <tbody><tr v-for="r in xpRows" :key="r.l"><td>{{ r.l }}</td><td class="num">{{ full(r.xp) }}</td><td class="num">{{ r.d ? full(r.d) : '—' }}</td><td class="num abyss">{{ r.a !== null ? full(r.a) : '—' }}</td></tr></tbody>
      </table>
    </div>

    <h2><Icon name="medal" /> 掌握度</h2>
    <p>技能里的每个动作（例如「砍伐橡木」）都有独立的掌握度等级，最高 <b>{{ MAX_MASTERY_LEVEL }}</b> 级。重复执行动作即可提升它的掌握度，同时也会填充该技能的<b>掌握度池</b>（上限为每个动作 500,000 点）。</p>
    <ul>
      <li><b>双倍产出：</b>采集类技能每级掌握度 +0.25% 双倍几率，其他技能 +0.125%。</li>
      <li><b>材料节省：</b>每 20 级掌握度 +5% 几率不消耗材料（与其他来源合计最高 80%）。</li>
      <li><b>掌握度池检查点：</b>池子达到 {{ MASTERY_CHECKPOINTS.map((c) => c * 100 + '%').join(' / ') }} 时分别激活一档技能级加成，加成内容见各技能页面。</li>
      <li>每次动作获得的掌握度经验与动作耗时、该技能已解锁动作的掌握度总和有关：耗时越长的动作，单次给的掌握度越多。</li>
    </ul>

    <h2><Icon name="swords" /> 战斗</h2>
    <p>战斗全自动进行。玩家和怪物按各自的攻击间隔轮流出手，每次攻击先判定是否命中，再在 1 到最大伤害之间随机取值。生命值以「等级 × 10」计算。</p>
    <h3>战斗三角</h3>
    <p>近战克远程，远程克魔法，魔法克近战。占优一方伤害 ×1.1、伤害减免 ×1.25；处于劣势时伤害 ×0.85、减免 ×0.5（硬核模式下劣势惩罚为 ×0.75 / ×0.25）。</p>
    <div class="tw"><table>
      <thead><tr><th>你的攻击方式</th><th>克制</th><th>被克制</th></tr></thead>
      <tbody>
        <tr><td><Icon name="swords" /> 近战</td><td><Icon name="bow" /> 远程</td><td><Icon name="wand" /> 魔法</td></tr>
        <tr><td><Icon name="bow" /> 远程</td><td><Icon name="wand" /> 魔法</td><td><Icon name="swords" /> 近战</td></tr>
        <tr><td><Icon name="wand" /> 魔法</td><td><Icon name="swords" /> 近战</td><td><Icon name="bow" /> 远程</td></tr>
      </tbody>
    </table></div>
    <h3>命中率</h3>
    <p>命中由攻击方的<b>命中值</b>与防守方的<b>闪避值</b>比较得出：命中值低于闪避值时，命中率 = 0.5 × 命中 ÷ 闪避；否则命中率 = 1 − 0.5 × 闪避 ÷ 命中。命中值 = (相关等级 + 9) × (装备攻击加成 + 64) × (1 + 命中修饰%)。</p>
    <h3>最大伤害</h3>
    <p>近战与远程的最大伤害 = ⌊10 × (1.3 + 有效等级/10 + 力量加成/80 + 有效等级 × 力量加成/640)⌋，其中有效等级 = 力量（或远程）等级 + 9。魔法伤害取决于所选法术的基础伤害、装备魔法伤害加成与魔法等级。</p>
    <h3>食物与死亡</h3>
    <ul>
      <li>战斗中可以手动进食；在商店购买「自动进食」后，生命值低于阈值时会自动吃食物。</li>
      <li>标准与冒险模式下死亡会随机失去一件已装备物品（激活「护佑」类祈祷可避免）；硬核模式死亡后角色被永久删除。</li>
      <li>副本中途死亡会中断副本进度。</li>
    </ul>
    <h3>猎杀任务</h3>
    <p>在猎杀页面接取任务，击败指定怪物若干只即可获得猎杀经验和猎杀币。猎杀币可在商店换取装备与便利升级；部分猎杀区域需要特定装备才能进入。</p>

    <h2><Icon name="hourglass" /> 离线进度</h2>
    <p>关闭页面时会保存当前活动。重新打开后，游戏用与在线时<b>完全相同的规则</b>逐 tick 重放离线期间的进度（在后台线程中计算，不会卡住页面），最多结算 <b>{{ MAX_OFFLINE_MS / 3600000 }} 小时</b>，结束后弹出离线报告，列出获得的经验、物品和消耗。</p>

    <h2><Icon name="bank" /> 银行与物品</h2>
    <ul>
      <li>银行初始有 <b>{{ BASE_BANK_SLOTS }}</b> 个格子，每种物品占一格，同种物品无限堆叠。银行满了以后新物品无法入库，相关活动会暂停。</li>
      <li>可以在商店扩容银行，也可以出售多余物品换取金币。锁定的物品不会被批量出售。</li>
      <li>物品稀有度以图标边框颜色区分：蓝色稀有、紫色史诗、金色传说。</li>
    </ul>

    <h2><Icon name="save" /> 存档</h2>
    <p>存档保存在浏览器本地（IndexedDB），每隔一段时间及关键操作后自动保存。可以在「存档管理」中导出为文本备份、导入到其他设备；导入前会自动备份当前存档。游戏没有服务器，也不需要账号。</p>

    <h2><Icon name="crown" /> 游戏模式</h2>
    <div class="tw"><table>
      <thead><tr><th>模式</th><th>说明</th><th>永久死亡</th><th>技能需解锁</th></tr></thead>
      <tbody><tr v-for="m in modes" :key="m.id"><td><b>{{ m.name }}</b></td><td>{{ m.description }}</td><td>{{ m.permadeath ? '是' : '否' }}</td><td>{{ m.skillUnlockCost ? '是' : '否' }}</td></tr></tbody>
    </table></div>
  </div>
</template>
