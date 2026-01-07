import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Comment } from '../../models/comment.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class Comments {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  createComment(postId: string, comment: string) {
    return this.http.post<Comment>(`${this.baseUrl}/comments/${postId}`, { comment });
  }

  deleteComment(commentId: string) {
    return this.http.delete<{ message?: string }>(`${this.baseUrl}/comments/${commentId}`);
  }
}
