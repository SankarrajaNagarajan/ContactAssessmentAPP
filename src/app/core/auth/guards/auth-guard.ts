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
 
    if (state.url && state.url.startsWith('/auth')) {
      return true;
    }

    const token = this.authService.getToken();


    if (!token) {
  
      this.router.navigate(['/auth'], { queryParams: { returnUrl: state.url } });
      return false;
    }


    if (!this.jwtUtil.isValidTokenStructure(token)) {
      console.warn('Invalid token structure detected');
      this.authService.logout();
      this.router.navigate(['/auth'], { queryParams: { returnUrl: state.url } });
      return false;
    }


    if (this.jwtUtil.isTokenExpired(token)) {
      console.warn('Token has expired');
      this.authService.logout();
      this.router.navigate(['/auth'], { queryParams: { returnUrl: state.url } });
      return false;
    }


    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth'], { queryParams: { returnUrl: state.url } });
      return false;
    }


    const remainingTime = this.jwtUtil.getTokenExpirationTime(token);
    if (remainingTime > 0 && remainingTime < 300000) { 
      console.warn('Token expiring soon. Remaining time:', remainingTime / 1000, 'seconds');
    }

    return true;
  }
}
