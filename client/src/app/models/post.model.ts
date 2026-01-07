import { Comment } from './comment.model';

export interface PostUser {
  _id: string;
  fullName: string;
  profilePhoto: string;
}

export interface Post {
  _id: string;
  creator: string | PostUser;
  body: string;
  image: string;
  likes: string[];
  comments: (string | Comment)[];
  createdAt?: string;
  updatedAt?: string;
}
