import { expect, test } from "../utils/test";

test(`creates and edits a personal sheet transaction successfully`, async ({
  page,
  serverTRPCClient,
  signIn,
}) => {
  await signIn();
  await page.goto("/");

  await serverTRPCClient.sheet.createPersonalSheet.mutate({
    name: "Test Sheet",
    currencyCode: "EUR",
  });

  await page.getByRole("button", { name: "Add Transaction" }).first().click();
  await page.getByRole("button", { name: "Test Sheet" }).click();

  // create

  await expect(
    page.getByRole("heading", { name: "Add Transaction" }),
  ).toBeVisible();

  await expect(page.getByLabel(/amount/i)).toBeFocused();
  await page.getByLabel(/amount/i).pressSequentially("10000");
  await page.getByLabel(/category/i).click();

  await page.getByPlaceholder(/search/i).fill("new category");
  await page.getByRole("option", { name: /create/i }).click();

  await page.getByLabel(/description/i).fill("test transaction");

  await page.getByRole("button", { name: /add/i }).click();

  // list on sheet page

  const row = page
    .getByRole("button", { name: /test transaction/ })
    .filter({ hasText: "-€100.00" });
  await expect(row).toBeVisible();

  // edit

  await row.getByRole("button", { name: /open menu/i, exact: true }).click();
  await page.getByRole("menuitem", { name: "Edit" }).click();

  await page.getByLabel(/amount/i).clear();
  await page.getByLabel(/amount/i).pressSequentially("20000");
  await page.getByRole("button", { name: /update/i }).click();

  // list again

  const updatedListItem = page
    .getByRole("button")
    .filter({ hasText: "-€200.00" })
    .first();

  await expect(updatedListItem).toBeVisible();
});

test(`creates a shared sheet transaction successfully`, async ({
  page,
  serverTRPCClient,
  signIn,
}) => {
  await signIn();
  await page.goto("/");

  await serverTRPCClient.sheet.createGroupSheet.mutate({
    name: "Test Sheet",
    currencyCode: "EUR",
    additionalParticipantEmailAddresses: [],
  });

  await page.getByRole("button", { name: "Add Transaction" }).first().click();
  await page.getByRole("button", { name: "Test Sheet" }).click();

  // create

  await expect(
    page.getByRole("heading", { name: "Add Transaction" }),
  ).toBeVisible();

  await expect(page.getByLabel(/how much/i)).toBeFocused();
  await page.getByLabel(/how much/i).pressSequentially("10000");
  await page.getByLabel(/category/i).click();

  await page.getByPlaceholder(/search/i).fill("new category");
  await page.getByRole("option", { name: /create/i }).click();

  await page.getByLabel(/description/i).fill("test transaction");

  await page.getByRole("button", { name: /add/i }).click();

  // list

  const row = page
    .getByRole("button", { name: /test transaction/ })
    .filter({ hasText: "-€100.00" });

  await expect(row).toBeVisible();
});
