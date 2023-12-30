import { expect, test } from '../utils/test';

test(`creates a personal sheet transaction successfully`, async ({
  page,
  serverTRPCClient,
  signIn,
}) => {
  await signIn();

  await serverTRPCClient.sheet.createPersonalSheet.mutate({
    name: 'Test Sheet',
    currencyCode: 'EUR',
  });

  await page.getByRole('link', { name: 'Sheets' }).click();
  await page.getByRole('link', { name: 'Test Sheet' }).click();

  await page.getByRole('link', { name: 'Add Transaction' }).click();

  await page.getByLabel(/amount/i).pressSequentially('10000');
  await page.getByLabel(/category/i).click();

  await page.getByPlaceholder(/search/i).fill('new category');
  await page.getByRole('option', { name: /create/i }).click();

  await page.getByLabel(/description/i).fill('test transaction');

  await page.getByRole('button', { name: /create/i }).click();

  await expect(page).toHaveTitle(/transactions/i);

  await expect(page.getByText('test transaction -€100.00')).toBeVisible();
});
