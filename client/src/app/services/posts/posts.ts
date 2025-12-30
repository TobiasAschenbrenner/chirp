import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PostUser {
  _id: string;
  fullName: string;
  profilePhoto: string;
}

export interface Comment {
  _id: string;
  creator: PostUser | string;
  post?: string;
  comment: string;
  createdAt?: string;
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

@Injectable({ providedIn: 'root' })
export class Posts {
  constructor(private http: HttpClient) {}

  createPost(data: FormData): Observable<Post> {
    return this.http.post<Post>('/api/posts', data);
  }

  getPosts() {
    return this.http.get<Post[]>('/api/posts');
  }

  getFollowingPosts() {
    return this.http.get<Post[]>('/api/posts/following');
  }

  likePost(postId: string) {
    return this.http.get<Post>(`/api/posts/${postId}/like`);
  }

  getPost(id: string) {
    return this.http.get<Post>(`/api/posts/${id}`);
  }
}
