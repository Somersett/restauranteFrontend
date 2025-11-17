import { AuthInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';

describe('AuthInterceptor', () => {
  it('should add Authorization header when token exists', (done) => {
    const mockAuth: any = { getToken: () => 'abc' };
    const mockRouter: any = {};
    const interceptor = new AuthInterceptor();

    // Monkey-patch injected auth and router (simple since we used inject())
    (interceptor as any).auth = mockAuth;
    (interceptor as any).router = mockRouter;

    const req: any = { clone: (x: any) => ({ ...x }), headers: {} };
    const next: any = { handle: (r: any) => of(r) };

    interceptor.intercept(req as any, next as any).subscribe((r: any) => {
      expect(r.setHeaders.Authorization).toContain('Bearer');
      done();
    });
  });
});
