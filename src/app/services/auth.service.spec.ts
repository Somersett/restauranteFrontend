import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import { of } from 'rxjs';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    const apiMock = {
      post: (url: string, body: any) => {
        if (url === 'api/login') {
          return of({ access_token: 'header.payload.signature' });
        }
        if (url === 'api/logout') return of(null);
        if (url === 'api/refresh') return of({ access_token: 'new.header.payload' });
        return of(null);
      },
      get: (url: string) => of({ id: 1, name: 'Test', roles: ['admin'] })
    };

    TestBed.configureTestingModule({ providers: [{ provide: ApiService, useValue: apiMock }] });
    service = TestBed.inject(AuthService);
    localStorage.removeItem('access_token');
  });

  it('should login and store token', (done) => {
    service.login({ username: 'x', password: 'p' }).subscribe(() => {
      expect(localStorage.getItem('access_token')).toBeTruthy();
      service.currentUser$.subscribe((u) => {
        // payload decode may be null for fake token, but localStorage should exist
        expect(localStorage.getItem('access_token')).toBe('header.payload.signature');
        done();
      });
    });
  });
});
