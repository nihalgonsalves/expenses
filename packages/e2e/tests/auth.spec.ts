import type { Page } from "@playwright/test";

import { MAILPIT_URL } from "../utils/env";
import { ZEmail, getUserData } from "../utils/misc";
import { test, expect } from "../utils/test";
import { randomUUID } from "crypto";

test("signs up successfully", async ({ page }) => {
  const { name, email, password } = getUserData();
  await page.goto("/auth/sign-up");

  await expect(page).toHaveTitle(/sign up/i);

  await page.getByLabel(/name/i).fill(name);
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /create an account/i }).click();

  await expect(page).toHaveTitle(/transactions/i);
});

const signInForm = async (page: Page, email: string, password: string) => {
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /login/i }).click();
};

test("signs in and out successfully", async ({ page, createUser }) => {
  const { email, password } = await createUser();

  await page.goto("/auth/sign-in");

  await expect(page).toHaveTitle(/sign in/i);

  await signInForm(page, email, password);

  await expect(page).toHaveTitle(/transactions/i);

  await page.getByRole("button", { name: /account/i }).click();
  await page.getByRole("menuitem", { name: /sign out/i }).click();
});

test("resets password successfully", async ({ page, request, createUser }) => {
  // TODO: Enable on CI
  test.skip(process.env["CI"] != null);

  const { email } = await createUser();

  await page.goto("/auth/sign-in");

  await page.getByRole("link", { name: /forgot your password/i }).click();
  await expect(page.getByText(/to reset/)).toBeVisible();
  await page.getByLabel(/email/i).fill(email);

  await page.getByRole("button", { name: /send reset/i }).click();

  await expect(page.getByText("check your email")).toBeVisible();

  const mailpitResponse = await request.get(
    new URL("/api/v1/message/latest", MAILPIT_URL).toString(),
  );

  const message = ZEmail.parse(await mailpitResponse.json());

  // HACK: depends on the message format
  await page.goto(message.Text.split("\n")[1]!);

  await page.getByLabel(/password/i).fill("new-password");
  await page.getByRole("button", { name: /save new password/i }).click();

  await signInForm(page, email, "new-password");

  await expect(page).toHaveTitle(/transactions/i);
});

test("verifies email successfully", async ({ page, request, signIn }) => {
  // TODO: Enable on CI
  test.skip(process.env["CI"] != null);

  await signIn();

  await page.goto("/settings");
  await page.getByRole("button", { name: "Not verified. Resend" }).click();

  await expect(page.getByText("check your email")).toBeVisible();

  const mailpitResponse = await request.get(
    new URL("/api/v1/message/latest", MAILPIT_URL).toString(),
  );

  const message = ZEmail.parse(await mailpitResponse.json());

  // HACK: depends on the message format
  await page.goto(message.Text.split("\n")[1]!);

  await page.getByRole("link", { name: /settings/i }).click();

  await expect(page.getByText("Verified")).toBeVisible();
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

  await otherPage.getByLabel(/password/i).fill("new-password");
  await otherPage.getByRole("button", { name: /save new password/i }).click();

  await signInForm(otherPage, invitedUserEmail, "new-password");

  await otherPage.getByRole("button", { name: /account/i }).click();
});
