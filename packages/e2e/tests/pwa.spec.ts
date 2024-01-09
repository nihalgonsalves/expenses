import { test, expect } from "../utils/test";

test("web manifest loads", async ({ page, request }) => {
  await page.goto("/");

  const manifestHref = await page
    .locator("link[rel=manifest]")
    .getAttribute("href");

  expect(manifestHref).toBe("/api/manifest.webmanifest");

  const manifest = await request.get(manifestHref!);

  expect(manifest.status()).toBe(200);
  expect(manifest.headers()).toMatchObject({
    "content-type": "application/manifest+json",
  });
});
