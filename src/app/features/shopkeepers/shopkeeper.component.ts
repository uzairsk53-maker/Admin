import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { AdminApiService } from '../../core/services/admin-api.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-shopkeepers',
  template: `
    <div class="page-shell page-stack">
      <section class="glass-panel section-card">
        <div class="page-hero">
          <div class="page-hero__meta">
            <span class="page-hero__icon"><app-icon name="users" [size]="22"></app-icon></span>
            <div>
              <p class="page-hero__eyebrow">Partners</p>
              <h1 class="page-hero__title">Shopkeeper Management</h1>
              <p class="page-hero__subtitle">Browse partner records, manage credit, block/unblock, and view full history.</p>
            </div>
          </div>
          <div class="hero-metrics">
            <div class="hero-metric">
              <span class="hero-metric__label">Shown</span>
              <span class="hero-metric__value">{{ totalItems }}</span>
            </div>
            <div class="hero-metric">
              <span class="hero-metric__label">High Risk</span>
              <span class="hero-metric__value">{{ highRiskCount }}</span>
            </div>
          </div>
        </div>

        <!-- Filters -->
        <div class="toolbar-row flex-wrap gap-3">
          <label class="custom-field custom-field--filled flex-1 min-w-[200px]">
            <input class="custom-field__control" [formControl]="searchControl" placeholder=" ">
            <span class="custom-field__label">Search name / shop / phone</span>
          </label>
          <select class="custom-field__select !min-h-[54px] !rounded-[18px] !px-4 min-w-[160px]" [(ngModel)]="cityFilter" (change)="fetch()">
            <option value="">All cities</option>
            <option *ngFor="let city of cities" [value]="city">{{ city }}</option>
          </select>
          <select class="custom-field__select !min-h-[54px] !rounded-[18px] !px-4 min-w-[160px]" [(ngModel)]="riskFilter" (change)="fetch()">
            <option value="">All risk levels</option>
            <option value="LOW">Low Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="HIGH">High Risk</option>
          </select>
        </div>

        <!-- Loader -->
        <div *ngIf="loading" class="flex justify-center p-10">
          <div class="h-10 w-10 rounded-full border-4 border-slate-200 border-t-sky-500 animate-[spin_0.8s_linear_infinite]"></div>
        </div>

        <!-- Desktop Table -->
        <div class="desktop-table-wrap overflow-x-auto custom-scrollbar" *ngIf="!loading && data.length > 0; else emptyState">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Shop / Owner</th>
                <th>Contact / City</th>
                <th>Credit Score</th>
                <th>Status / Risk</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let sk of data; trackBy: trackById">
                <td>
                  <div class="font-bold text-slate-900">{{ sk.shopName }}</div>
                  <div class="text-xs text-slate-500">{{ sk.ownerName }}</div>
                </td>
                <td>
                  <div class="flex items-center gap-1.5 text-sm"><app-icon name="phone" [size]="13"></app-icon> {{ sk.phone }}</div>
                  <div class="text-xs text-slate-400">{{ sk.city || '—' }}</div>
                </td>
                <td>
                  <div class="font-extrabold" [ngClass]="sk.creditScore < 8000 ? 'text-rose-600' : 'text-emerald-700'">{{ sk.creditScore | number }}</div>
                  <div class="text-xs text-slate-400">Points: {{ sk.creditPoints }}</div>
                </td>
                <td>
                  <div class="flex flex-col gap-1.5">
                    <span class="status-badge w-fit" [ngClass]="sk.status === 'BLOCKED' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'">{{ sk.status || 'ACTIVE' }}</span>
                    <span class="status-badge w-fit" [ngClass]="getRiskClass(sk.creditScore)">{{ getRiskLabel(sk.creditScore) }}</span>
                  </div>
                </td>
                <td class="text-right">
                  <div class="flex justify-end gap-2 flex-wrap">
                    <button type="button" class="action-chip !min-h-[38px] text-sky-700" (click)="openProfile(sk)">
                      <app-icon name="eye" [size]="14"></app-icon> View
                    </button>
                    <button type="button" class="action-chip !min-h-[38px]"
                      [ngClass]="sk.status === 'BLOCKED' ? 'text-emerald-700' : 'text-rose-600'"
                      [disabled]="busy[sk.id]" (click)="confirmToggleBlock(sk)">
                      <app-icon [name]="sk.status === 'BLOCKED' ? 'check' : 'block'" [size]="14"></app-icon>
                      {{ sk.status === 'BLOCKED' ? 'Unblock' : 'Block' }}
                    </button>
                    <button type="button" class="action-chip !min-h-[38px] text-amber-600"
                      [disabled]="busy[sk.id]" (click)="confirmReset(sk)">
                      <app-icon name="refresh" [size]="14"></app-icon> Reset Score
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile Cards -->
        <div class="mobile-card-list" *ngIf="!loading && data.length > 0">
          <article *ngFor="let sk of data; trackBy: trackById" class="data-card">
            <div class="data-card__header">
              <div>
                <h2 class="data-card__title">{{ sk.shopName }}</h2>
                <p class="data-card__subtitle">{{ sk.ownerName }}</p>
              </div>
              <span class="status-badge" [ngClass]="getRiskClass(sk.creditScore)">{{ getRiskLabel(sk.creditScore) }}</span>
            </div>
            <div class="data-card__grid mt-3">
              <div class="data-point"><span class="data-point__label">Score</span><span class="data-point__value" [ngClass]="sk.creditScore < 8000 ? 'text-rose-600' : 'text-emerald-700'">{{ sk.creditScore | number }}</span></div>
              <div class="data-point"><span class="data-point__label">City</span><span class="data-point__value">{{ sk.city || '—' }}</span></div>
              <div class="data-point"><span class="data-point__label">Phone</span><span class="data-point__value">{{ sk.phone }}</span></div>
              <div class="data-point"><span class="data-point__label">Status</span><span class="data-point__value">{{ sk.status || 'ACTIVE' }}</span></div>
            </div>
            <div class="data-card__actions mt-3">
              <button type="button" class="action-chip text-sky-700" (click)="openProfile(sk)"><app-icon name="eye" [size]="14"></app-icon> View</button>
              <button type="button" class="action-chip" [ngClass]="sk.status === 'BLOCKED' ? 'text-emerald-700' : 'text-rose-600'" (click)="confirmToggleBlock(sk)">
                <app-icon [name]="sk.status === 'BLOCKED' ? 'check' : 'block'" [size]="14"></app-icon>{{ sk.status === 'BLOCKED' ? 'Unblock' : 'Block' }}
              </button>
              <button type="button" class="action-chip text-amber-600" (click)="confirmReset(sk)"><app-icon name="refresh" [size]="14"></app-icon> Reset</button>
            </div>
          </article>
        </div>

        <ng-template #emptyState>
          <div *ngIf="!loading" class="px-6 py-14"><div class="empty-state">
            <app-icon name="users" [size]="40" class="text-slate-300 mb-4 mx-auto block"></app-icon>
            <p class="text-lg font-bold text-slate-900">No shopkeepers found</p>
            <p class="mt-2 text-sm text-slate-500">Try adjusting filters.</p>
          </div></div>
        </ng-template>

        <div class="custom-paginator bg-white/70" *ngIf="!loading && data.length > 0">
          <div class="text-sm text-slate-500">Page {{ currentPage + 1 }} of {{ totalPages }} · {{ totalItems }} partners</div>
          <div class="custom-paginator__controls">
            <button type="button" class="ui-btn ui-btn-secondary !min-h-[44px] !px-4 !py-2" [disabled]="currentPage === 0" (click)="goToPage(currentPage - 1)">Previous</button>
            <button type="button" class="ui-btn ui-btn-secondary !min-h-[44px] !px-4 !py-2" [disabled]="currentPage + 1 >= totalPages" (click)="goToPage(currentPage + 1)">Next</button>
          </div>
        </div>
      </section>

      <!-- Confirmation Modal -->
      <div *ngIf="confirmModal.open" class="custom-modal" (click)="cancelConfirm()">
        <div class="custom-modal__panel" (click)="$event.stopPropagation()">
          <div class="p-6 sm:p-8">
            <div class="flex items-start gap-4 mb-4">
              <span class="page-hero__icon !h-12 !w-12 !rounded-[18px]" [ngClass]="confirmModal.danger ? '!bg-[linear-gradient(135deg,#ef4444,#be123c)]' : '!bg-[linear-gradient(135deg,#f59e0b,#d97706)]'">
                <app-icon [name]="confirmModal.icon" [size]="18"></app-icon>
              </span>
              <div>
                <p class="page-hero__eyebrow" [ngClass]="confirmModal.danger ? '!text-rose-500' : '!text-amber-500'">{{ confirmModal.title }}</p>
                <h2 class="mt-1 text-2xl font-extrabold text-slate-950">Confirm action</h2>
                <p class="mt-2 text-sm text-slate-500">{{ confirmModal.message }}</p>
              </div>
            </div>
            <div *ngIf="confirmModal.warning" class="rounded-[20px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 mb-4">
              <div class="flex gap-2"><app-icon name="warning" [size]="16"></app-icon>{{ confirmModal.warning }}</div>
            </div>
            <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" class="ui-btn ui-btn-secondary" (click)="cancelConfirm()">Cancel</button>
              <button type="button" class="ui-btn" [ngClass]="confirmModal.danger ? 'ui-btn-danger' : 'ui-btn-primary'" [disabled]="confirmBusy" (click)="executeConfirm()">
                {{ confirmBusy ? 'Processing...' : 'Confirm' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Profile Drawer -->
      <div *ngIf="profileDrawer.open" class="custom-modal" (click)="closeProfile()">
        <div class="custom-modal__panel custom-modal__panel--wide" (click)="$event.stopPropagation()">
          <div class="p-6 sm:p-8">
            <div class="flex items-start justify-between gap-4 mb-6">
              <div>
                <p class="page-hero__eyebrow">Shopkeeper Profile</p>
                <h2 class="mt-1 text-2xl font-extrabold text-slate-950">{{ profileDrawer.sk?.shopName }}</h2>
              </div>
              <button type="button" class="header-action !h-10 !w-10" (click)="closeProfile()"><app-icon name="close" [size]="16"></app-icon></button>
            </div>

            <div class="grid gap-4 sm:grid-cols-2 mb-5">
              <div class="info-panel">
                <p class="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Contact</p>
                <p class="font-bold text-slate-900">{{ profileDrawer.sk?.ownerName }}</p>
                <p class="text-sm text-slate-500">{{ profileDrawer.sk?.phone }}</p>
                <p class="text-sm text-slate-500">{{ profileDrawer.sk?.city }}</p>
              </div>
              <div class="info-panel">
                <p class="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Credit Health</p>
                <div class="flex justify-between mb-1"><span class="text-sm text-slate-500">Score</span><span class="font-extrabold" [ngClass]="profileDrawer.sk?.creditScore < 8000 ? 'text-rose-600' : 'text-emerald-700'">{{ profileDrawer.sk?.creditScore | number }}</span></div>
                <div class="flex justify-between mb-1"><span class="text-sm text-slate-500">Points</span><span class="font-bold text-slate-900">{{ profileDrawer.sk?.creditPoints }}</span></div>
                <div class="flex justify-between"><span class="text-sm text-slate-500">Risk</span><span class="status-badge" [ngClass]="getRiskClass(profileDrawer.sk?.creditScore)">{{ getRiskLabel(profileDrawer.sk?.creditScore) }}</span></div>
              </div>
            </div>

            <!-- Credit History -->
            <div class="info-panel mb-5">
              <p class="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Credit History</p>
              <div *ngIf="historyLoading" class="space-y-2">
                <div *ngFor="let i of [1,2,3]" class="h-12 animate-pulse rounded-[16px] bg-slate-100"></div>
              </div>
              <div *ngIf="!historyLoading && history.length === 0" class="text-sm text-slate-400 text-center py-4">No history available</div>
              <div class="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                <div *ngFor="let h of history" class="flex items-center justify-between gap-3 rounded-[16px] border border-slate-100 bg-slate-50/70 px-4 py-3">
                  <div>
                    <p class="font-semibold text-slate-900 text-sm">{{ h.description || h.type }}</p>
                    <p class="text-xs text-slate-400">{{ h.createdAt | date:'MMM d, y h:mm a' }}</p>
                  </div>
                  <span class="font-extrabold text-sm" [ngClass]="h.amount >= 0 ? 'text-emerald-700' : 'text-rose-600'">{{ h.amount >= 0 ? '+' : '' }}{{ h.amount | number }}</span>
                </div>
              </div>
            </div>

            <div class="flex justify-end"><button type="button" class="ui-btn ui-btn-secondary" (click)="closeProfile()">Close</button></div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ShopkeepersComponent implements OnInit, OnDestroy {
  data: any[] = [];
  cities: string[] = [];
  totalItems = 0;
  pageSize = 20;
  currentPage = 0;
  loading = false;
  searchControl = new FormControl('');
  cityFilter = '';
  riskFilter = '';
  busy: Record<string, boolean> = {};
  confirmModal: any = { open: false };
  confirmBusy = false;
  profileDrawer: any = { open: false, sk: null };
  history: any[] = [];
  historyLoading = false;
  private _pendingAction: (() => void) | null = null;
  private destroy$ = new Subject<void>();

  constructor(private adminApi: AdminApiService, private toast: ToastService) {}

  ngOnInit() {
    this.searchControl.valueChanges.pipe(debounceTime(400), takeUntil(this.destroy$)).subscribe(() => { this.currentPage = 0; this.fetch(); });
    this.fetch();
  }

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

  get totalPages() { return Math.max(1, Math.ceil(this.totalItems / this.pageSize)); }
  get highRiskCount() { return this.data.filter(s => (s.creditScore || 0) < 8000).length; }

  fetch() {
    this.loading = true;
    const params: any = { page: this.currentPage + 1, limit: this.pageSize };
    if (this.searchControl.value) params.search = this.searchControl.value;
    if (this.cityFilter) params.city = this.cityFilter;

    this.adminApi.getShopkeepers(params).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.data = res?.data?.items || [];
        this.totalItems = res?.data?.totalItems || 0;
        if (!this.cities.length) {
          this.cities = [...new Set(this.data.map((s: any) => s.city).filter(Boolean))];
        }
        this.loading = false;
      },
      error: () => { this.toast.error('Failed to load shopkeepers'); this.loading = false; }
    });
  }

  goToPage(p: number) { this.currentPage = Math.max(0, Math.min(p, this.totalPages - 1)); this.fetch(); }

  confirmToggleBlock(sk: any) {
    const blocking = sk.status !== 'BLOCKED';
    this.confirmModal = {
      open: true,
      title: blocking ? 'Block Shopkeeper' : 'Unblock Shopkeeper',
      message: `${blocking ? 'Block' : 'Unblock'} ${sk.shopName}?`,
      warning: blocking ? 'This will prevent the shopkeeper from placing new orders.' : null,
      icon: blocking ? 'block' : 'check',
      danger: blocking,
    };
    this._pendingAction = () => this.doToggleBlock(sk);
  }

  confirmReset(sk: any) {
    this.confirmModal = {
      open: true,
      title: 'Reset Credit Score',
      message: `Reset credit score for ${sk.shopName}?`,
      warning: 'This will reset their credit score to default. This cannot be undone.',
      icon: 'refresh',
      danger: false,
    };
    this._pendingAction = () => this.doReset(sk);
  }

  cancelConfirm() { this.confirmModal = { open: false }; this._pendingAction = null; }

  executeConfirm() {
    if (this._pendingAction) { this.confirmBusy = true; this._pendingAction(); }
  }

  private doToggleBlock(sk: any) {
    const req$ = sk.status === 'BLOCKED' ? this.adminApi.unblockShopkeeper(sk.id) : this.adminApi.blockShopkeeper(sk.id);
    req$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.toast.success('Status updated'); this.confirmBusy = false; this.cancelConfirm(); this.fetch(); },
      error: (e: any) => { this.toast.error(e?.error?.message || 'Failed'); this.confirmBusy = false; }
    });
  }

  private doReset(sk: any) {
    this.adminApi.resetCreditScore(sk.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.toast.success('Credit score reset'); this.confirmBusy = false; this.cancelConfirm(); this.fetch(); },
      error: (e: any) => { this.toast.error(e?.error?.message || 'Failed'); this.confirmBusy = false; }
    });
  }

  openProfile(sk: any) {
    this.profileDrawer = { open: true, sk };
    this.historyLoading = true;
    this.history = [];
    this.adminApi.getShopkeeperHistory(sk.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => { this.history = res?.data?.items || res?.data || []; this.historyLoading = false; },
      error: () => { this.historyLoading = false; }
    });
  }

  closeProfile() { this.profileDrawer = { open: false, sk: null }; this.history = []; }

  getRiskClass(score: number) {
    if (!score || score < 5000) return 'bg-rose-100 text-rose-700';
    if (score < 8000) return 'bg-amber-100 text-amber-700';
    return 'bg-emerald-100 text-emerald-700';
  }

  getRiskLabel(score: number) {
    if (!score || score < 5000) return 'High Risk';
    if (score < 8000) return 'Medium Risk';
    return 'Low Risk';
  }

  trackById(_: number, item: any) { return item.id; }
}
