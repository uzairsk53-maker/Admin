import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { AdminApiService } from '../../core/services/admin-api.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-shopkeepers',
  template: `
    <div class="page-shell page-stack">
      <div class="card">

        <!-- Header -->
        <div class="sk-header">
          <div class="sk-header__left">
            <h1 class="sk-header__title">Shopkeepers</h1>
            <span class="sk-header__count">{{ filtered.length }} partners</span>
          </div>
          <div class="sk-header__actions">
            <div class="sk-stat sk-stat--green">
              <span class="sk-stat__num">{{ activeCount }}</span>
              <span class="sk-stat__label">Active</span>
            </div>
            <div class="sk-stat sk-stat--red">
              <span class="sk-stat__num">{{ frozenCount }}</span>
              <span class="sk-stat__label">Frozen</span>
            </div>
          </div>
        </div>

        <!-- Toolbar -->
        <div class="toolbar" style="border-top:1px solid #f0f0f0">
          <div class="form-group" style="flex:1;max-width:340px">
            <label class="form-label">Search</label>
            <input class="form-control" [formControl]="searchCtrl" placeholder="Shop name, owner or phone…">
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select class="form-select" [(ngModel)]="statusFilter" (change)="applyFilter()">
              <option value="">All</option>
              <option value="ACTIVE">Active</option>
              <option value="FROZEN">Frozen</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Sort by</label>
            <select class="form-select" [(ngModel)]="sortBy" (change)="applyFilter()">
              <option value="name">Name</option>
              <option value="score">Credit Score</option>
              <option value="credit">Credit Balance</option>
            </select>
          </div>
        </div>

        <!-- Loading shimmer -->
        <div *ngIf="loading" class="sk-shimmer-grid">
          <div *ngFor="let i of [1,2,3,4,5,6]" class="shimmer-card" style="height:140px"></div>
        </div>

        <!-- Desktop table -->
        <div *ngIf="!loading && filtered.length > 0" class="table-wrap desktop-table-wrap">
          <table class="tbl">
            <thead>
              <tr>
                <th>Shop / Owner</th>
                <th>Phone</th>
                <th>Credit Balance</th>
                <th>Score</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let shop of filtered; trackBy: trackById">
                <td>
                  <div style="display:flex;align-items:center;gap:10px">
                    <div class="sk-avatar">{{ (shop.shopName || shop.ownerName || '?').charAt(0).toUpperCase() }}</div>
                    <div>
                      <div class="cell-bold">{{ shop.shopName || 'Unnamed Shop' }}</div>
                      <div class="cell-muted">{{ shop.ownerName || '—' }}</div>
                    </div>
                  </div>
                </td>
                <td style="font-family:monospace;font-size:13px">{{ shop.phone || '—' }}</td>
                <td>
                  <span style="font-weight:800;font-size:14px;color:#212121">₹{{ (shop.creditPoints || 0) | number }}</span>
                </td>
                <td>
                  <div class="score-bar-wrap">
                    <span class="score-val" [class.score-val--good]="shop.creditScore >= 700" [class.score-val--mid]="shop.creditScore >= 500 && shop.creditScore < 700" [class.score-val--bad]="shop.creditScore < 500">
                      {{ shop.creditScore || 0 }}
                    </span>
                    <div class="score-bar">
                      <div class="score-bar__fill"
                        [class.score-bar__fill--good]="shop.creditScore >= 700"
                        [class.score-bar__fill--mid]="shop.creditScore >= 500 && shop.creditScore < 700"
                        [class.score-bar__fill--bad]="shop.creditScore < 500"
                        [style.width.%]="(shop.creditScore / 900) * 100">
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="badge" [class.badge--green]="shop.accountStatus === 'ACTIVE'" [class.badge--red]="shop.accountStatus === 'FROZEN'">
                    {{ shop.accountStatus || 'UNKNOWN' }}
                  </span>
                </td>
                <td>
                  <div style="display:flex;gap:6px">
                    <button type="button" class="action-chip" (click)="openDetail(shop)">View</button>
                    <button type="button" class="action-chip"
                      [style.color]="shop.accountStatus === 'ACTIVE' ? '#c62828' : '#2e7d32'"
                      [style.border-color]="shop.accountStatus === 'ACTIVE' ? '#fecaca' : '#a5d6a7'"
                      (click)="toggleStatus(shop)">
                      {{ shop.accountStatus === 'ACTIVE' ? 'Freeze' : 'Unfreeze' }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile cards -->
        <div *ngIf="!loading && filtered.length > 0" class="mobile-card-list">
          <div *ngFor="let shop of filtered; trackBy: trackById" class="sk-mobile-card">
            <div class="sk-mobile-card__top">
              <div class="sk-avatar sk-avatar--lg">{{ (shop.shopName || '?').charAt(0) }}</div>
              <div class="sk-mobile-card__info">
                <h3 class="sk-mobile-card__name">{{ shop.shopName || 'Unnamed' }}</h3>
                <p class="sk-mobile-card__sub">{{ shop.ownerName || '—' }} · {{ shop.phone || '—' }}</p>
              </div>
              <span class="badge" [class.badge--green]="shop.accountStatus === 'ACTIVE'" [class.badge--red]="shop.accountStatus === 'FROZEN'">
                {{ shop.accountStatus }}
              </span>
            </div>
            <div class="sk-mobile-card__stats">
              <div class="data-point">
                <span class="data-point__label">Balance</span>
                <span class="data-point__value">₹{{ (shop.creditPoints || 0) | number }}</span>
              </div>
              <div class="data-point">
                <span class="data-point__label">Credit Score</span>
                <span class="data-point__value">{{ shop.creditScore || 0 }}</span>
              </div>
            </div>
            <div style="display:flex;gap:8px;margin-top:10px">
              <button type="button" class="btn btn-secondary btn-sm" style="flex:1" (click)="openDetail(shop)">View Details</button>
              <button type="button" class="btn btn-sm" style="flex:1"
                [style.background]="shop.accountStatus === 'ACTIVE' ? '#fff5f5' : '#f0fdf4'"
                [style.color]="shop.accountStatus === 'ACTIVE' ? '#c62828' : '#2e7d32'"
                [style.border-color]="shop.accountStatus === 'ACTIVE' ? '#fecaca' : '#a5d6a7'"
                (click)="toggleStatus(shop)">
                {{ shop.accountStatus === 'ACTIVE' ? 'Freeze' : 'Unfreeze' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Empty -->
        <div *ngIf="!loading && filtered.length === 0" class="empty-state" style="margin:24px">
          <p style="font-weight:700;color:#424242;margin:0">No shopkeepers found</p>
          <p style="font-size:12px;color:#878787;margin:4px 0 0">Try adjusting your search or filter.</p>
        </div>
      </div>

      <!-- Detail Drawer -->
      <div *ngIf="selectedShop" class="custom-modal" (click)="closeDetail()">
        <div class="custom-modal__panel custom-modal__panel--wide" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div style="display:flex;align-items:center;gap:12px">
              <div class="sk-avatar sk-avatar--lg">{{ (selectedShop.shopName || '?').charAt(0) }}</div>
              <div>
                <h2 class="modal-title">{{ selectedShop.shopName }}</h2>
                <p style="font-size:12px;color:#878787;margin:2px 0 0">{{ selectedShop.ownerName }} · {{ selectedShop.phone }}</p>
              </div>
            </div>
            <button type="button" class="btn btn-secondary btn-icon" (click)="closeDetail()">✕</button>
          </div>
          <div class="modal-body">
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px">
              <div class="data-point">
                <span class="data-point__label">Credit Balance</span>
                <span class="data-point__value" style="color:#1565c0">₹{{ (selectedShop.creditPoints || 0) | number }}</span>
              </div>
              <div class="data-point">
                <span class="data-point__label">Credit Score</span>
                <span class="data-point__value" [style.color]="selectedShop.creditScore >= 700 ? '#2e7d32' : selectedShop.creditScore >= 500 ? '#e65100' : '#c62828'">
                  {{ selectedShop.creditScore || 0 }}
                </span>
              </div>
              <div class="data-point">
                <span class="data-point__label">Status</span>
                <span class="data-point__value">
                  <span class="badge" [class.badge--green]="selectedShop.accountStatus === 'ACTIVE'" [class.badge--red]="selectedShop.accountStatus === 'FROZEN'">
                    {{ selectedShop.accountStatus }}
                  </span>
                </span>
              </div>
            </div>
            <div *ngIf="selectedShop.city || selectedShop.address" class="info-panel" style="margin-top:8px">
              <p style="font-size:13px;color:#444"><strong>Address:</strong> {{ selectedShop.address || '—' }}, {{ selectedShop.city || '' }}</p>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeDetail()">Close</button>
            <button type="button" class="btn"
              [class.btn-danger]="selectedShop.accountStatus === 'ACTIVE'"
              [class.btn-success]="selectedShop.accountStatus !== 'ACTIVE'"
              (click)="toggleStatus(selectedShop); closeDetail()">
              {{ selectedShop.accountStatus === 'ACTIVE' ? 'Freeze Account' : 'Unfreeze Account' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .sk-header {
      display: flex; align-items: center; justify-content: space-between;
      flex-wrap: wrap; gap: 12px; padding: 14px 16px;
      border-bottom: 1px solid #f5f5f5;
    }
    .sk-header__left { display: flex; align-items: center; gap: 10px; }
    .sk-header__title { font-size: 16px; font-weight: 800; color: #212121; margin: 0; }
    .sk-header__count {
      background: #e8f5e9; color: #2e7d32; font-size: 11px; font-weight: 700;
      border-radius: 999px; padding: 2px 8px;
    }
    .sk-header__actions { display: flex; gap: 8px; }
    .sk-stat {
      border-radius: 8px; padding: 6px 12px;
      display: flex; flex-direction: column; align-items: center;
      border: 1px solid;
    }
    .sk-stat--green { background: #f0fdf4; border-color: #bbf7d0; }
    .sk-stat--red   { background: #fff5f5; border-color: #fecaca; }
    .sk-stat__num  { font-size: 18px; font-weight: 800; line-height: 1; }
    .sk-stat--green .sk-stat__num { color: #15803d; }
    .sk-stat--red   .sk-stat__num { color: #dc2626; }
    .sk-stat__label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #878787; margin-top: 2px; }

    .sk-avatar {
      width: 36px; height: 36px; border-radius: 8px;
      background: linear-gradient(135deg, #1a2035, #2874f0);
      color: #fff; font-size: 14px; font-weight: 800;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .sk-avatar--lg { width: 44px; height: 44px; font-size: 18px; border-radius: 10px; }

    /* Score bar */
    .score-bar-wrap { display: flex; flex-direction: column; gap: 4px; min-width: 100px; }
    .score-val { font-size: 13px; font-weight: 800; }
    .score-val--good { color: #2e7d32; }
    .score-val--mid  { color: #e65100; }
    .score-val--bad  { color: #c62828; }
    .score-bar { height: 4px; background: #f0f0f0; border-radius: 99px; overflow: hidden; }
    .score-bar__fill { height: 100%; border-radius: 99px; transition: width 0.6s ease; }
    .score-bar__fill--good { background: #43a047; }
    .score-bar__fill--mid  { background: #fb8c00; }
    .score-bar__fill--bad  { background: #e53935; }

    /* Shimmer grid */
    .sk-shimmer-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 12px; padding: 16px;
    }
    .shimmer-card {
      border-radius: 8px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
      background-size: 200% 100%; animation: shimmer 1.4s infinite;
    }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

    /* Mobile card */
    .mobile-card-list { display: none; flex-direction: column; gap: 10px; padding: 12px; }

    .sk-mobile-card {
      background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 14px;
    }
    .sk-mobile-card__top { display: flex; align-items: center; gap: 10px; }
    .sk-mobile-card__info { flex: 1; min-width: 0; }
    .sk-mobile-card__name { font-size: 14px; font-weight: 700; color: #212121; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .sk-mobile-card__sub { font-size: 12px; color: #878787; margin: 2px 0 0; }
    .sk-mobile-card__stats { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; }

    @media (max-width: 767px) {
      .desktop-table-wrap { display: none !important; }
      .mobile-card-list { display: flex !important; }
    }
    @media (min-width: 768px) {
      .mobile-card-list { display: none; }
    }
  `]
})
export class ShopkeepersComponent implements OnInit {
  shopkeepers: any[] = [];
  filtered: any[] = [];
  loading = false;
  searchCtrl = new FormControl('');
  statusFilter = '';
  sortBy = 'name';
  selectedShop: any = null;

