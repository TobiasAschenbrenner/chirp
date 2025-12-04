const HttpError = require("../models/errorModel");
const CommentModel = require("../models/commentModel");
const PostModel = require("../models/postModel");
const UserModel = require("../models/userModel");

// CREATE COMMENT
// POST: /api/comments/:postId
// PROTECTED
const createComment = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { comment } = req.body;
    if (!comment) {
      return next(new HttpError("Please write a comment", 422));
    }
    // get comment creator from db
    const commentCreator = await UserModel.findById(req.user.id);
    const newComment = await CommentModel.create({
      creator: {
        creatorId: req.user.id,
        creatorName: commentCreator?.fullName,
        creatorPhoto: commentCreator?.profilePhoto,
      },
      comment,
      postId,
    });
    await PostModel.findByIdAndUpdate(
      postId,
      { $push: { comments: newComment?._id } },
      { new: true }
    );
    res.json(newComment);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// GET COMMENT
// GET: /api/comments/:postId
// PROTECTED
const getComment = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const comments = await PostModel.findById(postId).populate({
      path: "comments",
      options: { sort: { createdAt: -1 } },
    });
    res.json(comments);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// DELETE COMMENT
// DELETE: /api/comments/:commentId
// PROTECTED
const deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    // get comment from db
    const comment = await CommentModel.findById(commentId);
    const commentCreator = await UserModel.findById(
      comment?.creator?.creatorId
    );
    // check if creator matches logged in user
    if (commentCreator?._id != req.user.id) {
      return next(
        new HttpError("You are not authorized to delete this comment", 403)
      );
    }
    // remove comment id from post comments array
    await PostModel.findByIdAndUpdate(comment?.postId, {
      $pull: { comments: comment?._id },
    });
    const deletedComment = await CommentModel.findByIdAndDelete(commentId);
    res.json(deletedComment);
  } catch (error) {
    return next(new HttpError(error));
  }
};

module.exports = {
  createComment,
  getComment,
  deleteComment,
};
