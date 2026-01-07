import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, tap } from 'rxjs/operators';
import { Observable, shareReplay } from 'rxjs';

import { Post } from '../../models/post.model';
import { User } from '../../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class Users {
  private cache = new Map<string, Observable<User>>();
  private bookmarkIdsSig = signal<Set<string>>(new Set());

  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getUser(id: string): Observable<User> {
    const cached = this.cache.get(id);
    if (cached) return cached;

    const req$ = this.http.get<User>(`${this.baseUrl}/users/${id}`).pipe(shareReplay(1));

    this.cache.set(id, req$);
    return req$;
  }

  searchUsers(q: string, limit = 8, page = 1) {
    return this.http.get<{ users: User[]; total: number; page: number; limit: number }>(
      `${this.baseUrl}/users/search`,
      { params: { q, limit, page } }
    );
  }

  getUserPosts(id: string) {
    return this.http.get<{ posts: Post[] }>(`${this.baseUrl}/users/${id}/posts`);
  }

  followUnfollow(userId: string) {
    return this.http.get<User>(`${this.baseUrl}/users/${userId}/follow-unfollow`);
  }

  changeAvatar(file: File) {
    const fd = new FormData();
    fd.set('avatar', file);
    return this.http.post<User>(`${this.baseUrl}/users/avatar`, fd);
  }

  updateProfile(data: { fullName: string; bio: string }) {
    return this.http.patch<User>(`${this.baseUrl}/users/edit`, data);
  }

  getBookmarks() {
    return this.http.get<{ bookmarks: Post[] }>(`${this.baseUrl}/users/bookmarks`);
  }

  loadBookmarks(): Observable<Set<string>> {
    return this.getBookmarks().pipe(
      map((res) => new Set((res.bookmarks ?? []).map((p) => p._id))),
      tap((ids) => this.bookmarkIdsSig.set(ids))
    );
  }

  bookmarkIds(): Set<string> {
    return this.bookmarkIdsSig();
  }

  isBookmarked(postId: string): boolean {
    return this.bookmarkIdsSig().has(postId);
  }

  setBookmarked(postId: string, bookmarked: boolean): void {
    this.bookmarkIdsSig.update((prev) => {
      const next = new Set(prev);
      if (bookmarked) next.add(postId);
      else next.delete(postId);
      return next;
    });
  }
}
