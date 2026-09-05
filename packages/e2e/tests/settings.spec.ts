import { expect, test } from "../utils/test";

test("redirects to the profile settings and navigates from the sidebar", async ({
  page,
  signIn,
}) => {
  await signIn();
  await page.goto("/settings");

  await expect(page).toHaveURL(/\/settings\/profile$/);
  await expect(page.getByLabel("Name")).toBeVisible();

  await page.getByRole("link", { name: "Appearance" }).click();

  await expect(page).toHaveURL(/\/settings\/appearance$/);
  await expect(page.getByText("Preferred Display Currency")).toBeVisible();
});

test("navigates settings from the mobile drawer", async ({ page, signIn }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn();
  await page.goto("/");

  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("link", { name: "Appearance" }).click();

  await expect(page).toHaveURL(/\/settings\/appearance$/);
  await expect(page.getByText("Preferred Display Currency")).toBeVisible();
});
