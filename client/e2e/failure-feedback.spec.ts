import { expect, test } from '@playwright/test';

const user = {
  _id: '507f191e810c19729de86001', fullName: 'Reliability Test User',
  profilePhoto: '/favicon.ico', followers: [], following: [],
};
const otherUser = { ...user, _id: '507f191e810c19729de86002', fullName: 'Another User' };
const post = {
  _id: '507f191e810c19729de86003', body: 'A post for checking failed actions',
  creator: user, likes: [], comments: [], createdAt: new Date().toISOString(),
};

test.beforeEach(async ({ page }) => {
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    let body: unknown;
    if (path === '/api/users/login') body = { id: user._id, token: 'test-session-token' };
    else if (path === '/api/users/bookmarks') body = { bookmarks: [] };
    else if (path === `/api/users/${user._id}`) body = user;
    else if (path === `/api/users/${otherUser._id}`) body = otherUser;
    else if (path.endsWith('/posts') && path.startsWith('/api/users/')) body = { posts: [post] };
    else if (path === '/api/users/search') body = { users: [], total: 0, page: 1, limit: 8 };
    else if (path === '/api/posts') body = [post];
    else if (path === `/api/posts/${post._id}`) {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({ status: 204 });
        return;
      }
      body = route.request().method() === 'PATCH'
        ? { ...post, body: route.request().postDataJSON().body } : post;
    } else {
      await route.fulfill({ status: 404, json: { message: 'Unexpected test request' } });
      return;
    }
    await route.fulfill({ json: body });
  });

  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill('reliability@example.com');
  await page.getByLabel('Password', { exact: true }).fill('reliability-test-password');
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await expect(page.getByRole('article').getByText(post.body, { exact: true })).toBeVisible();
});

test('keeps failed likes, bookmarks, and deletions unchanged until a retry succeeds', async ({ page }) => {
  const article = page.getByRole('article');
  for (const action of [
    { name: 'Like post', suffix: '/like', error: 'Couldn’t update like.', response: { ...post, likes: [user._id] } },
    { name: 'Bookmark post', suffix: '/bookmarks', error: 'Couldn’t update bookmark.', response: { bookmarks: [post._id] } },
  ]) {
    let fail = true;
    await page.route(`**/api/posts/${post._id}${action.suffix}`, async (route) => {
      if (fail) { fail = false; await route.abort('internetdisconnected'); }
      else await route.fulfill({ json: action.response });
    });
    const button = article.getByRole('button', { name: action.name, exact: true });
    await button.click();
    await expect(article.getByRole('alert')).toHaveText(action.error);
    await expect(button).toHaveAttribute('aria-pressed', 'false');
    await expect(button).toBeEnabled();
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(article.getByRole('alert')).toHaveCount(0);
  }

  let failDelete = true;
  await page.route(`**/api/posts/${post._id}`, async (route) => {
    if (failDelete) { failDelete = false; await route.fulfill({ status: 503, json: {} }); }
    else await route.fulfill({ status: 204 });
  });
  await article.getByRole('button', { name: 'Delete post', exact: true }).click();
  await expect(article.getByRole('alert')).toHaveText('Couldn’t delete post.');
  await expect(article.getByText(post.body, { exact: true })).toBeVisible();
  await article.getByRole('button', { name: 'Delete post', exact: true }).click();
  await expect(article).toHaveCount(0);
});

