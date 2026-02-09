import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../../core/services/auth.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class Login implements OnInit, OnDestroy {
  loginForm: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  returnUrl: string = '';
  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/contacts';
    if (this.authService.isAuthenticated()) {
      this.router.navigate([this.returnUrl]);
    }
    this.error = '';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get f() {
    return this.loginForm.controls;
  }

  onSubmit(): void {
    this.submitted = true;
    this.error = '';
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;

    this.authService
      .login(this.f['username'].value, this.f['password'].value)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading = false;

    
          const token = this.authService.getToken();
          if (token) {
            console.log('Login successful. Token stored.');
     
            this.router.navigate([this.returnUrl]);
          } else {
            this.error = 'Login failed: Token not stored. Please try again.';
          }
        },
        error: (err) => {
          this.loading = false;
          this.handleLoginError(err);
        }
      });
  }


  private handleLoginError(error: any): void {
    console.error('Login error:', error);

    if (error.status === 401) {
      this.error = 'Invalid username or password';
    } else if (error.status === 400) {
      this.error = error.message || 'Invalid login request';
    } else if (error.status === 500) {
      this.error = 'Server error. Please try again later.';
    } else if (error.statusText === 'Unknown Error') {
      this.error = 'Unable to connect to server. Please check your connection.';
    } else {
      this.error = error.message || 'Login failed. Please try again.';
    }
  }
}
