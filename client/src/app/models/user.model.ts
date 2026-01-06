export interface User {
  _id: string;
  fullName: string;
  email?: string;
  profilePhoto?: string;
  bio?: string;
  followers?: string[];
  following?: string[];
  posts?: string[];
}
