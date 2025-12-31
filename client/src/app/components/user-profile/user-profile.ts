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
  @Input({ required: true }) user!: User;

  @Output() editProfile = new EventEmitter<void>();
  @Output() followToggle = new EventEmitter<void>();
  @Output() avatarChange = new EventEmitter<File>();

  avatarTouched = signal(false);
  pendingAvatar = signal<File | null>(null);

  constructor(public auth: Auth) {}

  isOwnProfile = computed(() => this.auth.getUserId() === this.user?._id);

  followsUser = computed(() => {
    const me = this.auth.getUserId();
    return !!me && Array.isArray(this.user?.followers) && this.user.followers.includes(me);
  });

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
