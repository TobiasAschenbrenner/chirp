import { TestBed } from '@angular/core/testing';
import { MainLayout } from './main-layout';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { of, throwError } from 'rxjs';

import { Auth } from '../../services/auth/auth';
import { Users } from '../../services/users/users';

class AuthStub {
  getToken() {
    return null as string | null;
  }
  isLoggedIn() {
    return false;
  }
  getUserId() {
    return null as string | null;
  }
}

class UsersStub {
  loadBookmarks() {
    return of(void 0);
  }
}

describe('MainLayout', () => {
  let auth: AuthStub;
  let users: UsersStub;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainLayout],
      providers: [
        provideRouter([]),
        { provide: Auth, useClass: AuthStub },
        { provide: Users, useClass: UsersStub },
      ],
    }).compileComponents();

    auth = TestBed.inject(Auth) as unknown as AuthStub;
    users = TestBed.inject(Users) as unknown as UsersStub;

    vi.spyOn(auth, 'getToken');
    vi.spyOn(auth, 'isLoggedIn');
    vi.spyOn(auth, 'getUserId');
    vi.spyOn(users, 'loadBookmarks');
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(MainLayout);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should not load bookmarks when not logged in', () => {
    (auth.getToken as any).mockReturnValue(null);
    (auth.isLoggedIn as any).mockReturnValue(false);

    const fixture = TestBed.createComponent(MainLayout);
    fixture.detectChanges();

    expect(users.loadBookmarks).not.toHaveBeenCalled();
  });

  it('should load bookmarks when token exists', () => {
    (auth.getToken as any).mockReturnValue('token');
    (auth.isLoggedIn as any).mockReturnValue(false);

    const fixture = TestBed.createComponent(MainLayout);
    fixture.detectChanges();

    expect(users.loadBookmarks).toHaveBeenCalledTimes(1);
  });

  it('should load bookmarks when isLoggedIn is true', () => {
    (auth.getToken as any).mockReturnValue(null);
    (auth.isLoggedIn as any).mockReturnValue(true);

    const fixture = TestBed.createComponent(MainLayout);
    fixture.detectChanges();

    expect(users.loadBookmarks).toHaveBeenCalledTimes(1);
  });

  it('should swallow loadBookmarks errors', () => {
    (auth.getToken as any).mockReturnValue('token');
    (users.loadBookmarks as any).mockReturnValueOnce(throwError(() => new Error('fail')));

    const fixture = TestBed.createComponent(MainLayout);

    expect(() => fixture.detectChanges()).not.toThrow();
  });
});
