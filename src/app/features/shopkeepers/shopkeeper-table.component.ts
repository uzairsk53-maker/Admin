import { Component, ChangeDetectionStrategy, Input, EventEmitter, Output, TrackByFunction } from '@angular/core';

@Component({
  selector: 'app-shopkeeper-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table class="w-full text-left border-collapse">
            <thead>
                <tr class="bg-gray-50 text-gray-500 text-sm border-b uppercase tracking-wider">
                    <th class="py-4 px-6 font-medium">Shop Name</th>
                    <th class="py-4 px-6 font-medium">Contact</th>
                    <th class="py-4 px-6 font-medium">Credit Metrics</th>
                    <th class="py-4 px-6 font-medium">Status</th>
                    <th class="py-4 px-6 font-medium text-right">Actions</th>
                </tr>
            </thead>
            <tbody class="text-gray-700 text-sm divide-y divide-gray-50">
                <!-- trackBy prevents complete DOM detachment when array data pumps in -->
                <tr *ngFor="let shop of dataset; trackBy: trackById" class="hover:bg-gray-50 transition">
                    <td class="py-4 px-6">
                       <div class="font-bold text-gray-900">{{shop.shopName}}</div>
                       <div class="text-xs text-gray-500">{{shop.ownerName}}</div>
                    </td>
                    <td class="py-4 px-6 font-mono">{{shop.phone}}</td>
                    <td class="py-4 px-6">
                       <span class="text-green-600 font-bold">₹{{shop.creditPoints}}</span>
                       <span class="text-xs text-gray-500 block">Score: {{shop.creditScore}}</span>
                    </td>
                    <td class="py-4 px-6">
                        <span class="px-3 py-1 text-xs font-bold rounded-full" 
                              [ngClass]="{'bg-green-100 text-green-700': shop.accountStatus === 'ACTIVE', 'bg-red-100 text-red-700': shop.accountStatus === 'FROZEN'}">
                            {{shop.accountStatus}}
                        </span>
                    </td>
                    <td class="py-4 px-6 text-right">
                        <button 
                            (click)="onToggle.emit(shop)"
                            class="px-4 py-2 text-xs font-bold rounded transition-colors"
                            [ngClass]="{'bg-red-50 text-red-600 hover:bg-red-100': shop.accountStatus === 'ACTIVE', 'bg-green-50 text-green-600 hover:bg-green-100': shop.accountStatus === 'FROZEN'}">
                            {{shop.accountStatus === 'ACTIVE' ? 'Freeze' : 'Unfreeze'}}
                        </button>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
  `
})
export class ShopkeeperTableComponent {
  @Input() dataset: any[] = [];
  @Output() onToggle = new EventEmitter<any>();

  // Crucial performance optimization for *ngFor over giant arrays
  trackById: TrackByFunction<any> = (index: number, item: any) => item._id;
}
