import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/settings');

  await expect(page).toHaveTitle(/Settings/);
});
