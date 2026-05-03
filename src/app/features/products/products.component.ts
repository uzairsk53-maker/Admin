import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { AdminApiService } from '../../core/services/admin-api.service';
import { StoreService } from '../../core/services/store.service';
import { ToastService } from '../../shared/services/toast.service';
import { environment } from '../../../environments/environment';

const BASE_URL = environment.apiUrl.replace('/api/v1', '');

@Component({
  selector: 'app-products',
  template: `
    <div class="page-shell page-stack">
      <div class="card">

        <!-- Header -->
        <div class="prod-header">
          <div class="prod-header__left">
            <h1 class="prod-header__title">Products</h1>
            <span class="prod-header__count">{{ totalItems }} items</span>
          </div>
          <div class="prod-header__actions">
            <!-- View toggle -->
            <div class="view-toggle">
              <button type="button" class="view-toggle__btn" [class.view-toggle__btn--active]="viewMode==='grid'" (click)="viewMode='grid'" title="Grid view">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
              </button>
              <button type="button" class="view-toggle__btn" [class.view-toggle__btn--active]="viewMode==='table'" (click)="viewMode='table'" title="Table view">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
              </button>
            </div>

            <button type="button" class="btn btn-secondary btn-sm" (click)="bulkInput.click()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Bulk Upload
            </button>
            <input #bulkInput type="file" accept=".xlsx,.xls,.csv" style="display:none" (change)="onBulkUpload($event)">

            <button type="button" class="btn btn-primary btn-sm" (click)="openDialog()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Product
            </button>
          </div>
        </div>

        <!-- Toolbar -->
        <div class="toolbar" style="border-top:1px solid #f0f0f0">
          <div class="form-group" style="flex:1;max-width:340px">
            <label class="form-label">Search</label>
            <input class="form-control" [formControl]="searchControl" placeholder="Name or category…">
          </div>
          <div class="form-group">
            <label class="form-label">Category</label>
            <select class="form-select" [(ngModel)]="categoryFilter" (change)="onCategoryFilter()">
              <option value="">All</option>
              <option value="Grocery">Grocery</option>
              <option value="Beverages">Beverages</option>
              <option value="Dairy">Dairy</option>
              <option value="Snacks">Snacks</option>
              <option value="Household">Household</option>
              <option value="Personal Care">Personal Care</option>
              <option value="Electronics">Electronics</option>
              <option value="General">General</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Stock</label>
            <select class="form-select" [(ngModel)]="stockFilter" (change)="onStockFilter()">
              <option value="">All</option>
              <option value="low">Low (≤10)</option>
              <option value="ok">In Stock (>10)</option>
            </select>
          </div>
        </div>

        <!-- Loading shimmer -->
        <div *ngIf="store.loading$ | async" class="prod-shimmer-grid">
          <div *ngFor="let i of [1,2,3,4,5,6,7,8]" class="shimmer-card"></div>
        </div>

        <!-- ═══════ GRID VIEW ═══════ -->
        <ng-container *ngIf="!(store.loading$ | async)">
          <div *ngIf="viewMode === 'grid' && filteredData.length > 0" class="prod-grid">
            <div *ngFor="let p of filteredData" class="prod-card">

              <!-- Image -->
              <div class="prod-card__img-wrap">
                <img *ngIf="getFirstImage(p)" [src]="getFirstImage(p)" [alt]="p.name" class="prod-card__img"
                  (error)="onImgError($event)">
                <div *ngIf="!getFirstImage(p)" class="prod-card__img-placeholder">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#bbb" stroke-width="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21,15 16,10 5,21"/>
                  </svg>
                </div>
                <!-- Image count badge -->
                <span *ngIf="p.productImages?.length > 1" class="prod-card__img-count">
                  +{{ p.productImages.length - 1 }}
                </span>
                <!-- Stock badge overlay -->
                <span class="prod-card__stock-badge" [class.prod-card__stock-badge--low]="p.stock <= 10">
                  {{ p.stock }} units
                </span>
              </div>

              <!-- Info -->
              <div class="prod-card__body">
                <p class="prod-card__cat">{{ p.category }}</p>
                <h3 class="prod-card__name">{{ p.name }}</h3>
                <div class="prod-card__prices">
                  <span class="prod-card__price">₹{{ p.price }}</span>
                  <span class="prod-card__bulk">Bulk: ₹{{ p.bulkPrice }}</span>
                </div>
              </div>

              <!-- Actions -->
              <div class="prod-card__actions">
                <button type="button" class="btn btn-secondary btn-sm" style="flex:1" (click)="openDialog(p)">
                  Edit
                </button>
                <button type="button" class="btn btn-sm" style="flex:1;background:#fff5f5;color:#c62828;border-color:#fecaca" (click)="requestDelete(p)">
                  Delete
                </button>
              </div>
            </div>
          </div>

          <!-- ═══════ TABLE VIEW ═══════ -->
          <div *ngIf="viewMode === 'table' && filteredData.length > 0" class="table-wrap">
            <table class="tbl">
              <thead>
                <tr>
                  <th style="width:52px"></th>
                  <th>Name / Category</th>
                  <th>Price</th>
                  <th>Bulk Price</th>
                  <th>Stock</th>
                  <th>Fast Del.</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let p of filteredData">
                  <!-- Thumbnail -->
                  <td style="padding:8px 10px">
                    <div class="tbl-thumb">
                      <img *ngIf="getFirstImage(p)" [src]="getFirstImage(p)" [alt]="p.name"
                        class="tbl-thumb__img" (error)="onImgError($event)">
                      <div *ngIf="!getFirstImage(p)" class="tbl-thumb__empty">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#bbb" stroke-width="1.5">
                          <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                          <polyline points="21,15 16,10 5,21"/>
                        </svg>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div class="cell-bold">{{ p.name }}</div>
                    <div class="cell-muted">{{ p.category }}</div>
                  </td>
                  <td class="cell-bold">₹{{ p.price }}</td>
                  <td style="color:#1565c0;font-size:13px">₹{{ p.bulkPrice }}</td>
                  <td>
                    <span class="badge" [class.badge--green]="p.stock > 10" [class.badge--red]="p.stock <= 10">
                      {{ p.stock }} units
                    </span>
                  </td>
                  <td>
                    <span class="badge" [class.badge--green]="p.fastDeliveryEligible" [class.badge--gray]="!p.fastDeliveryEligible">
                      {{ p.fastDeliveryEligible ? 'Yes' : 'No' }}
                    </span>
                  </td>
                  <td>
                    <div style="display:flex;gap:6px">
                      <button type="button" class="action-chip" (click)="openDialog(p)">Edit</button>
                      <button type="button" class="action-chip" style="color:#c62828;border-color:#fecaca" (click)="requestDelete(p)">Delete</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Mobile cards -->
          <div *ngIf="filteredData.length > 0" class="mobile-card-list">
            <div *ngFor="let p of filteredData" class="m-prod-card">
              <div class="m-prod-card__img">
                <img *ngIf="getFirstImage(p)" [src]="getFirstImage(p)" [alt]="p.name" (error)="onImgError($event)">
                <div *ngIf="!getFirstImage(p)" class="m-prod-card__no-img">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#bbb" stroke-width="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21,15 16,10 5,21"/>
                  </svg>
                </div>
              </div>
              <div class="m-prod-card__body">
                <p class="m-prod-card__cat">{{ p.category }}</p>
                <h3 class="m-prod-card__name">{{ p.name }}</h3>
                <div style="display:flex;gap:8px;align-items:center;margin-top:4px;flex-wrap:wrap">
                  <span style="font-weight:700;font-size:14px;color:#212121">₹{{ p.price }}</span>
                  <span style="font-size:12px;color:#878787">Bulk ₹{{ p.bulkPrice }}</span>
                  <span class="badge" style="margin-left:auto" [class.badge--green]="p.stock > 10" [class.badge--red]="p.stock <= 10">{{ p.stock }} units</span>
                </div>
              </div>
              <div class="m-prod-card__actions">
                <button type="button" class="btn btn-secondary btn-sm btn-block" (click)="openDialog(p)">Edit</button>
                <button type="button" class="btn btn-sm btn-block" style="background:#fff5f5;color:#c62828;border-color:#fecaca" (click)="requestDelete(p)">Delete</button>
              </div>
            </div>
          </div>

          <!-- Empty -->
          <div *ngIf="filteredData.length === 0" class="empty-state" style="margin:24px">
            <p style="font-weight:700;font-size:14px;color:#424242;margin:0">No products found</p>
            <p style="font-size:12px;color:#878787;margin:4px 0 0">Try adjusting the search or filters, or add a new product.</p>
          </div>
        </ng-container>

        <!-- Paginator -->
        <div class="custom-paginator">
          <span>Page {{ currentPage + 1 }} of {{ totalPages }} · {{ totalItems }} products</span>
          <div class="custom-paginator__controls">
            <button type="button" class="btn btn-secondary btn-sm" [disabled]="currentPage === 0" (click)="goToPage(currentPage - 1)">← Prev</button>
            <button type="button" class="btn btn-secondary btn-sm" [disabled]="currentPage + 1 >= totalPages" (click)="goToPage(currentPage + 1)">Next →</button>
            <select class="form-select" style="height:30px;font-size:12px;padding:0 24px 0 8px;width:auto" [ngModel]="pageSize" (ngModelChange)="changePageSize($event)">
              <option *ngFor="let s of [10, 25, 50]" [ngValue]="s">{{ s }}/page</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Product Dialog -->
      <app-product-dialog [open]="dialogOpen" [data]="selectedProduct" (closed)="closeDialog($event)"></app-product-dialog>

      <!-- Delete confirm modal -->
      <div *ngIf="deleteCandidate" class="custom-modal" (click)="cancelDelete()">
        <div class="custom-modal__panel" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2 class="modal-title" style="color:#c62828">Delete Product</h2>
            <button type="button" class="btn btn-secondary btn-icon" (click)="cancelDelete()">✕</button>
          </div>
          <div class="modal-body">
            <p style="font-size:14px;color:#444">
              Are you sure you want to delete <strong>{{ deleteCandidate.name }}</strong>?
              This action cannot be undone.
            </p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="cancelDelete()">Cancel</button>
            <button type="button" class="btn btn-danger" (click)="confirmDelete()">Delete Product</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Header */
    .prod-header {
      display: flex; align-items: center; justify-content: space-between;
      flex-wrap: wrap; gap: 12px; padding: 14px 16px;
      border-bottom: 1px solid #f5f5f5;
    }
    .prod-header__left { display: flex; align-items: center; gap: 10px; }
    .prod-header__title { font-size: 16px; font-weight: 800; color: #212121; margin: 0; }
    .prod-header__count {
      background: #e8eaf6; color: #3949ab;
      font-size: 11px; font-weight: 700;
      border-radius: 999px; padding: 2px 8px;
    }
    .prod-header__actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

    /* View toggle */
    .view-toggle {
      display: flex; border: 1px solid #e0e0e0; border-radius: 5px; overflow: hidden;
    }
    .view-toggle__btn {
      display: flex; align-items: center; justify-content: center;
      width: 30px; height: 30px; border: none; background: #fff;
      color: #878787; cursor: pointer; transition: background 0.15s;
    }
    .view-toggle__btn:hover { background: #f5f5f5; }
    .view-toggle__btn--active { background: #2874f0 !important; color: #fff !important; }

    /* Loading grid shimmer */
    .prod-shimmer-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 14px; padding: 16px;
    }
    .shimmer-card {
      height: 260px; border-radius: 8px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
    }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

    /* ── Product Grid ── */
    .prod-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 14px; padding: 16px;
    }

    .prod-card {
      background: #fff; border: 1px solid #e0e0e0; border-radius: 8px;
      overflow: hidden; display: flex; flex-direction: column;
      transition: box-shadow 0.18s, transform 0.18s;
    }
    .prod-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.10); transform: translateY(-2px); }

    .prod-card__img-wrap {
      position: relative; width: 100%; padding-top: 75%; /* 4:3 */
      background: #f8f8f8; overflow: hidden; flex-shrink: 0;
    }
    .prod-card__img {
      position: absolute; inset: 0; width: 100%; height: 100%;
      object-fit: cover; object-position: center;
      transition: transform 0.25s;
    }
    .prod-card:hover .prod-card__img { transform: scale(1.04); }

    .prod-card__img-placeholder {
      position: absolute; inset: 0;
      display: flex; align-items: center; justify-content: center;
      background: #f5f5f5;
    }

    .prod-card__img-count {
      position: absolute; bottom: 6px; right: 6px;
      background: rgba(0,0,0,0.55); color: #fff;
      font-size: 10px; font-weight: 700; border-radius: 4px;
      padding: 2px 5px;
    }

    .prod-card__stock-badge {
      position: absolute; top: 6px; left: 6px;
      background: #43a047; color: #fff;
      font-size: 10px; font-weight: 700; border-radius: 4px;
      padding: 2px 6px;
    }
    .prod-card__stock-badge--low { background: #e53935; }

    .prod-card__body { padding: 10px 12px; flex: 1; }
    .prod-card__cat { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #2874f0; margin: 0 0 3px; }
    .prod-card__name { font-size: 13px; font-weight: 700; color: #212121; margin: 0 0 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .prod-card__prices { display: flex; align-items: baseline; gap: 6px; }
    .prod-card__price { font-size: 15px; font-weight: 800; color: #212121; }
    .prod-card__bulk { font-size: 11px; color: #878787; }

    .prod-card__actions {
      display: flex; gap: 6px; padding: 8px 10px;
      border-top: 1px solid #f5f5f5;
    }

    /* Table thumbnail */
    .tbl-thumb {
      width: 40px; height: 40px; border-radius: 6px;
      overflow: hidden; background: #f5f5f5;
      border: 1px solid #e0e0e0;
      display: flex; align-items: center; justify-content: center;
    }
    .tbl-thumb__img { width: 100%; height: 100%; object-fit: cover; }
    .tbl-thumb__empty { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; }

    /* Mobile product card */
    .mobile-card-list { display: none; }

    .m-prod-card {
      display: flex; gap: 12px; align-items: flex-start;
      background: #fff; border: 1px solid #e0e0e0; border-radius: 8px;
      padding: 12px; overflow: hidden;
    }

    .m-prod-card__img {
      width: 72px; height: 72px; border-radius: 6px;
      overflow: hidden; background: #f5f5f5; flex-shrink: 0;
      border: 1px solid #e0e0e0; display: flex; align-items: center; justify-content: center;
    }
    .m-prod-card__img img { width: 100%; height: 100%; object-fit: cover; }
    .m-prod-card__no-img { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; }
    .m-prod-card__body { flex: 1; min-width: 0; }
    .m-prod-card__cat { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #2874f0; margin: 0 0 2px; }
    .m-prod-card__name { font-size: 13px; font-weight: 700; color: #212121; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .m-prod-card__actions { display: flex; flex-direction: column; gap: 5px; flex-shrink: 0; }

    /* Responsive */
    @media (max-width: 767px) {
      .prod-grid { display: none !important; }
      .table-wrap { display: none !important; }
      .mobile-card-list { display: flex !important; flex-direction: column; gap: 10px; padding: 12px; }
    }

    @media (min-width: 768px) {
      .mobile-card-list { display: none; }
    }

    @media (max-width: 480px) {
      .prod-header { flex-direction: column; align-items: flex-start; }
    }
  `]
})
export class ProductsComponent implements OnInit, OnDestroy {
  data: any[] = [];
  filteredData: any[] = [];
  totalItems = 0;
  pageSize = 10;
  currentPage = 0;
  searchControl = new FormControl('');
  categoryFilter = '';
  stockFilter = '';
  viewMode: 'grid' | 'table' = 'grid';
  dialogOpen = false;
  selectedProduct: any = null;
  deleteCandidate: any = null;
  private destroy$ = new Subject<void>();

