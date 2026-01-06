import { Component, EventEmitter, Input, Output, OnInit, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Posts as PostsApi, Post } from '../../services/posts/posts';

type ApiError = {
  error?: {
    message?: string;
  };
};

@Component({
  selector: 'app-edit-post-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './edit-post-modal.html',
  styleUrls: ['./edit-post-modal.scss'],
})
export class EditPostModal implements OnInit {
  @Input({ required: true }) postId!: string;

  @Output() updated = new EventEmitter<Post>();
  @Output() closed = new EventEmitter<void>();

  body = signal('');
  loading = signal(false);
  error = signal('');

  constructor(private postsApi: PostsApi, private destroyRef: DestroyRef) {}

  ngOnInit(): void {
    this.loadPost();
  }

  onBodyInput(event: Event): void {
    const el = event.target as HTMLTextAreaElement | null;
    if (!el) return;
    this.body.set(el.value);
  }

  private loadPost(): void {
    this.loading.set(true);
    this.error.set('');

    this.postsApi
      .getPost(this.postId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (post: Post) => {
          this.body.set(post.body || '');
          this.loading.set(false);
        },
        error: (err: ApiError) => {
          console.log(err);
          this.error.set(err?.error?.message || 'Failed to load post.');
          this.loading.set(false);
        },
      });
  }

  submit(): void {
    const body = this.body().trim();
    if (!body) return;

    this.loading.set(true);
    this.error.set('');

    this.postsApi
      .editPost(this.postId, body)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (post: Post) => {
          this.updated.emit(post);
          this.closed.emit();
          this.loading.set(false);
        },
        error: (err: ApiError) => {
          console.log(err);
          this.error.set(err?.error?.message || 'Failed to update post.');
          this.loading.set(false);
        },
      });
  }

  close(e?: MouseEvent): void {
    if (!e || (e.target as HTMLElement).classList.contains('editPost')) {
      this.closed.emit();
    }
  }
}
