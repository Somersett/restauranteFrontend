import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, withXsrfConfiguration } from '@angular/common/http';

import { routes } from './app.routes';
import { API_BASE_URL } from './api.tokens';
import { authInterceptor } from './interceptors/auth.interceptor';
import { credentialsInterceptor } from './interceptors/credentials.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([credentialsInterceptor, authInterceptor]), withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' })),
    { provide: API_BASE_URL, useValue: 'http://localhost:8000' }
  ]
};
