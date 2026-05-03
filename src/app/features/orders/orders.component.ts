import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { debounceTime, Subject, takeUntil } from 'rxjs';
import { AdminApiService } from '../../core/services/admin-api.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-orders',
  template: `
    <div class="page-shell page-stack">

      <!-- Hero -->
      <section class="glass-panel section-card">
        <div class="page-hero">
          <div class="page-hero__meta">
            <span class="page-hero__icon">
              <app-icon name="bag" [size]="22"></app-icon>
            </span>
            <div>
              <p class="page-hero__eyebrow">Fulfillment</p>
              <h1 class="page-hero__title">Order Management</h1>
              <p class="page-hero__subtitle">Review orders, approve, assign delivery partners, update statuses, and cancel with confirmation.</p>
            </div>
          </div>
          <div class="hero-metrics">
            <div class="hero-metric">
              <span class="hero-metric__label">Total shown</span>
              <span class="hero-metric__value">{{ totalItems }}</span>
            </div>
            <div class="hero-metric">
              <span class="hero-metric__label">Filter</span>
              <span class="hero-metric__value">{{ statusFilter || 'All' }}</span>
            </div>
          </div>
        </div>

        <!-- Status Tabs -->
        <div style="padding:0 16px">
          <div class="segment-tabs">
            <button type="button" class="segment-tabs__item" [class.segment-tabs__item--active]="statusFilter === ''" (click)="setStatus('')">All</button>
            <button type="button" class="segment-tabs__item" [class.segment-tabs__item--active]="statusFilter === 'PENDING'" (click)="setStatus('PENDING')">Pending</button>
            <button type="button" class="segment-tabs__item" [class.segment-tabs__item--active]="statusFilter === 'APPROVED'" (click)="setStatus('APPROVED')">Approved</button>
            <button type="button" class="segment-tabs__item" [class.segment-tabs__item--active]="statusFilter === 'PACKED'" (click)="setStatus('PACKED')">Packed</button>
            <button type="button" class="segment-tabs__item" [class.segment-tabs__item--active]="statusFilter === 'SHIPPED'" (click)="setStatus('SHIPPED')">Shipped</button>
            <button type="button" class="segment-tabs__item" [class.segment-tabs__item--active]="statusFilter === 'DELIVERED'" (click)="setStatus('DELIVERED')">Delivered</button>
            <button type="button" class="segment-tabs__item" [class.segment-tabs__item--active]="statusFilter === 'CANCELLED'" (click)="setStatus('CANCELLED')">Cancelled</button>
          </div>
        </div>

        <!-- Filters -->
        <div class="toolbar">
          <div class="form-group" style="flex:1;min-width:160px">
            <label class="form-label">Search Shop</label>
            <input class="form-control" [formControl]="searchControl" placeholder="Shop name…">
          </div>
          <div class="form-group" style="min-width:140px">
            <label class="form-label">Payment</label>
            <select class="form-select" [(ngModel)]="paymentFilter" (change)="fetch()">
              <option value="">All</option>
              <option value="CASH">Cash</option>
              <option value="CREDIT">Credit</option>
            </select>
          </div>
          <div class="form-group" style="min-width:130px">
            <label class="form-label">From Date</label>
            <input type="date" class="form-control" [(ngModel)]="dateFrom" (change)="fetch()">
          </div>
          <div class="form-group" style="min-width:130px">
            <label class="form-label">To Date</label>
            <input type="date" class="form-control" [(ngModel)]="dateTo" (change)="fetch()">
          </div>
          <div class="form-group" style="justify-content:flex-end">
            <label class="form-label" style="visibility:hidden">-</label>
            <button type="button" class="btn btn-secondary" (click)="clearFilters()">
              <app-icon name="close" [size]="14"></app-icon> Clear
            </button>
          </div>
        </div>

        <!-- Loader -->
        <div *ngIf="loading" class="flex justify-center p-10">
          <div class="h-10 w-10 rounded-full border-4 border-slate-200 border-t-sky-500 animate-[spin_0.8s_linear_infinite]"></div>
        </div>

        <!-- Desktop Table -->
        <div class="desktop-table-wrap overflow-x-auto custom-scrollbar" *ngIf="!loading && orders.length > 0; else ordersEmpty">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Shop / Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Delivery Partner</th>
                <th>Payment</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let order of orders; trackBy: trackById">
                <td>
                  <div class="font-mono text-xs text-slate-400 truncate max-w-[90px]">{{ order.id }}</div>
                </td>
                <td>
                  <div class="font-bold text-slate-900">{{ order.shopkeeper?.shopName || 'Unknown' }}</div>
                  <div class="text-xs text-slate-400">{{ order.createdAt | date:'MMM d, y' }}</div>
                </td>
                <td>
                  <div class="font-bold text-slate-900">Rs {{ order.totalAmount | number }}</div>
                </td>
                <td>
                  <span class="status-badge" [ngClass]="getStatusClass(order.status)">{{ order.status }}</span>
                </td>
                <td>
                  <div *ngIf="order.deliveryBoy" class="text-sm text-slate-700 font-semibold">{{ order.deliveryBoy?.name || '—' }}</div>
                  <div *ngIf="!order.deliveryBoy" class="text-xs text-slate-400">Not assigned</div>
                </td>
                <td>
                  <span class="text-xs font-semibold bg-slate-100 text-slate-700 rounded-full px-2 py-1">{{ order.paymentType }}</span>
                </td>
                <td class="text-right">
                  <div class="flex justify-end gap-2 flex-wrap">
                    <button type="button" class="action-chip !min-h-[38px] text-sky-700"
                      (click)="openDetail(order)">
                      <app-icon name="eye" [size]="14"></app-icon>
                      View
                    </button>
                    <button type="button" class="action-chip !min-h-[38px] text-emerald-700"
                      *ngIf="order.status === 'PENDING'"
                      [disabled]="busy[order.id]"
                      (click)="confirmAction('approve', order)">
                      <app-icon name="check" [size]="14"></app-icon>
                      Approve
                    </button>
                    <button type="button" class="action-chip !min-h-[38px] text-indigo-700"
                      *ngIf="order.status === 'APPROVED' && !order.deliveryBoyId"
                      [disabled]="busy[order.id]"
                      (click)="openAssignModal(order)">
                      <app-icon name="truck" [size]="14"></app-icon>
                      Assign
                    </button>
                    <button type="button" class="action-chip !min-h-[38px] text-violet-700"
                      *ngIf="canUpdateStatus(order.status)"
                      [disabled]="busy[order.id]"
                      (click)="openStatusModal(order)">
                      <app-icon name="edit" [size]="14"></app-icon>
                      Status
                    </button>
                    <button type="button" class="action-chip !min-h-[38px] text-rose-600"
                      *ngIf="order.status !== 'CANCELLED' && order.status !== 'DELIVERED'"
                      [disabled]="busy[order.id]"
                      (click)="confirmAction('cancel', order)">
                      <app-icon name="close" [size]="14"></app-icon>
                      Cancel
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile Cards -->
        <div class="mobile-card-list" *ngIf="!loading && orders.length > 0">
          <article *ngFor="let order of orders; trackBy: trackById" class="data-card">
            <div class="data-card__header">
              <div>
                <h2 class="data-card__title">{{ order.shopkeeper?.shopName || 'Unknown' }}</h2>
                <p class="data-card__subtitle">{{ order.createdAt | date:'medium' }}</p>
              </div>
              <span class="status-badge" [ngClass]="getStatusClass(order.status)">{{ order.status }}</span>
            </div>
            <div class="mt-2 font-mono text-[0.68rem] text-slate-400 truncate bg-slate-50 rounded-xl px-3 py-2">{{ order.id }}</div>
            <div class="data-card__grid mt-3">
              <div class="data-point">
                <span class="data-point__label">Amount</span>
                <span class="data-point__value">Rs {{ order.totalAmount | number }}</span>
              </div>
              <div class="data-point">
                <span class="data-point__label">Payment</span>
                <span class="data-point__value">{{ order.paymentType }}</span>
              </div>
              <div class="data-point">
                <span class="data-point__label">Delivery</span>
                <span class="data-point__value">{{ order.deliveryBoy?.name || 'Unassigned' }}</span>
              </div>
            </div>
            <div class="data-card__actions mt-3">
              <button type="button" class="action-chip text-sky-700" (click)="openDetail(order)">
                <app-icon name="eye" [size]="14"></app-icon> View
              </button>
              <button type="button" class="action-chip text-emerald-700" *ngIf="order.status === 'PENDING'" (click)="confirmAction('approve', order)">
                <app-icon name="check" [size]="14"></app-icon> Approve
              </button>
              <button type="button" class="action-chip text-indigo-700" *ngIf="order.status === 'APPROVED' && !order.deliveryBoyId" (click)="openAssignModal(order)">
                <app-icon name="truck" [size]="14"></app-icon> Assign
              </button>
              <button type="button" class="action-chip text-rose-600" *ngIf="order.status !== 'CANCELLED' && order.status !== 'DELIVERED'" (click)="confirmAction('cancel', order)">
                <app-icon name="close" [size]="14"></app-icon> Cancel
              </button>
            </div>
          </article>
        </div>

        <!-- Empty State -->
        <ng-template #ordersEmpty>
          <div *ngIf="!loading" class="px-6 py-14">
            <div class="empty-state">
              <app-icon name="bag" [size]="40" class="text-slate-300 mb-4 mx-auto block"></app-icon>
              <p class="text-lg font-bold text-slate-900">No orders found</p>
              <p class="mt-2 text-sm text-slate-500">Try adjusting the filters or check back later.</p>
            </div>
          </div>
        </ng-template>

        <!-- Pagination -->
        <div class="custom-paginator bg-white/70" *ngIf="!loading && orders.length > 0">
          <div class="text-sm text-slate-500">Page {{ currentPage + 1 }} of {{ totalPages }} · {{ totalItems }} orders</div>
          <div class="custom-paginator__controls">
            <button type="button" class="ui-btn ui-btn-secondary !min-h-[44px] !px-4 !py-2" [disabled]="currentPage === 0" (click)="goToPage(currentPage - 1)">Previous</button>
            <button type="button" class="ui-btn ui-btn-secondary !min-h-[44px] !px-4 !py-2" [disabled]="currentPage + 1 >= totalPages" (click)="goToPage(currentPage + 1)">Next</button>
            <select class="custom-field__select !min-h-[44px] !rounded-2xl !px-4 !py-2 !pr-8" [(ngModel)]="pageSize" (change)="fetch()">
              <option *ngFor="let size of [10, 25, 50]" [ngValue]="size">{{ size }}/page</option>
            </select>
          </div>
        </div>
      </section>

      <!-- ── Assign Delivery Boy Modal ─────────────────────────────── -->
      <div *ngIf="assignModalOpen" class="custom-modal" (click)="closeAssignModal()">
        <div class="custom-modal__panel" (click)="$event.stopPropagation()">
          <div class="p-6 sm:p-8">
            <div class="flex items-start justify-between gap-4 mb-6">
              <div>
                <p class="page-hero__eyebrow">Assign Delivery</p>
                <h2 class="mt-2 text-2xl font-extrabold text-slate-950">Assign delivery partner</h2>
                <p class="mt-2 text-sm text-slate-500">Select a delivery boy for order <strong class="text-slate-700">{{ selectedOrder?.id | slice:0:12 }}...</strong></p>
              </div>
              <button type="button" class="header-action !h-10 !w-10 flex-shrink-0" (click)="closeAssignModal()">
                <app-icon name="close" [size]="16"></app-icon>
              </button>
            </div>
            <div class="custom-form-grid">
              <label class="custom-field" [class.custom-field--filled]="!!assignDeliveryBoyId">
                <select class="custom-field__select" [(ngModel)]="assignDeliveryBoyId">
                  <option value="">Select delivery partner</option>
                  <option *ngFor="let boy of deliveryBoys" [value]="boy.id">{{ boy.name }} ({{ boy.phone || 'No phone' }})</option>
                </select>
                <span class="custom-field__label">Delivery Partner</span>
              </label>
              <label class="custom-field" [class.custom-field--filled]="!!assignNotes">
                <input class="custom-field__control" [(ngModel)]="assignNotes" placeholder=" ">
                <span class="custom-field__label">Notes (optional)</span>
              </label>
            </div>
            <div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" class="ui-btn ui-btn-secondary" (click)="closeAssignModal()">Cancel</button>
              <button type="button" class="ui-btn ui-btn-primary" [disabled]="!assignDeliveryBoyId || assignBusy" (click)="confirmAssign()">
                <app-icon name="truck" [size]="16"></app-icon>
                {{ assignBusy ? 'Assigning...' : 'Assign Partner' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Confirmation Modal ────────────────────────────────────── -->
      <div *ngIf="confirmModal.open" class="custom-modal" (click)="cancelConfirm()">
        <div class="custom-modal__panel" (click)="$event.stopPropagation()">
          <div class="p-6 sm:p-8">
            <div class="flex items-start gap-4">
              <span class="page-hero__icon !h-12 !w-12 !rounded-[18px]"
                [ngClass]="confirmModal.type === 'approve' ? '!bg-[linear-gradient(135deg,#065f46,#10b981)]' : '!bg-[linear-gradient(135deg,#ef4444,#be123c)]'">
                <app-icon [name]="confirmModal.type === 'approve' ? 'check' : 'close'" [size]="18"></app-icon>
              </span>
              <div>
                <p class="page-hero__eyebrow" [ngClass]="confirmModal.type === 'approve' ? '!text-emerald-500' : '!text-rose-500'">
                  {{ confirmModal.type === 'approve' ? 'Approve Order' : 'Cancel Order' }}
                </p>
                <h2 class="mt-2 text-2xl font-extrabold text-slate-950">Confirm action</h2>
                <p class="mt-2 text-sm text-slate-500">
                  {{ confirmModal.type === 'approve' ? 'Approve order from' : 'Cancel order from' }}
                  <strong>{{ confirmModal.order?.shopkeeper?.shopName }}</strong>?
                </p>
              </div>
            </div>

            <!-- Cancel reason -->
            <div *ngIf="confirmModal.type === 'cancel'" class="mt-5">
              <label class="custom-field" [class.custom-field--filled]="!!cancelReason">
                <textarea class="custom-field__control !min-h-[80px] !pt-6 !resize-none" [(ngModel)]="cancelReason" placeholder=" " rows="3"></textarea>
                <span class="custom-field__label">Cancellation reason *</span>
              </label>
            </div>

            <div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" class="ui-btn ui-btn-secondary" (click)="cancelConfirm()">No, go back</button>
              <button type="button" class="ui-btn"
                [ngClass]="confirmModal.type === 'approve' ? 'ui-btn-primary' : 'ui-btn-danger'"
                [disabled]="(confirmModal.type === 'cancel' && !cancelReason.trim()) || confirmBusy"
                (click)="executeConfirm()">
                {{ confirmBusy ? 'Processing...' : (confirmModal.type === 'approve' ? 'Approve Order' : 'Cancel Order') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Order Detail Drawer ────────────────────────────────────── -->
      <div *ngIf="detailOrder" class="custom-modal" (click)="closeDetail()">
        <div class="custom-modal__panel custom-modal__panel--wide" (click)="$event.stopPropagation()">
          <div class="p-6 sm:p-8">
            <div class="flex items-start justify-between gap-4 mb-6">
              <div>
                <p class="page-hero__eyebrow">Order Detail</p>
                <h2 class="mt-1 text-2xl font-extrabold text-slate-950">Order #{{ detailOrder.id | slice:0:12 }}...</h2>
              </div>
              <button type="button" class="header-action !h-10 !w-10 flex-shrink-0" (click)="closeDetail()">
                <app-icon name="close" [size]="16"></app-icon>
              </button>
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <div class="info-panel">
                <p class="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Shopkeeper Info</p>
                <p class="font-bold text-slate-900">{{ detailOrder.shopkeeper?.shopName }}</p>
                <p class="text-sm text-slate-500">{{ detailOrder.shopkeeper?.ownerName }}</p>
                <p class="text-sm text-slate-500">{{ detailOrder.shopkeeper?.phone }}</p>
              </div>
              <div class="info-panel">
                <p class="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Order Info</p>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm text-slate-500">Status</span>
                  <span class="status-badge" [ngClass]="getStatusClass(detailOrder.status)">{{ detailOrder.status }}</span>
                </div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm text-slate-500">Payment</span>
                  <span class="font-bold text-slate-900">{{ detailOrder.paymentType }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-slate-500">Total</span>
                  <span class="font-extrabold text-slate-900">Rs {{ detailOrder.totalAmount | number }}</span>
                </div>
              </div>
            </div>

            <!-- Order Status Timeline -->
            <div class="mt-5 info-panel">
              <p class="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Order Tracking</p>
              <div class="flex items-center gap-1 flex-wrap">
                <ng-container *ngFor="let step of orderSteps; let i = index; let last = last">
                  <div class="flex items-center gap-1">
                    <div class="flex flex-col items-center">
                      <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                        [ngClass]="getStepClass(detailOrder.status, step.status)">
                        {{ i + 1 }}
                      </div>
                      <p class="text-[10px] mt-1 font-semibold text-center"
                        [ngClass]="isStepDone(detailOrder.status, step.status) ? 'text-emerald-600' : 'text-slate-400'">
                        {{ step.label }}
                      </p>
                    </div>
                    <div *ngIf="!last" class="w-6 h-0.5 mb-4"
                      [ngClass]="isStepDone(detailOrder.status, step.status) ? 'bg-emerald-400' : 'bg-slate-200'"></div>
                  </div>
                </ng-container>
              </div>
            </div>

            <!-- Order Items -->
            <div class="mt-4 info-panel" *ngIf="detailOrder.products?.length > 0">
              <p class="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Order Items</p>
              <div class="space-y-3">
                <div *ngFor="let item of detailOrder.products" class="flex items-center justify-between gap-3 py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <p class="font-semibold text-slate-900">{{ item.product?.name || 'Product' }}</p>
                    <p class="text-xs text-slate-400">Qty: {{ item.quantity }}</p>
                  </div>
                  <p class="font-bold text-slate-900">Rs {{ item.priceAtOrder * item.quantity | number }}</p>
                </div>
              </div>
            </div>

            <!-- Delivery Info -->
            <div class="mt-4 info-panel" *ngIf="detailOrder.deliveryBoy || detailOrder.deliveryAssignments?.length > 0">
              <p class="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Delivery Partner</p>
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <app-icon name="truck" [size]="16" class="text-indigo-600"></app-icon>
                </div>
                <div>
                  <p class="font-bold text-slate-900">{{ detailOrder.deliveryBoy?.name || (detailOrder.deliveryAssignments?.[0]?.deliveryBoy?.name) || 'Assigned' }}</p>
                  <p class="text-sm text-slate-500">{{ detailOrder.deliveryBoy?.phone || detailOrder.deliveryAssignments?.[0]?.deliveryBoy?.phone }}</p>
                </div>
                <span class="ml-auto status-badge" [ngClass]="getDeliveryBadge(detailOrder)">
                  {{ detailOrder.deliveryAssignments?.[0]?.status || detailOrder.status }}
                </span>
              </div>
            </div>

            <div class="mt-6 flex justify-end gap-3">
              <button type="button" class="ui-btn ui-btn-secondary" (click)="closeDetail()">Close</button>
              <button type="button" class="ui-btn ui-btn-primary" *ngIf="canUpdateStatus(detailOrder.status)" (click)="openStatusModal(detailOrder); closeDetail()">
                <app-icon name="edit" [size]="14"></app-icon> Update Status
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Status Update Modal -->
      <div *ngIf="statusModal.open" class="custom-modal" (click)="statusModal.open=false">
        <div class="custom-modal__panel" (click)="$event.stopPropagation()">
          <div class="p-6 sm:p-8">
            <div class="flex items-start justify-between gap-4 mb-6">
              <div>
                <p class="page-hero__eyebrow">Order Fulfillment</p>
                <h2 class="mt-1 text-2xl font-extrabold text-slate-950">Update Order Status</h2>
                <p class="mt-1 text-sm text-slate-500">Current: <span class="font-bold" [ngClass]="getStatusClass(statusModal.order?.status)">{{ statusModal.order?.status }}</span></p>
              </div>
              <button type="button" class="header-action !h-10 !w-10" (click)="statusModal.open=false">
                <app-icon name="close" [size]="16"></app-icon>
              </button>
            </div>

            <!-- Visual Step Selector -->
            <div class="space-y-2 mb-6">
              <ng-container *ngFor="let step of getNextStatuses(statusModal.order?.status)">
                <button type="button"
                  class="w-full flex items-center gap-3 p-3 rounded-2xl border-2 transition-all"
                  [ngClass]="statusModal.newStatus === step.value ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white hover:border-slate-300'"
                  (click)="statusModal.newStatus = step.value">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center" [ngClass]="step.color">
                    <app-icon [name]="step.icon" [size]="14"></app-icon>
                  </div>
                  <div class="text-left">
                    <p class="font-bold text-slate-900 text-sm">{{ step.label }}</p>
                    <p class="text-xs text-slate-500">{{ step.desc }}</p>
                  </div>
                  <div *ngIf="statusModal.newStatus === step.value" class="ml-auto w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
                    <app-icon name="check" [size]="10" class="text-white"></app-icon>
                  </div>
                </button>
              </ng-container>
            </div>

            <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" class="ui-btn ui-btn-secondary" (click)="statusModal.open=false">Cancel</button>
              <button type="button" class="ui-btn ui-btn-primary" [disabled]="!statusModal.newStatus || statusBusy" (click)="doUpdateOrderStatus()">
                {{ statusBusy ? 'Updating...' : 'Confirm Status Update' }}
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  `
})
export class OrdersComponent implements OnInit, OnDestroy {
  orders: any[] = [];
  deliveryBoys: any[] = [];
  totalItems = 0;
  pageSize = 10;
  currentPage = 0;
  loading = false;
  statusFilter = '';
  paymentFilter = '';
  dateFrom = '';
  dateTo = '';
  searchControl = new FormControl('');
  busy: Record<string, boolean> = {};

