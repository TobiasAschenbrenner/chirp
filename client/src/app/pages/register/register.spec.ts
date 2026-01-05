import { TestBed } from '@angular/core/testing';
import { Register } from './register';
import { provideRouter } from '@angular/router';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { of, throwError } from 'rxjs';

import { Auth } from '../../services/auth/auth';

class AuthStub {
  register(payload: {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) {
    return of(void 0);
  }
}

describe('Register', () => {
  let auth: AuthStub;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [provideRouter([]), { provide: Auth, useClass: AuthStub }],
    }).compileComponents();

    auth = TestBed.inject(Auth) as unknown as AuthStub;
    router = TestBed.inject(Router);

    vi.spyOn(auth, 'register');
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  function createComponent() {
    const fixture = TestBed.createComponent(Register);
    fixture.detectChanges();
    return fixture;
  }

  it('should create', () => {
    const fixture = createComponent();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should toggle password visibility', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    expect(component.showPassword).toBe(false);

    component.togglePassword();
    expect(component.showPassword).toBe(true);

    component.togglePassword();
    expect(component.showPassword).toBe(false);
  });

  it('should show error if any field is missing', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.userData = {
      fullName: '',
      email: 'test@example.com',
      password: 'secret',
      confirmPassword: 'secret',
    };

    component.registerUser();

    expect(component.error).toBe('Please fill out all fields.');
    expect(auth.register).not.toHaveBeenCalled();
  });

  it('should show error if passwords do not match', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.userData = {
      fullName: 'Tobi',
      email: 'test@example.com',
      password: 'secret',
      confirmPassword: 'different',
    };

    component.registerUser();

    expect(component.error).toBe('Passwords do not match.');
    expect(auth.register).not.toHaveBeenCalled();
  });

  it('should register and navigate to /login on success', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.userData = {
      fullName: '  Tobi  ',
      email: '  test@example.com  ',
      password: 'secret',
      confirmPassword: 'secret',
    };

    component.registerUser();

    expect(auth.register).toHaveBeenCalledWith({
      fullName: 'Tobi',
      email: 'test@example.com',
      password: 'secret',
      confirmPassword: 'secret',
    });

    expect(router.navigate).toHaveBeenCalledWith(['/login']);
    expect(component.loading).toBe(false);
  });

  it('should show error message when registration fails', () => {
    vi.spyOn(auth, 'register').mockReturnValueOnce(
      throwError(() => ({
        error: { message: 'Email already exists' },
      }))
    );

    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.userData = {
      fullName: 'Tobi',
      email: 'test@example.com',
      password: 'secret',
      confirmPassword: 'secret',
    };

    component.registerUser();

    expect(component.error).toBe('Email already exists');
    expect(component.loading).toBe(false);
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
