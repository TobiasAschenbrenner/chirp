import { Component, EventEmitter, Input, Output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

import { User } from '../../services/users/users';
import { Auth } from '../../services/auth/auth';
import { ProfileImage } from '../profile-image/profile-image';

type FollowerRef = string | { _id: string };

type UserWithFollows = User & {
  followers?: FollowerRef[];
  following?: FollowerRef[];
};

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule, ProfileImage],
  templateUrl: './user-profile.html',
  styleUrls: ['./user-profile.scss'],
})
export class UserProfile {
  private _user = signal<UserWithFollows | null>(null);

  @Input({ required: true })
  set user(value: UserWithFollows) {
    this._user.set(value);
  }
  get user(): UserWithFollows {
    return this._user() as UserWithFollows;
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

    const followers: ReadonlyArray<FollowerRef> = this.user.followers ?? [];

    return followers.some((f) => (typeof f === 'string' ? f === me : f._id === me));
  });

  followerCount = computed(() => {
    const u = this._user();
    return u?.followers?.length ?? 0;
  });

  followingCount = computed(() => {
    const u = this._user();
    return u?.following?.length ?? 0;
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
