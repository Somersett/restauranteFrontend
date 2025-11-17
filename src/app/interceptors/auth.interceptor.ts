import { inject } from '@angular/core';
import {
  HttpInterceptorFn,
  HttpErrorResponse
} from '@angular/common/http';
import { BehaviorSubject, throwError } from 'rxjs';
import { catchError, filter, switchMap, take, finalize } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

let isRefreshing = false;
const refreshSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  
  const token = auth.getToken();
  let authReq = req;
  if (token) {
    authReq = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(authReq).pipe(
    catchError((err: any) => {
      // If the request itself is login or refresh, do not try to refresh again
      const url = (req.url || '').toString();
      if (url.includes('/login') || url.includes('/refresh')) {
        return throwError(() => err);
      }

      if (err instanceof HttpErrorResponse && err.status === 401) {
        if (!isRefreshing) {
          isRefreshing = true;
          refreshSubject.next(null);

          return auth.refresh().pipe(
            switchMap((res: any) => {
              const newToken = res?.token ?? res?.access_token ?? auth.getToken();
              refreshSubject.next(newToken ?? null);
              return next(req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } }));
            }),
            catchError((refreshErr) => {
              auth.logout().subscribe(() => {});
              try { router.navigate(['/login']); } catch {}
              return throwError(() => refreshErr);
            }),
            finalize(() => {
              isRefreshing = false;
            })
          );
        } else {
          return refreshSubject.pipe(
            filter((token) => token != null),
            take(1),
            switchMap((token) => {
              return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
            })
          );
        }
      }
      return throwError(() => err);
    })
  );
};
