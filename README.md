# Idle Realms · 放置王国

纯前端、无后端、可离线运行的放置 RPG 网页游戏。按 `prd.md` 实现，复刻 Melvor Idle（基线 v1.3.1 规则体系 + Throne of the Herald / Atlas of Discovery / Into the Abyss 三个扩展）的机制与内容结构。

> **素材声明：** 项目遵循合法素材原则，全部名称、数值、图标（emoji / 原创 SVG）、音效（WebAudio 实时合成）均为原创重制，不复制原作商业资产。本项目与 Melvor Idle 及其开发商无任何关联。

## 特性

- **完整玩法：** 28 项技能、完整战斗系统、生产制造体系、任务 / 成就 / 宠物图鉴，第一版即包含全部内容，无占位功能
- **离线挂机：** 关闭浏览器后按同一套规则逐 tick 结算离线收益（上限 24 小时），由 Web Worker 重放，报告可追溯
- **本地存档：** IndexedDB 持久化，`schemaVersion` + 迁移链 + 导入前自动备份，玩家对数据拥有完全控制权
- **PWA：** Service Worker 预缓存，首次访问后可断网启动、安装到桌面
- **零后端：** 无服务器 API、无账号系统，构建产物为纯静态文件，可部署在任意子路径
- **数据驱动：** 技能、物品、怪物、配方等通过 `src/content` 内容数据定义，可扩展而无需改动引擎

## 技术栈

Vue 3 + TypeScript + Vite + Pinia + IndexedDB + Web Worker + PWA（Vitest / Playwright 测试）。

## 快速开始

```bash
npm install
npm run dev              # 开发服务器
npm run build            # 类型检查 + 生产构建（输出 dist/，含 Service Worker 预缓存清单）
npm run preview          # 预览构建产物
npm run typecheck        # 仅类型检查
```

### 测试与校验

```bash
npm run test             # Vitest：规则 / 内容 / 存档 / 离线测试
npm run test:e2e         # Playwright 端到端测试（需先 npx playwright install）
npm run validate:content # 内容完整性校验，生成 content-report.json
```

## 部署

将 `dist/` 作为静态站点发布即可（构建使用相对路径 `base: './'`，可部署在任意子路径）。首次访问完成缓存后可断网启动，并可作为 PWA 安装。

## 架构

```
Vue 3 UI (src/pages, src/components)
   │  只调用命令（store.act），不直接修改核心状态
Pinia (src/stores/game.ts) —— 主循环 / 自动保存 / 离线结算 / 存档管理 / 标签页锁
   │
GameFacade (src/game/core/game.ts) —— 统一物品、货币、经验、掌握度、需求检查
   ├─ 动作引擎 src/game/production/actions.ts（全部技能的统一动作生命周期）
   ├─ 农业 / 城镇 / 制图 / 综合技能命令 src/game/production/*
   ├─ 战斗引擎 src/game/combat/*（50ms tick、特殊攻击、状态效果、屏障、副本、Slayer）
   ├─ 效果系统 src/game/effects/modifiers.ts（装备、药水、宠物、敏捷、占星、祈祷、技能树…）
   ├─ 任务 / 成就 src/game/quests, src/game/achievements（事件驱动）
   └─ 事件总线 / 随机数（xoshiro128**，状态随存档保存）src/game/core
内容数据 src/content（数据驱动，按扩展归属登记）
离线结算 src/game/offline + Web Worker src/workers/offline.worker.ts
持久化 src/game/persistence（IndexedDB：saves / backups / events / meta）
```

### 关键规则

- **时间推进**由唯一调度器完成：`Game.advance(ms)` 按 50ms tick 拆分，在线与离线共享同一套规则。
- **离线结算**：保存 `lastSettledAt`，重新进入时计算时间差（上限 24 小时），由 Worker 逐 tick 重放；时间倒退不发放收益，超长离线截断并在报告中标记。结算号 `settlementId` + IndexedDB 事务校验 + Web Locks 标签页锁，防止重复结算。
- **存档安全**：`schemaVersion` + 迁移链（`MIGRATIONS`）+ 结构 / 数值 / 物品 ID 校验；保存时保留上一份存档用于崩溃恢复；导入前自动备份，失败不覆盖；拒绝高于当前版本的存档。存档不承诺防篡改，玩家对本地数据拥有完全控制权。

## 内容范围

28 项技能（含制图、考古、腐化、收割）、数百件物品与装备、60+ 怪物、10 个战斗区域 + 7 个猎杀区域 + 深渊区域、21 个副本（含三套终局）、标准 / 远古 / 古代遗法 / 深渊法术与替代魔法、26 个祈祷、23 只召唤兽与协同、敏捷路线与立柱、13 个星座、城镇（建筑 / 人口 / 季节 / 信仰 / 任务）、六角格地图与博物馆、深渊等级与技能树、任务链、成就、宠物与图鉴。

具体计数见 `npm run validate:content` 生成的 `content-report.json`；版本锁定、规则公式与已知差异见 `compatibility-manifest.json`。

## 目录说明

- `prd.md` —— 产品需求文档（含完整目录见第 20/21 节）
- `src/content` —— 内容数据（技能 / 物品 / 怪物 / 副本 / 任务 / 成就 / 宠物…）
- `src/tests` —— 单元测试；`e2e/` —— 端到端测试
- `scripts/validate-content.ts` —— 内容校验工具
- `compatibility-manifest.json` —— 版本锁定与机制差异清单
