import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Post {
  _id: string;
  creator: string;
  body: string;
  image: string;
  likes: string[];
  comments: string[];
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
}
