import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, tap, switchMap } from 'rxjs/operators';
import { ApiService } from './api.service';

function decodeJwt(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private accessTokenKey = 'access_token';

  private _currentUser$ = new BehaviorSubject<any>(null);
  currentUser$ = this._currentUser$.asObservable();

  constructor() {
    const token = localStorage.getItem(this.accessTokenKey);
    if (token) {
      const payload = decodeJwt(token);
      if (payload) {
        this._currentUser$.next(payload);
      }
    }
  }

  private setToken(token: string | null) {
    if (token) {
      localStorage.setItem(this.accessTokenKey, token);
      const p = decodeJwt(token);
        
      this._currentUser$.next(p);
    } else {
      localStorage.removeItem(this.accessTokenKey);
      this._currentUser$.next(null);
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.accessTokenKey);
  }

  login(credentials: { email: string; password: string }): Observable<any> {
    // Ensure the Laravel Sanctum CSRF cookie is set before attempting login.
    // This hits `/sanctum/csrf-cookie` (relative path via ApiService) and waits for it,
    // then performs the login POST. Use withCredentials via the credentials interceptor.
    return this.api.get<any>('sanctum/csrf-cookie', { withCredentials: true }).pipe(
      switchMap(() => this.api.post<any>('api/login', credentials, { withCredentials: true })),
      tap((res: any) => {
        const token = res?.token ?? res?.access_token ?? null;
        if (token) this.setToken(token);
        if (res?.user) {
          this._currentUser$.next(res.user);
        }
      })
    );
  }

  logout(): Observable<any> {
    return this.api.post<any>('api/logout', {}).pipe(
      catchError(() => of(null)),
      tap(() => {
        this.setToken(null);
      })
    );
  }

  me(): Observable<any> {
    return this.api.get<any>('api/me').pipe(
      tap((res: any) => {
        // Backend /me may return the user directly or wrapped; normalize both
        const user = res?.user ?? res;
        if (user) this._currentUser$.next(user);
      }),
      catchError((err) => throwError(() => err))
    );
  }

  refresh(): Observable<any> {
    return this.api.post<any>('api/refresh', {}).pipe(
      tap((res: any) => {
        const token = res?.token ?? res?.access_token ?? null;
        if (token) this.setToken(token);
      })
    );
  }

  isAuthenticated(): boolean {
    const t = this.getToken();
    if (!t) return false;
    const p = decodeJwt(t);
    if (!p) return true;
    if (p.exp) {
      const now = Math.floor(Date.now() / 1000);
      return p.exp > now;
    }
    return true;
  }

  hasRole(role: string): boolean {
    const user = this._currentUser$.value;
    

    // 1) If we have a user object, inspect common shapes
    if (user) {
      const roles = user?.roles ?? user?.role ?? user?.data?.roles ?? user?.data?.role ?? user?.user?.roles ?? null;
      if (roles) {
        if (Array.isArray(roles)) return roles.includes(role);
        if (typeof roles === 'string') return roles === role;
        if (roles?.name) return roles.name === role;
      }
      const single = user?.role || user?.position || null;
      if (single) return single === role || single?.name === role;
    }

    // 2) Fallback: try to read roles from token payload (if JWT)
    const token = this.getToken();
    if (!token) return false;
    const payload = decodeJwt(token);
    if (!payload) return false;
    const rolesFromPayload = payload?.roles ?? payload?.role ?? payload?.user?.roles ?? payload?.user?.role ?? null;
    if (!rolesFromPayload) return false;
    if (Array.isArray(rolesFromPayload)) return rolesFromPayload.includes(role);
    if (typeof rolesFromPayload === 'string') return rolesFromPayload === role;
    if (rolesFromPayload?.name) return rolesFromPayload.name === role;
    return false;
  }
}
