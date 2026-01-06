import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

import { Post, Posts } from '../../services/posts/posts';
import { Auth } from '../../services/auth/auth';

type ApiError = {
  error?: {
    message?: string;
  };
};

@Component({
  selector: 'app-like-dislike-post',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './like-dislike-post.html',
  styleUrls: ['./like-dislike-post.scss'],
})
export class LikeDislikePost {
  @Input({ required: true }) post!: Post;
  @Output() postUpdated = new EventEmitter<Post>();

  busy = signal(false);

  private userId = computed(() => this.auth.getUserId());

  liked = computed(() => {
    const uid = this.userId();
    return !!uid && Array.isArray(this.post?.likes) && this.post.likes.includes(uid);
  });

  likesCount = computed(() => this.post?.likes?.length ?? 0);

  constructor(private postsApi: Posts, private auth: Auth) {}

  toggleLike(): void {
    if (!this.post?._id || this.busy()) return;

    this.busy.set(true);

    this.postsApi.likePost(this.post._id).subscribe({
      next: (updated) => {
        this.postUpdated.emit(updated);
        this.busy.set(false);
      },
      error: (err: ApiError) => {
        console.log(err);
        this.busy.set(false);
      },
    });
  }
}
