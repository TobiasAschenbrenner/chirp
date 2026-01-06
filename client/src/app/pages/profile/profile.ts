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

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, Feeds, FeedSkeleton, UserProfile],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss'],
})
export class Profile implements OnInit {
  user = signal<User | null>(null);
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
      const id = params.get('id');
      if (!id) return;

      this.user.set(null);
      this.posts.set([]);
      this.loading.set(true);
      this.error.set('');

      this.loadProfile(id);
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

          const followers = Array.isArray((u as any).followers) ? [...(u as any).followers] : [];

          const ids = followers
            .map((f: any) => (typeof f === 'string' ? f : f?._id))
            .filter(Boolean) as string[];

          const hasMe = ids.includes(myId);
          const nextIds = hasMe ? ids.filter((id) => id !== myId) : [myId, ...ids];

          return { ...(u as any), followers: nextIds } as any;
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
      error: (err) => console.log(err),
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
    this.loading.set(true);
    this.error.set('');

    this.usersApi.getUser(id).subscribe({
      next: (u) => this.user.set(u),
      error: (err) => {
        console.log(err);
        this.error.set(err?.error?.message || 'Failed to load user.');
      },
    });

    this.usersApi.getUserPosts(id).subscribe({
      next: (res) => {
        this.posts.set(res.posts || []);
        this.loading.set(false);
      },
      error: (err) => {
        console.log(err);
        this.error.set(err?.error?.message || 'Failed to load posts.');
        this.loading.set(false);
      },
    });
  }

  onPostUpdated(updated: Post): void {
    this.posts.update((list) => list.map((p) => (p._id === updated._id ? updated : p)));
  }

  onPostDeleted(postId: string): void {
    this.posts.update((list) => list.filter((p) => p._id !== postId));
  }
}
