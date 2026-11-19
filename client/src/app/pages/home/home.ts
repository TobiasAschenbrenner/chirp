import { Component, computed, DestroyRef, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize, Subscription } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { CreatePost } from '../../components/create-post/create-post';
import { ForYouOrFollowing } from '../../components/for-you-or-following/for-you-or-following';
import { FeedSkeleton } from '../../components/feed-skeleton/feed-skeleton';
import { Feeds } from '../../components/feeds/feeds';

import { Posts } from '../../services/posts/posts';
import { Post } from '../../models/post.model';
import { ApiError } from '../../models/api-error.model';
import { FeedMode } from '../../models/feed-mode.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, CreatePost, ForYouOrFollowing, FeedSkeleton, Feeds],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
})
export class Home implements OnInit {
  mode = signal<FeedMode>('foryou');
  posts = signal<Post[]>([]);

  loading = signal(false);
  loadingMore = signal(false);
  posting = signal(false);
  error = signal('');
  feedError = signal('');
  readonly hasMore = computed(() => this.nextCursor() !== null);

  private readonly nextCursor = signal<string | null>(null);
  private feedRequest?: Subscription;

  constructor(
    private postsApi: Posts,
    private destroyRef: DestroyRef,
  ) {}

  ngOnInit(): void {
    this.loadPosts();
  }

  onModeChange(mode: FeedMode): void {
    if (this.mode() === mode) return;
    this.mode.set(mode);
    this.loadPosts();
  }

  loadMorePosts(): void {
    const cursor = this.nextCursor();
    if (!cursor || this.loading() || this.loadingMore()) return;
    this.loadPosts(cursor);
  }

  retryPosts(): void {
    if (this.loading() || this.loadingMore()) return;
    this.loadPosts(this.nextCursor() ?? undefined);
  }

  onPostUpdated(updated: Post): void {
    this.posts.update((posts) => posts.map((p) => (p._id === updated._id ? updated : p)));
  }

  onPostDeleted(postId: string): void {
    this.posts.update((posts) => posts.filter((p) => p._id !== postId));
  }

  createPost(data: FormData): void {
    this.error.set('');
    this.posting.set(true);

    this.postsApi.createPost(data).subscribe({
      next: (newPost) => {
        this.posting.set(false);

        if (this.mode() === 'foryou') {
          this.posts.update((posts) => [newPost, ...posts]);
        } else {
          this.loadPosts();
        }
      },
      error: (err: ApiError) => {
        this.posting.set(false);

        const msg = err.error?.message || 'Failed to create post.';
        this.error.set(
          msg === "TypeError: Cannot read properties of null (reading 'image')"
            ? 'Please upload an image'
            : msg
        );
      },
    });
  }

  private loadPosts(cursor?: string): void {
    this.feedRequest?.unsubscribe();
    this.feedError.set('');
    this.loading.set(!cursor);
    this.loadingMore.set(!!cursor);

    if (!cursor) {
      this.posts.set([]);
      this.nextCursor.set(null);
    }

    const request =
      this.mode() === 'foryou'
        ? this.postsApi.getPosts(cursor)
        : this.postsApi.getFollowingPosts(cursor);

    this.feedRequest = request
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading.set(false);
          this.loadingMore.set(false);
        }),
      )
      .subscribe({
        next: (page) => {
          this.posts.update((current) => {
            if (!cursor) return page.posts;
            const existingIds = new Set(current.map((post) => post._id));
            return [...current, ...page.posts.filter((post) => !existingIds.has(post._id))];
          });
          this.nextCursor.set(page.nextCursor);
        },
        error: (err: ApiError) => this.feedError.set(err.error?.message || 'Failed to load posts.'),
      });
  }
}
