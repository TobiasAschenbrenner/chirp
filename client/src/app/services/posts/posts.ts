import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Post {
  _id: string;
  body: string;
}

@Injectable({ providedIn: 'root' })
export class Posts {
  constructor(private http: HttpClient) {}

  getPosts(): Observable<Post[]> {
    return this.http.get<Post[]>('/api/posts');
  }

  createPost(data: any): Observable<Post> {
    return this.http.post<Post>('/api/posts', data);
  }
}
