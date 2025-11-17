import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  private auth = inject(AuthService);
  private router = inject(Router);

  canActivate(): any {
    // If there's no token, redirect immediately
    if (!this.auth.getToken()) {
      this.router.navigate(['/login']);
      return false;
    }

    // If we already have role info, allow immediately
    if (this.auth.isAuthenticated() && this.auth.hasRole('admin')) return true;

    // Otherwise try to refresh user info via /me before deciding
    return this.auth.me().pipe(
      map(() => {
        if (this.auth.hasRole('admin')) return true;
        this.router.navigate(['/login']);
        return false;
      }),
      catchError(() => {
        this.router.navigate(['/login']);
        return of(false);
      })
    );
  }
}
