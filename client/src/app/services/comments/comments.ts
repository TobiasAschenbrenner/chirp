import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Comment } from '../../models/comment.model';

@Injectable({ providedIn: 'root' })
export class Comments {
  constructor(private http: HttpClient) {}

  createComment(postId: string, comment: string) {
    return this.http.post<Comment>(`/api/comments/${postId}`, { comment });
  }

  deleteComment(commentId: string) {
    return this.http.delete<{ message?: string }>(`/api/comments/${commentId}`);
  }
}
