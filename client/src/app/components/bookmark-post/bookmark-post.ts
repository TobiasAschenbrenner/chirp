import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs';

import { Posts } from '../../services/posts/posts';
import { Users } from '../../services/users/users';

@Component({
  selector: 'app-bookmark-post',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './bookmark-post.html',
  styleUrls: ['./bookmark-post.scss'],
})
export class BookmarkPost {
  @Input({ required: true }) postId!: string;

  bookmarked = signal(false);
  busy = signal(false);

  @Input() set initialBookmarked(value: boolean) {
    this.setBookmarkedState(!!value, { emit: false });
  }

  @Output() changed = new EventEmitter<{ postId: string; bookmarked: boolean }>();
  @Output() actionError = new EventEmitter<string>();

  constructor(private postsApi: Posts, private usersApi: Users) {}

  toggleBookmark(): void {
    if (!this.postId || this.busy()) return;

    this.busy.set(true);
    this.actionError.emit('');

    this.postsApi.toggleBookmark(this.postId).pipe(
      finalize(() => this.busy.set(false)),
    ).subscribe({
      next: (res) => {
        const isOn = res.bookmarks.includes(this.postId);
        this.setBookmarkedState(isOn, { emit: true });
      },
      error: () => this.actionError.emit('Couldn’t update bookmark.'),
    });
  }

  private setBookmarkedState(isOn: boolean, opts: { emit: boolean }): void {
    this.bookmarked.set(isOn);
    this.usersApi.setBookmarked(this.postId, isOn);

    if (opts.emit) {
      this.changed.emit({ postId: this.postId, bookmarked: isOn });
    }
  }
}
