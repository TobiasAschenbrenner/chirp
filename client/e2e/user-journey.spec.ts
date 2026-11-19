import { expect, test } from '@playwright/test';

test('registers, edits posts with accessible controls, and keeps profile changes after navigation', async ({ page }) => {
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
  await expect(page).toHaveTitle('Feed | Chirp');
  const feedHeading = page.getByRole('heading', { level: 1, name: 'Feed', exact: true });
  await expect(feedHeading).toBeFocused();
  await expect(feedHeading).toHaveCSS('position', 'absolute');
  await expect(feedHeading).toHaveCSS('height', '1px');
  await expect(page.getByRole('navigation', { name: 'Main', exact: true })
    .getByRole('link', { name: 'Forest', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('button', { name: 'For you', exact: true }))
    .toHaveAttribute('aria-pressed', 'true');

  const search = page.getByRole('searchbox', { name: 'Search users', exact: true });
  await search.fill('E2E');
  const searchResult = page.getByRole('button', { name: user.fullName, exact: true });
  await searchResult.waitFor();
  await search.press('Tab');
  await page.keyboard.press('Tab');
  await expect(searchResult).toBeFocused();
  await searchResult.press('Escape');
  await expect(search).toBeFocused();
  await expect(searchResult).toBeHidden();
  await search.fill('');

  const imageChooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Add image', exact: true }).press('Enter');
  await (await imageChooser).setFiles([]);

  await page.getByLabel('Post text', { exact: true }).fill(postBody);
  await page.getByRole('button', { name: 'Post', exact: true }).click();

  await expect(page.getByText(postBody, { exact: true })).toBeVisible();

  const ownPost = page.getByRole('article').filter({ hasText: postBody });
  await ownPost.getByRole('button', { name: 'Like post', exact: true }).click();
  await expect(ownPost.getByRole('button', { name: 'Like post', exact: true }))
    .toHaveAttribute('aria-pressed', 'true');
  await expect(ownPost.getByRole('button', { name: 'Like post', exact: true }))
    .toHaveAccessibleDescription('1 like');
  await ownPost.getByRole('button', { name: 'Bookmark post', exact: true }).click();
  await expect(ownPost.getByRole('button', { name: 'Bookmark post', exact: true }))
    .toHaveAttribute('aria-pressed', 'true');

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
  await expect(page.getByRole('heading', { level: 1, name: 'Post', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Comments', exact: true }).click();
  await expect(page.getByLabel('Reply', { exact: true })).toBeFocused();
  await page.getByLabel('Reply', { exact: true }).fill('A thoughtful post.');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  const comments = page.getByRole('list', { name: 'Comments', exact: true });
  await expect(comments.getByRole('listitem')).toHaveCount(1);
  await expect(comments.getByRole('listitem')).toContainText('A thoughtful post.');
  const deleteComment = comments.getByRole('button', { name: 'Delete comment', exact: true });
  await deleteComment.focus();
  await expect(deleteComment).toHaveCSS('opacity', '1');
  await deleteComment.press('Enter');
  await expect(comments).toBeHidden();
  await page.getByRole('link', { name: 'Nest', exact: true }).click();
  await expect(page.getByRole('heading', { name: `${user.fullName}’s posts`, exact: true }))
    .toBeVisible();
  await page.getByRole('link', { name: 'Seeds', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Bookmarks', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Forest', exact: true }).click();
  await expect(page.getByText(updatedBody, { exact: true })).toBeVisible();

  await page.getByRole('link', { name: 'Nest', exact: true }).click();
  const editProfileButton = page.getByRole('button', { name: 'Edit profile', exact: true });
  await editProfileButton.focus();
  await editProfileButton.press('Enter');
  const profileDialog = page.getByRole('dialog', { name: 'Edit profile', exact: true });
  await expect(profileDialog.getByLabel('Full name', { exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(profileDialog).toBeHidden();
  await expect(editProfileButton).toBeFocused();
  await editProfileButton.press('Enter');
  const updatedName = 'E2E Test User Updated';
  const bio = 'A quiet place to share thoughts.';
  await profileDialog.getByLabel('Full name', { exact: true }).fill(updatedName);
  await profileDialog.getByLabel('Bio', { exact: true }).fill(bio);
  await profileDialog.getByRole('button', { name: 'Update', exact: true }).click();
  await expect(profileDialog).toBeHidden();

  await page.getByRole('link', { name: 'Forest', exact: true }).click();
  await page.getByRole('link', { name: 'Nest', exact: true }).click();
  await expect(page.getByRole('heading', { name: `${updatedName}’s posts`, exact: true }))
    .toBeVisible();
  await expect(page.getByText(bio, { exact: true })).toBeVisible();
});

test('keeps a failed post and its image until a retry succeeds', async ({ page, request }) => {
  const user = {
    fullName: 'Draft Test User',
    email: `draft.${Date.now()}@example.com`,
    password: 'draft-test-password',
    confirmPassword: 'draft-test-password',
  };
  const registration = await request.post('http://127.0.0.1:3001/api/users/register', {
    data: user,
  });
  expect(registration.ok()).toBe(true);
  const registeredUser = await registration.json();

  let failInitialFeed = true;
  await page.route('**/api/posts?*', async (route) => {
    if (failInitialFeed) {
      failInitialFeed = false;
      await route.abort('internetdisconnected');
    } else {
      await route.continue();
    }
  });
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill(user.password);
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Can’t reach Chirp.');
  await expect(page.getByText('No posts found', { exact: true })).toBeHidden();
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);

  const composer = page.locator('app-create-post');
  const body = composer.getByLabel('Post text', { exact: true });
  const fileInput = composer.getByLabel('Choose a post image', { exact: true });
  const draft = 'Draft kept through a failed post and retry';
  const image = {
    name: 'forest-walk.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aGL8AAAAASUVORK5CYII=',
      'base64',
    ),
  };
  await body.fill(draft);
  await fileInput.setInputFiles(image);
  await expect(composer.getByText(image.name, { exact: true })).toBeVisible();

  const submittedBodies: Buffer[] = [];
  let finishPublishing!: () => void;
  const publishingResponse = new Promise<void>((resolve) => { finishPublishing = resolve; });
  await page.route('**/api/posts', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    submittedBodies.push(route.request().postDataBuffer()!);
    if (submittedBodies.length === 1) {
      await route.fulfill({ status: 503, json: { message: 'Internal database failure' } });
    } else if (submittedBodies.length === 2) {
      await route.abort('internetdisconnected');
    } else {
      await publishingResponse;
      await route.fulfill({ status: 201, json: {
        _id: '507f191e810c19729de860ee',
        creator: { _id: registeredUser._id, fullName: user.fullName },
        body: draft, image: '', likes: [], comments: [], createdAt: new Date().toISOString(),
      } });
    }
  });

  for (let attempt = 0; attempt < 2; attempt++) {
    await composer.getByRole('button', { name: 'Post', exact: true }).click();
    await expect(composer.getByRole('alert').locator('span')).toHaveText('Couldn’t publish post.');
    await expect(body).toHaveValue(draft);
    await expect(composer.getByText(image.name, { exact: true })).toBeVisible();
    expect(await fileInput.evaluate((input: HTMLInputElement) => input.files?.[0]?.name))
      .toBe(image.name);
    await expect(composer.getByRole('button', { name: 'Post', exact: true })).toBeEnabled();
    expect(submittedBodies).toHaveLength(attempt + 1);
  }

  await page.setViewportSize({ width: 320, height: 780 });
  expect(await composer.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await composer.getByRole('button', { name: 'Post', exact: true }).click();
  await expect(composer.getByRole('button', { name: 'Posting…', exact: true })).toBeDisabled();
  await expect(body).toHaveValue(draft);
  await expect(body).toHaveJSProperty('readOnly', true);
  await expect(fileInput).toBeDisabled();
  await expect(composer.getByText(image.name, { exact: true })).toBeVisible();

  finishPublishing();
  await expect(page.getByRole('article').getByText(draft, { exact: true })).toBeVisible();
  await expect(body).toHaveValue('');
  await expect(body).toHaveJSProperty('readOnly', false);
  expect(await fileInput.evaluate((input: HTMLInputElement) => input.files?.length)).toBe(0);
  await expect(composer.getByText(image.name, { exact: true })).toBeHidden();
  await expect(composer.getByRole('alert')).toHaveCount(0);
  expect(submittedBodies).toHaveLength(3);
  for (const submitted of submittedBodies) {
    expect(submitted.includes(draft)).toBe(true);
    expect(submitted.includes(image.name)).toBe(true);
    expect(submitted.includes(image.buffer)).toBe(true);
  }
});
