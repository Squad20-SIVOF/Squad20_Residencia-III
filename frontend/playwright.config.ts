import { defineConfig, devices } from '@playwright/test'

const GESTOR_PORT = 4173
const MOTORISTA_PORT = 4174

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'html',
  use: { trace: 'on-first-retry' },
  projects: [
    {
      name: 'gestor-desktop',
      testMatch: /gestor\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${GESTOR_PORT}` },
    },
    {
      name: 'gestor-mobile',
      testMatch: /gestor\.spec\.ts/,
      use: { ...devices['Pixel 7'], baseURL: `http://localhost:${GESTOR_PORT}` },
    },
    {
      name: 'motorista',
      testMatch: /motorista\.spec\.ts/,
      use: { ...devices['Pixel 7'], baseURL: `http://localhost:${MOTORISTA_PORT}` },
    },
  ],
  // Sobe o build de produção dos dois apps, cada um na sua porta.
  webServer: [
    {
      env: { VITE_API_URL: '/api' },
      command: `npm run build:gestor && npm run preview:gestor -- --port ${GESTOR_PORT}`,
      url: `http://localhost:${GESTOR_PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      env: { VITE_API_URL: '/api' },
      command: `npm run build:motorista && npm run preview:motorista -- --port ${MOTORISTA_PORT}`,
      url: `http://localhost:${MOTORISTA_PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
})
