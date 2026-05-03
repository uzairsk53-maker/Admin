import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, catchError, timeout } from 'rxjs/operators';
import { AdminApiService } from '../core/services/admin-api.service';

declare var Chart: any;

const REQUEST_TIMEOUT = 8000;

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('revenueChart') revenueChartRef!: ElementRef;

  metrics: any = null;
  recentOrders: any[] = [];
  graphData: any = null;
  loading = true;
  graphLoading = true;
  graphPeriod = 'monthly';
  private chartInstance: any = null;
  private destroy$ = new Subject<void>();

  constructor(private adminApi: AdminApiService) {}

  ngOnInit() { this.loadAll(); }
  ngAfterViewInit() {}

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.chartInstance) this.chartInstance.destroy();
  }

  loadAll() {
    this.loading = true;
    forkJoin({
      summary: this.adminApi.getSummary().pipe(timeout(REQUEST_TIMEOUT), catchError(() => of(null))),
      recentOrders: this.adminApi.getRecentOrders(10).pipe(timeout(REQUEST_TIMEOUT), catchError(() => of(null))),
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.metrics = res.summary?.data || {};
        const ordersData = res.recentOrders?.data;
        this.recentOrders = Array.isArray(ordersData) ? ordersData : [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.metrics = {};
        this.recentOrders = [];
      }
    });
    this.loadRevenueGraph();
  }

  loadRevenueGraph() {
    this.graphLoading = true;
    this.adminApi.getRevenueGraph(this.graphPeriod).pipe(
      timeout(REQUEST_TIMEOUT), catchError(() => of(null)), takeUntil(this.destroy$)
    ).subscribe({
      next: (res: any) => {
        this.graphData = res?.data;
        this.graphLoading = false;
        setTimeout(() => this.renderChart(), 100);
      },
      error: () => { this.graphLoading = false; }
    });
  }

  renderChart() {
    if (!this.revenueChartRef || !this.graphData) return;
    if (this.chartInstance) this.chartInstance.destroy();
    const labels = this.graphData.labels || this.graphData.map((d: any) => d.label || d.period || d.date || 'N/A');
    const values = this.graphData.values || this.graphData.map((d: any) => d.revenue || d.amount || d.value || 0);
    if (typeof Chart === 'undefined') return;
    this.chartInstance = new Chart(this.revenueChartRef.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Revenue (Rs)', data: values,
          borderColor: '#0ea5e9', backgroundColor: 'rgba(14,165,233,0.08)',
          tension: 0.4, fill: true, pointBackgroundColor: '#0284c7', pointRadius: 4, borderWidth: 2.5
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#94a3b8' } },
          y: { grid: { color: 'rgba(226,232,240,0.7)' }, ticks: { font: { size: 11 }, color: '#94a3b8', callback: (v: any) => `Rs ${Number(v).toLocaleString()}` } }
        }
      }
    });
  }

  refresh() { this.adminApi.getSummary(true); this.adminApi.getRecentOrders(10, true); this.loadAll(); }

  get highRiskShopkeepers(): any[] {
    return (this.metrics?.topShopkeepers || []).filter((s: any) => (s.creditScore || 0) < 8000).slice(0, 6);
  }

  get hasGraphData(): boolean {
    if (!this.graphData) return false;
    try {
      const raw = this.graphData;
      const values: number[] = Array.isArray(raw)
        ? raw.map((d: any) => d.revenue || d.amount || d.value || 0)
        : Array.isArray(raw.values) ? raw.values : [];
      return values.length > 0 && values.some((v: number) => v > 0);
    } catch { return false; }
  }

  get deliveryStats() {
    const t = this.metrics?.totalOrders || 0;
    return [
      { label: 'Delivered', value: this.metrics?.deliveredOrders || 0, percent: t > 0 ? Math.round(((this.metrics?.deliveredOrders||0)/t)*100) : 0, color: 'bg-emerald-500' },
      { label: 'Approved', value: this.metrics?.approvedOrders || 0, percent: t > 0 ? Math.round(((this.metrics?.approvedOrders||0)/t)*100) : 0, color: 'bg-sky-400' },
      { label: 'Pending', value: this.metrics?.pendingOrders || 0, percent: t > 0 ? Math.round(((this.metrics?.pendingOrders||0)/t)*100) : 0, color: 'bg-amber-400' },
    ];
  }

  get metricCards() {
    return [
      { label: 'Total Orders', value: (this.metrics?.totalOrders||0).toLocaleString(), sub: `${this.metrics?.pendingOrders||0} pending`, icon: 'bag', iconClass: 'icon-blue' },
      { label: 'Revenue', value: `₹${(this.metrics?.totalRevenue||0).toLocaleString()}`, sub: 'Completed orders', icon: 'rupee', iconClass: 'icon-green' },
      { label: 'Credit Exposure', value: `₹${(this.metrics?.totalCreditUsed||0).toLocaleString()}`, sub: 'Outstanding', icon: 'creditCard', iconClass: 'icon-amber' },
      { label: 'Shopkeepers', value: (this.metrics?.topShopkeepers?.length||0).toLocaleString(), sub: `${this.highRiskShopkeepers.length} high risk`, icon: 'users', iconClass: 'icon-purple' },
    ];
  }

  getStatusClass(status: string) {
    const map: Record<string, string> = {
      'PENDING':   'bg-yellow-100 text-yellow-800',
      'APPROVED':  'bg-blue-100 text-blue-800',
      'DELIVERED': 'bg-emerald-100 text-emerald-800',
      'CANCELLED': 'bg-rose-100 text-rose-700',
    };
    return map[status] || 'bg-slate-100 text-slate-600';
  }

  trackByLabel(_: number, item: any) { return item.label; }
  trackById(_: number, item: any) { return item.id; }
}
