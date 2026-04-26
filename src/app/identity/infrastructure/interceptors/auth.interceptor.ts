import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const token = localStorage.getItem('auth_token');
  const urlMatches = request.url.startsWith(environment.platformProviderApiBaseUrl);

  if (!token || !urlMatches) {
    return next(request);
  }

  const cloned = request.clone({
    headers: request.headers.set('Authorization', `Bearer ${token}`),
  });

  return next(cloned);
};
