import { expect, test } from '@playwright/test';

test('redirects an unauthenticated user from home to login', async ({ page }) => {
  await page.goto('/home');

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  await expect(page).toHaveTitle('Sign in | Chirp');
  await expect(page.getByRole('heading', { level: 1, name: 'Sign in' })).toBeFocused();
});

test('supports keyboard navigation between public pages and skipping to content', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('link', { name: 'Sign up', exact: true }).click();
  await expect(page).toHaveTitle('Sign up | Chirp');
  const heading = page.getByRole('heading', { level: 1, name: 'Sign up', exact: true });
  await expect(heading).toBeFocused();

  await heading.press('Shift+Tab');
  const skipLink = page.getByRole('link', { name: 'Skip to content', exact: true });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeInViewport();
  await skipLink.press('Enter');
  await expect(heading).toBeFocused();
  await expect(page).toHaveURL(/\/register$/);
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Full name', { exact: true })).toBeFocused();
});
