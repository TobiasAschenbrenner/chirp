import { Component, EventEmitter, Input, Output, OnInit, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Post } from '../../services/posts/posts';
import { Users, User } from '../../services/users/users';
import { LikeDislikePost } from '../like-dislike-post/like-dislike-post';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, LikeDislikePost],
  templateUrl: './feed.html',
  styleUrls: ['./feed.scss'],
})
export class Feed implements OnInit {
  @Input({ required: true }) post!: Post;
  @Output() postUpdated = new EventEmitter<Post>();

  creator = signal<User | null>(null);
  creatorLoading = signal(false);

  constructor(private usersApi: Users, private destroyRef: DestroyRef) {}

  ngOnInit(): void {
    const creatorId = this.creatorId();
    if (!creatorId) return;

    this.creatorLoading.set(true);

    this.usersApi
      .getUser(creatorId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) => {
          this.creator.set(user);
          this.creatorLoading.set(false);
        },
        error: (err) => {
          console.log(err);
          this.creatorLoading.set(false);
        },
      });
  }

  private creatorId(): string | null {
    const c = this.post?.creator;
    if (!c) return null;
    return typeof c === 'string' ? c : c._id;
  }

  emitUpdatedPost(updated: Post): void {
    this.postUpdated.emit(updated);
  }
}
