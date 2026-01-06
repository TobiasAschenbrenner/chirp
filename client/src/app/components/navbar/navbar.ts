import { Component, EventEmitter, Output, OnInit, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { debounceTime, distinctUntilChanged, filter, switchMap, catchError, of, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Auth } from '../../services/auth/auth';
import { Users, User } from '../../services/users/users';
import { ProfileImage } from '../profile-image/profile-image';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatIconModule,
    ProfileImage,
    ReactiveFormsModule,
  ],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss'],
})
export class Navbar implements OnInit {
  search = new FormControl<string>('', { nonNullable: true });

  results = signal<User[]>([]);
  searching = signal(false);
  open = signal(false);
  user = signal<User | null>(null);

  constructor(
    public auth: Auth,
    private usersApi: Users,
    private router: Router,
    private destroyRef: DestroyRef
  ) {}

  goToUser(userId: string) {
    this.open.set(false);
    this.results.set([]);
    this.router.navigate(['/users', userId]);
  }

  close() {
    this.open.set(false);
  }

  private setupSearch(): void {
    this.search.valueChanges
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        tap((q) => {
          const trimmed = q.trim();
          if (trimmed.length < 2) {
            this.results.set([]);
            this.searching.set(false);
            this.open.set(false);
          }
        }),
        filter((q) => q.trim().length >= 2),
        tap(() => {
          this.searching.set(true);
          this.open.set(true);
        }),
        switchMap((q) =>
          this.usersApi.searchUsers(q.trim(), 8, 1).pipe(
            catchError((err) => {
              console.log(err);
              return of({ users: [], total: 0, page: 1, limit: 8 });
            })
          )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        this.results.set(res.users ?? []);
        this.searching.set(false);
      });
  }

  ngOnInit(): void {
    this.setupSearch();
    const userId = this.auth.getUserId();
    if (!userId) return;

    this.usersApi
      .getUser(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (u) => this.user.set(u),
        error: (err) => console.log(err),
      });
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
