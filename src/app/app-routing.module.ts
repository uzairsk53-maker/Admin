import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { LoginComponent } from './auth/login/login.component';
import { LayoutComponent } from './layout/layout.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ProductsComponent } from './features/products/products.component';
import { OrdersComponent } from './features/orders/orders.component';
import { ShopkeepersComponent } from './features/shopkeepers/shopkeeper.component';
import { CreditComponent } from './features/credit/credit.component';
import { DeliveryComponent } from './features/delivery/delivery.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { 
    path: '', 
    component: LayoutComponent, 
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'products', component: ProductsComponent },
      { path: 'orders', component: OrdersComponent },
      { path: 'shopkeepers', component: ShopkeepersComponent },
      { path: 'credit', component: CreditComponent },
      { path: 'delivery', component: DeliveryComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
