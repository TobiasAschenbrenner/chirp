import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { LoginPayload, LoginResponse, RegisterPayload } from '../../models/auth.model';

@Injectable({ providedIn: 'root' })
export class Auth {
  private static readonly TOKEN_KEY = 'chirp_token';
  private static readonly USER_ID_KEY = 'chirp_user_id';

  constructor(private http: HttpClient) {}

  login(payload: LoginPayload): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`/api/users/login`, payload)
      .pipe(tap((res) => this.persistSession(res)));
  }

  register(payload: RegisterPayload): Observable<unknown> {
    return this.http.post('/api/users/register', payload);
  }

  logout(): void {
    this.remove(Auth.TOKEN_KEY);
    this.remove(Auth.USER_ID_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    return this.read(Auth.TOKEN_KEY);
  }

  getUserId(): string | null {
    return this.read(Auth.USER_ID_KEY);
  }

  private persistSession(res: LoginResponse): void {
    this.setToken(res.token);
    this.setUserId(res.id);
  }

  private setToken(token: string): void {
    this.write(Auth.TOKEN_KEY, token);
  }

  private setUserId(id: string): void {
    this.write(Auth.USER_ID_KEY, id);
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
