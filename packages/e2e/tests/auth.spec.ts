import type { Page } from "@playwright/test";

import { MAILPIT_URL } from "../utils/env";
import { ZEmail } from "../utils/misc";
import { test, expect } from "../utils/test";
import { randomUUID } from "crypto";

const signInForm = async (page: Page, email: string) => {
  await page.getByLabel(/email/i).fill(email);
  await page.getByRole("button", { name: /send code/i }).click();
};

test("signs in and out successfully", async ({ page, request, createUser }) => {
  // TODO: Enable on CI (mailpit issues)
  test.skip(process.env["CI"] != null);

  const { email } = await createUser();

  await page.goto("/auth/sign-in");

  await expect(page).toHaveTitle(/sign in/i);

  await signInForm(page, email);

  const mailpitResponse = await request.get(
    new URL("/api/v1/message/latest", MAILPIT_URL).toString(),
  );
  const message = ZEmail.parse(await mailpitResponse.json());
  // HACK: depends on the message format
  await page
    .getByLabel(/verification/i)
    .fill(message.Text.split(/[\n\r]+/)[0]!.split(" ")[3]!);
  await page.getByRole("button", { name: /verify/i }).click();

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
  // TODO: Enable on CI (mailpit issues)
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

  const inviteMailpitResponse = await request.get(
    new URL("/api/v1/message/latest", MAILPIT_URL).toString(),
  );

  const inviteMessage = ZEmail.parse(await inviteMailpitResponse.json());

  expect(inviteMessage.Text).toContain("You've been invited by");

  const otherPage = await (await browser.newContext()).newPage();
  // HACK: depends on the message format
  await otherPage.goto(inviteMessage.Text.split(/[\n\r]+/)[2]!);
  await otherPage.waitForSelector("body[data-hydrated]");

  await signInForm(otherPage, invitedUserEmail);

  const otpMailpitResponse = await request.get(
    new URL("/api/v1/message/latest", MAILPIT_URL).toString(),
  );
  const otpMessage = ZEmail.parse(await otpMailpitResponse.json());
  // HACK: depends on the message format
  await otherPage
    .getByLabel(/verification/i)
    .fill(otpMessage.Text.split(/[\n\r]+/)[0]!.split(" ")[3]!);
  await otherPage.getByRole("button", { name: /verify/i }).click();

  await otherPage.getByRole("link", { name: /sheets/i }).click();
  await expect(otherPage.getByText("Test Sheet")).toBeVisible();
});
