import type { Page } from "@playwright/test";

import { MAILPIT_URL } from "../utils/env";
import { ZEmail } from "../utils/misc";
import { test, expect } from "../utils/test";
import { randomUUID } from "crypto";

const signInForm = async (page: Page, email: string) => {
  await page.getByLabel(/email/i).fill(email);
  await page.getByRole("button", { name: /send link/i }).click();
};

test("signs in and out successfully", async ({ page, request, createUser }) => {
  const { email } = await createUser();

  await page.goto("/auth/sign-in");

  await expect(page).toHaveTitle(/sign in/i);

  await signInForm(page, email);

  const mailpitResponse = await request.get(
    new URL("/api/v1/message/latest", MAILPIT_URL).toString(),
  );

  const message = ZEmail.parse(await mailpitResponse.json());

  // HACK: depends on the message format
  await page.goto(message.Text.split("\n")[1]!);

  await expect(page).toHaveTitle(/transactions/i);

  await page.getByRole("button", { name: /profile/i }).click();
  await page.getByRole("menuitem", { name: /sign out/i }).click();
});

test("signs up via invite flow successfully", async ({
  page,
  request,
  signIn,
  serverTRPCClient,
  browser,
}) => {
  // TODO: Enable on CI
  test.skip(process.env["CI"] != null);

  await signIn();
  const { id } = await serverTRPCClient.sheet.createGroupSheet.mutate({
    name: "Test Sheet",
    currencyCode: "EUR",
  });

  await page.goto(`/groups/${id}`);

  const invitedUserEmail = `${randomUUID()}@example.com`;

  await page.getByRole("button", { name: /add participant/i }).click();
  await page.getByRole("textbox", { name: /name/i }).fill("Invited User");
  await page
    .getByRole("textbox", { name: /email address/i })
    .fill(invitedUserEmail);
  await page.getByRole("button", { name: /add/i }).click();
  await page.context().close();

  const mailpitResponse = await request.get(
    new URL("/api/v1/message/latest", MAILPIT_URL).toString(),
  );

  const message = ZEmail.parse(await mailpitResponse.json());

  expect(message.Text).toContain("You've been invited by");

  const otherPage = await (await browser.newContext()).newPage();
  // HACK: depends on the message format
  await otherPage.goto(message.Text.split(/[\n\r]+/)[2]!);
  await otherPage.waitForSelector("body[data-hydrated]");

  await otherPage.getByRole("link", { name: /sheets/i }).click();
  await expect(otherPage.getByText("Test Sheet")).toBeVisible();
});
