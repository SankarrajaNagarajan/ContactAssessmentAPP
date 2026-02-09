import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { JwtUtilService } from '../../services/jwt-util.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private jwtUtil: JwtUtilService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    // Allow access to auth routes without authentication
    if (state.url && state.url.startsWith('/auth')) {
      return true;
    }

    const token = this.authService.getToken();

    // Check if token exists
    if (!token) {
      // Not authenticated, redirect to login and pass return url
      this.router.navigate(['/auth'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    // Check if token has valid structure
    if (!this.jwtUtil.isValidTokenStructure(token)) {
      console.warn('Invalid token structure detected');
      this.authService.logout();
      this.router.navigate(['/auth'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    // Check if token is expired
    if (this.jwtUtil.isTokenExpired(token)) {
      console.warn('Token has expired');
      this.authService.logout();
      this.router.navigate(['/auth'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    // Get token remaining time for warning
    const remainingTime = this.jwtUtil.getTokenExpirationTime(token);
    if (remainingTime > 0 && remainingTime < 300000) { // Less than 5 minutes
      console.warn('Token expiring soon. Remaining time:', remainingTime / 1000, 'seconds');
    }

    return true;
  }
}
