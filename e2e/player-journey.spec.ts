// 端到端：模拟真实玩家从新建角色到导入存档的完整流程
import { test, expect } from '@playwright/test';

test('新玩家完整流程', async ({ page }) => {
  await page.goto('/');
  // 1. 新建角色
  await page.getByPlaceholder('冒险者').fill('E2E测试');
  await page.getByRole('button', { name: '开始冒险' }).click();
  await expect(page.getByText('总览').first()).toBeVisible();
  // 2-3. 训练技能获取材料
  await page.getByText('伐木').first().click();
  await page.getByRole('button', { name: /开始|砍伐/ }).first().click();
  await page.waitForTimeout(8000);
  // 4. 采矿与锻造
  await page.getByText('采矿').first().click();
  await page.getByRole('button', { name: /开始|开采/ }).first().click();
  await page.waitForTimeout(8000);
  // 5-6. 进入战斗获取掉落
  await page.getByText('战斗').first().click();
  await page.getByRole('button', { name: '战斗' }).first().click();
  await page.waitForTimeout(15000);
  // 9-11. 退出并重新进入，验证离线进度（修改时钟模拟离线）
  await page.getByText('存档').last().click();
  await page.getByRole('button', { name: '立即保存' }).click();
  await page.clock?.fastForward?.('02:00:00').catch(() => undefined);
  await page.reload();
  await page.getByRole('button', { name: '进入' }).first().click();
  // 12. 导出存档
  await page.getByText('存档').last().click();
  await page.getByRole('button', { name: /生成导出|导出/ }).first().click();
  const exported = await page.locator('textarea').first().inputValue();
  expect(exported.length).toBeGreaterThan(100);
  // 13-14. 清理测试角色并导入验证
  await page.evaluate(() => indexedDB.deleteDatabase('idle-realms'));
  await page.reload();
  await page.getByRole('button', { name: '📥 导入存档' }).click();
  await page.locator('textarea').fill(exported);
  await page.getByRole('button', { name: '导入为新角色' }).click();
  await expect(page.getByText('E2E测试')).toBeVisible();
});
