import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

import { Auth } from '../../services/auth/auth';
import { User } from '../../services/users/users';
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
  @Input() busy = false;

  @Input({ required: true })
  set user(value: UserWithFollows) {
    this._user.set(value);
  }
  get user(): UserWithFollows {
    return this._user() as UserWithFollows;
  }

  @Output() editProfile = new EventEmitter<void>();
  @Output() followToggle = new EventEmitter<void>();
  @Output() avatarChange = new EventEmitter<File>();

  private readonly _user = signal<UserWithFollows | null>(null);

  avatarTouched = signal(false);
  pendingAvatar = signal<File | null>(null);

  constructor(public auth: Auth) {}

  readonly isOwnProfile = computed(() => {
    const u = this._user();
    return !!u && this.auth.getUserId() === u._id;
  });

  readonly followerCount = computed(() => this._user()?.followers?.length ?? 0);

  readonly followingCount = computed(() => this._user()?.following?.length ?? 0);

  readonly followsUser = computed(() => {
    const u = this._user();
    const me = this.auth.getUserId();
    if (!u || !me) return false;

    const followers: ReadonlyArray<FollowerRef> = u.followers ?? [];
    return followers.some((f) => (typeof f === 'string' ? f === me : f._id === me));
  });

  onEditProfile(): void {
    this.editProfile.emit();
  }

  onFollowToggle(): void {
    this.followToggle.emit();
  }

  onPickAvatar(event: Event): void {
    const file = this.getFirstFile(event.target);
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

  private getFirstFile(target: EventTarget | null): File | null {
    const input = target as HTMLInputElement | null;
    return input?.files?.[0] ?? null;
  }
}
