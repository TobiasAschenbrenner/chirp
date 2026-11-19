import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Navbar } from './navbar';
import { provideRouter } from '@angular/router';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { of, Subject, throwError } from 'rxjs';

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
  setBookmarked(postId: string, bookmarked: boolean): void {}
}

describe('Navbar', () => {
  let fixture: ComponentFixture<Navbar>;
  let component: Navbar;

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

    fixture = TestBed.createComponent(Navbar);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should load the current user on init when logged in', () => {
    (auth.getUserId as any).mockReturnValue('u1');

    fixture.detectChanges();

    expect(users.getUser).toHaveBeenCalledWith('u1');
    expect(component.user()?._id).toBe('u1');
  });

  it('should not load user on init when not logged in', () => {
    (auth.getUserId as any).mockReturnValue(null);

    fixture.detectChanges();

    expect(users.getUser).not.toHaveBeenCalled();
    expect(component.user()).toBeNull();
  });

  it('should search users after debounce and open results', async () => {
    fixture.detectChanges(); // ngOnInit → setupSearch()

    component.search.setValue('to');

    vi.advanceTimersByTime(250);
    await vi.runAllTimersAsync(); // ✅ Vitest-compatible
    fixture.detectChanges();

    expect(users.searchUsers).toHaveBeenCalledWith('to', 8, 1);
    expect(component.open()).toBe(true);
    expect(component.searching()).toBe(false);
  });

  it('should handle search errors by returning empty results and not crashing', () => {
    (users.searchUsers as any).mockReturnValueOnce(throwError(() => new Error('boom')));

    fixture.detectChanges();

    component.search.setValue('to');
    vi.advanceTimersByTime(250);
    fixture.detectChanges();

    expect(component.results()).toEqual([]);
    expect(component.searching()).toBe(false);
  });

  it('keeps dismissed results closed when a debounced search finishes', () => {
    fixture.detectChanges();
    component.search.setValue('to');
    expect(component.searchStatus).toBe('Searching…');

    component.close();
    vi.advanceTimersByTime(250);

    expect(component.open()).toBe(false);
    expect(component.searchStatus).toBe('');
  });

  it('ignores a pending search response after the query is cleared', () => {
    const response = new Subject<any>();
    (users.searchUsers as any).mockReturnValueOnce(response);
    fixture.detectChanges();
    component.search.setValue('to');
    vi.advanceTimersByTime(250);

    component.search.setValue('');
    response.next({ users: [{ _id: 'u1', fullName: 'Tobi' }] });

    expect(component.results()).toEqual([]);
    expect(component.searching()).toBe(false);
    expect(component.searchStatus).toBe('');
  });

  it('goToUser should close dropdown, clear results and navigate', () => {
    fixture.detectChanges();

    component.search.setValue('Tobi');
    component.mobileSearchOpen.set(true);
    component.open.set(true);
    component.results.set([{ _id: 'u2' } as any]);

    component.goToUser('u2');

    expect(component.open()).toBe(false);
    expect(component.results()).toEqual([]);
    expect(component.mobileSearchOpen()).toBe(false);
    expect(component.search.value).toBe('');
    expect(router.navigate).toHaveBeenCalledWith(['/users', 'u2']);
  });

  it('dismisses mobile search without losing the query or reopening pending results', () => {
    fixture.detectChanges();
    component.search.setValue('Tobi');
    component.openMobileSearch();
    expect(component.mobileSearchOpen()).toBe(true);

    component.dismissSearch();
    vi.advanceTimersByTime(250);

    expect(component.mobileSearchOpen()).toBe(false);
    expect(component.open()).toBe(false);
    expect(component.search.value).toBe('Tobi');
  });

  it('logout should call auth.logout and navigate to /login', () => {
    (auth.isLoggedIn as any).mockReturnValue(true);

    fixture.detectChanges();

    component.logout();

    expect(auth.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
