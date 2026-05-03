import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private readonly TOKEN_KEY = 'admin_access_token';
  private readonly REFRESH_KEY = 'admin_refresh_token';

  constructor(private http: HttpClient, private router: Router) {
    this.parseTokenOnInit();
  }

  login(credentials: { phone: string; password: string }): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/login`, {
      phone: credentials.phone,
      password: credentials.password,
      role: 'ADMIN',
    }).pipe(
      tap((res: any) => {
        if (res?.success && res?.data?.accessToken) {
          this.saveTokens(res.data.accessToken, res.data.refreshToken);
        } else if (res?.data?.accessToken) {
          // Handle case where success flag is missing
          this.saveTokens(res.data.accessToken, res.data.refreshToken);
        }
      }),
      catchError((err) => {
        return throwError(() => err);
      })
    );
  }

  refreshToken(): Observable<any> {
    const refreshToken = localStorage.getItem(this.REFRESH_KEY);
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token'));
    }
    return this.http.post(`${environment.apiUrl}/auth/refresh`, { refreshToken });
  }

  saveTokens(accessToken: string, refreshToken: string) {
    try {
      localStorage.setItem(this.TOKEN_KEY, accessToken);
      if (refreshToken) {
        localStorage.setItem(this.REFRESH_KEY, refreshToken);
      }
      this.parseTokenOnInit();
    } catch (e) {
      console.error('Failed to save tokens to localStorage:', e);
    }
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  parseTokenOnInit() {
    const token = this.getAccessToken();
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        // Check if token is expired
        const now = Math.floor(Date.now() / 1000);
        if (decoded.exp && decoded.exp < now) {
          this.clearTokens();
          return;
        }
        this.currentUserSubject.next(decoded);
      } catch (err) {
        console.error('Invalid token:', err);
        this.clearTokens();
      }
    }
  }

  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;
    try {
      const decoded: any = jwtDecode(token);
      const now = Math.floor(Date.now() / 1000);
      return !decoded.exp || decoded.exp > now;
    } catch {
      return false;
    }
  }

  private clearTokens() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    this.currentUserSubject.next(null);
  }

  logout() {
    this.clearTokens();
    this.router.navigate(['/login']);
  }

  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }

  getUserRole(): string | null {
    const user = this.currentUserSubject.value;
    return user?.role || null;
  }
}