  constructor(
    private adminApi: AdminApiService,
    private toast: ToastService,
    public store: StoreService
  ) {}

  ngOnInit() {
    this.searchControl.valueChanges.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentPage = 0;
      this.fetchProducts();
    });
    this.fetchProducts();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Returns the full URL for a product's first image, or null */
  getFirstImage(product: any): string | null {
    const imgs = product.productImages;
    if (imgs && imgs.length > 0 && imgs[0].url) {
      const url = imgs[0].url as string;
      // Already absolute
      if (url.startsWith('http')) return url;
      // Relative — prepend backend base
      return BASE_URL + url;
    }
    return null;
  }

  onImgError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }

  get totalPages() {
    return Math.max(1, Math.ceil(this.totalItems / this.pageSize));
  }

  applyClientFilters() {
    let result = [...this.data];
    if (this.categoryFilter) result = result.filter(p => p.category === this.categoryFilter);
    if (this.stockFilter === 'low') result = result.filter(p => p.stock <= 10);
    if (this.stockFilter === 'ok')  result = result.filter(p => p.stock > 10);
    this.filteredData = result;
  }

  onCategoryFilter() { this.applyClientFilters(); }
  onStockFilter()    { this.applyClientFilters(); }

  fetchProducts() {
    this.store.setLoading(true);
    const params = {
      page: this.currentPage + 1,
      limit: this.pageSize,
      search: this.searchControl.value || ''
    };

    this.adminApi.getProducts(params).subscribe({
      next: (res: any) => {
        this.data = res.data.items;
        this.totalItems = res.data.totalItems;
        this.applyClientFilters();
        this.store.setLoading(false);
      },
      error: () => {
        this.store.setLoading(false);
        this.toast.error('Error loading products');
      }
    });
  }

  onBulkUpload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    this.store.setLoading(true);
    this.adminApi.bulkUploadProducts(formData).subscribe({
      next: () => { this.toast.success('Bulk upload complete!'); this.store.setLoading(false); this.fetchProducts(); },
      error: (e: any) => { this.toast.error(e?.error?.message || 'Bulk upload failed'); this.store.setLoading(false); }
    });
    (event.target as HTMLInputElement).value = '';
  }

  goToPage(page: number) {
    this.currentPage = Math.max(0, Math.min(page, this.totalPages - 1));
    this.fetchProducts();
  }

  changePageSize(pageSize: number) {
    this.pageSize = Number(pageSize);
    this.currentPage = 0;
    this.fetchProducts();
  }

  openDialog(product?: any) {
    this.selectedProduct = product || null;
    this.dialogOpen = true;
  }

  closeDialog(saved: boolean) {
    this.dialogOpen = false;
    this.selectedProduct = null;
    if (saved) this.fetchProducts();
  }

  requestDelete(product: any) { this.deleteCandidate = product; }
  cancelDelete()              { this.deleteCandidate = null; }

  confirmDelete() {
    if (!this.deleteCandidate?.id) return;
    this.adminApi.deleteProduct(this.deleteCandidate.id).subscribe({
      next: () => { this.toast.success('Product deleted'); this.deleteCandidate = null; this.fetchProducts(); },
      error: () => { this.toast.error('Delete failed'); this.deleteCandidate = null; }
    });
  }
}
