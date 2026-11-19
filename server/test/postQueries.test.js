const { test } = require("node:test");
const assert = require("node:assert/strict");

const PostModel = require("../models/postModel");
const UserModel = require("../models/userModel");
const { getPosts, getFollowingPosts } = require("../controllers/postControllers");
const { createPostCursor } = require("../utils/postPagination");

const makePost = (number) => ({
  _id: number.toString(16).padStart(24, "0"),
  body: `Post ${number}`,
  createdAt: new Date("2026-11-19T12:00:00.000Z"),
  creator: { _id: "507f191e810c19729de860ea", fullName: "Feed Author" },
});

const mockFeed = (t, posts) => {
  const query = {
    sort: t.mock.fn(() => query),
    limit: t.mock.fn(() => query),
    populate: t.mock.fn(async () => posts),
  };
  const find = t.mock.method(PostModel, "find", () => query);
  const response = { json: t.mock.fn(), set: t.mock.fn() };
  const next = t.mock.fn();
  return { find, query, response, next };
};

test("includes creator summaries and bounds the default feed query", async (t) => {
  const posts = [makePost(1)];
  const { query, response, next } = mockFeed(t, posts);
  await getPosts({}, response, next);
  assert.deepEqual(query.sort.mock.calls[0].arguments, [{ createdAt: -1, _id: -1 }]);
  assert.deepEqual(query.limit.mock.calls[0].arguments, [21]);
  assert.deepEqual(query.populate.mock.calls[0].arguments, [
    "creator", "fullName profilePhoto",
  ]);
  assert.deepEqual(response.json.mock.calls[0].arguments[0], posts);
  assert.equal(response.set.mock.callCount(), 0);
  assert.equal(next.mock.callCount(), 0);
});

test("returns only the requested page with a cursor for its last visible post", async (t) => {
  const posts = [makePost(3), makePost(2), makePost(1)];
  const { query, response, next } = mockFeed(t, posts);
  await getPosts({ query: { limit: "2" } }, response, next);
  assert.deepEqual(query.limit.mock.calls[0].arguments, [3]);
  assert.deepEqual(response.json.mock.calls[0].arguments[0], posts.slice(0, 2));
  assert.deepEqual(response.set.mock.calls[0].arguments, [
    "X-Next-Cursor", createPostCursor(posts[1]),
  ]);
  assert.equal(next.mock.callCount(), 0);
});

test("uses both timestamp and id to continue a feed with equal timestamps", async (t) => {
  const previousPost = makePost(2);
  const { find, response, next } = mockFeed(t, [makePost(1)]);
  await getPosts({ query: { cursor: createPostCursor(previousPost) } }, response, next);
  assert.deepEqual(find.mock.calls[0].arguments[0], {
    $or: [
      { createdAt: { $lt: previousPost.createdAt } },
      { createdAt: previousPost.createdAt, _id: { $lt: previousPost._id } },
    ],
  });
  assert.equal(next.mock.callCount(), 0);
});

test("does not advertise another page when the result exactly fills the limit", async (t) => {
  const { response, next } = mockFeed(t, [makePost(2), makePost(1)]);
  await getPosts({ query: { limit: "2" } }, response, next);
  assert.equal(response.set.mock.callCount(), 0);
  assert.equal(next.mock.callCount(), 0);
});

test("rejects invalid limits and cursors before querying posts", async (t) => {
  const { find, response, next } = mockFeed(t, []);
  const invalidCursor = Buffer.from(JSON.stringify({
    id: "not-an-id", createdAt: "not-a-date",
  })).toString("base64url");
  for (const query of [
    { limit: "0" }, { limit: "51" }, { limit: "1.5" }, { limit: "NaN" },
    { limit: ["20"] }, { cursor: "invalid!" }, { cursor: [] }, { cursor: invalidCursor },
  ]) {
    await getPosts({ query }, response, next);
    assert.equal(next.mock.calls.at(-1).arguments[0].code, 400);
  }
  assert.equal(find.mock.callCount(), 0);
  assert.equal(response.json.mock.callCount(), 0);
});

test("keeps the following filter while paging and populates author summaries", async (t) => {
  const following = ["507f191e810c19729de860ea"];
  t.mock.method(UserModel, "findById", () => ({ select: async () => ({ following }) }));
  const previousPost = makePost(2);
  const { find, query, response, next } = mockFeed(t, [makePost(1)]);
  await getFollowingPosts({
    user: { id: "507f191e810c19729de860eb" },
    query: { cursor: createPostCursor(previousPost) },
  }, response, next);
  assert.deepEqual(find.mock.calls[0].arguments[0].creator, { $in: following });
  assert.ok(find.mock.calls[0].arguments[0].$or);
  assert.equal(query.populate.mock.callCount(), 1);
  assert.deepEqual(query.limit.mock.calls[0].arguments, [21]);
  assert.equal(next.mock.callCount(), 0);
});

test("reports a missing following-feed user without querying posts", async (t) => {
  t.mock.method(UserModel, "findById", () => ({ select: async () => null }));
  const { find, response, next } = mockFeed(t, []);
  await getFollowingPosts({ user: { id: "missing" } }, response, next);
  assert.equal(next.mock.calls[0].arguments[0].code, 404);
  assert.equal(find.mock.callCount(), 0);
});
