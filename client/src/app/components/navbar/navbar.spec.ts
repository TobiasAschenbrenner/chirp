import { TestBed } from '@angular/core/testing';
import { Navbar } from './navbar';
import { provideRouter } from '@angular/router';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { of, throwError } from 'rxjs';

import { Auth } from '../../services/auth/auth';
import { Users } from '../../services/users/users';

class AuthStub {
  getUserId() {
    return null as string | null;
  }
  isLoggedIn() {
    return false;
  }
  logout() {}
}

class UsersStub {
  searchUsers(q: string, limit: number, page: number) {
    return of({ users: [], total: 0, page, limit });
  }

  getUser(id: string) {
    return of({
      _id: id,
      fullName: 'Tobi Test',
      profilePhoto: 'https://example.com/p.png',
    } as any);
  }
}

describe('Navbar', () => {
  let auth: AuthStub;
  let users: UsersStub;
  let router: Router;

  beforeEach(async () => {
    vi.useFakeTimers();

    await TestBed.configureTestingModule({
      imports: [Navbar],
      providers: [
        provideRouter([]),
        { provide: Auth, useClass: AuthStub },
        { provide: Users, useClass: UsersStub },
      ],
    }).compileComponents();

    auth = TestBed.inject(Auth) as unknown as AuthStub;
    users = TestBed.inject(Users) as unknown as UsersStub;
    router = TestBed.inject(Router);

    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    vi.spyOn(auth, 'getUserId');
    vi.spyOn(auth, 'isLoggedIn');
    vi.spyOn(auth, 'logout');
    vi.spyOn(users, 'getUser');
    vi.spyOn(users, 'searchUsers');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(Navbar);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should load the current user on init when logged in', () => {
    (auth.getUserId as any).mockReturnValue('u1');

    const fixture = TestBed.createComponent(Navbar);
    fixture.detectChanges();

    expect(users.getUser).toHaveBeenCalledWith('u1');
    expect(fixture.componentInstance.user()?._id).toBe('u1');
  });

  it('should not load user on init when not logged in', () => {
    (auth.getUserId as any).mockReturnValue(null);

    const fixture = TestBed.createComponent(Navbar);
    fixture.detectChanges();

    expect(users.getUser).not.toHaveBeenCalled();
    expect(fixture.componentInstance.user()).toBeNull();
  });

  it('should search users after debounce and open results', () => {
    const fixture = TestBed.createComponent(Navbar);
    fixture.detectChanges();

    fixture.componentInstance.search.setValue('to');
    vi.advanceTimersByTime(250);

    expect(users.searchUsers).toHaveBeenCalledWith('to', 8, 1);
    expect(fixture.componentInstance.open()).toBe(true);
    expect(fixture.componentInstance.searching()).toBe(false);
  });

  it('should clear results and close dropdown for queries shorter than 2 chars', () => {
    (users.searchUsers as any).mockReturnValueOnce(
      of({
        users: [{ _id: 'x', fullName: 'X', profilePhoto: null }],
        total: 1,
        page: 1,
        limit: 8,
      })
    );

    const fixture = TestBed.createComponent(Navbar);
    fixture.detectChanges();

    fixture.componentInstance.search.setValue('to');
    vi.advanceTimersByTime(250);

    expect(fixture.componentInstance.open()).toBe(true);
    expect(fixture.componentInstance.results().length).toBe(1);

    fixture.componentInstance.search.setValue('t');
    vi.advanceTimersByTime(1);

    expect(fixture.componentInstance.open()).toBe(false);
    expect(fixture.componentInstance.results()).toEqual([]);
    expect(fixture.componentInstance.searching()).toBe(false);
  });

  it('should handle search errors by returning empty results and not crashing', () => {
    (users.searchUsers as any).mockReturnValueOnce(throwError(() => new Error('boom')));

    const fixture = TestBed.createComponent(Navbar);
    fixture.detectChanges();

    fixture.componentInstance.search.setValue('to');
    vi.advanceTimersByTime(250);

    expect(fixture.componentInstance.results()).toEqual([]);
    expect(fixture.componentInstance.searching()).toBe(false);
  });

  it('goToUser should close dropdown, clear results and navigate', () => {
    const fixture = TestBed.createComponent(Navbar);
    fixture.detectChanges();

    fixture.componentInstance.open.set(true);
    fixture.componentInstance.results.set([{ _id: 'u2' } as any]);

    fixture.componentInstance.goToUser('u2');

    expect(fixture.componentInstance.open()).toBe(false);
    expect(fixture.componentInstance.results()).toEqual([]);
    expect(router.navigate).toHaveBeenCalledWith(['/users', 'u2']);
  });

  it('logout should call auth.logout and navigate to /login', () => {
    (auth.isLoggedIn as any).mockReturnValue(true);

    const fixture = TestBed.createComponent(Navbar);
    fixture.detectChanges();

    fixture.componentInstance.logout();

    expect(auth.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
