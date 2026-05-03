import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable, finalize } from 'rxjs';
import { StoreService } from '../services/store.service';

// Only show the full-screen blocking loader for mutating requests
const MUTATION_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];

// Auth endpoints should never trigger the loader
const SKIP_LOADER_URLS = ['/auth/login', '/auth/refresh', '/auth/register'];

@Injectable()
export class LoaderInterceptor implements HttpInterceptor {
  private activeRequests = 0;

  constructor(private store: StoreService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const isMutation = MUTATION_METHODS.includes(request.method.toUpperCase());
    const isAuthRoute = SKIP_LOADER_URLS.some(f => request.url.includes(f));
    const hasSkipHeader = request.headers.has('skip-loader');

    // Only block the UI for mutation requests on non-auth routes
    const shouldShowLoader = isMutation && !isAuthRoute && !hasSkipHeader;

    if (shouldShowLoader) {
      this.activeRequests++;
      this.store.setGlobalLoader(true);
    }

    return next.handle(request).pipe(
      finalize(() => {
        if (shouldShowLoader) {
          this.activeRequests = Math.max(0, this.activeRequests - 1);
          if (this.activeRequests === 0) {
            this.store.setGlobalLoader(false);
          }
        }
      })
    );
  }
}