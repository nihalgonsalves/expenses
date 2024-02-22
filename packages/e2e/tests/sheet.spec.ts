import { expect, takeSnapshot, test } from "../utils/test";

["personal", "group"].forEach((type) => {
  test(`creates a ${type} sheet successfully`, async ({
    page,
    signIn,
  }, testInfo) => {
    await signIn();
    await page.goto("/");

    await page.getByRole("link", { name: "Sheets" }).click();

    await page.getByRole("button", { name: `New ${type} sheet` }).click();

    await page.getByLabel(/sheet name/i).fill("Test Sheet");
    await takeSnapshot(page, testInfo);

    await page.getByRole("button", { name: /create/i }).click();

    await expect(page).toHaveTitle(/test sheet/i);
    await expect(page.getByText("Test Sheet")).toBeVisible();
    await takeSnapshot(page, testInfo);
  });

  test(`updates a ${type} sheet  successfully`, async ({
    page,
    signIn,
    serverTRPCClient,
  }) => {
    await signIn();
    await page.goto("/");

    switch (type) {
      case "personal":
        await serverTRPCClient.sheet.createPersonalSheet.mutate({
          name: "Test Sheet",
          currencyCode: "EUR",
        });

        break;
      case "group":
        await serverTRPCClient.sheet.createGroupSheet.mutate({
          name: "Test Sheet",
          currencyCode: "EUR",
          additionalParticipantEmailAddresses: [],
        });

        break;

      default:
        break;
    }

    await page.getByRole("link", { name: "Sheets" }).click();
    await page.getByRole("link", { name: "Test Sheet" }).click();

    await page.getByLabel("Name").fill("Updated Test Sheet");
    await page.getByRole("button", { name: /save/i }).click();

    await expect(page.getByText("Updated Test Sheet")).toBeVisible();
  });
});
