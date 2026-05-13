import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { DatePipe, CurrencyPipe, DecimalPipe } from '@angular/common';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Layout & Auth
import { LayoutComponent } from './layout/layout.component';
import { LoginComponent } from './auth/login/login.component';

// Feature Modules
import { DashboardComponent } from './dashboard/dashboard.component';
import { ProductsComponent } from './features/products/products.component';
import { OrdersComponent } from './features/orders/orders.component';
import { ShopkeepersComponent } from './features/shopkeepers/shopkeeper.component';
import { CreditComponent } from './features/credit/credit.component';
import { DeliveryComponent } from './features/delivery/delivery.component';
import { DeliveryDialogComponent } from './features/delivery/delivery-dialog.component';

// Shared Components
import { LoaderComponent } from './shared/components/loader/loader.component';
import { ProductDialogComponent } from './features/products/product-dialog/product-dialog.component';
import { ToastComponent } from './shared/components/toast/toast.component';
import { IconComponent } from './shared/ui/icon.component';
import { MapPickerComponent } from './shared/components/map-picker/map-picker.component';
import { MapTrackerComponent } from './shared/components/map-tracker/map-tracker.component';

// Interceptors
import { TokenInterceptor } from './core/interceptors/token.interceptor';
import { LoaderInterceptor } from './core/interceptors/loader.interceptor';

@NgModule({
  declarations: [
    AppComponent,
    LayoutComponent,
    LoginComponent,
    DashboardComponent,
    ProductsComponent,
    OrdersComponent,
    ShopkeepersComponent,
    CreditComponent,
    DeliveryComponent,
    DeliveryDialogComponent,
    LoaderComponent,
    ProductDialogComponent,
    ToastComponent,
    IconComponent,
    MapPickerComponent,
    MapTrackerComponent,
  ],
  imports: [
    BrowserModule,
    CommonModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
  ],
  providers: [
    DatePipe,
    CurrencyPipe,
    DecimalPipe,
    { provide: HTTP_INTERCEPTORS, useClass: TokenInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: LoaderInterceptor, multi: true },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
