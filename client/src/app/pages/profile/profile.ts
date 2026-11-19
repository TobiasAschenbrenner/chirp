import { Component, DestroyRef, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, forkJoin, of, Subscription } from 'rxjs';

import { Auth } from '../../services/auth/auth';
import { Users } from '../../services/users/users';
import { Post } from '../../models/post.model';

import { Feeds } from '../../components/feeds/feeds';
import { FeedSkeleton } from '../../components/feed-skeleton/feed-skeleton';
import { UserProfile } from '../../components/user-profile/user-profile';
import { EditProfileDialog } from '../../components/edit-profile-dialog/edit-profile-dialog';

import { ApiUser } from '../../models/api-user.model';
import { User } from '../../models/user.model';
import { normalizeUser } from '../../utils/normalize-user';

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
  actionError = signal('');

  @ViewChild(UserProfile) private profileCard?: UserProfile;
  private profileId = '';
  private profileRequest?: Subscription;
  private actionRequest?: Subscription;

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

      this.profileId = profileId;
      this.actionRequest?.unsubscribe();
      this.resetState();
      this.loadProfile(profileId);
    });
  }

  toggleFollow(): void {
    const profileId = this.user()?._id;
    if (!profileId || this.busy()) return;

    const myId = this.getMyUserId();
    if (!myId) return;

    this.busy.set(true);
    this.actionError.set('');

    this.actionRequest = this.usersApi.followUnfollow(profileId).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.busy.set(false)),
    ).subscribe({
      next: () => this.applyFollowToggle(myId),
      error: () => this.actionError.set('Couldn’t update follow.'),
    });
  }

  changeAvatar(file: File): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.actionError.set('');

    this.actionRequest = this.usersApi.changeAvatar(file).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.busy.set(false)),
    ).subscribe({
      next: (updated: ApiUser) => {
        this.user.set(normalizeUser(updated));
        this.profileCard?.resetAvatar();
      },
      error: (err: HttpErrorResponse) => this.actionError.set(
        err.status === 413 ? 'Image is too large.' : 'Couldn’t update photo.',
      ),
    });
  }

  openEditProfile(): void {
    const u = this.user();
    if (!u) return;

    const ref = this.dialog.open(EditProfileDialog, {
      data: { user: u },
      panelClass: 'chirp-dialog',
      ariaLabelledBy: 'edit-profile-title',
    });

    ref.afterClosed().subscribe((updated?: ApiUser | User) => {
      if (!updated) return;

      // If the dialog returns ApiUser, normalize. If it returns User, keep it.
      const normalized = 'email' in updated || 'profilePhoto' in updated ? (updated as User) : null;
      this.user.set(normalized ?? normalizeUser(updated as ApiUser));
    });
  }

  onPostUpdated(updated: Post): void {
    this.posts.update((list) => list.map((p) => (p._id === updated._id ? updated : p)));
  }

  onPostDeleted(postId: string): void {
    this.posts.update((list) => list.filter((p) => p._id !== postId));
  }

  retryProfile(): void {
    if (this.profileId && !this.loading()) this.loadProfile(this.profileId);
  }

  private loadProfile(id: string): void {
    this.profileRequest?.unsubscribe();
    this.loading.set(true);
    this.error.set('');

    this.profileRequest = forkJoin({
      user: this.usersApi.getUser(id).pipe(catchError(() => {
        this.error.set('Couldn’t load profile.');
        return of(null);
      })),
      posts: this.usersApi.getUserPosts(id).pipe(catchError(() => {
        this.error.set('Couldn’t load posts.');
        return of(null);
      })),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false)),
    ).subscribe(({ user, posts }) => {
      this.user.set(user ? normalizeUser(user) : null);
      this.posts.set(posts?.posts ?? []);
    });
  }

  private resetState(): void {
    this.user.set(null);
    this.posts.set([]);
    this.loading.set(true);
    this.error.set('');
    this.actionError.set('');
  }

  private getMyUserId(): string | null {
    return this.auth.getUserId();
  }

  private applyFollowToggle(myId: string): void {
    this.user.update((u) => {
      if (!u) return u;

      const followers = u.followers ?? [];
      const nextFollowers = this.toggleId(followers, myId);

      return { ...u, followers: nextFollowers };
    });
  }

  private toggleId(ids: readonly string[], id: string): string[] {
    return ids.includes(id) ? ids.filter((x) => x !== id) : [id, ...ids];
  }
}
