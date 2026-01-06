import { Component, EventEmitter, Input, Output, OnInit, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Auth } from '../../services/auth/auth';
import { Users, User } from '../../services/users/users';
import { ProfileImage } from '../profile-image/profile-image';

type ApiError = {
  error?: {
    message?: string;
  };
};

@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, ProfileImage],
  templateUrl: './create-post.html',
  styleUrls: ['./create-post.scss'],
})
export class CreatePost implements OnInit {
  @Input() error = '';
  @Input() loading = false;
  @Output() createPost = new EventEmitter<FormData>();

  body = '';
  image: File | null = null;

  user = signal<User | null>(null);

  constructor(private auth: Auth, private usersApi: Users, private destroyRef: DestroyRef) {}

  get canSubmit(): boolean {
    return !this.loading && this.body.trim().length > 0;
  }

  ngOnInit(): void {
    const userId = this.auth.getUserId();
    if (!userId) return;

    this.usersApi
      .getUser(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (u) => this.user.set(u),
        error: (err: ApiError) => console.log(err),
      });
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.image = input.files?.[0] ?? null;
  }

  onSubmit(): void {
    if (!this.canSubmit) return;

    const body = this.body.trim();
    if (!body) return;

    const postData = new FormData();
    postData.set('body', body);
    if (this.image) postData.set('image', this.image);

    this.createPost.emit(postData);

    this.body = '';
    this.image = null;
  }
}
