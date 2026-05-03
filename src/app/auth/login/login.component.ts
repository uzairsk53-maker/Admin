import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-login',
  template: `
    <div class="login-shell">
      <!-- Left panel -->
      <aside class="login-panel login-panel--left">
        <div class="login-brand">
          <div class="login-brand__icon">
            <app-icon name="sparkle" [size]="18"></app-icon>
          </div>
          <div>
            <p class="login-brand__sub">Admin Console</p>
            <h1 class="login-brand__title">Shop UZAIR</h1>
          </div>
        </div>

        <div class="login-hero">
          <h2 class="login-hero__heading">Manage your entire shop operation from one place.</h2>
          <p class="login-hero__sub">Orders · Credit · Delivery · Shopkeepers</p>
        </div>

        <div class="login-features">
          <div class="login-feat">
            <span class="login-feat__dot login-feat__dot--blue"></span>
            <span>Live inventory tracking</span>
          </div>
          <div class="login-feat">
            <span class="login-feat__dot login-feat__dot--green"></span>
            <span>Fast order approvals</span>
          </div>
          <div class="login-feat">
            <span class="login-feat__dot login-feat__dot--amber"></span>
            <span>Credit risk visibility</span>
          </div>
        </div>
      </aside>

      <!-- Right form -->
      <main class="login-panel login-panel--right">
        <div class="login-form-wrap">
          <div class="login-form-header">
            <div class="login-form-icon">
              <app-icon name="lock" [size]="20"></app-icon>
            </div>
            <div>
              <h2 class="login-form-title">Sign in</h2>
              <p class="login-form-sub">Admin credentials required</p>
            </div>
          </div>

          <div *ngIf="errorMsg" class="login-error">
            <app-icon name="exclamation" [size]="16"></app-icon>
            {{ errorMsg }}
          </div>

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form" autocomplete="off">
            <div class="field">
              <label class="field__label" for="phone">Phone Number</label>
              <input id="phone" class="field__control" type="text" formControlName="phone" placeholder="10-digit number" autocomplete="username">
              <p *ngIf="f['phone'].invalid && f['phone'].touched" class="login-field-err">Enter a valid 10-digit number</p>
            </div>

            <div class="field" style="position:relative">
              <label class="field__label" for="password">Password</label>
              <input id="password" class="field__control" [type]="hidePassword ? 'password' : 'text'"
                formControlName="password" placeholder="Your password"
                autocomplete="current-password" style="padding-right:2.5rem">
              <button type="button"
                style="position:absolute;right:0.6rem;bottom:0.4rem;background:none;border:none;cursor:pointer;color:#94a3b8;padding:0.2rem"
                (click)="hidePassword = !hidePassword">
                <app-icon [name]="hidePassword ? 'eye' : 'eyeOff'" [size]="16"></app-icon>
              </button>
              <p *ngIf="f['password'].invalid && f['password'].touched" class="login-field-err">Password is required</p>
            </div>

            <button id="login-submit-btn" type="submit" class="login-submit" [disabled]="loading || loginForm.invalid">
              <span *ngIf="!loading">Sign in →</span>
              <span *ngIf="loading" style="display:flex;align-items:center;gap:0.5rem">
                <span class="login-spinner"></span> Signing in…
              </span>
            </button>
          </form>

          <p class="login-footer">Shop UZAIR · Secure admin access</p>
        </div>
      </main>
    </div>
  `,
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  hidePassword = true;
  errorMsg = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toast: ToastService
  ) {
    // Already logged in → redirect immediately
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }

    this.loginForm = this.fb.group({
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      password: ['', Validators.required],
    });
  }

  get f() { return this.loginForm.controls; }

  onSubmit() {
    this.errorMsg = '';
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;

    this.authService.login(this.loginForm.value).subscribe({
      next: (res: any) => {
        // Tokens are already saved inside authService tap()
        // Double-check token was actually saved
        if (!this.authService.isAuthenticated()) {
          this.loading = false;
          this.errorMsg = 'Login failed: Could not save session. Please try again.';
          return;
        }

        this.toast.success('Welcome back, Admin!');

        // Navigate to returnUrl or dashboard
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
        this.router.navigateByUrl(returnUrl).then(() => {
          this.loading = false;
        }).catch(() => {
          this.router.navigate(['/dashboard']);
          this.loading = false;
        });
      },
      error: (err: any) => {
        this.loading = false;
        const msg = err?.error?.message || err?.message || 'Login failed. Please check your credentials.';
        this.errorMsg = msg;
        this.toast.error(msg);
      }
    });
  }
}
