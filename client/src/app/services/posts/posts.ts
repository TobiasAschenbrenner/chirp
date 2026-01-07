import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Post } from '../../models/post.model';

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class Posts {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  createPost(data: FormData): Observable<Post> {
    return this.http.post<Post>(`${this.baseUrl}/posts`, data);
  }

  getPosts() {
    return this.http.get<Post[]>(`${this.baseUrl}/posts`);
  }

  getFollowingPosts() {
    return this.http.get<Post[]>(`${this.baseUrl}/posts/following`);
  }

  likePost(postId: string) {
    return this.http.get<Post>(`${this.baseUrl}/posts/${postId}/like`);
  }

  getPost(id: string) {
    return this.http.get<Post>(`${this.baseUrl}/posts/${id}`);
  }

  deletePost(postId: string) {
    return this.http.delete<{ message?: string }>(`${this.baseUrl}/posts/${postId}`);
  }

  editPost(postId: string, body: string) {
    return this.http.patch<Post>(`${this.baseUrl}/posts/${postId}`, { body });
  }

  toggleBookmark(postId: string) {
    return this.http.get<{ bookmarks: string[] }>(`${this.baseUrl}/posts/${postId}/bookmarks`);
  }
}
