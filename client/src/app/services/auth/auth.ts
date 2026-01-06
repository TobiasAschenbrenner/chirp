import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  id: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const TOKEN_KEY = 'chirp_token';
const USER_ID_KEY = 'chirp_user_id';

@Injectable({ providedIn: 'root' })
export class Auth {
  constructor(private http: HttpClient) {}

  login(payload: LoginPayload): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`/api/users/login`, payload).pipe(
      tap((res) => {
        this.setToken(res.token);
        this.setUserId(res.id);
      })
    );
  }

  logout(): void {
    this.remove(TOKEN_KEY);
    this.remove(USER_ID_KEY);
  }

  getToken(): string | null {
    return this.read(TOKEN_KEY);
  }

  getUserId(): string | null {
    return this.read(USER_ID_KEY);
  }

  private setToken(token: string): void {
    this.write(TOKEN_KEY, token);
  }

  private setUserId(id: string): void {
    this.write(USER_ID_KEY, id);
  }

  register(payload: RegisterPayload): Observable<unknown> {
    return this.http.post('/api/users/register', payload);
  }

  private read(key: string): string | null {
    return localStorage.getItem(key);
  }

  private write(key: string, value: string): void {
    localStorage.setItem(key, value);
  }

  private remove(key: string): void {
    localStorage.removeItem(key);
  }
}
