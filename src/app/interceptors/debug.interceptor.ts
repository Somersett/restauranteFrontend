import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpResponse, HttpEventType } from '@angular/common/http';
import { API_BASE_URL } from '../api.tokens';
import { tap } from 'rxjs/operators';

export const debugInterceptor: HttpInterceptorFn = (req, next) => {
  const base = inject(API_BASE_URL) as string | undefined;
  const url = (req.url || '').toString();
  try {
    const baseStr = (base ?? '').toString().replace(/\/$/, '');
    if (baseStr && url.startsWith(baseStr)) {
      // Log outgoing request details useful for CSRF debugging
      try {
        console.groupCollapsed(`[DEBUG] API Request -> ${req.method} ${url}`);
        console.log('document.cookie:', typeof document !== 'undefined' ? document.cookie : '(no document)');
        console.log('withCredentials:', (req as any).withCredentials === true);
        console.log('Request headers:');
        const keys = req.headers ? req.headers.keys() : [];
        if (keys.length === 0) console.log('(no headers)');
        keys.forEach(k => console.log(k + ':', req.headers.get(k)));
        console.groupEnd();
      } catch (err) {
        try { console.debug('[DEBUG] failed to print request debug', err); } catch {}
      }
      return next(req).pipe(
        tap((ev: any) => {
          if (ev instanceof HttpResponse) {
            try {
              console.groupCollapsed(`[DEBUG] API Response <- ${req.method} ${url} -> ${ev.status}`);
              console.log('Response status:', ev.status, ev.statusText);
              try { console.log('Response headers keys:', ev.headers ? ev.headers.keys() : []); } catch {}
              console.log('Response body preview:', ev.body);
              console.groupEnd();
            } catch (err) {
              try { console.debug('[DEBUG] failed to print response debug', err); } catch {}
            }
          }
        })
      );
    }
  } catch {
    // ignore
  }
  return next(req);
};
