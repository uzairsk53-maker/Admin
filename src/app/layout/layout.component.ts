import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { routeAnimations } from '../shared/animations';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css'],
  animations: [routeAnimations]
})
export class LayoutComponent {
  sidebarOpen = false;
  quickActionsOpen = false;
  readonly navItems = [
    { label: 'Dashboard', route: '/dashboard', icon: 'dashboard' },
    { label: 'Products', route: '/products', icon: 'box' },
    { label: 'Orders', route: '/orders', icon: 'bag' },
    { label: 'Shopkeepers', route: '/shopkeepers', icon: 'users' },
    { label: 'Credit', route: '/credit', icon: 'rupee' },
    { label: 'Delivery', route: '/delivery', icon: 'delivery' }
  ];
  readonly quickActions = [
    { label: 'Add Product', helper: 'Open product workspace', route: '/products', icon: 'add' },
    { label: 'Approve Credit', helper: 'Go to repayment flow', route: '/credit', icon: 'rupee' },
    { label: 'Delivery Team', helper: 'Manage delivery users', route: '/delivery', icon: 'delivery' }
  ];

  constructor(private authService: AuthService, public router: Router) {}

  logout() {
    this.authService.logout();
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar() {
    this.sidebarOpen = false;
    this.quickActionsOpen = false;
  }

  toggleQuickActions() {
    this.quickActionsOpen = !this.quickActionsOpen;
  }

  closeQuickActions() {
    this.quickActionsOpen = false;
  }

  getRouteAnimationData() {
    return this.constructor.name;
  }

  get activeNav() {
    return this.navItems.find((item) => this.router.url.startsWith(item.route)) || this.navItems[0];
  }

  get pageEyebrow() {
    const map: Record<string, string> = {
      '/dashboard': 'Command Center',
      '/products': 'Catalog Workspace',
      '/orders': 'Fulfillment Queue',
      '/shopkeepers': 'Partner Network',
      '/credit': 'Credit Control',
      '/delivery': 'Last Mile Ops'
    };

    return map[this.activeNav.route] || 'Admin Console';
  }
}
