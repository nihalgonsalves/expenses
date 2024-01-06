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

  await page.getByRole('button', { name: 'Add Transaction' }).click();

  // create

  await expect(
    page.getByRole('heading', { name: 'Add Transaction' }),
  ).toBeVisible();

  await page.getByLabel(/amount/i).pressSequentially('10000');
  await page.getByLabel(/category/i).click();

  await page.getByPlaceholder(/search/i).fill('new category');
  await page.getByRole('option', { name: /create/i }).click();

  await page.getByLabel(/description/i).fill('test transaction');

  await page.getByRole('button', { name: /add/i }).click();

  // list on sheet page

  const listItem = page
    .getByRole('listitem')
    .filter({ hasText: 'test transaction -€100.00' })
    .first();

  await expect(listItem).toBeVisible();

  // list on transactions page

  await page.getByRole('link', { name: /all transactions/i }).click();

  await listItem.getByLabel(/show more/i).click();
  await listItem.getByRole('button', { name: /edit/i }).click();

  // edit

  await page.getByLabel(/amount/i).clear();
  await page.getByLabel(/amount/i).pressSequentially('20000');
  await page.getByRole('button', { name: /update/i }).click();

  await expect(page).toHaveTitle(/transactions/i);

  // list again

  const updatedListItem = page
    .getByRole('listitem')
    .filter({ hasText: 'test transaction -€200.00' })
    .first();

  await expect(updatedListItem).toBeVisible();
});

test(`creates a shared sheet transaction successfully`, async ({
  page,
  serverTRPCClient,
  signIn,
}) => {
  await signIn();

  await serverTRPCClient.sheet.createGroupSheet.mutate({
    name: 'Test Sheet',
    currencyCode: 'EUR',
    additionalParticipantEmailAddresses: [],
  });

  await page.getByRole('link', { name: 'Sheets' }).click();
  await page.getByRole('link', { name: 'Test Sheet' }).click();

  await page.getByRole('button', { name: 'Add Transaction' }).click();

  // create

  await expect(
    page.getByRole('heading', { name: 'Add Transaction' }),
  ).toBeVisible();

  await page.getByLabel(/how much/i).pressSequentially('10000');
  await page.getByLabel(/category/i).click();

  await page.getByPlaceholder(/search/i).fill('new category');
  await page.getByRole('option', { name: /create/i }).click();

  await page.getByLabel(/description/i).fill('test transaction');

  await page.getByRole('button', { name: /add/i }).click();

  // list

  const listItem = page
    .getByRole('listitem')
    // .filter({ hasText: /test transaction/ })
    .first();

  await expect(listItem).toBeVisible();
});
