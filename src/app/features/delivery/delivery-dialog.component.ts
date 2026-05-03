import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminApiService } from '../../core/services/admin-api.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-delivery-dialog',
  template: `
    <div *ngIf="open" class="custom-modal" (click)="close(false)">
      <div class="custom-modal__panel custom-modal__panel--wide" (click)="$event.stopPropagation()">
        <div class="relative p-6 sm:p-7">
          <div class="mb-6 flex items-start justify-between gap-4">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.24em] text-sky-500">Delivery Team</p>
              <h2 class="mt-2 text-2xl font-extrabold text-slate-950">Add delivery partner</h2>
              <p class="mt-2 text-sm text-slate-500">Create a live delivery account without leaving the dashboard.</p>
            </div>
            <button type="button" class="header-action !h-11 !w-11" (click)="close(false)">
              <app-icon name="close" [size]="16"></app-icon>
            </button>
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-5">
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="custom-field" [class.custom-field--filled]="!!form.get('name')?.value">
                  <input class="custom-field__control" formControlName="name" placeholder=" ">
                  <span class="custom-field__label">Full Name</span>
                </label>
                <p *ngIf="form.get('name')?.invalid && form.get('name')?.touched" class="field-error">Name is required</p>
              </div>

              <div>
                <label class="custom-field" [class.custom-field--filled]="!!form.get('phone')?.value">
                  <input class="custom-field__control" formControlName="phone" placeholder=" ">
                  <span class="custom-field__label">Phone Number</span>
                </label>
                <p *ngIf="form.get('phone')?.invalid && form.get('phone')?.touched" class="field-error">Enter a valid phone number</p>
              </div>
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <label class="custom-field" [class.custom-field--filled]="!!form.get('email')?.value">
                <input class="custom-field__control" formControlName="email" placeholder=" ">
                <span class="custom-field__label">Email (optional)</span>
              </label>
              <label class="custom-field" [class.custom-field--filled]="!!form.get('city')?.value">
                <input class="custom-field__control" formControlName="city" placeholder=" ">
                <span class="custom-field__label">City (optional)</span>
              </label>
            </div>

            <div class="rounded-[22px] border border-slate-200 bg-slate-50/90 p-4 text-sm text-slate-500">
              This creates a real delivery user through the existing API. No dummy data is being used.
            </div>

            <div class="flex flex-col-reverse gap-3 border-t border-slate-200/80 pt-5 sm:flex-row sm:justify-end">
              <button type="button" class="ui-btn ui-btn-secondary" (click)="close(false)">Cancel</button>
              <button type="submit" class="ui-btn ui-btn-primary" [disabled]="loading || form.invalid">
                <span *ngIf="loading" class="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-[spin_0.8s_linear_infinite]"></span>
                <span>{{ loading ? 'Creating...' : 'Create Delivery User' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class DeliveryDialogComponent {
  @Input() open = false;
  @Output() closed = new EventEmitter<boolean>();
  form: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private adminApi: AdminApiService,
    private toast: ToastService
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^\d{8,15}$/)]],
      email: [''],
      city: ['']
    });
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.adminApi.createDeliveryBoy(this.form.value).subscribe({
      next: () => {
        this.toast.success('Delivery boy added');
        this.form.reset();
        this.close(true);
      },
      error: (err) => {
        this.loading = false;
        this.toast.error(err.error?.message || 'Error adding delivery boy');
      }
    });
  }

  close(saved: boolean) {
    this.loading = false;
    if (!saved) {
      this.form.reset();
    }
    this.closed.emit(saved);
  }
}
