import { TestBed } from '@angular/core/testing';
import { Sidebar } from './sidebar';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { Auth } from '../../services/auth/auth';

class AuthStub {
  getUserId() {
    return null as string | null;
  }
}

describe('Sidebar', () => {
  let auth: AuthStub;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Sidebar],
      providers: [provideRouter([]), { provide: Auth, useClass: AuthStub }],
    }).compileComponents();

    auth = TestBed.inject(Auth) as unknown as AuthStub;
    vi.spyOn(auth, 'getUserId');
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(Sidebar);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should expose auth to the template', () => {
    const fixture = TestBed.createComponent(Sidebar);
    fixture.detectChanges();

    expect(auth.getUserId).toHaveBeenCalled();
  });
});
