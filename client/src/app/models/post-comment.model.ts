export interface CommentCreator {
  creatorId: string;
  creatorName: string;
  creatorPhoto: string;
}

export interface PostCommentModel {
  _id: string;
  comment: string;
  createdAt?: string;
  creator: CommentCreator | string;
}
