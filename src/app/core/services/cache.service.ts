import { Injectable } from '@angular/core';
import { Observable, of, ReplaySubject } from 'rxjs';
import { tap } from 'rxjs/operators';

interface CacheEntry {
  expiry: number;
  value: any;
}

@Injectable({ providedIn: 'root' })
export class CacheService {
  private cache = new Map<string, CacheEntry>();

  getOrSet<T>(key: string, ttlMs: number, factory: () => Observable<T>): Observable<T> {
    const now = Date.now();
    const existing = this.cache.get(key);

    // Return cached value immediately if still valid
    if (existing && existing.expiry > now) {
      return of(existing.value as T);
    }

    // Fetch fresh data and cache the RESULT (not the observable)
    return new Observable<T>(observer => {
      factory().subscribe({
        next: (value) => {
          this.cache.set(key, { expiry: now + ttlMs, value });
          observer.next(value);
          observer.complete();
        },
        error: (err) => observer.error(err)
      });
    });
  }

  invalidate(prefix: string): void {
    Array.from(this.cache.keys()).forEach((k) => {
      if (k.startsWith(prefix)) this.cache.delete(k);
    });
  }

  clear(): void { this.cache.clear(); }
}