test('retries a failed mobile search without changing its query', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 780 });
  let fail = true;
  await page.route('**/api/users/search?*', async (route) => {
    if (fail) { fail = false; await route.abort('internetdisconnected'); }
    else await route.fallback();
  });
  await page.getByRole('button', { name: 'Open search', exact: true }).click();
  const search = page.getByRole('searchbox', { name: 'Search users', exact: true });
  await search.fill('Nobody');
  await expect(page.getByRole('alert').locator('span')).toHaveText('Couldn’t search.');
  await expect(page.getByText('No users found', { exact: true })).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(search).toHaveValue('Nobody');
  await expect(search).toBeFocused();
  await expect(page.getByText('No users found', { exact: true })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('retries failed page loads and updates edits and deletions on Bookmarks', async ({ page }) => {
  let failBookmarks = true;
  await page.route('**/api/users/bookmarks', async (route) => {
    if (failBookmarks) { failBookmarks = false; await route.abort('internetdisconnected'); }
    else await route.fulfill({ json: { bookmarks: [post] } });
  });
  await page.getByRole('link', { name: 'Seeds', exact: true }).click();
  await expect(page.getByRole('alert').locator('span')).toHaveText('Couldn’t load bookmarks.');
  await expect(page.getByText('No posts bookmarked', { exact: true })).toBeHidden();
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.getByRole('article').getByText(post.body, { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Bookmark post', exact: true }))
    .toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: 'Edit post', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Edit post', exact: true });
  await dialog.getByRole('textbox', { name: 'Post text', exact: true }).fill('Updated bookmarked post');
  await dialog.getByRole('button', { name: 'Update Post', exact: true }).click();
  await expect(page.getByRole('article').getByText('Updated bookmarked post', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Delete post', exact: true }).click();
  await expect(page.getByText('No posts bookmarked', { exact: true })).toBeVisible();

  let failPosts = true;
  await page.route(`**/api/users/${user._id}/posts`, async (route) => {
    if (failPosts) { failPosts = false; await route.abort('internetdisconnected'); }
    else await route.fallback();
  });
  await page.getByRole('link', { name: 'Nest', exact: true }).click();
  await expect(page.getByRole('alert').locator('span')).toHaveText('Couldn’t load posts.');
  await expect(page.getByText('No posts by this user', { exact: true })).toBeHidden();
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.getByRole('article').getByText(post.body, { exact: true })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('keeps the selected avatar after failure and clears it only after a successful retry', async ({ page, browserName }) => {
  await page.getByRole('link', { name: 'Nest', exact: true }).click();
  const fileInput = page.getByLabel('Choose a profile image', { exact: true });
  const image = {
    name: 'avatar.png', mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aGL8AAAAASUVORK5CYII=', 'base64'),
  };
  await fileInput.setInputFiles(image);
  const uploads: Buffer[] = [];
  let finishUpload!: () => void;
  const uploadResponse = new Promise<void>((resolve) => { finishUpload = resolve; });
  await page.route('**/api/users/avatar', async (route) => {
    uploads.push(route.request().postDataBuffer()!);
    if (uploads.length === 1) await route.fulfill({ status: 503, json: {} });
    else {
      await uploadResponse;
      await route.fulfill({ json: { ...user, profilePhoto: '/favicon.ico?updated' } });
    }
  });
  const save = page.getByRole('button', { name: 'Save avatar', exact: true });
  await save.click();
  await expect(page.getByRole('alert')).toHaveText('Couldn’t update photo.');
  await expect(save).toBeEnabled();
  expect(await fileInput.evaluate((input: HTMLInputElement) => input.files?.[0]?.name)).toBe(image.name);
  const selectedBytes = await fileInput.evaluate(async (input: HTMLInputElement) =>
    Array.from(new Uint8Array(await input.files![0].arrayBuffer())));
  expect(Buffer.from(selectedBytes)).toEqual(image.buffer);
  await save.click();
  await expect(save).toBeDisabled();
  await expect(fileInput).toBeDisabled();
  finishUpload();
  await expect(save).toBeHidden();
  await expect(page.getByRole('button', { name: 'Change avatar', exact: true })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(await fileInput.evaluate((input: HTMLInputElement) => input.files?.length)).toBe(0);
  expect(uploads).toHaveLength(2);
  expect(uploads.every((body) => body.includes(image.name))).toBe(true);
  // WebKit omits file bytes from intercepted bodies: microsoft/playwright#14624.
  if (browserName !== 'webkit') {
    expect(uploads.every((body) => body.includes(image.buffer))).toBe(true);
  }
});

test('keeps follow state unchanged after failure and allows another attempt', async ({ page }) => {
  let fail = true;
  await page.route(`**/api/users/${otherUser._id}/follow-unfollow`, async (route) => {
    if (fail) { fail = false; await route.abort('internetdisconnected'); }
    else await route.fulfill({ json: { ...otherUser, followers: [user._id] } });
  });
  await page.goto(`/users/${otherUser._id}`);
  await page.getByRole('button', { name: 'Follow', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Couldn’t update follow.');
  await expect(page.getByRole('button', { name: 'Follow', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Follow', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Unfollow', exact: true })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});
