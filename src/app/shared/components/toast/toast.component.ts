import { Component } from '@angular/core';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  template: `
    <div class="pointer-events-none fixed right-4 top-4 z-[120] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3">
      <div
        *ngFor="let item of toast.items$ | async"
        class="pointer-events-auto rounded-3xl border px-4 py-4 shadow-2xl backdrop-blur-xl transition-all duration-300 animate-[toastIn_.28s_ease]"
        [ngClass]="toastClass(item.type)"
      >
        <div class="flex items-start gap-3">
          <div class="mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl border border-white/25 bg-white/10">
            <app-icon [name]="iconName(item.type)" [size]="16"></app-icon>
          </div>
          <div class="flex-1">
            <p class="text-sm font-semibold capitalize">{{ item.type }}</p>
            <p class="mt-1 text-sm opacity-90">{{ item.message }}</p>
          </div>
          <button type="button" class="rounded-full p-1 opacity-70 transition hover:opacity-100" (click)="toast.dismiss(item.id)">
            <app-icon name="close" [size]="14"></app-icon>
          </button>
        </div>
      </div>
    </div>
  `
})
export class ToastComponent {
  constructor(public toast: ToastService) {}

  toastClass(type: string) {
    return {
      'border-emerald-300/40 bg-emerald-500/90 text-white shadow-[0_20px_45px_rgba(16,185,129,0.28)]': type === 'success',
      'border-rose-300/40 bg-rose-500/90 text-white shadow-[0_20px_45px_rgba(244,63,94,0.28)]': type === 'error',
      'border-amber-300/40 bg-amber-400/90 text-slate-900 shadow-[0_20px_45px_rgba(251,191,36,0.28)]': type === 'warning',
      'border-sky-300/40 bg-sky-500/90 text-white shadow-[0_20px_45px_rgba(14,165,233,0.28)]': type === 'info'
    };
  }

  iconName(type: string) {
    return {
      success: 'check',
      error: 'close',
      warning: 'warning',
      info: 'notification'
    }[type] || 'notification';
  }
}
