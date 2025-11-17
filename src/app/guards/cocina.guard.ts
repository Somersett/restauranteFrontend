import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class CocinaGuard implements CanActivate {
  private auth = inject(AuthService);
  private router = inject(Router);

  canActivate(): any {
    if (!this.auth.getToken()) {
      this.router.navigate(['/login']);
      return false;
    }
    if (this.auth.isAuthenticated() && this.auth.hasRole('cocina')) return true;
    return this.auth.me().pipe(
      map(() => {
        if (this.auth.hasRole('cocina')) return true;
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
