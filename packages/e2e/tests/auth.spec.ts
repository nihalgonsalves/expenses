import type { Page } from "@playwright/test";

import { MAILPIT_URL } from "../utils/env";
import { ZEmail, getUserData } from "../utils/misc";
import { test, expect } from "../utils/test";

test("signs up succesfully", async ({ page }) => {
  const { name, email, password } = getUserData();
  await page.goto("/auth/sign-up");

  await expect(page).toHaveTitle(/sign up/i);

  await page.getByLabel(/name/i).fill(name);
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /sign up/i }).click();

  await expect(page).toHaveTitle(/transactions/i);
});

const signInForm = async (page: Page, email: string, password: string) => {
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
};

test("signs in and out succesfully", async ({ page, createUser }) => {
  const { email, password } = await createUser();

  await page.goto("/auth/sign-in");

  await expect(page).toHaveTitle(/sign in/i);

  await signInForm(page, email, password);

  await expect(page).toHaveTitle(/transactions/i);

  await page.getByRole("button", { name: "Profile and Settings menu" }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
});

test("resets password successfully", async ({ page, request, createUser }) => {
  // TODO: Enable on CI
  test.skip(process.env.CI != null);

  const { email } = await createUser();

  await page.goto("/auth/sign-in");
  await page.getByLabel(/email/i).fill(email);

  await page.getByRole("button", { name: /forgot password/i }).click();

  await expect(
    page.getByRole("status").filter({ hasText: "you will receive" }),
  ).toBeVisible();

  const mailpitResponse = await request.get(
    new URL("/api/v1/message/latest", MAILPIT_URL).toString(),
  );

  const message = ZEmail.parse(await mailpitResponse.json());

  // HACK: depends on the message format
  await page.goto(message.Text.split("\n")[1]);

  await page.getByLabel(/password/i).fill("new-password");
  await page.getByRole("button", { name: /reset password/i }).click();

  await signInForm(page, email, "new-password");

  await expect(page).toHaveTitle(/transactions/i);
});

test("verifies email successfully", async ({ page, request, signIn }) => {
  // TODO: Enable on CI
  test.skip(process.env.CI != null);

  await signIn();

  await page.goto("/settings");
  await page.getByRole("button", { name: "Not verified. Resend" }).click();

  await expect(
    page.getByRole("status").filter({ hasText: "check your email" }),
  ).toBeVisible();

  const mailpitResponse = await request.get(
    new URL("/api/v1/message/latest", MAILPIT_URL).toString(),
  );

  const message = ZEmail.parse(await mailpitResponse.json());

  // HACK: depends on the message format
  await page.goto(message.Text.split("\n")[1]);

  await page.getByRole("button", { name: /confirm/i }).click();

  await expect(page.getByText("Verified")).toBeVisible();
});
