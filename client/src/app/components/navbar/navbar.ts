import {
  afterNextRender, Component, DestroyRef, ElementRef, inject, Injector, OnInit, signal, ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { catchError, distinctUntilChanged, map, merge, of, Subject, switchMap, tap, timer } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Auth } from '../../services/auth/auth';
import { Users } from '../../services/users/users';
import { User } from '../../models/user.model';
import { ProfileImage } from '../profile-image/profile-image';
import { ApiError } from '../../models/api-error.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, ProfileImage, ReactiveFormsModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss'],
})
export class Navbar implements OnInit {
  private readonly minQueryLength = 2;
  private readonly injector = inject(Injector);
  private readonly searchRetries = new Subject<void>();

  @ViewChild('userSearch') private searchInput?: ElementRef<HTMLInputElement>;
  @ViewChild('mobileSearchToggle') private mobileSearchToggle?: ElementRef<HTMLButtonElement>;

  search = new FormControl<string>('', { nonNullable: true });

  results = signal<User[]>([]);
  searching = signal(false);
  searchError = signal('');
  open = signal(false);
  mobileSearchOpen = signal(false);
  user = signal<User | null>(null);

  constructor(
    public auth: Auth,
    private usersApi: Users,
    private router: Router,
    private destroyRef: DestroyRef
  ) {}

  ngOnInit(): void {
    this.setupSearch();
    this.loadCurrentUser();
  }

  goToUser(userId: string): void {
    this.mobileSearchOpen.set(false);
    this.search.setValue('');
    this.resetSearchUi();
    this.router.navigate(['/users', userId]);
  }

  close(): void {
    this.open.set(false);
  }

  openMobileSearch(): void {
    this.mobileSearchOpen.set(true);
    afterNextRender(() => {
      if (this.mobileSearchOpen()) this.searchInput?.nativeElement.focus();
    }, { injector: this.injector });
  }

  dismissSearch(): void {
    this.searchInput?.nativeElement.focus();
    this.close();
    this.mobileSearchOpen.set(false);
    afterNextRender(() => {
      const toggle = this.mobileSearchToggle?.nativeElement;
      if (toggle?.getClientRects().length) toggle.focus();
    }, { injector: this.injector });
  }

  get showEmptyState(): boolean {
    return (
      !this.searching() &&
      !this.searchError() &&
      this.results().length === 0 &&
      this.search.value.trim().length >= this.minQueryLength
    );
  }

  get searchStatus(): string {
    if (!this.open()) return '';
    if (this.searching()) return 'Searching…';
    if (this.searchError()) return '';

    const count = this.results().length;
    if (count > 0) return `${count} ${count === 1 ? 'user' : 'users'} found.`;

    return this.showEmptyState ? 'No users found.' : '';
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  retrySearch(): void {
    if (this.searching()) return;
    this.searchInput?.nativeElement.focus();
    this.searchRetries.next();
  }

  private setupSearch(): void {
    merge(
      this.search.valueChanges.pipe(map((query) => query.trim()), distinctUntilChanged()),
      this.searchRetries.pipe(map(() => this.search.value.trim())),
    )
      .pipe(
        tap((q) => {
          this.searchError.set('');
          this.results.set([]);
          if (q.length < this.minQueryLength) {
            this.resetSearchUi();
          } else {
            this.searching.set(true);
            this.open.set(true);
          }
        }),
        switchMap((q) =>
          q.length < this.minQueryLength ? of(null) : timer(250).pipe(
            switchMap(() => this.usersApi.searchUsers(q, 8, 1)),
            catchError(() => {
              this.searchError.set('Couldn’t search.');
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        this.results.set(res?.users ?? []);
        this.searching.set(false);
      });
  }

  private loadCurrentUser(): void {
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

  private resetSearchUi(): void {
    this.results.set([]);
    this.searching.set(false);
    this.searchError.set('');
    this.open.set(false);
  }
}
