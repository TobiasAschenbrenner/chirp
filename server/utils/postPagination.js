const HttpError = require("../models/errorModel");

const DEFAULT_POST_LIMIT = 20;
const MAX_POST_LIMIT = 50;

const parsePostPagination = (query = {}) => {
  const limit = query.limit === undefined ? DEFAULT_POST_LIMIT : Number(query.limit);

  if (
    (query.limit !== undefined &&
      (typeof query.limit !== "string" || !/^\d+$/.test(query.limit))) ||
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    limit > MAX_POST_LIMIT
  ) {
    throw new HttpError(`Post limit must be between 1 and ${MAX_POST_LIMIT}`, 400);
  }

  if (query.cursor === undefined) return { limit, filter: {} };

  try {
    if (
      typeof query.cursor !== "string" ||
      query.cursor.length > 256 ||
      !/^[A-Za-z0-9_-]+$/.test(query.cursor)
    ) {
      throw new Error();
    }

    const { createdAt, id } = JSON.parse(
      Buffer.from(query.cursor, "base64url").toString("utf8"),
    );
    const date = new Date(createdAt);

    if (
      typeof createdAt !== "string" ||
      !Number.isFinite(date.getTime()) ||
      date.toISOString() !== createdAt ||
      typeof id !== "string" ||
      !/^[a-f\d]{24}$/i.test(id)
    ) {
      throw new Error();
    }

    return {
      limit,
      filter: {
        $or: [
          { createdAt: { $lt: date } },
          { createdAt: date, _id: { $lt: id } },
        ],
      },
    };
  } catch {
    throw new HttpError("Invalid post cursor", 400);
  }
};

const createPostCursor = (post) =>
  Buffer.from(
    JSON.stringify({
      createdAt: new Date(post.createdAt).toISOString(),
      id: String(post._id),
    }),
  ).toString("base64url");

module.exports = { parsePostPagination, createPostCursor };
