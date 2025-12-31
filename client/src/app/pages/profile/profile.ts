import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import { Users, User } from '../../services/users/users';
import { Post } from '../../services/posts/posts';

import { Feeds } from '../../components/feeds/feeds';
import { FeedSkeleton } from '../../components/feed-skeleton/feed-skeleton';
import { UserProfile } from '../../components/user-profile/user-profile';

import { Auth } from '../../services/auth/auth';

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

  constructor(private route: ActivatedRoute, private usersApi: Users, private auth: Auth) {}

  toggleFollow(): void {
    const u = this.user();
    if (!u?._id) return;

    this.usersApi.followUnfollow(u._id).subscribe({
      next: (updated) => this.user.set(updated),
      error: (err) => console.log(err),
    });
  }

  changeAvatar(file: File): void {
    this.usersApi.changeAvatar(file).subscribe({
      next: (updated) => this.user.set(updated),
      error: (err) => console.log(err),
    });
  }

  openEditProfile(): void {
    console.log('Edit profile modal later');
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.loadProfile(id);
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
