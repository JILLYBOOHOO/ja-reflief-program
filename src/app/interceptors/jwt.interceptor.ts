import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Add auth header with jwt if user is logged in and request is to api url
    const token = localStorage.getItem('survivor_token');
    if (token && token.trim() !== '' && token !== 'undefined' && token !== 'null') {
      console.log(`[JwtInterceptor] Adding Authorization header for: ${request.url}`);
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    } else {
      console.warn(`[JwtInterceptor] No valid token found for: ${request.url}. Found:`, token);
    }

    return next.handle(request);
  }
}
