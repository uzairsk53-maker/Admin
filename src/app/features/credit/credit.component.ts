import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, forkJoin, takeUntil } from 'rxjs';
import { AdminApiService } from '../../core/services/admin-api.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-credit',
  template: `
    <div class="page-shell page-stack">

      <!-- Hero -->
      <section class="glass-panel section-card">
        <div class="page-hero">
          <div class="page-hero__meta">
            <span class="page-hero__icon"><app-icon name="rupee" [size]="22"></app-icon></span>
            <div>
              <p class="page-hero__eyebrow">Credit Ops</p>
              <h1 class="page-hero__title">Credit System Panel</h1>
              <p class="page-hero__subtitle">Configure credit settings, penalty rules, bonus rules, apply manual adjustments and audit all transactions.</p>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="px-4 sm:px-6 pb-4">
          <div class="segment-tabs">
            <button class="segment-tabs__item" [class.segment-tabs__item--active]="activeTab==='settings'" (click)="activeTab='settings'">Settings</button>
            <button class="segment-tabs__item" [class.segment-tabs__item--active]="activeTab==='penalty'" (click)="activeTab='penalty'">Penalty Rules</button>
            <button class="segment-tabs__item" [class.segment-tabs__item--active]="activeTab==='bonus'" (click)="activeTab='bonus'">Bonus Rules</button>
            <button class="segment-tabs__item" [class.segment-tabs__item--active]="activeTab==='adjustment'" (click)="activeTab='adjustment'">Manual Adjust</button>
            <button class="segment-tabs__item" [class.segment-tabs__item--active]="activeTab==='history'" (click)="activeTab='history'; loadHistory()">History</button>
          </div>
        </div>
      </section>

      <!-- ── Credit Settings ─────────────────────────── -->
      <section *ngIf="activeTab==='settings'" class="soft-card rounded-[32px] p-6 sm:p-8">
        <h2 class="text-xl font-extrabold text-slate-950 mb-2">Credit Score Conversion Settings</h2>
        <p class="text-sm text-slate-500 mb-6">Define how credit scores map to credit limits. Confirm before saving.</p>
        <div *ngIf="settingsLoading" class="space-y-3"><div *ngFor="let i of [1,2,3]" class="h-16 animate-pulse rounded-[18px] bg-slate-100"></div></div>
        <div *ngIf="!settingsLoading && settings.length === 0" class="empty-state"><p class="font-bold text-slate-500">No settings configured</p></div>
        <div *ngIf="!settingsLoading && settings.length > 0" class="space-y-4">
          <div *ngFor="let s of settings; let i = index" class="form-surface">
            <div class="grid gap-3 sm:grid-cols-3">
              <label class="custom-field custom-field--filled">
                <input class="custom-field__control" [(ngModel)]="s.minScore" type="number" placeholder=" ">
                <span class="custom-field__label">Min Score</span>
              </label>
              <label class="custom-field custom-field--filled">
                <input class="custom-field__control" [(ngModel)]="s.maxScore" type="number" placeholder=" ">
                <span class="custom-field__label">Max Score</span>
              </label>
              <label class="custom-field custom-field--filled">
                <input class="custom-field__control" [(ngModel)]="s.creditLimit" type="number" placeholder=" ">
                <span class="custom-field__label">Credit Limit (Rs)</span>
              </label>
            </div>
          </div>
          <button type="button" class="ui-btn ui-btn-primary" (click)="confirmSaveSettings()" [disabled]="settingsBusy">
            <app-icon name="save" [size]="16"></app-icon>
            {{ settingsBusy ? 'Saving...' : 'Save Settings' }}
          </button>
        </div>
      </section>

      <!-- ── Penalty Rules ───────────────────────────── -->
      <section *ngIf="activeTab==='penalty'" class="soft-card rounded-[32px] p-6 sm:p-8">
        <div class="flex items-center justify-between mb-6">
          <div><h2 class="text-xl font-extrabold text-slate-950">Penalty Rules</h2><p class="text-sm text-slate-500 mt-1">Rules that deduct credit score on violations</p></div>
          <button type="button" class="ui-btn ui-btn-primary" (click)="openRuleModal('penalty')"><app-icon name="add" [size]="16"></app-icon> Add Rule</button>
        </div>
        <div *ngIf="rulesLoading" class="space-y-3"><div *ngFor="let i of [1,2,3]" class="h-16 animate-pulse rounded-[18px] bg-slate-100"></div></div>
        <div *ngIf="!rulesLoading && penaltyRules.length === 0" class="empty-state"><p class="font-bold text-slate-500">No penalty rules configured</p></div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <div *ngFor="let rule of penaltyRules; trackBy: trackById" class="rule-card">
            <div style="display:flex;align-items:center;gap:12px;flex:1;min-width:0">
              <div class="rule-card__icon" style="background:#ffebee;color:#c62828">—</div>
              <div style="min-width:0">
                <p class="rule-card__title">{{ rule.name || rule.description }}</p>
                <p class="rule-card__meta">Deduction: <strong style="color:#c62828">{{ rule.deduction || rule.amount }} pts</strong> · {{ rule.triggerCondition || rule.trigger || 'No trigger set' }}</p>
              </div>
            </div>
            <div style="display:flex;gap:6px;flex-shrink:0">
              <button type="button" class="action-chip" style="color:#1565c0" (click)="openRuleModal('penalty', rule)">Edit</button>
              <button type="button" class="action-chip" style="color:#c62828;border-color:#fecaca" (click)="confirmDeleteRule('penalty', rule)">Delete</button>
            </div>
          </div>
        </div>
      </section>

      <!-- ── Bonus Rules ──────────────────────────────── -->
      <section *ngIf="activeTab==='bonus'" class="soft-card rounded-[32px] p-6 sm:p-8">
        <div class="flex items-center justify-between mb-6">
          <div><h2 class="text-xl font-extrabold text-slate-950">Bonus Rules</h2><p class="text-sm text-slate-500 mt-1">Rules that award credit score for positive behavior</p></div>
          <button type="button" class="ui-btn ui-btn-primary" (click)="openRuleModal('bonus')"><app-icon name="add" [size]="16"></app-icon> Add Rule</button>
        </div>
        <div *ngIf="rulesLoading" class="space-y-3"><div *ngFor="let i of [1,2,3]" class="h-16 animate-pulse rounded-[18px] bg-slate-100"></div></div>
        <div *ngIf="!rulesLoading && bonusRules.length === 0" class="empty-state"><p class="font-bold text-slate-500">No bonus rules configured</p></div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <div *ngFor="let rule of bonusRules; trackBy: trackById" class="rule-card">
            <div style="display:flex;align-items:center;gap:12px;flex:1;min-width:0">
              <div class="rule-card__icon" style="background:#e8f5e9;color:#2e7d32">+</div>
              <div style="min-width:0">
                <p class="rule-card__title">{{ rule.name || rule.description }}</p>
                <p class="rule-card__meta">Bonus: <strong style="color:#2e7d32">+{{ rule.bonus || rule.amount }} pts</strong> · {{ rule.triggerCondition || rule.trigger || 'No trigger set' }}</p>
              </div>
            </div>
            <div style="display:flex;gap:6px;flex-shrink:0">
              <button type="button" class="action-chip" style="color:#1565c0" (click)="openRuleModal('bonus', rule)">Edit</button>
              <button type="button" class="action-chip" style="color:#c62828;border-color:#fecaca" (click)="confirmDeleteRule('bonus', rule)">Delete</button>
            </div>
          </div>
        </div>
      </section>

      <!-- ── Manual Adjustment ───────────────────────── -->
      <section *ngIf="activeTab==='adjustment'" class="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div class="soft-card rounded-[32px] p-6 sm:p-8">
          <div class="rounded-[20px] border border-amber-200 bg-amber-50 p-4 mb-6 flex gap-3">
            <app-icon name="warning" [size]="20" class="text-amber-600 flex-shrink-0 mt-0.5"></app-icon>
            <p class="text-sm text-amber-800"><strong>Warning:</strong> Manual adjustments directly affect a shopkeeper's credit score and are logged in the audit trail. Use with caution.</p>
          </div>
          <h2 class="text-xl font-extrabold text-slate-950 mb-6">Manual Credit Adjustment</h2>
          <form [formGroup]="adjustForm" (ngSubmit)="confirmAdjustment()" style="display:flex;flex-direction:column;gap:14px">
            <div class="form-group">
              <label class="form-label required">Shopkeeper ID</label>
              <input class="form-control" formControlName="shopkeeperId" placeholder="Enter shopkeeper ID…"
                [class.is-invalid]="adjustForm.get('shopkeeperId')?.invalid && adjustForm.get('shopkeeperId')?.touched">
              <div *ngIf="adjustForm.get('shopkeeperId')?.invalid && adjustForm.get('shopkeeperId')?.touched" class="form-error">Shopkeeper ID is required</div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
              <div class="form-group">
                <label class="form-label required">Type</label>
                <select class="form-select" formControlName="type"
                  [class.is-invalid]="adjustForm.get('type')?.invalid && adjustForm.get('type')?.touched">
                  <option value="">Select…</option>
                  <option value="CREDIT">Credit (+)</option>
                  <option value="DEBIT">Debit (−)</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label required">Amount (pts)</label>
                <input class="form-control" type="number" formControlName="amount" placeholder="0"
                  [class.is-invalid]="adjustForm.get('amount')?.invalid && adjustForm.get('amount')?.touched">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label required">Reason</label>
              <textarea class="form-control" formControlName="description" placeholder="Describe the reason for adjustment…" rows="3"
                [class.is-invalid]="adjustForm.get('description')?.invalid && adjustForm.get('description')?.touched"></textarea>
            </div>
            <button type="submit" class="btn btn-primary btn-block" [disabled]="adjustForm.invalid || adjustBusy">
              <span *ngIf="adjustBusy" class="spinner spinner--sm spinner--white"></span>
              {{ adjustBusy ? 'Applying…' : 'Apply Adjustment' }}
            </button>
          </form>
        </div>
        <div class="soft-card rounded-[32px] p-6 sm:p-8">
          <h2 class="text-xl font-extrabold text-slate-950 mb-5">Guidelines</h2>
          <div class="space-y-4">
            <div class="info-panel border-emerald-200 bg-emerald-50 text-emerald-800">
              <div class="flex gap-3"><app-icon name="check" [size]="16" class="flex-shrink-0"></app-icon><p><strong>CREDIT:</strong> Adds to shopkeeper's credit balance. Use for manual repayments.</p></div>
            </div>
            <div class="info-panel border-rose-200 bg-rose-50 text-rose-800">
              <div class="flex gap-3"><app-icon name="exclamation" [size]="16" class="flex-shrink-0"></app-icon><p><strong>DEBIT:</strong> Deducts from credit balance. Use for corrections or penalties.</p></div>
            </div>
            <div class="info-panel border-sky-200 bg-sky-50 text-sky-800">
              <div class="flex gap-3"><app-icon name="info" [size]="16" class="flex-shrink-0"></app-icon><p>All adjustments are logged with admin ID, timestamp, and reason in the audit trail.</p></div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── Transaction History ─────────────────────── -->
      <section *ngIf="activeTab==='history'" class="soft-card rounded-[32px] overflow-hidden">
        <div class="p-6 flex items-center justify-between">
          <div><h2 class="text-xl font-extrabold text-slate-950">Credit Transaction History</h2><p class="text-sm text-slate-500 mt-1">Audit log of all credit adjustments</p></div>
          <button type="button" class="ui-btn ui-btn-secondary" (click)="loadHistory()"><app-icon name="refresh" [size]="16"></app-icon> Refresh</button>
        </div>
        <div *ngIf="historyLoading" class="p-6 space-y-3"><div *ngFor="let i of [1,2,3,4,5]" class="h-14 animate-pulse rounded-[18px] bg-slate-100"></div></div>
        <div *ngIf="!historyLoading && transactions.length === 0" class="px-6 py-14 empty-state mx-4 mb-4"><p class="font-bold text-slate-500">No transactions found</p></div>
        <div *ngIf="!historyLoading && transactions.length > 0" class="overflow-x-auto custom-scrollbar">
          <table class="custom-table">
            <thead><tr>
              <th>Shopkeeper</th><th>Type</th><th>Amount</th><th>Description</th><th>Date</th>
            </tr></thead>
            <tbody>
              <tr *ngFor="let tx of transactions; trackBy: trackById">
                <td><div class="font-semibold text-slate-900">{{ tx.shopkeeper?.shopName || tx.shopkeeperId }}</div></td>
                <td><span class="status-badge" [ngClass]="tx.type === 'CREDIT' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'">{{ tx.type }}</span></td>
                <td><span class="font-extrabold" [ngClass]="tx.type === 'CREDIT' ? 'text-emerald-700' : 'text-rose-600'">{{ tx.type === 'CREDIT' ? '+' : '−' }}{{ tx.amount | number }}</span></td>
                <td class="max-w-[200px]"><p class="text-sm text-slate-600 truncate">{{ tx.description || '—' }}</p></td>
                <td class="whitespace-nowrap text-sm text-slate-500">{{ tx.createdAt | date:'MMM d, y h:mm a' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Rule Modal -->
      <div *ngIf="ruleModal.open" class="custom-modal" (click)="closeRuleModal()">
        <div class="custom-modal__panel" (click)="$event.stopPropagation()">
          <div class="p-6 sm:p-8">
            <div class="flex items-start justify-between gap-4 mb-6">
              <div>
                <p class="page-hero__eyebrow">{{ ruleModal.ruleType === 'penalty' ? 'Penalty Rule' : 'Bonus Rule' }}</p>
                <h2 class="mt-1 text-2xl font-extrabold text-slate-950">{{ ruleModal.rule?.id ? 'Edit' : 'Create' }} {{ ruleModal.ruleType | titlecase }} Rule</h2>
              </div>
              <button type="button" class="header-action !h-10 !w-10" (click)="closeRuleModal()"><app-icon name="close" [size]="16"></app-icon></button>
            </div>
            <form [formGroup]="ruleForm" (ngSubmit)="saveRule()" class="space-y-4">
              <label class="custom-field" [class.custom-field--filled]="ruleForm.get('name')?.value">
                <input class="custom-field__control" formControlName="name" placeholder=" ">
                <span class="custom-field__label">Rule Name *</span>
              </label>
              <label class="custom-field" [class.custom-field--filled]="ruleForm.get('description')?.value">
                <input class="custom-field__control" formControlName="description" placeholder=" ">
                <span class="custom-field__label">Description</span>
              </label>
              <div class="grid gap-4 sm:grid-cols-2">
                <label class="custom-field" [class.custom-field--filled]="ruleForm.get('amount')?.value">
                  <input class="custom-field__control" type="number" formControlName="amount" placeholder=" ">
                  <span class="custom-field__label">{{ ruleModal.ruleType === 'penalty' ? 'Deduction' : 'Bonus' }} Points *</span>
                </label>
                <label class="custom-field" [class.custom-field--filled]="ruleForm.get('triggerCondition')?.value">
                  <input class="custom-field__control" formControlName="triggerCondition" placeholder=" ">
                  <span class="custom-field__label">Trigger Condition</span>
                </label>
              </div>
              <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button type="button" class="ui-btn ui-btn-secondary" (click)="closeRuleModal()">Cancel</button>
                <button type="submit" class="ui-btn ui-btn-primary" [disabled]="ruleForm.invalid || ruleBusy">
                  {{ ruleBusy ? 'Saving...' : 'Save Rule' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Confirm Modal -->
      <div *ngIf="confirmModal.open" class="custom-modal" (click)="cancelConfirm()">
        <div class="custom-modal__panel" (click)="$event.stopPropagation()">
          <div class="p-6 sm:p-8">
            <h2 class="text-xl font-extrabold text-slate-950 mb-2">{{ confirmModal.title }}</h2>
            <p class="text-sm text-slate-500 mb-6">{{ confirmModal.message }}</p>
            <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" class="ui-btn ui-btn-secondary" (click)="cancelConfirm()">Cancel</button>
              <button type="button" class="ui-btn ui-btn-danger" [disabled]="confirmBusy" (click)="executeConfirm()">{{ confirmBusy ? 'Processing...' : 'Confirm' }}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CreditComponent implements OnInit, OnDestroy {
  activeTab = 'settings';
  settings: any[] = [];
  penaltyRules: any[] = [];
  bonusRules: any[] = [];
  transactions: any[] = [];
  settingsLoading = false;
  rulesLoading = false;
  historyLoading = false;
  settingsBusy = false;
  adjustBusy = false;
  ruleBusy = false;
  confirmBusy = false;
  adjustForm!: FormGroup;
  ruleForm!: FormGroup;
  ruleModal: any = { open: false, ruleType: 'penalty', rule: null };
  confirmModal: any = { open: false };
  private _pendingAction: (() => void) | null = null;
  private destroy$ = new Subject<void>();

  constructor(private adminApi: AdminApiService, private toast: ToastService, private fb: FormBuilder) {}

  ngOnInit() {
    this.adjustForm = this.fb.group({
      shopkeeperId: ['', Validators.required],
      type: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(1)]],
      description: ['', Validators.required],
    });
    this.ruleForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      amount: [null, [Validators.required, Validators.min(1)]],
      triggerCondition: [''],
    });
    this.loadSettings();
    this.loadRules();
  }

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

  loadSettings() {
    this.settingsLoading = true;
    this.adminApi.getCreditSettings().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => { this.settings = res?.data?.items || res?.data || []; this.settingsLoading = false; },
      error: () => this.settingsLoading = false,
    });
  }

  loadRules() {
    this.rulesLoading = true;
    forkJoin({ penalty: this.adminApi.getPenaltyRules(), bonus: this.adminApi.getBonusRules() })
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          this.penaltyRules = res.penalty?.data || [];
          this.bonusRules = res.bonus?.data || [];
          this.rulesLoading = false;
        },
        error: () => this.rulesLoading = false,
      });
  }

  loadHistory() {
    this.historyLoading = true;
    this.adminApi.getCreditTransactions({ page: 1, limit: 50 }, true).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => { this.transactions = res?.data?.items || res?.data || []; this.historyLoading = false; },
      error: () => this.historyLoading = false,
    });
  }

  confirmSaveSettings() {
    this.confirmModal = { open: true, title: 'Save Credit Settings', message: 'Are you sure you want to update the credit score configuration? This will affect all shopkeeper credit limits.' };
    this._pendingAction = () => this.doSaveSettings();
  }

  doSaveSettings() {
    this.settingsBusy = true;
    this.adminApi.updateCreditSettings(this.settings).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.toast.success('Credit settings saved'); this.settingsBusy = false; this.cancelConfirm(); this.loadSettings(); },
      error: (e: any) => { this.toast.error(e?.error?.message || 'Failed'); this.settingsBusy = false; this.confirmBusy = false; },
    });
  }

  confirmAdjustment() {
    if (this.adjustForm.invalid) { this.adjustForm.markAllAsTouched(); return; }
    this.confirmModal = { open: true, title: 'Confirm Manual Adjustment', message: `Apply ${this.adjustForm.value.type} of ${this.adjustForm.value.amount} pts to shopkeeper?` };
    this._pendingAction = () => this.doAdjustment();
  }

  doAdjustment() {
    this.adjustBusy = true;
    this.adminApi.manualAdjustment(this.adjustForm.value).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.toast.success('Adjustment applied'); this.adjustBusy = false; this.cancelConfirm(); this.adjustForm.reset(); },
      error: (e: any) => { this.toast.error(e?.error?.message || 'Failed'); this.adjustBusy = false; this.confirmBusy = false; },
    });
  }

  openRuleModal(ruleType: string, rule?: any) {
    this.ruleModal = { open: true, ruleType, rule: rule || null };
    this.ruleForm.reset();
    if (rule) {
      this.ruleForm.patchValue({ name: rule.name || rule.description, description: rule.description, amount: rule.amount || rule.deduction || rule.bonus, triggerCondition: rule.triggerCondition || rule.trigger });
    }
  }

  closeRuleModal() { this.ruleModal = { open: false, ruleType: 'penalty', rule: null }; }

  saveRule() {
    if (this.ruleForm.invalid) { this.ruleForm.markAllAsTouched(); return; }
    this.ruleBusy = true;
    const { ruleType, rule } = this.ruleModal;
    const body = this.ruleForm.value;
    let req$;
    if (ruleType === 'penalty') {
      req$ = rule?.id ? this.adminApi.updatePenaltyRule(rule.id, body) : this.adminApi.createPenaltyRule(body);
    } else {
      req$ = rule?.id ? this.adminApi.updateBonusRule(rule.id, body) : this.adminApi.createBonusRule(body);
    }
    req$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.toast.success('Rule saved'); this.ruleBusy = false; this.closeRuleModal(); this.loadRules(); },
      error: (e: any) => { this.toast.error(e?.error?.message || 'Failed'); this.ruleBusy = false; },
    });
  }

  confirmDeleteRule(ruleType: string, rule: any) {
    this.confirmModal = { open: true, title: 'Delete Rule', message: `Delete "${rule.name || rule.description}"?` };
    this._pendingAction = () => {
      this.confirmBusy = true;
      const req$ = ruleType === 'penalty' ? this.adminApi.deletePenaltyRule(rule.id) : this.adminApi.deleteBonusRule(rule.id);
      req$.pipe(takeUntil(this.destroy$)).subscribe({
        next: () => { this.toast.success('Rule deleted'); this.confirmBusy = false; this.cancelConfirm(); this.loadRules(); },
        error: (e: any) => { this.toast.error(e?.error?.message || 'Failed'); this.confirmBusy = false; },
      });
    };
  }

  cancelConfirm() { this.confirmModal = { open: false }; this._pendingAction = null; }
  executeConfirm() { this.confirmBusy = true; if (this._pendingAction) this._pendingAction(); }
  trackById(_: number, item: any) { return item.id; }
}
