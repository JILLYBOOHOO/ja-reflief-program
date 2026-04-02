import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(catchError(err => {
      if (err instanceof HttpErrorResponse) {
        if ([401, 403].includes(err.status)) {
          // Auto logout if 401 or 403 response returned from api
          this.authService.logout();
        }
        
        const error = err.error?.message || err.error?.error || err.statusText;
        console.error('HTTP Error Interceptor:', error);
        return throwError(() => error);
      }
      return throwError(() => 'Something went wrong. Please try again later.');
    }));
  }
}