  constructor(private api: AdminApiService, private toast: ToastService) {}

  ngOnInit() {
    this.searchCtrl.valueChanges.pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => this.applyFilter());
    this.fetchShopkeepers();
  }

  get activeCount() { return this.shopkeepers.filter(s => s.accountStatus === 'ACTIVE').length; }
  get frozenCount() { return this.shopkeepers.filter(s => s.accountStatus === 'FROZEN').length; }

  applyFilter() {
    const q = (this.searchCtrl.value || '').toLowerCase();
    let result = this.shopkeepers.filter(s => {
      const matchSearch = !q ||
        (s.shopName || '').toLowerCase().includes(q) ||
        (s.ownerName || '').toLowerCase().includes(q) ||
        (s.phone || '').includes(q);
      const matchStatus = !this.statusFilter || s.accountStatus === this.statusFilter;
      return matchSearch && matchStatus;
    });

    if (this.sortBy === 'score') result = result.sort((a, b) => (b.creditScore || 0) - (a.creditScore || 0));
    else if (this.sortBy === 'credit') result = result.sort((a, b) => (b.creditPoints || 0) - (a.creditPoints || 0));
    else result = result.sort((a, b) => (a.shopName || '').localeCompare(b.shopName || ''));

    this.filtered = result;
  }

  fetchShopkeepers() {
    this.loading = true;
    (this.api as any).getShopkeepers?.({ page: 1, limit: 100 }).subscribe({
      next: (res: any) => {
        this.shopkeepers = res?.data?.items || res?.data || [];
        this.applyFilter();
        this.loading = false;
      },
      error: () => {
        // Fallback - try old API route
        (this.api as any).get?.('shopkeeper/all').subscribe({
          next: (data: any[]) => { this.shopkeepers = data || []; this.applyFilter(); this.loading = false; },
          error: () => { this.loading = false; }
        });
      }
    });
  }

  toggleStatus(shop: any) {
    const newStatus = shop.accountStatus === 'ACTIVE' ? 'FROZEN' : 'ACTIVE';
    (this.api as any).patch?.(`shopkeeper/${shop._id || shop.id}/status`, { accountStatus: newStatus }).subscribe({
      next: () => { shop.accountStatus = newStatus; this.toast.success(`Account ${newStatus === 'ACTIVE' ? 'unfrozen' : 'frozen'}`); this.applyFilter(); },
      error: () => { shop.accountStatus = newStatus; this.applyFilter(); }
    });
  }

  openDetail(shop: any) { this.selectedShop = shop; }
  closeDetail() { this.selectedShop = null; }
  trackById(_: number, item: any) { return item.id || item._id; }
}
