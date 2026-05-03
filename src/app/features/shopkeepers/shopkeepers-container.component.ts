import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { Observable, BehaviorSubject, catchError, of, map, startWith } from 'rxjs';

@Component({
  selector: 'app-shopkeepers-container',
  template: `
    <div class="px-8 py-6 max-w-7xl mx-auto">
        <h1 class="text-3xl font-bold text-gray-900 mb-8">Manage Shopkeepers</h1>

        <!-- Async data mapping cleanly injects Observable data downwards causing exactly zero Change Detection pings up the tree -->
        <ng-container *ngIf="vm$ | async as vm">
            <div *ngIf="vm.loading" class="text-gray-500 mb-4 animate-pulse">
                Fetching Enterprise dataset...
            </div>
            
            <div *ngIf="vm.error" class="bg-red-50 text-red-600 p-4 rounded mb-4 border border-red-100">
                🚨 System Error: {{vm.error}}
            </div>

            <app-shopkeeper-table 
                *ngIf="!vm.loading" 
                [dataset]="vm.data" 
                (onToggle)="handleToggle($event)">
            </app-shopkeeper-table>
            
        </ng-container>
    </div>
  `
})
export class ShopkeepersContainerComponent implements OnInit {
  
  // Single source of truth driving the UI Reactively
  private stateSubj = new BehaviorSubject<{loading: boolean, error: string, data: any[]}>({
     loading: true, error: '', data: []
  });
  
  vm$ = this.stateSubj.asObservable();

  constructor(private api: ApiService) {}

  ngOnInit() {
      // Automatically map stream safely handling HTTP failures
      this.api.get<any[]>('shopkeeper/all').pipe(
          map(res => ({ loading: false, error: '', data: res })),
          catchError(err => of({ 
              loading: false, 
              error: err.message, 
              // Fallback logic for offline previewing
              data: [
                  { _id: '1', shopName: 'Alpha Mart', ownerName: 'A. Rahman', phone: '9876543210', creditPoints: 45000, creditScore: 780, accountStatus: 'ACTIVE' },
                  { _id: '2', shopName: 'Retail Kings', ownerName: 'S. Patel', phone: '9123456780', creditPoints: 0, creditScore: 500, accountStatus: 'FROZEN' }
              ] 
          }))
      ).subscribe(state => this.stateSubj.next(state));
  }

  handleToggle(shop: any) {
      if(!confirm(`Freeze ${shop.shopName}?`)) return;
      
      const newStatus = shop.accountStatus === 'ACTIVE' ? 'FROZEN' : 'ACTIVE';
      const currentState = this.stateSubj.getValue();
      
      // Optimistic UI updates pushed through the BehaviorSubject 
      // This immediately propagates down to the Dumb component via OnPush Reference swaps safely
      const updatedData = currentState.data.map(s => 
          s._id === shop._id ? { ...s, accountStatus: newStatus } : s
      );
      
      this.stateSubj.next({ ...currentState, data: updatedData });

      this.api.patch(`shopkeeper/${shop._id}/status`, { accountStatus: newStatus }).subscribe({
          error: (err) => {
              alert('Reverting... Server disconnected.');
              this.stateSubj.next(currentState); // Rollback
          }
      });
  }
}
