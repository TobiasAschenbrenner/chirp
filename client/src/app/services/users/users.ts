import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class Users {
  constructor(private http: HttpClient) {}

  getUser(id: string) {
    return this.http.get<any>(`/api/users/${id}`);
  }
}
