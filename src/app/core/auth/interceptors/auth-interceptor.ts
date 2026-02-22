import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    
    const token = this.authService.getToken();
    if (token) {
      request = this.addToken(request, token);
    }

    return next.handle(request).pipe(
      catchError(error => this.handleError(error, request, next))
    );
  }

  
  private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
  if (!token) return request; 
  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}

 
  private handleError(
    error: HttpErrorResponse,
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {

    if (error.status === 401) {
      return this.handle401Error(request, next);
    }


    if (error.status === 403) {
      this.authService.logout();
      this.router.navigate(['/auth']);
      return throwError(() => new Error('Access denied. Please login again.'));
    }


    return throwError(() => error);
  }


  private handle401Error(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
 
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refreshToken().pipe(
        switchMap(response => {
          this.isRefreshing = false;
          const token = response.token;
          this.refreshTokenSubject.next(token);
          return next.handle(this.addToken(request, token));
        }),
        catchError(err => {
          this.isRefreshing = false;
          this.authService.logout();
          this.router.navigate(['/auth']);
          return throwError(() => new Error('Token refresh failed. Please login again.'));
        })
      );
    } else {

      return this.refreshTokenSubject.pipe(
        filter(token => token != null),
        take(1),
        switchMap(token => {
          return next.handle(this.addToken(request, token));
        }),
        catchError(err => {
          this.authService.logout();
          this.router.navigate(['/auth']);
          return throwError(() => new Error('Request failed and token refresh failed.'));
        })
      );
    }
  }
}
