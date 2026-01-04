import { Component, EventEmitter, Input, Output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

import { User } from '../../services/users/users';
import { Auth } from '../../services/auth/auth';
import { ProfileImage } from '../profile-image/profile-image';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule, ProfileImage],
  templateUrl: './user-profile.html',
  styleUrls: ['./user-profile.scss'],
})
export class UserProfile {
  private _user = signal<User | null>(null);

  @Input({ required: true })
  set user(value: User) {
    this._user.set(value);
  }
  get user(): User {
    return this._user() as User;
  }

  @Input() busy = false;

  @Output() editProfile = new EventEmitter<void>();
  @Output() followToggle = new EventEmitter<void>();
  @Output() avatarChange = new EventEmitter<File>();

  avatarTouched = signal(false);
  pendingAvatar = signal<File | null>(null);

  constructor(public auth: Auth) {}

  isOwnProfile = computed(() => {
    const u = this._user();
    return !!u && this.auth.getUserId() === u._id;
  });

  followsUser = computed(() => {
    const u = this._user();
    const me = this.auth.getUserId();
    if (!u || !me) return false;

    const followers = (u as any).followers;
    if (!Array.isArray(followers)) return false;

    return followers.some((f: any) => (typeof f === 'string' ? f === me : f?._id === me));
  });

  followerCount = computed(() => {
    const u = this._user();
    const followers = u ? (u as any).followers : null;
    return Array.isArray(followers) ? followers.length : 0;
  });

  followingCount = computed(() => {
    const u = this._user();
    const following = u ? (u as any).following : null;
    return Array.isArray(following) ? following.length : 0;
  });

  onEditProfile(): void {
    this.editProfile.emit();
  }

  onFollowToggle(): void {
    this.followToggle.emit();
  }

  onPickAvatar(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.pendingAvatar.set(file);
    this.avatarTouched.set(true);
  }

  submitAvatar(): void {
    const file = this.pendingAvatar();
    if (!file) return;

    this.avatarChange.emit(file);
    this.avatarTouched.set(false);
    this.pendingAvatar.set(null);
  }
}
