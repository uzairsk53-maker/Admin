import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { AdminApiService } from '../../core/services/admin-api.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-delivery',
  template: `
    <div class="page-shell page-stack">

      <!-- Hero -->
      <section class="glass-panel section-card">
        <div class="page-hero">
          <div class="page-hero__meta">
            <span class="page-hero__icon"><app-icon name="delivery" [size]="22"></app-icon></span>
            <div>
              <p class="page-hero__eyebrow">Delivery Ops</p>
              <h1 class="page-hero__title">Delivery Management</h1>
              <p class="page-hero__subtitle">Manage delivery partners, track deliveries, and confirm manual repayments.</p>
            </div>
          </div>
          <div class="page-hero__actions">
            <button type="button" class="ui-btn ui-btn-primary !min-h-[48px]" (click)="openAddBoyModal()">
              <app-icon name="add" [size]="18"></app-icon> Add Delivery Partner
            </button>
          </div>
        </div>

        <!-- Tabs -->
        <div class="px-4 sm:px-6 pb-4">
          <div class="segment-tabs">
            <button class="segment-tabs__item" [class.segment-tabs__item--active]="activeTab==='partners'" (click)="activeTab='partners'">Partners ({{ boys.length }})</button>
            <button class="segment-tabs__item" [class.segment-tabs__item--active]="activeTab==='pending'" (click)="activeTab='pending'">Pending ({{ pendingDeliveries.length }})</button>
            <button class="segment-tabs__item" [class.segment-tabs__item--active]="activeTab==='completed'" (click)="activeTab='completed'">Completed</button>
            <button class="segment-tabs__item" [class.segment-tabs__item--active]="activeTab==='repayment'" (click)="activeTab='repayment'">Manual Repayment</button>
          </div>
        </div>
      </section>

      <!-- ── Delivery Partners ──────────────────────── -->
      <section *ngIf="activeTab==='partners'">
        <div *ngIf="boysLoading" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;padding:4px">
          <div *ngFor="let i of [1,2,3]" style="height:160px;border-radius:8px;background:linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%);background-size:200% 100%;animation:shimmer 1.4s infinite"></div>
        </div>
        <div *ngIf="!boysLoading && boys.length === 0" class="empty-state" style="margin:16px">
          <p style="font-weight:700;color:#424242;margin:0">No delivery partners yet</p>
          <p style="font-size:12px;color:#878787;margin:4px 0 0">Add your first partner to start assigning deliveries.</p>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;padding:4px">
          <div *ngFor="let boy of boys; trackBy: trackById" class="partner-card">
            <div style="display:flex;align-items:center;gap:12px">
              <div class="partner-card__avatar">{{ boy.name?.charAt(0) || 'D' }}</div>
              <div style="min-width:0;flex:1">
                <h3 class="partner-card__name">{{ boy.name || 'Unnamed' }}</h3>
                <p class="partner-card__phone">{{ boy.phone || 'No phone' }}</p>
              </div>
              <span class="badge" [class.badge--green]="boy.isActive" [class.badge--gray]="!boy.isActive">
                {{ boy.isActive ? 'Active' : 'Inactive' }}
              </span>
              <button class="action-chip ml-auto !h-8 !w-8 p-0" title="Edit Partner" (click)="openEditBoyModal(boy)">
                <app-icon name="edit" [size]="14"></app-icon>
              </button>
            </div>
            <div class="partner-card__stats">
              <div>
                <div class="partner-card__stat-label">Total Deliveries</div>
                <div class="partner-card__stat-value">{{ boy.totalDeliveries || 0 }}</div>
              </div>
              <div>
                <div class="partner-card__stat-label">Completed</div>
                <div class="partner-card__stat-value" style="color:#2e7d32">{{ boy.completedDeliveries || 0 }}</div>
              </div>
            </div>
          </div>
        </div>
      </section>


      <!-- ── Pending Deliveries ──────────────────────── -->
      <section *ngIf="activeTab==='pending'" class="soft-card rounded-[32px] overflow-hidden">
        <div class="p-6 flex items-center justify-between">
          <h2 class="text-xl font-extrabold text-slate-950">Pending Deliveries</h2>
          <button type="button" class="ui-btn ui-btn-secondary" (click)="loadDeliveries()"><app-icon name="refresh" [size]="16"></app-icon></button>
        </div>
        <div *ngIf="deliveriesLoading" class="p-6 space-y-3"><div *ngFor="let i of [1,2,3]" class="h-16 animate-pulse rounded-[18px] bg-slate-100"></div></div>
        <div *ngIf="!deliveriesLoading && pendingDeliveries.length === 0" class="px-6 pb-10 empty-state mx-4 mb-4"><p class="font-bold text-slate-500">No pending deliveries</p></div>
        <div *ngIf="!deliveriesLoading && pendingDeliveries.length > 0" class="overflow-x-auto custom-scrollbar">
          <table class="custom-table">
            <thead><tr>
              <th>Order / Shop</th><th>Delivery Partner</th><th>Tracking</th><th>Assigned At</th><th class="text-right">Actions</th>
            </tr></thead>
            <tbody>
              <tr *ngFor="let d of pendingDeliveries; trackBy: trackById">
                <td>
                  <div class="font-bold text-slate-900">{{ d.order?.shopkeeper?.shopName || 'Unknown' }}</div>
                  <div class="font-mono text-xs text-slate-400">{{ d.orderId | slice:0:12 }}...</div>
                </td>
                <td>
                  <div class="font-semibold text-slate-900">{{ d.deliveryBoy?.name || 'Unassigned' }}</div>
                  <div class="text-xs text-slate-400">{{ d.deliveryBoy?.phone || '' }}</div>
                </td>
                <td>
                  <!-- Delivery Progress Track -->
                  <div class="flex items-center gap-1">
                    <ng-container *ngFor="let step of deliverySteps; let last = last">
                      <div [title]="step.label"
                        class="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold transition-all"
                        [ngClass]="isDeliveryStepDone(d.status, step.value) ? step.doneClass : 'bg-slate-100 text-slate-400'">
                        {{ step.num }}
                      </div>
                      <div *ngIf="!last" class="w-3 h-0.5"
                        [ngClass]="isDeliveryStepDone(d.status, step.value) ? 'bg-emerald-400' : 'bg-slate-200'"></div>
                    </ng-container>
                  </div>
                  <span class="text-[10px] font-semibold mt-1 block" [ngClass]="getDeliveryStatusClass(d.status)">{{ d.status }}</span>
                </td>
                <td class="text-sm text-slate-500">{{ d.createdAt | date:'MMM d, h:mm a' }}</td>
                <td class="text-right">
                  <div class="flex justify-end gap-2">
                    <button type="button" class="action-chip !min-h-[38px] text-indigo-700"
                      *ngIf="!d.deliveryBoyId" (click)="openAssignDelivery(d)">
                      <app-icon name="truck" [size]="14"></app-icon> Assign
                    </button>
                    <button type="button" class="action-chip !min-h-[38px] text-sky-700" (click)="openStatusUpdate(d)">
                      <app-icon name="edit" [size]="14"></app-icon> Status
                    </button>
                    <button type="button" class="action-chip !min-h-[38px] text-emerald-700" *ngIf="d.deliveryBoyId" (click)="openTrackModal(d)">
                      <app-icon name="location" [size]="14"></app-icon> Track
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ── Completed Deliveries ────────────────────── -->
      <section *ngIf="activeTab==='completed'" class="soft-card rounded-[32px] overflow-hidden">
        <div class="p-6 flex items-center justify-between">
          <h2 class="text-xl font-extrabold text-slate-950">Completed Deliveries</h2>
          <button type="button" class="ui-btn ui-btn-secondary" (click)="loadDeliveries()"><app-icon name="refresh" [size]="16"></app-icon></button>
        </div>
        <div *ngIf="deliveriesLoading" class="p-6 space-y-3"><div *ngFor="let i of [1,2,3]" class="h-16 animate-pulse rounded-[18px] bg-slate-100"></div></div>
        <div *ngIf="!deliveriesLoading && completedDeliveries.length === 0" class="px-6 pb-10 empty-state mx-4 mb-4"><p class="font-bold text-slate-500">No completed deliveries</p></div>
        <div *ngIf="!deliveriesLoading && completedDeliveries.length > 0" class="overflow-x-auto custom-scrollbar">
          <table class="custom-table">
            <thead><tr>
              <th>Order / Shop</th><th>Delivery Partner</th><th>Status</th><th>Completed At</th>
            </tr></thead>
            <tbody>
              <tr *ngFor="let d of completedDeliveries; trackBy: trackById">
                <td>
                  <div class="font-bold text-slate-900">{{ d.order?.shopkeeper?.shopName || 'Unknown' }}</div>
                  <div class="font-mono text-xs text-slate-400">{{ d.orderId | slice:0:12 }}...</div>
                </td>
                <td><div class="font-semibold text-slate-900">{{ d.deliveryBoy?.name || '—' }}</div></td>
                <td><span class="status-badge bg-emerald-100 text-emerald-700">{{ d.status }}</span></td>
                <td class="text-sm text-slate-500">{{ d.updatedAt | date:'MMM d, y' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ── Manual Repayment ────────────────────────── -->
      <section *ngIf="activeTab==='repayment'" class="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div class="soft-card rounded-[32px] p-6 sm:p-8">
          <div class="rounded-[20px] border border-amber-200 bg-amber-50 p-4 mb-6 flex gap-3">
            <app-icon name="warning" [size]="20" class="text-amber-600 flex-shrink-0 mt-0.5"></app-icon>
            <p class="text-sm text-amber-800"><strong>Warning:</strong> Manual repayment confirmation directly credits the shopkeeper's wallet. Verify cash receipt before confirming.</p>
          </div>
          <h2 class="text-xl font-extrabold text-slate-950 mb-6">Confirm Manual Repayment</h2>
          <form [formGroup]="repayForm" (ngSubmit)="confirmRepayment()" class="space-y-5">
            <label class="custom-field" [class.custom-field--filled]="repayForm.get('shopkeeperId')?.value">
              <input class="custom-field__control" formControlName="shopkeeperId" placeholder=" ">
              <span class="custom-field__label">Shopkeeper ID *</span>
            </label>
            <label class="custom-field" [class.custom-field--filled]="repayForm.get('orderId')?.value">
              <input class="custom-field__control" formControlName="orderId" placeholder=" ">
              <span class="custom-field__label">Order ID *</span>
            </label>
            <label class="custom-field" [class.custom-field--filled]="repayForm.get('amount')?.value">
              <input class="custom-field__control" type="number" formControlName="amount" placeholder=" ">
              <span class="custom-field__label">Amount Received (Rs) *</span>
            </label>
            <label class="flex cursor-pointer items-center justify-between rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
              <div>
                <p class="font-bold text-slate-900">Late repayment</p>
                <p class="mt-1 text-sm text-slate-500">Enable if payment missed the due window.</p>
              </div>
              <input type="checkbox" formControlName="isLate" class="h-5 w-5 rounded border-slate-300 text-sky-600">
            </label>
            <label class="custom-field" [class.custom-field--filled]="repayForm.get('notes')?.value">
              <textarea class="custom-field__control !min-h-[70px] !pt-6 !resize-none" formControlName="notes" placeholder=" " rows="2"></textarea>
              <span class="custom-field__label">Notes (optional)</span>
            </label>
            <button type="submit" class="ui-btn ui-btn-primary !w-full !justify-center" [disabled]="repayForm.invalid || repayBusy">
              <app-icon name="check" [size]="16"></app-icon>
              {{ repayBusy ? 'Processing...' : 'Confirm Repayment' }}
            </button>
          </form>
        </div>
        <div class="soft-card rounded-[32px] p-6 sm:p-8">
          <h2 class="text-xl font-extrabold text-slate-950 mb-5">Repayment Guidelines</h2>
          <div class="space-y-4">
            <div class="info-panel border-emerald-200 bg-emerald-50 text-emerald-800">
              <div class="flex gap-3"><app-icon name="check" [size]="16"></app-icon><p><strong>On-time:</strong> Credits balance, awards bonus points if applicable.</p></div>
            </div>
            <div class="info-panel border-rose-200 bg-rose-50 text-rose-800">
              <div class="flex gap-3"><app-icon name="warning" [size]="16"></app-icon><p><strong>Late:</strong> Credits balance but applies penalty score deduction.</p></div>
            </div>
            <div class="info-panel border-sky-200 bg-sky-50 text-sky-800">
              <div class="flex gap-3"><app-icon name="info" [size]="16"></app-icon><p>All repayments are logged with admin ID and timestamp in the audit trail.</p></div>
            </div>
          </div>
        </div>
      </section>

      <!-- Add Boy Modal -->
      <div *ngIf="addBoyModal" class="custom-modal" (click)="addBoyModal=false">
        <div class="custom-modal__panel" (click)="$event.stopPropagation()">
          <div class="p-6 sm:p-8">
            <div class="flex items-start justify-between gap-4 mb-6">
              <div><p class="page-hero__eyebrow">Delivery Partner</p><h2 class="mt-1 text-2xl font-extrabold text-slate-950">Add New Partner</h2></div>
              <button type="button" class="header-action !h-10 !w-10" (click)="addBoyModal=false"><app-icon name="close" [size]="16"></app-icon></button>
            </div>
            <form [formGroup]="boyForm" (ngSubmit)="saveDeliveryBoy()" class="space-y-4">
              <label class="custom-field" [class.custom-field--filled]="boyForm.get('name')?.value">
                <input class="custom-field__control" formControlName="name" placeholder=" ">
                <span class="custom-field__label">Full Name *</span>
              </label>
              <label class="custom-field" [class.custom-field--filled]="boyForm.get('phone')?.value">
                <input class="custom-field__control" formControlName="phone" placeholder=" ">
                <span class="custom-field__label">Phone Number *</span>
              </label>
              <label class="custom-field" [class.custom-field--filled]="boyForm.get('password')?.value">
                <input class="custom-field__control" type="password" formControlName="password" placeholder=" ">
                <span class="custom-field__label">Password *</span>
              </label>
              <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button type="button" class="ui-btn ui-btn-secondary" (click)="addBoyModal=false">Cancel</button>
                <button type="submit" class="ui-btn ui-btn-primary" [disabled]="boyForm.invalid || boyBusy">{{ boyBusy ? 'Saving...' : 'Add Partner' }}</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Edit Boy Modal with Tracking Map -->
      <div *ngIf="editBoyModal" class="custom-modal" (click)="editBoyModal=false">
        <div class="custom-modal__panel custom-modal__panel--wide" (click)="$event.stopPropagation()">
          <div class="p-6 sm:p-8">
            <div class="flex items-start justify-between gap-4 mb-6">
              <div>
                <p class="page-hero__eyebrow">Delivery Partner</p>
                <h2 class="mt-1 text-2xl font-extrabold text-slate-950">Edit Partner & Live Tracking</h2>
              </div>
              <button type="button" class="header-action !h-10 !w-10" (click)="editBoyModal=false"><app-icon name="close" [size]="16"></app-icon></button>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <!-- Edit Form -->
              <form [formGroup]="editBoyForm" (ngSubmit)="updateDeliveryBoy()" class="space-y-4">
                <label class="custom-field" [class.custom-field--filled]="editBoyForm.get('name')?.value">
                  <input class="custom-field__control" formControlName="name" placeholder=" ">
                  <span class="custom-field__label">Full Name *</span>
                </label>
                <label class="custom-field" [class.custom-field--filled]="editBoyForm.get('phone')?.value">
                  <input class="custom-field__control" formControlName="phone" placeholder=" ">
                  <span class="custom-field__label">Phone Number *</span>
                </label>
                <label class="custom-field" [class.custom-field--filled]="editBoyForm.get('vehicleNo')?.value">
                  <input class="custom-field__control" formControlName="vehicleNo" placeholder=" ">
                  <span class="custom-field__label">Vehicle No.</span>
                </label>
                <label class="custom-field" [class.custom-field--filled]="editBoyForm.get('city')?.value">
                  <input class="custom-field__control" formControlName="city" placeholder=" ">
                  <span class="custom-field__label">City</span>
                </label>
                
                <label class="flex cursor-pointer items-center justify-between rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                  <div>
                    <p class="font-bold text-slate-900">Active Status</p>
                    <p class="mt-1 text-sm text-slate-500">Toggle if partner is active.</p>
                  </div>
                  <input type="checkbox" formControlName="isActive" class="h-5 w-5 rounded border-slate-300 text-sky-600">
                </label>

                <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-start pt-2">
                  <button type="submit" class="ui-btn ui-btn-primary" [disabled]="editBoyForm.invalid || boyBusy">{{ boyBusy ? 'Saving...' : 'Save Changes' }}</button>
                  <button type="button" class="ui-btn ui-btn-secondary" (click)="editBoyModal=false">Close</button>
                </div>
              </form>

              <!-- Map Tracking -->
              <div class="space-y-3">
                <p class="font-bold text-slate-900">Live GPS Location</p>
                <div class="rounded-2xl border-2 border-slate-200 overflow-hidden relative" style="height: 300px">
                  <app-map-picker 
                    height="300px" 
                    [lat]="selectedBoy?.latitude" 
                    [lng]="selectedBoy?.longitude"
                    (locationChange)="onLocationChange($event)">
                  </app-map-picker>
                </div>
                <p class="text-xs text-slate-500">
                  <app-icon name="info" [size]="12" class="inline"></app-icon> Move pin to update partner's live tracking coordinates.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Assign Delivery Modal -->
      <div *ngIf="assignDeliveryModal.open" class="custom-modal" (click)="assignDeliveryModal.open=false">
        <div class="custom-modal__panel" (click)="$event.stopPropagation()">
          <div class="p-6 sm:p-8">
            <div class="flex items-start justify-between gap-4 mb-6">
              <h2 class="text-xl font-extrabold text-slate-950">Assign Delivery Partner</h2>
              <button type="button" class="header-action !h-10 !w-10" (click)="assignDeliveryModal.open=false"><app-icon name="close" [size]="16"></app-icon></button>
            </div>
            <div class="space-y-4">
              <label class="custom-field" [class.custom-field--filled]="assignDeliveryModal.deliveryBoyId">
                <select class="custom-field__select" [(ngModel)]="assignDeliveryModal.deliveryBoyId">
                  <option value="">Select partner</option>
                  <option *ngFor="let boy of boys" [value]="boy.id">{{ boy.name }} — {{ boy.phone }}</option>
                </select>
                <span class="custom-field__label">Delivery Partner</span>
              </label>
            </div>
            <div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" class="ui-btn ui-btn-secondary" (click)="assignDeliveryModal.open=false">Cancel</button>
              <button type="button" class="ui-btn ui-btn-primary" [disabled]="!assignDeliveryModal.deliveryBoyId || assignBusy" (click)="doAssignDelivery()">
                {{ assignBusy ? 'Assigning...' : 'Confirm Assignment' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Status Update Modal (Guided) -->
      <div *ngIf="statusModal.open" class="custom-modal" (click)="statusModal.open=false">
        <div class="custom-modal__panel" (click)="$event.stopPropagation()">
          <div class="p-6 sm:p-8">
            <div class="flex items-start justify-between gap-4 mb-2">
              <div>
                <p class="page-hero__eyebrow">Delivery Tracking</p>
                <h2 class="mt-1 text-2xl font-extrabold text-slate-950">Update Delivery Status</h2>
                <p class="mt-1 text-sm text-slate-500">
                  <span class="font-bold text-slate-700">{{ statusModal.delivery?.deliveryBoy?.name || 'Partner' }}</span>
                  &mdash; {{ statusModal.delivery?.order?.shopkeeper?.shopName || 'Order' }}
                </p>
              </div>
              <button type="button" class="header-action !h-10 !w-10" (click)="statusModal.open=false">
                <app-icon name="close" [size]="16"></app-icon>
              </button>
            </div>

            <!-- Current progress track -->
            <div class="flex items-center gap-1 my-5 p-3 bg-slate-50 rounded-2xl">
              <ng-container *ngFor="let step of deliverySteps; let last = last">
                <div class="flex items-center gap-1">
                  <div class="flex flex-col items-center">
                    <div class="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold"
                      [ngClass]="isDeliveryStepDone(statusModal.delivery?.status, step.value) ? step.doneClass : 'bg-slate-200 text-slate-400'">
                      {{ step.num }}
                    </div>
                    <p class="text-[9px] mt-0.5 font-semibold text-center"
                      [ngClass]="isDeliveryStepDone(statusModal.delivery?.status, step.value) ? 'text-emerald-600' : 'text-slate-400'">
                      {{ step.label }}
                    </p>
                  </div>
                  <div *ngIf="!last" class="w-4 h-0.5 mb-3"
                    [ngClass]="isDeliveryStepDone(statusModal.delivery?.status, step.value) ? 'bg-emerald-400' : 'bg-slate-200'"></div>
                </div>
              </ng-container>
            </div>

            <!-- Next step options -->
            <div class="space-y-2 mb-5">
              <p class="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Select Next Status</p>
              <ng-container *ngFor="let step of getNextDeliveryStatuses(statusModal.delivery?.status)">
                <button type="button"
                  class="w-full flex items-center gap-3 p-3 rounded-2xl border-2 transition-all"
                  [ngClass]="statusModal.newStatus === step.value ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white hover:border-slate-300'"
                  (click)="statusModal.newStatus = step.value">
                  <div class="w-9 h-9 rounded-full flex items-center justify-center" [ngClass]="step.color">
                    <app-icon [name]="step.icon" [size]="16"></app-icon>
                  </div>
                  <div class="text-left flex-1">
                    <p class="font-bold text-slate-900 text-sm">{{ step.label }}</p>
                    <p class="text-xs text-slate-500">{{ step.desc }}</p>
                  </div>
                  <div *ngIf="statusModal.newStatus === step.value" class="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
                    <app-icon name="check" [size]="10" class="text-white"></app-icon>
                  </div>
                </button>
              </ng-container>
              <div *ngIf="getNextDeliveryStatuses(statusModal.delivery?.status).length === 0"
                class="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-center text-sm text-slate-500">
                No further updates available for <strong>{{ statusModal.delivery?.status }}</strong>
              </div>
            </div>

            <!-- Credit award banner -->
            <div *ngIf="statusModal.newStatus === 'DELIVERED'"
              class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 mb-5 flex gap-3 items-start">
              <app-icon name="check" [size]="18" class="text-emerald-600 flex-shrink-0 mt-0.5"></app-icon>
              <div>
                <p class="font-bold text-emerald-800 text-sm">Credit Reward Will Be Awarded</p>
                <p class="text-xs text-emerald-700 mt-0.5">Shopkeeper receives delivery bonus credit points. Order status syncs to DELIVERED automatically.</p>
              </div>
            </div>

            <label class="custom-field mb-5" [class.custom-field--filled]="statusModal.notes">
              <input class="custom-field__control" [(ngModel)]="statusModal.notes" placeholder=" ">
              <span class="custom-field__label">Notes (optional)</span>
            </label>

            <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" class="ui-btn ui-btn-secondary" (click)="statusModal.open=false">Cancel</button>
              <button type="button" class="ui-btn ui-btn-primary" [disabled]="!statusModal.newStatus || statusBusy" (click)="doUpdateStatus()">
                <app-icon name="truck" [size]="14"></app-icon>
                {{ statusBusy ? 'Updating...' : 'Confirm Update' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Live Tracking Modal -->
      <div *ngIf="trackModal.open" class="custom-modal" (click)="trackModal.open=false">
        <div class="custom-modal__panel custom-modal__panel--wide" (click)="$event.stopPropagation()">
          <div class="p-6 sm:p-8">
            <div class="flex items-start justify-between gap-4 mb-4">
              <div>
                <p class="page-hero__eyebrow">Live GPS Tracking</p>
                <h2 class="mt-1 text-2xl font-extrabold text-slate-950">Track Delivery</h2>
                <p class="mt-1 text-sm text-slate-500">
                  <span class="font-bold text-slate-700">{{ trackModal.delivery?.deliveryBoy?.name || 'Partner' }}</span>
                  &mdash; delivering to {{ trackModal.delivery?.order?.shopkeeper?.shopName || 'Shop' }}
                </p>
              </div>
              <button type="button" class="header-action !h-10 !w-10" (click)="trackModal.open=false">
                <app-icon name="close" [size]="16"></app-icon>
              </button>
            </div>

            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4 mb-4 flex justify-between items-center text-sm">
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full bg-indigo-600"></span> 
                <span class="font-semibold text-slate-700">Delivery Vehicle</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="font-semibold text-slate-700">Destination</span>
                <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
              </div>
            </div>

            <div class="w-full">
              <app-map-tracker
                height="400px"
                [startLat]="trackModal.delivery?.deliveryBoy?.latitude"
                [startLng]="trackModal.delivery?.deliveryBoy?.longitude"
                [endLat]="trackModal.delivery?.order?.shopkeeper?.latitude"
                [endLng]="trackModal.delivery?.order?.shopkeeper?.longitude">
              </app-map-tracker>
            </div>

            <div class="mt-6 flex justify-end">
              <button type="button" class="ui-btn ui-btn-primary" (click)="trackModal.open=false">Close Tracking</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Repayment Confirm Modal -->
      <div *ngIf="repayConfirmOpen" class="custom-modal" (click)="repayConfirmOpen=false">
        <div class="custom-modal__panel" (click)="$event.stopPropagation()">
          <div class="p-6 sm:p-8">
            <div class="flex items-start gap-4 mb-4">
              <span class="page-hero__icon !h-12 !w-12 !rounded-[18px] !bg-[linear-gradient(135deg,#065f46,#10b981)]">
                <app-icon name="check" [size]="18"></app-icon>
              </span>
              <div>
                <p class="page-hero__eyebrow !text-emerald-500">Manual Repayment</p>
                <h2 class="mt-1 text-2xl font-extrabold text-slate-950">Confirm repayment of Rs {{ repayForm.get('amount')?.value | number }}</h2>
                <p class="mt-2 text-sm text-slate-500">{{ repayForm.get('isLate')?.value ? '⚠️ Late penalty will apply.' : 'On-time bonus will apply.' }}</p>
              </div>
            </div>
            <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end mt-6">
              <button type="button" class="ui-btn ui-btn-secondary" (click)="repayConfirmOpen=false">Cancel</button>
              <button type="button" class="ui-btn ui-btn-primary" [disabled]="repayBusy" (click)="doRepayment()">
                {{ repayBusy ? 'Processing...' : 'Confirm Repayment' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DeliveryComponent implements OnInit, OnDestroy {
  activeTab = 'partners';
  boys: any[] = [];
  allDeliveries: any[] = [];
  boysLoading = false;
  deliveriesLoading = false;
  boyBusy = false;
  assignBusy = false;
  statusBusy = false;
  repayBusy = false;
  addBoyModal = false;
  editBoyModal = false;
  repayConfirmOpen = false;
  assignDeliveryModal: any = { open: false, delivery: null, deliveryBoyId: '', notes: '' };
  statusModal: any = { open: false, delivery: null, status: '', notes: '' };
  trackModal: any = { open: false, delivery: null };
  boyForm!: FormGroup;
  editBoyForm!: FormGroup;
  repayForm!: FormGroup;
  selectedBoy: any = null;
  private destroy$ = new Subject<void>();

  constructor(private adminApi: AdminApiService, private toast: ToastService, private fb: FormBuilder) {}

  ngOnInit() {
    this.boyForm = this.fb.group({
      name: ['', Validators.required],
      phone: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
    this.editBoyForm = this.fb.group({
      name: ['', Validators.required],
      phone: ['', Validators.required],
      vehicleNo: [''],
      city: [''],
      isActive: [true],
      latitude: [null],
      longitude: [null]
    });
    this.repayForm = this.fb.group({
      shopkeeperId: ['', Validators.required],
      orderId: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(1)]],
      isLate: [false],
      notes: [''],
    });
    this.loadBoys();
    this.loadDeliveries();
  }

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

  get pendingDeliveries() {
    return Array.isArray(this.allDeliveries)
      ? this.allDeliveries.filter(d => !['DELIVERED', 'COMPLETED'].includes(d.status))
      : [];
  }
  get completedDeliveries() {
    return Array.isArray(this.allDeliveries)
      ? this.allDeliveries.filter(d => ['DELIVERED', 'COMPLETED'].includes(d.status))
      : [];
  }

  loadBoys() {
    this.boysLoading = true;
    this.adminApi.getDeliveryBoys(true).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        const raw = res?.data?.deliveryBoys || res?.data?.items || res?.data || [];
        this.boys = Array.isArray(raw) ? raw : [];
        this.boysLoading = false;
      },
      error: () => this.boysLoading = false,
    });
  }

  loadDeliveries() {
    this.deliveriesLoading = true;
    this.adminApi.getDeliveries({ page: 1, limit: 100 }, true).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        const raw = res?.data?.items || res?.data?.deliveries || res?.data || [];
        this.allDeliveries = Array.isArray(raw) ? raw : [];
        this.deliveriesLoading = false;
      },
      error: () => this.deliveriesLoading = false,
    });
  }

  openAddBoyModal() { this.boyForm.reset(); this.addBoyModal = true; }

  saveDeliveryBoy() {
    if (this.boyForm.invalid) { this.boyForm.markAllAsTouched(); return; }
    this.boyBusy = true;
    this.adminApi.createDeliveryBoy(this.boyForm.value).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.toast.success('Delivery partner added!'); this.boyBusy = false; this.addBoyModal = false; this.loadBoys(); },
      error: (e: any) => { this.toast.error(e?.error?.message || 'Failed'); this.boyBusy = false; },
    });
  }

  openEditBoyModal(boy: any) {
    this.selectedBoy = boy;
    this.editBoyForm.patchValue({
      name: boy.name || '',
      phone: boy.phone || '',
      vehicleNo: boy.vehicleNo || '',
      city: boy.city || '',
      isActive: boy.isActive !== false,
      latitude: boy.latitude,
      longitude: boy.longitude
    });
    this.editBoyModal = true;
  }

  onLocationChange(pos: {lat: number, lng: number}) {
    this.editBoyForm.patchValue({ latitude: pos.lat, longitude: pos.lng });
  }

  updateDeliveryBoy() {
    if (this.editBoyForm.invalid || !this.selectedBoy) { this.editBoyForm.markAllAsTouched(); return; }
    this.boyBusy = true;
    this.adminApi.updateDeliveryBoy(this.selectedBoy.id, this.editBoyForm.value).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.toast.success('Partner updated!'); this.boyBusy = false; this.editBoyModal = false; this.loadBoys(); },
      error: (e: any) => { this.toast.error(e?.error?.message || 'Failed'); this.boyBusy = false; },
    });
  }

  openAssignDelivery(d: any) {
    this.assignDeliveryModal = { open: true, delivery: d, deliveryBoyId: '', notes: '' };
  }

  doAssignDelivery() {
    if (!this.assignDeliveryModal.deliveryBoyId) return;
    this.assignBusy = true;
    this.adminApi.assignDelivery(this.assignDeliveryModal.delivery.orderId, this.assignDeliveryModal.deliveryBoyId, this.assignDeliveryModal.notes)
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: () => { this.toast.success('Delivery assigned!'); this.assignBusy = false; this.assignDeliveryModal.open = false; this.loadDeliveries(); },
        error: (e: any) => { this.toast.error(e?.error?.message || 'Failed'); this.assignBusy = false; },
      });
  }

  openStatusUpdate(d: any) {
    this.statusModal = { open: true, delivery: d, newStatus: '', notes: '' };
  }

  openTrackModal(d: any) {
    this.trackModal = { open: true, delivery: d };
  }

  doUpdateStatus() {
    if (!this.statusModal.newStatus) return;
    this.statusBusy = true;
    this.adminApi.updateDeliveryStatus(this.statusModal.delivery.id, { status: this.statusModal.newStatus, notes: this.statusModal.notes })
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.toast.success(
            this.statusModal.newStatus === 'DELIVERED'
              ? '✅ Delivered! Credit points awarded to shopkeeper.'
              : 'Delivery status updated!'
          );
          this.statusBusy = false;
          this.statusModal.open = false;
          this.loadDeliveries();
        },
        error: (e: any) => { this.toast.error(e?.error?.message || 'Failed'); this.statusBusy = false; },
      });
  }

  confirmRepayment() {
    if (this.repayForm.invalid) { this.repayForm.markAllAsTouched(); return; }
    this.repayConfirmOpen = true;
  }

  doRepayment() {
    this.repayBusy = true;
    this.adminApi.manualRepaymentConfirmation(this.repayForm.value).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.toast.success('Repayment confirmed!'); this.repayBusy = false; this.repayConfirmOpen = false; this.repayForm.reset({ isLate: false }); },
      error: (e: any) => { this.toast.error(e?.error?.message || 'Failed'); this.repayBusy = false; },
    });
  }

  getNextDeliveryStatuses(current: string): any[] {
    const map: Record<string, any[]> = {
      'ASSIGNED':   [{ value: 'PICKED',     label: 'Picked Up',  icon: 'bag',     color: 'bg-violet-100 text-violet-600', desc: 'Partner has picked up the order' }],
      'PICKED':     [{ value: 'IN_TRANSIT', label: 'In Transit', icon: 'truck',   color: 'bg-amber-100 text-amber-600',  desc: 'Order is on the way to shopkeeper' }],
      'IN_TRANSIT': [{ value: 'DELIVERED',  label: 'Delivered',  icon: 'check',   color: 'bg-emerald-100 text-emerald-600', desc: 'Successfully delivered — credit points will be awarded' },
                     { value: 'FAILED',     label: 'Failed',     icon: 'close',   color: 'bg-rose-100 text-rose-600',    desc: 'Delivery attempt failed' }],
      'FAILED':     [{ value: 'IN_TRANSIT', label: 'Retry Delivery', icon: 'truck', color: 'bg-amber-100 text-amber-600', desc: 'Attempt delivery again' }],
    };
    return map[current] || [];
  }

  readonly deliverySteps = [
    { value: 'ASSIGNED',   label: 'Assigned',   num: '1', doneClass: 'bg-blue-500 text-white' },
    { value: 'PICKED',     label: 'Picked Up',  num: '2', doneClass: 'bg-violet-500 text-white' },
    { value: 'IN_TRANSIT', label: 'In Transit', num: '3', doneClass: 'bg-amber-500 text-white' },
    { value: 'DELIVERED',  label: 'Delivered',  num: '4', doneClass: 'bg-emerald-500 text-white' },
  ];

  private readonly DELIVERY_ORDER = ['ASSIGNED','PICKED','IN_TRANSIT','DELIVERED','FAILED'];

  isDeliveryStepDone(current: string, step: string): boolean {
    const idx = (s: string) => this.DELIVERY_ORDER.indexOf(s);
    return idx(current) >= idx(step);
  }

  getDeliveryStatusClass(status: string) {
    const map: Record<string, string> = {
      'ASSIGNED':   'text-blue-700',
      'PICKED':     'text-violet-700',
      'IN_TRANSIT': 'text-amber-700',
      'DELIVERED':  'text-emerald-700',
      'COMPLETED':  'text-emerald-700',
      'FAILED':     'text-rose-700',
    };
    return map[status] || 'text-slate-500';
  }

  trackById(_: number, item: any) { return item.id; }
}
