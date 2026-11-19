const { Schema, model } = require("mongoose");

const postSchema = new Schema(
  {
    creator: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true },
    image: { type: String, required: false },
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
  },
  { timestamps: true }
);

postSchema.index({ createdAt: -1, _id: -1 });
postSchema.index({ creator: 1, createdAt: -1, _id: -1 });

module.exports = model("Post", postSchema);
