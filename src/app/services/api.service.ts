import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../api.tokens';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = inject(API_BASE_URL);

  private buildUrl(path: string) {
    const base = (this.base ?? '').toString().replace(/\/$/, '');
    const p = (path ?? '').toString().replace(/^\//, '');
    return `${base}/${p}`;
  }

  get<T>(path: string, options?: any) {
    return this.http.get<T>(this.buildUrl(path), options);
  }

  post<T>(path: string, body: any, options?: any) {
    return this.http.post<T>(this.buildUrl(path), body, options);
  }

  put<T>(path: string, body: any, options?: any) {
    return this.http.put<T>(this.buildUrl(path), body, options);
  }

  delete<T>(path: string, options?: any) {
    return this.http.delete<T>(this.buildUrl(path), options);
  }
}
