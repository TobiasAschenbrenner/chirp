import { Component, DestroyRef, computed, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';

import { Users } from '../../services/users/users';
import { Post } from '../../services/posts/posts';

import { Feeds } from '../../components/feeds/feeds';
import { FeedSkeleton } from '../../components/feed-skeleton/feed-skeleton';

@Component({
  selector: 'app-bookmarks',
  standalone: true,
  imports: [CommonModule, Feeds, FeedSkeleton],
  templateUrl: './bookmarks.html',
  styleUrls: ['./bookmarks.scss'],
})
export class Bookmarks implements OnInit {
  bookmarks = signal<Post[]>([]);
  loading = signal(true);
  error = signal('');

  bookmarkedIds = computed(() => new Set(this.bookmarks().map((p) => p._id)));

  constructor(private usersApi: Users, private destroyRef: DestroyRef) {}

  ngOnInit(): void {
    this.loadBookmarks();
  }

  loadBookmarks(): void {
    this.loading.set(true);
    this.error.set('');

    this.usersApi
      .getBookmarks()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.bookmarks.set(res.bookmarks || []);
          this.loading.set(false);
        },
        error: (err) => {
          console.log(err);
          this.error.set(err?.error?.message || 'Failed to load bookmarks.');
          this.loading.set(false);
        },
      });
  }

  onPostUpdated(updated: Post): void {
    this.bookmarks.update((list) => list.map((p) => (p._id === updated._id ? updated : p)));
  }

  onPostDeleted(postId: string): void {
    this.bookmarks.update((list) => list.filter((p) => p._id !== postId));
  }

  onBookmarkChanged(e: { postId: string; bookmarked: boolean }): void {
    if (!e.bookmarked) {
      this.bookmarks.update((list) => list.filter((p) => p._id !== e.postId));
    }
  }
}
