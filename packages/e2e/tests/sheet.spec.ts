import { expect, test } from "../utils/test";

["personal", "group"].forEach((type) => {
  test(`creates a ${type} sheet successfully`, async ({ page, signIn }) => {
    await signIn();
    await page.goto("/");

    await page.getByRole("link", { name: "Sheets" }).click();

    await page.getByRole("button", { name: `New ${type} sheet` }).click();

    await page.getByLabel(/sheet name/i).fill("Test Sheet");
    await page.getByRole("button", { name: /create/i }).click();

    await expect(page).toHaveTitle(/test sheet/i);
    await expect(page.getByText("Test Sheet")).toBeVisible();
  });
});
