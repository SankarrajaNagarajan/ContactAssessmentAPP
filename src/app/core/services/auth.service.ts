import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { JwtUtilService } from './jwt-util.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = '/api/Auth';
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  private currentUserSubject = new BehaviorSubject<any>(this.getClaims());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private jwtUtil: JwtUtilService
  ) {
    this.validateTokenOnInit();
  }

  /**
   * Validate token on service initialization
   */
  private validateTokenOnInit(): void {
    const token = this.getToken();
    if (token && !this.jwtUtil.isValidTokenStructure(token)) {
      this.logout();
    }
  }

  /**
   * Login with username and password
   */
  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { username, password }).pipe(
      tap(response => {
        if (response.token) {
          this.storeToken(response.token);
        }
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Logout and clear token
   */
  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('tokenExpiry');
    this.isAuthenticatedSubject.next(false);
    this.currentUserSubject.next(null);
  }

  /**
   * Store token and update authentication state
   */
  private storeToken(token: string): void {
    if (this.jwtUtil.isValidTokenStructure(token)) {
      localStorage.setItem('authToken', token);
      
      const expirationTime = this.jwtUtil.getTokenExpirationTime(token);
      if (expirationTime > 0) {
        localStorage.setItem('tokenExpiry', (Date.now() + expirationTime).toString());
      }
      
      this.isAuthenticatedSubject.next(true);
      this.currentUserSubject.next(this.getClaims());
    }
  }

  /**
   * Get stored JWT token
   */
  getToken(): string | null {
    const token = localStorage.getItem('authToken');
    
    // If token exists but is expired, remove it
    if (token && this.jwtUtil.isTokenExpired(token)) {
      this.logout();
      return null;
    }
    
    return token;
  }

  /**
   * Refresh the JWT token (if the backend supports it)
   */
  refreshToken(): Observable<any> {
    const currentToken = this.getToken();
    if (!currentToken) {
      return throwError(() => new Error('No token to refresh'));
    }

    return this.http.post<any>(`${this.apiUrl}/refresh`, { token: currentToken }).pipe(
      tap(response => {
        if (response.token) {
          this.storeToken(response.token);
        }
      }),
      catchError(error => {
        this.logout();
        return throwError(() => error);
      })
    );
  }

  /**
   * Check if user is authenticated and token is valid
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) {
      this.isAuthenticatedSubject.next(false);
      return false;
    }
    return !this.jwtUtil.isTokenExpired(token);
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(): boolean {
    const token = this.getToken();
    return !token || this.jwtUtil.isTokenExpired(token);
  }

  /**
   * Get token expiration time in milliseconds
   */
  getTokenExpirationTime(): number {
    const token = this.getToken();
    if (!token) return -1;
    return this.jwtUtil.getTokenExpirationTime(token);
  }

  /**
   * Get current user claims from token
   */
  getClaims(): any {
    const token = this.getToken();
    if (!token) return null;
    return this.jwtUtil.getTokenClaims(token);
  }

  /**
   * Check if user has valid token on initialization
   */
  private hasValidToken(): boolean {
    const token = localStorage.getItem('authToken');
    if (!token) return false;
    
    if (!this.jwtUtil.isValidTokenStructure(token)) return false;
    
    return !this.jwtUtil.isTokenExpired(token);
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      errorMessage = error.error?.message || error.statusText || 'Server error';
      
      // If 401, clear token
      if (error.status === 401) {
        this.logout();
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }
}
