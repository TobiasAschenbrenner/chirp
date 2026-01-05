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
    vi.spyOn(users, 'loadBookmarks');
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(MainLayout);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should not load bookmarks when not logged in', () => {
    vi.spyOn(auth, 'getToken').mockReturnValue(null);
    vi.spyOn(auth, 'isLoggedIn').mockReturnValue(false);

    const fixture = TestBed.createComponent(MainLayout);
    fixture.detectChanges();

    expect(users.loadBookmarks).not.toHaveBeenCalled();
  });

  it('should load bookmarks when token exists', () => {
    vi.spyOn(auth, 'getToken').mockReturnValue('token');
    vi.spyOn(auth, 'isLoggedIn').mockReturnValue(false);

    const fixture = TestBed.createComponent(MainLayout);
    fixture.detectChanges();

    expect(users.loadBookmarks).toHaveBeenCalled();
  });

  it('should load bookmarks when isLoggedIn is true', () => {
    vi.spyOn(auth, 'getToken').mockReturnValue(null);
    vi.spyOn(auth, 'isLoggedIn').mockReturnValue(true);

    const fixture = TestBed.createComponent(MainLayout);
    fixture.detectChanges();

    expect(users.loadBookmarks).toHaveBeenCalled();
  });

  it('should swallow loadBookmarks errors', () => {
    vi.spyOn(auth, 'getToken').mockReturnValue('token');
    vi.spyOn(users, 'loadBookmarks').mockReturnValueOnce(throwError(() => new Error('fail')));

    const fixture = TestBed.createComponent(MainLayout);

    expect(() => fixture.detectChanges()).not.toThrow();
  });
});
