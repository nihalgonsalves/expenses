import { expect, test } from '../utils/test';

['personal', 'shared'].forEach((type) => {
  test(`creates a ${type} sheet successfully`, async ({ page, signIn }) => {
    await signIn();

    await page.getByRole('link', { name: 'Sheets' }).click();
    await expect(page.getByText('No sheets')).toBeVisible();

    await page.getByRole('button', { name: 'New Sheet' }).click();

    await page.getByRole('tab', { name: new RegExp(type, 'i') }).click();

    await page.getByLabel(/sheet name/i).fill('Test Sheet');
    await page.getByRole('button', { name: /create/i }).click();

    await expect(page).toHaveTitle(/test sheet/i);
    await expect(page.getByText('Test Sheet')).toBeVisible();
  });
});
