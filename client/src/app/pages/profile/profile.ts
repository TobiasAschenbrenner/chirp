import { Component, DestroyRef, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Auth } from '../../services/auth/auth';
import { Users, User } from '../../services/users/users';
import { Post } from '../../services/posts/posts';

import { Feeds } from '../../components/feeds/feeds';
import { FeedSkeleton } from '../../components/feed-skeleton/feed-skeleton';
import { UserProfile } from '../../components/user-profile/user-profile';
import { EditProfileDialog } from '../../components/edit-profile-dialog/edit-profile-dialog';

type ApiError = {
  error?: {
    message?: string;
  };
};

type UserWithFollowers = User & {
  followers?: Array<string | { _id: string }>;
};

type FollowerRef = string | { _id: string };

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, Feeds, FeedSkeleton, UserProfile],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss'],
})
export class Profile implements OnInit {
  user = signal<UserWithFollowers | null>(null);
  posts = signal<Post[]>([]);
  loading = signal(true);
  error = signal('');
  busy = signal(false);

  constructor(
    private route: ActivatedRoute,
    private usersApi: Users,
    private auth: Auth,
    private dialog: MatDialog,
    private destroyRef: DestroyRef
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const profileId = params.get('id');
      if (!profileId) return;

      this.resetState();
      this.loadProfile(profileId);
    });
  }

  toggleFollow(): void {
    const profile = this.user();
    if (!profile?._id || this.busy()) return;

    const myId = this.auth.getUserId();
    if (!myId) return;

    this.busy.set(true);

    this.usersApi.followUnfollow(profile._id).subscribe({
      next: () => {
        this.user.update((u) => {
          if (!u) return u;

          type FollowerRef = string | { _id: string };
          const followers: ReadonlyArray<FollowerRef> = u.followers ?? [];

          const ids = followers.map((f) => (typeof f === 'string' ? f : f._id));

          const hasMe = ids.includes(myId);
          const nextIds = hasMe ? ids.filter((id) => id !== myId) : [myId, ...ids];

          return { ...u, followers: nextIds };
        });

        this.busy.set(false);
      },
      error: (err) => {
        console.log(err);
        this.busy.set(false);
      },
    });
  }

  changeAvatar(file: File): void {
    this.usersApi.changeAvatar(file).subscribe({
      next: (updated) => this.user.set(updated),
      error: (err: ApiError) => console.log(err),
    });
  }

  openEditProfile(): void {
    const u = this.user();
    if (!u) return;

    const ref = this.dialog.open(EditProfileDialog, {
      data: { user: u },
      panelClass: 'chirp-dialog',
    });

    ref.afterClosed().subscribe((updated?: User) => {
      if (updated) {
        this.user.set(updated);
      }
    });
  }

  private loadProfile(id: string): void {
    let userDone = false;
    let postsDone = false;

    this.loading.set(true);
    this.error.set('');

    const finishLoadingIfDone = () => {
      if (userDone && postsDone) this.loading.set(false);
    };

    this.usersApi.getUser(id).subscribe({
      next: (u) => {
        this.user.set(u);
        userDone = true;
        finishLoadingIfDone();
      },
      error: (err: ApiError) => {
        console.log(err);
        this.error.set(err.error?.message || 'Failed to load user.');
        userDone = true;
        finishLoadingIfDone();
      },
    });

    this.usersApi.getUserPosts(id).subscribe({
      next: (res) => {
        this.posts.set(res.posts || []);
        postsDone = true;
        finishLoadingIfDone();
      },
      error: (err: ApiError) => {
        console.log(err);
        this.error.set(err.error?.message || 'Failed to load posts.');
        postsDone = true;
        finishLoadingIfDone();
      },
    });
  }

  onPostUpdated(updated: Post): void {
    this.posts.update((list) => list.map((p) => (p._id === updated._id ? updated : p)));
  }

  onPostDeleted(postId: string): void {
    this.posts.update((list) => list.filter((p) => p._id !== postId));
  }

  private resetState(): void {
    this.user.set(null);
    this.posts.set([]);
    this.loading.set(true);
    this.error.set('');
  }
}
