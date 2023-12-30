import { getUserData } from '../utils/misc';
import { test, expect } from '../utils/test';

test('signs up succesfully', async ({ page }) => {
  const { name, email, password } = getUserData();
  await page.goto('/auth/sign-up');

  await expect(page).toHaveTitle(/sign up/i);

  await page.getByLabel(/name/i).fill(name);
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign up/i }).click();

  await expect(page).toHaveTitle(/transactions/i);
});

test('signs in and out succesfully', async ({ page, signIn }) => {
  await signIn();

  await expect(page).toHaveTitle(/transactions/i);

  await page.getByRole('button', { name: 'Profile and Settings menu' }).click();
  await page.getByRole('menuitem', { name: 'Sign out' }).click();
});
