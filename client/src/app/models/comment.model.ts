export interface CommentCreator {
  creatorId: string;
  creatorName: string;
  creatorPhoto: string;
}

export interface Comment {
  _id: string;
  comment: string;
  createdAt?: string;
  creator: string | CommentCreator;
}
