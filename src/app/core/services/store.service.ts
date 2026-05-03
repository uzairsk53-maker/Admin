import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StoreService {
  // User data
  user$ = new BehaviorSubject<any>(null);

  // Cached search results
  searchCache$ = new BehaviorSubject<Map<string, any>>(new Map());

  // Filters
  filters$ = new BehaviorSubject<any>({});

  // Loading states
  loading$ = new BehaviorSubject<boolean>(false);
  globalLoader$ = new BehaviorSubject<boolean>(false);

  // Cached data
  products$ = new BehaviorSubject<any[]>([]);
  orders$ = new BehaviorSubject<any[]>([]);
  shopkeepers$ = new BehaviorSubject<any[]>([]);
  creditTransactions$ = new BehaviorSubject<any[]>([]);

  // Methods to update state
  setUser(userData: any) {
    this.user$.next(userData);
  }

  updateSearchCache(key: string, data: any) {
    const cache = this.searchCache$.value;
    cache.set(key, data);
    this.searchCache$.next(cache);
  }

  getSearchCache(key: string) {
    return this.searchCache$.value.get(key);
  }

  setFilters(newFilters: any) {
    this.filters$.next({ ...this.filters$.value, ...newFilters });
  }

  setLoading(isLoading: boolean) {
    this.loading$.next(isLoading);
  }

  setGlobalLoader(isLoading: boolean) {
    this.globalLoader$.next(isLoading);
  }

  setProducts(products: any[]) {
    this.products$.next(products);
  }

  setOrders(orders: any[]) {
    this.orders$.next(orders);
  }

  setShopkeepers(shopkeepers: any[]) {
    this.shopkeepers$.next(shopkeepers);
  }

  setCreditTransactions(transactions: any[]) {
    this.creditTransactions$.next(transactions);
  }
}