  assignModalOpen = false;
  selectedOrder: any = null;
  assignDeliveryBoyId = '';
  assignNotes = '';
  assignBusy = false;

  confirmModal: { open: boolean; type: string; order: any } = { open: false, type: '', order: null };
  cancelReason = '';
  confirmBusy = false;
  detailOrder: any = null;
  statusModal: any = { open: false, order: null, newStatus: '' };
  statusBusy = false;

  readonly orderSteps = [
    { status: 'PENDING',   label: 'Pending' },
    { status: 'APPROVED',  label: 'Approved' },
    { status: 'PACKED',    label: 'Packed' },
    { status: 'SHIPPED',   label: 'Shipped' },
    { status: 'DELIVERED', label: 'Delivered' },
  ];

  private readonly STATUS_ORDER = ['PENDING','APPROVED','PACKED','SHIPPED','DELIVERED','CANCELLED'];

  private destroy$ = new Subject<void>();

  constructor(private adminApi: AdminApiService, private toast: ToastService) {}

  ngOnInit() {
    this.adminApi.getDeliveryBoys().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => { this.deliveryBoys = res?.data?.deliveryBoys || []; }
    });

    this.searchControl.valueChanges.pipe(
      debounceTime(400),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentPage = 0;
      this.fetch();
    });

    this.fetch();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get totalPages() { return Math.max(1, Math.ceil(this.totalItems / this.pageSize)); }

  setStatus(status: string) {
    this.statusFilter = status;
    this.currentPage = 0;
    this.fetch();
  }

  clearFilters() {
    this.statusFilter = '';
    this.paymentFilter = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.searchControl.setValue('');
    this.currentPage = 0;
    this.fetch();
  }

  fetch(force = false) {
    this.loading = true;
    const params: any = {
      page: this.currentPage + 1,
      limit: this.pageSize,
      status: this.statusFilter || null,
      paymentType: this.paymentFilter || null,
      search: this.searchControl.value || null,
      dateFrom: this.dateFrom || null,
      dateTo: this.dateTo || null,
    };
    Object.keys(params).forEach(k => params[k] == null && delete params[k]);

    this.adminApi.getOrders(params, force).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.orders = res?.data?.items || [];
        this.totalItems = res?.data?.totalItems || 0;
        this.loading = false;
      },
      error: () => {
        this.toast.error('Failed to load orders');
        this.loading = false;
      }
    });
  }

  goToPage(page: number) {
    this.currentPage = Math.max(0, Math.min(page, this.totalPages - 1));
    this.fetch();
  }

  openAssignModal(order: any) {
    this.selectedOrder = order;
    this.assignDeliveryBoyId = '';
    this.assignNotes = '';
    this.assignModalOpen = true;
  }

  closeAssignModal() {
    this.assignModalOpen = false;
    this.selectedOrder = null;
    this.assignDeliveryBoyId = '';
    this.assignNotes = '';
  }

  confirmAssign() {
    if (!this.assignDeliveryBoyId || !this.selectedOrder) return;
    this.assignBusy = true;
    this.adminApi.assignDeliveryBoy(this.selectedOrder.id, this.assignDeliveryBoyId, this.assignNotes).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.toast.success('Delivery partner assigned!');
        this.assignBusy = false;
        this.closeAssignModal();
        this.fetch(true);
      },
      error: (err: any) => {
        this.toast.error(err?.error?.message || 'Assignment failed');
        this.assignBusy = false;
      }
    });
  }

  confirmAction(type: string, order: any) {
    this.confirmModal = { open: true, type, order };
    this.cancelReason = '';
  }

  cancelConfirm() {
    this.confirmModal = { open: false, type: '', order: null };
    this.cancelReason = '';
  }

  executeConfirm() {
    const { type, order } = this.confirmModal;
    if (!order) return;
    this.confirmBusy = true;
    this.busy[order.id] = true;

    const req$ = type === 'approve'
      ? this.adminApi.approveOrder(order.id)
      : this.adminApi.cancelOrder(order.id, this.cancelReason);

    req$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.toast.success(type === 'approve' ? 'Order approved!' : 'Order cancelled');
        this.confirmBusy = false;
        this.busy[order.id] = false;
        this.cancelConfirm();
        this.fetch(true);
      },
      error: (err: any) => {
        this.toast.error(err?.error?.message || 'Action failed');
        this.confirmBusy = false;
        this.busy[order.id] = false;
      }
    });
  }

  openDetail(order: any) {
    this.adminApi.getOrderById(order.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => { this.detailOrder = res?.data || order; },
      error: () => { this.detailOrder = order; }
    });
  }

  closeDetail() { this.detailOrder = null; }

  openStatusModal(order: any) {
    this.statusModal = { open: true, order, newStatus: '' };
  }

  doUpdateOrderStatus() {
    if (!this.statusModal.newStatus || !this.statusModal.order) return;
    this.statusBusy = true;
    this.adminApi.updateOrderStatus(this.statusModal.order.id, this.statusModal.newStatus)
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.toast.success('Order status updated!');
          this.statusBusy = false;
          this.statusModal.open = false;
          this.fetch(true);
        },
        error: (e: any) => { this.toast.error(e?.error?.message || 'Failed'); this.statusBusy = false; }
      });
  }

  canUpdateStatus(status: string): boolean {
    return !['DELIVERED','CANCELLED'].includes(status);
  }

  getNextStatuses(current: string): any[] {
    const allNext: Record<string, any[]> = {
      'PENDING':  [{ value: 'APPROVED', label: 'Approve Order', icon: 'check', color: 'bg-blue-100 text-blue-600', desc: 'Mark as reviewed and approved' }],
      'APPROVED': [{ value: 'PACKED', label: 'Mark as Packed', icon: 'bag', color: 'bg-violet-100 text-violet-600', desc: 'Items packed and ready for pickup' }],
      'PACKED':   [{ value: 'SHIPPED', label: 'Mark as Shipped', icon: 'truck', color: 'bg-amber-100 text-amber-600', desc: 'Out for delivery with partner' }],
      'SHIPPED':  [{ value: 'DELIVERED', label: 'Mark as Delivered', icon: 'check', color: 'bg-emerald-100 text-emerald-600', desc: 'Successfully delivered to shopkeeper' }],
    };
    return allNext[current] || [];
  }

  isStepDone(currentStatus: string, stepStatus: string): boolean {
    const idx = (s: string) => this.STATUS_ORDER.indexOf(s);
    return idx(currentStatus) >= idx(stepStatus);
  }

  getStepClass(currentStatus: string, stepStatus: string): string {
    if (currentStatus === stepStatus) return 'bg-indigo-500 text-white ring-2 ring-indigo-300';
    return this.isStepDone(currentStatus, stepStatus)
      ? 'bg-emerald-500 text-white'
      : 'bg-slate-100 text-slate-400';
  }

  getDeliveryBadge(order: any): string {
    const s = order.deliveryAssignments?.[0]?.status || '';
    const map: Record<string, string> = {
      'ASSIGNED': 'bg-blue-100 text-blue-700',
      'PICKED': 'bg-violet-100 text-violet-700',
      'IN_TRANSIT': 'bg-amber-100 text-amber-700',
      'DELIVERED': 'bg-emerald-100 text-emerald-700',
      'FAILED': 'bg-rose-100 text-rose-700',
    };
    return map[s] || 'bg-slate-100 text-slate-500';
  }

  getStatusClass(status: string) {
    const map: Record<string, string> = {
      'PENDING':   'bg-yellow-100 text-yellow-800',
      'APPROVED':  'bg-blue-100 text-blue-800',
      'PACKED':    'bg-violet-100 text-violet-800',
      'SHIPPED':   'bg-amber-100 text-amber-800',
      'DELIVERED': 'bg-emerald-100 text-emerald-800',
      'CANCELLED': 'bg-rose-100 text-rose-700',
    };
    return map[status] || 'bg-slate-100 text-slate-600';
  }

  trackById(_: number, item: any) { return item.id; }
}
