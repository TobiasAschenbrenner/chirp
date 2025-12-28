import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type Post = any;

@Injectable({ providedIn: 'root' })
export class Posts {
  constructor(private http: HttpClient) {}

  createPost(data: FormData): Observable<Post> {
    return this.http.post<Post>('/api/posts', data);
  }
}
