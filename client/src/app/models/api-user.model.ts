export type FollowerRef = string | { _id: string };

export interface ApiUser {
  _id: string;
  fullName: string;

  email?: string;
  profilePhoto?: string;
  bio?: string;

  followers?: FollowerRef[];
  following?: FollowerRef[];
  posts?: Array<string | { _id: string }>;
}
