import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Post, PostPage } from '../../models/post.model';

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class Posts {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  createPost(data: FormData): Observable<Post> {
    return this.http.post<Post>(`${this.baseUrl}/posts`, data);
  }

  getPosts(cursor?: string): Observable<PostPage> {
    return this.getPostPage('/posts', cursor);
  }

  getFollowingPosts(cursor?: string): Observable<PostPage> {
    return this.getPostPage('/posts/following', cursor);
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

  private getPostPage(path: string, cursor?: string): Observable<PostPage> {
    const params: { limit: number; cursor?: string } = { limit: 20 };
    if (cursor) params.cursor = cursor;

    return this.http.get<Post[]>(`${this.baseUrl}${path}`, { params, observe: 'response' }).pipe(
      map((response) => ({
        posts: response.body ?? [],
        nextCursor: response.headers.get('X-Next-Cursor') || null,
      })),
    );
  }
}
