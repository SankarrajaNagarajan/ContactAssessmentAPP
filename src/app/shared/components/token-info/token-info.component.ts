import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { JwtUtilService } from '../../../core/services/jwt-util.service';
import { Subject, interval } from 'rxjs';
import { takeUntil, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-token-info',
  standalone: true,
  imports: [CommonModule],
  template: ``,
  styles: ``,
})
export class TokenInfoComponent implements OnInit, OnDestroy {
  isAuthenticated = false;
  userClaims: any = null;
  formattedRemainingTime = '';
  tokenExpiringAlert = false;
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private jwtUtil: JwtUtilService
  ) {}

  ngOnInit(): void {

    this.authService.isAuthenticated$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(isAuth => {
      this.isAuthenticated = isAuth;
      if (isAuth) {
        this.userClaims = this.authService.getClaims();
      } else {
        this.userClaims = null;
      }
    });


    interval(1000).pipe(
      startWith(0),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.updateTokenInfo();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateTokenInfo(): void {
    const token = this.authService.getToken();
    if (!token) {
      this.formattedRemainingTime = 'Not available';
      return;
    }

    const remainingMs = this.jwtUtil.getTokenExpirationTime(token);
    this.tokenExpiringAlert = remainingMs > 0 && remainingMs < 300000; 

    if (remainingMs <= 0) {
      this.formattedRemainingTime = 'Expired';
    } else {
      const totalSeconds = Math.floor(remainingMs / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      if (hours > 0) {
        this.formattedRemainingTime = `${hours}h ${minutes}m ${seconds}s`;
      } else if (minutes > 0) {
        this.formattedRemainingTime = `${minutes}m ${seconds}s`;
      } else {
        this.formattedRemainingTime = `${seconds}s`;
      }
    }
  }
}
