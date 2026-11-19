import { expect, test } from '@playwright/test';

test('registers, logs in, and creates and edits a post with accessible controls', async ({ page }) => {
  const user = {
    fullName: 'E2E Test User',
    email: 'e2e.user@example.com',
    password: 'e2e-test-password',
  };

  const postBody = 'Post created by the full-stack E2E test';

  await page.goto('/register');

  await page.getByLabel('Full name', { exact: true }).fill(user.fullName);
  await page.getByLabel('Email', { exact: true }).fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill(user.password);
  await page.getByLabel('Confirm password', { exact: true }).fill(user.password);
  await page.getByRole('button', { name: 'Register' }).click();

  await expect(page).toHaveURL(/\/login$/);

  await page.getByLabel('Email', { exact: true }).fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill(user.password);
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page).toHaveURL(/\/home$/);

  const imageChooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Add image', exact: true }).press('Enter');
  await (await imageChooser).setFiles([]);

  await page.getByLabel('Post text', { exact: true }).fill(postBody);
  await page.getByRole('button', { name: 'Post', exact: true }).click();

  await expect(page.getByText(postBody, { exact: true })).toBeVisible();

  await page.reload();

  await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByText(postBody, { exact: true })).toBeVisible();

  const editButton = page.getByRole('button', { name: 'Edit post', exact: true });
  await editButton.focus();
  await editButton.press('Enter');

  const dialog = page.getByRole('dialog', { name: 'Edit post', exact: true });
  const editor = dialog.getByRole('textbox', { name: 'Post text', exact: true });
  await expect(editor).toBeFocused();
  await expect(editor).toHaveValue(postBody);
  await expect(dialog.getByRole('button', { name: /close/i })).toHaveCount(0);

  const initialHeight = await editor.evaluate((element) => element.clientHeight);
  await editor.fill(Array.from({ length: 25 }, (_, index) => `Line ${index + 1}`).join('\n'));
  await expect(editor).toHaveCSS('resize', 'none');
  await expect(editor).toHaveCSS('scrollbar-width', 'none');
  expect(await editor.evaluate((element) => element.clientHeight)).toBe(initialHeight);
  expect(await editor.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
  await editor.press('ArrowDown');
  await expect.poll(() => editor.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);

  await editor.press('Shift+Tab');
  await expect(dialog.getByRole('button', { name: 'Update Post', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(editor).toBeFocused();
  await editor.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(editButton).toBeFocused();

  await editButton.press('Enter');
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(editButton).toBeFocused();

  await editButton.press('Enter');
  const updatedBody = 'Post updated through the accessible edit dialog';
  await editor.fill(updatedBody);
  await dialog.getByRole('button', { name: 'Update Post', exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText(updatedBody, { exact: true })).toBeVisible();

  await page.getByRole('article').filter({ hasText: updatedBody })
    .getByRole('link', { name: 'Comments', exact: true }).click();
  await expect(page.getByLabel('Reply', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Nest', exact: true }).click();
  await expect(page.getByRole('heading', { name: `${user.fullName}’s posts`, exact: true }))
    .toBeVisible();
  await page.getByRole('link', { name: 'Seeds', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Bookmarks', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Forest', exact: true }).click();
  await expect(page.getByText(updatedBody, { exact: true })).toBeVisible();
});
