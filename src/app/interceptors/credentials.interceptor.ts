import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { API_BASE_URL } from '../api.tokens';

export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  const base = inject(API_BASE_URL) as string | undefined;
  const url = (req.url || '').toString();
  try {
    const baseStr = (base ?? '').toString().replace(/\/$/, '');
    if (baseStr && url.startsWith(baseStr)) {
      // ensure browser will send cookies for same-origin/backend calls
      return next(req.clone({ withCredentials: true }));
    }
  } catch {
    // fallthrough
  }
  return next(req);
};
