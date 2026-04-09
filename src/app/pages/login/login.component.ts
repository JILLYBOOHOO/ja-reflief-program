import { Component, OnInit, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { GuideService } from '../../services/guide.service';
import { SocialAuthService, GoogleLoginProvider } from '@abacritt/angularx-social-login';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  loginError = false;
  errorMessage = '';
  isAdminMode = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private guideService: GuideService
  ) { }

  ngOnInit(): void {
    // If already logged in, go straight to dashboard
    if (this.authService.currentUserValue) {
      this.router.navigate(['/dashboard']);
    }

    this.loginForm = this.fb.group({
      identifier: ['', Validators.required],
      password: ['', Validators.required],
      rememberMe: [false]
    });

    const savedIdentifier = localStorage.getItem('ja_relief_saved_identifier');
    if (savedIdentifier) {
      this.loginForm.patchValue({
        identifier: savedIdentifier,
        rememberMe: true
      });
    }

    // External SSO (Google) has been explicitly disabled.
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.guideService.autoStartIfFirstTime();
    }, 1000);
  }

  showForgotPasswordModal = false;
  resetIdentifier = '';
  resetPassword = '';
  resetMessage = '';
  resetError = false;

  toggleMode(): void {
    this.isAdminMode = !this.isAdminMode;
    this.loginError = false;
    this.errorMessage = '';
    this.loginForm.reset();
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.loginError = false;
    this.errorMessage = '';

    const { identifier, password, rememberMe } = this.loginForm.value;

    const identifierTrimmed = identifier.trim();
    if (rememberMe && !this.isAdminMode) {
      localStorage.setItem('ja_relief_saved_identifier', identifierTrimmed);
    } else {
      localStorage.removeItem('ja_relief_saved_identifier');
    }

    this.authService.login(identifierTrimmed, password, this.isAdminMode).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response && response.token) {
          const user = this.authService.currentUserValue;
          if (user?.role === 'admin') {
            this.router.navigate(['/admin']);
          } else {
            this.router.navigate(['/dashboard']);
          }
        } else {
          this.loginError = true;
          this.errorMessage = 'Invalid Username/Phone or Password. Please try again.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.loginError = true;
        this.errorMessage = err || 'An unexpected error occurred. Please try again.';
      }
    });
  }

  openForgotPassword(): void {
    this.showForgotPasswordModal = true;
    this.resetIdentifier = '';
    this.resetPassword = '';
    this.resetMessage = '';
    this.resetError = false;
  }

  closeForgotPassword(): void {
    this.showForgotPasswordModal = false;
  }

  submitForgotPassword(): void {
    if (!this.resetIdentifier || !this.resetPassword) {
      this.resetError = true;
      this.resetMessage = 'Please fill out both fields.';
      return;
    }

    this.authService.resetPassword(this.resetIdentifier, this.resetPassword).subscribe({
      next: (res) => {
        this.resetError = false;
        this.resetMessage = 'Password successfully reset! You can now log in.';
        setTimeout(() => this.closeForgotPassword(), 3000);
      },
      error: (err) => {
        this.resetError = true;
        this.resetMessage = err || 'Error resetting password. Please try again.';
      }
    });
  }
}


