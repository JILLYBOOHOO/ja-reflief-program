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
        
        // Handle connection issues (status 0)
        if (err.status === 0) {
          return throwError(() => 'Unable to connect to the JA RELIEF server. Please ensure the backend is running or check your internet connection.');
        }

        let error = err.statusText || 'Server Error';
        
        // Handle structured JSON errors from backend
        if (err.error) {
          if (err.error.error) {
            error = err.error.error;
          } else if (err.error.message) {
            error = err.error.message;
          } else if (err.error.errors && Array.isArray(err.error.errors)) {
            error = err.error.errors.map((e: any) => e.msg).join(', ');
          }
        }

        console.error('HTTP Error Interceptor:', error);
        return throwError(() => error);
      }
      return throwError(() => 'An unexpected system error occurred. Please try again later.');
    }));
  }
}
