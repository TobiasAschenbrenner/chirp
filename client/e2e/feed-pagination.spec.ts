import { expect, test } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';

const apiUrl = 'http://127.0.0.1:3001/api';
const password = 'pagination-test-password';

async function createUser(request: APIRequestContext, name: string) {
  const email = `${name.toLowerCase().replaceAll(' ', '.')}.${Date.now()}@example.com`;
  const registration = await request.post(`${apiUrl}/users/register`, {
    data: { fullName: name, email, password, confirmPassword: password },
  });
  expect(registration.ok()).toBe(true);
  const login = await request.post(`${apiUrl}/users/login`, { data: { email, password } });
  expect(login.ok()).toBe(true);
  const { token, id } = await login.json();
  return { email, id, headers: { Authorization: `Bearer ${token}` } };
}

test('pages both feeds without gaps and can retry a failed next page', async ({ page, request }) => {
  const author = await createUser(request, 'Pagination Author');
  const reader = await createUser(request, 'Pagination Reader');
  const authorBodies = Array.from({ length: 21 }, (_, index) => `Pagination post ${index + 1}`);

  async function createPost(headers: { Authorization: string }, body: string) {
    const response = await request.post(`${apiUrl}/posts`, { headers, data: { body } });
    expect(response.ok()).toBe(true);
  }

  await Promise.all(authorBodies.map((body) => createPost(author.headers, body)));
  const readerBody = 'Reader post to delete between pages';
  await createPost(reader.headers, readerBody);
  const follow = await request.get(`${apiUrl}/users/${author.id}/follow-unfollow`, {
    headers: reader.headers,
  });
  expect(follow.ok()).toBe(true);

  const expectedFeed = await request.get(`${apiUrl}/posts?limit=50`, { headers: reader.headers });
  expect(expectedFeed.ok()).toBe(true);
  const expectedCount = (await expectedFeed.json()).length - 1;

  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill(reader.email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  const initialPage = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return url.pathname === '/api/posts' && url.searchParams.get('limit') === '20';
  });
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  const firstResponse = await initialPage;
  expect(await firstResponse.json()).toHaveLength(20);
  expect(firstResponse.headers()['x-next-cursor']).toBeTruthy();
  const posts = page.getByRole('article');
  await expect(posts).toHaveCount(20);

  await posts.filter({ hasText: readerBody }).getByRole('button', { name: 'Delete post' }).click();
  await expect(posts).toHaveCount(19);

  let failNextPage = true;
  await page.route('**/api/posts?*', async (route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.has('cursor') && failNextPage) {
      failNextPage = false;
      await route.fulfill({ status: 503, json: { message: 'Temporarily unavailable' } });
    } else {
      await route.continue();
    }
  });

  const loadMore = page.getByRole('button', { name: 'Load more', exact: true });
  await loadMore.click();
  await expect(page.getByRole('alert').locator('span')).toHaveText('Couldn’t load more posts.');
  await expect(posts).toHaveCount(19);
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(posts).toHaveCount(expectedCount);
  await expect(loadMore).toBeHidden();
  await expect(page.getByRole('alert')).toHaveCount(0);
  for (const body of authorBodies) {
    await expect(posts.getByText(body, { exact: true })).toHaveCount(1);
  }

  const newAuthorBody = 'New followed-author post';
  const newReaderBody = 'Reader post excluded from Following';
  await createPost(author.headers, newAuthorBody);
  await createPost(reader.headers, newReaderBody);
  await page.getByRole('button', { name: 'Following', exact: true }).click();
  await expect(posts).toHaveCount(20);
  await expect(posts.first()).toContainText(newAuthorBody);
  await expect(posts.getByText(newReaderBody, { exact: true })).toHaveCount(0);
  await loadMore.click();
  await expect(posts).toHaveCount(22);
  await expect(loadMore).toBeHidden();
  for (const body of [...authorBodies, newAuthorBody]) {
    await expect(posts.getByText(body, { exact: true })).toHaveCount(1);
  }
});
