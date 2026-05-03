import { Component } from '@angular/core';
import { StoreService } from '../../../core/services/store.service';

@Component({
  selector: 'app-loader',
  template: `
    <div *ngIf="store.globalLoader$ | async" class="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/35 backdrop-blur-md">
      <div class="glass-panel flex items-center gap-4 rounded-[28px] px-6 py-5 text-slate-700">
        <div class="h-10 w-10 rounded-full border-4 border-slate-200 border-t-sky-500 animate-[spin_0.8s_linear_infinite]"></div>
        <div>
          <p class="text-sm font-semibold text-slate-500">Syncing workspace</p>
          <p class="text-base font-bold text-slate-900">Loading admin data...</p>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class LoaderComponent {
  constructor(public store: StoreService) {}
}
