import { test, expect } from '@playwright/test';

test('abre o monitoramento de viagens', async ({ page }) => {
  await page.goto('/viagens');
  await expect(page.getByRole('heading', { name: 'Monitoramento de Viagens' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Rota #101/ })).toBeVisible();
});
