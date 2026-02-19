import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { JwtUtilService } from './jwt-util.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = '/api/Auth';
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private jwtUtil: JwtUtilService
  ) {
    this.validateTokenOnInit();
    this.isAuthenticatedSubject.next(this.hasValidToken());
    this.currentUserSubject.next(this.getClaims());
  }


  private validateTokenOnInit(): void {
    const token = this.getToken();
    if (token && !this.jwtUtil.isValidTokenStructure(token)) {
      this.logout();
    }
  }

//   login(username: string, password: string) {
  
//   this.http.post<{ token: string }>(`${this.apiUrl}/login`, { username, password })
//     .subscribe({
//       next: (response) => {
//         if (response.token) {

//           localStorage.setItem('authToken', response.token);
//           this.isAuthenticatedSubject.next(true);
//         }
//       },
//       error: (error) => {

//         console.error('Login failed:', error);
//         if (error.status === 401) {
//           this.logout();
//         }
//       }
//     });
// }



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

  
  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('tokenExpiry');
    this.isAuthenticatedSubject.next(false);
    this.currentUserSubject.next(null);
  }


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


  getToken(): string | null {
    const token = localStorage.getItem('authToken');
    

    if (token && this.jwtUtil.isTokenExpired(token)) {
      this.logout();
      return null;
    }
    
    return token;
  }

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


  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) {
      this.isAuthenticatedSubject.next(false);
      return false;
    }
    return !this.jwtUtil.isTokenExpired(token);
  }


  isTokenExpired(): boolean {
    const token = this.getToken();
    return !token || this.jwtUtil.isTokenExpired(token);
  }


  getTokenExpirationTime(): number {
    const token = this.getToken();
    if (!token) return -1;
    return this.jwtUtil.getTokenExpirationTime(token);
  }

 
  getClaims(): any {
    const token = this.getToken();
    if (!token) return null;
    return this.jwtUtil.getTokenClaims(token);
  }

 
  private hasValidToken(): boolean {
    const token = localStorage.getItem('authToken');
    if (!token) return false;
    
    if (!this.jwtUtil.isValidTokenStructure(token)) return false;
    
    return !this.jwtUtil.isTokenExpired(token);
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';
    
    if (error.error instanceof ErrorEvent) {
 
      errorMessage = error.error.message;
    } else {

      errorMessage = error.error?.message || error.statusText || 'Server error';
      

      if (error.status === 401) {
        this.logout();
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }
}
