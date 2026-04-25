import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const token = localStorage.getItem('auth_token');

  if (!token || !request.url.startsWith(environment.platformProviderApiBaseUrl)) {
    return next(request);
  }

  return next(
    request.clone({
      headers: request.headers.set('Authorization', `Bearer ${token}`),
    })
  );
};
