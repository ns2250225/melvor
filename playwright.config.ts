import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  use: { baseURL: 'http://localhost:4173' },
  webServer: { command: 'npm run build:fast && npm run preview -- --port 4173', port: 4173, reuseExistingServer: true, timeout: 180_000 },
});
