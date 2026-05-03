import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { CacheService } from './cache.service';

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  constructor(private api: ApiService, private cache: CacheService) {}

  // ── Dashboard ───────────────────────────────────────────────────────────────
  getSummary(force = false): Observable<any> {
    if (force) this.cache.invalidate('dashboard:summary');
    return this.cache.getOrSet('dashboard:summary', 2 * 60 * 1000, () => this.api.get('/admin/dashboard/summary'));
  }

  getRevenueGraph(period = 'monthly', force = false): Observable<any> {
    const key = `dashboard:graph:${period}`;
    if (force) this.cache.invalidate('dashboard:graph:');
    return this.cache.getOrSet(key, 2 * 60 * 1000, () => this.api.get('/admin/dashboard/revenue-graph', { period }));
  }

  getRecentOrders(limit = 10, force = false): Observable<any> {
    if (force) this.cache.invalidate('dashboard:recent');
    return this.cache.getOrSet('dashboard:recent', 2 * 60 * 1000, () => this.api.get('/admin/dashboard/recent-orders', { limit }));
  }

  // ── Products ─────────────────────────────────────────────────────────────────
  getProducts(params: any, force = false) {
    if (force) this.cache.invalidate('products:list');
    return this.cache.getOrSet(`products:list:${JSON.stringify(params)}`, 3 * 60 * 1000, () => this.api.get('/admin/products', params));
  }

  getProduct(id: string, force = false) {
    if (force) this.cache.invalidate(`products:detail:${id}`);
    return this.cache.getOrSet(`products:detail:${id}`, 10 * 60 * 1000, () => this.api.get(`/admin/products/${id}`));
  }

  createProduct(formData: FormData) {
    this.cache.invalidate('products:');
    return this.api.postFormData('/admin/products', formData);
  }

  updateProduct(id: string, body: any) {
    this.cache.invalidate('products:');
    return this.api.put(`/admin/products/${id}`, body);
  }

  deleteProduct(id: string) {
    this.cache.invalidate('products:');
    return this.api.delete(`/admin/products/${id}`);
  }

  bulkUploadProducts(formData: FormData) {
    this.cache.invalidate('products:');
    return this.api.postFormData('/admin/products/bulk-upload', formData);
  }

  uploadProductImages(formData: FormData) {
    return this.api.postFormData('/admin/products/upload-images', formData);
  }

  // ── Orders ───────────────────────────────────────────────────────────────────
  getOrders(params: any, force = false) {
    if (force) this.cache.invalidate('orders:list');
    return this.cache.getOrSet(`orders:list:${JSON.stringify(params)}`, 2 * 60 * 1000, () => this.api.get('/admin/orders', params));
  }

  getOrderById(id: string, force = false) {
    if (force) this.cache.invalidate(`orders:detail:${id}`);
    return this.cache.getOrSet(`orders:detail:${id}`, 5 * 60 * 1000, () => this.api.get(`/admin/orders/${id}`));
  }

  approveOrder(id: string) {
    this.cache.invalidate('orders:');
    return this.api.put(`/admin/orders/${id}/approve`, {});
  }

  assignDeliveryBoy(id: string, deliveryBoyId: string, notes?: string) {
    this.cache.invalidate('orders:');
    this.cache.invalidate('deliveries:');
    return this.api.put(`/admin/orders/${id}/assign-delivery-boy`, { deliveryBoyId, notes: notes || null });
  }

  updateOrderStatus(id: string, status: string) {
    this.cache.invalidate('orders:');
    return this.api.put(`/admin/orders/${id}/status`, { status });
  }

  cancelOrder(id: string, reason: string) {
    this.cache.invalidate('orders:');
    return this.api.put(`/admin/orders/${id}/cancel`, { reason });
  }

  // ── Shopkeepers ───────────────────────────────────────────────────────────────
  getShopkeepers(params: any, force = false) {
    if (force) this.cache.invalidate('shopkeepers:list');
    return this.cache.getOrSet(`shopkeepers:list:${JSON.stringify(params)}`, 3 * 60 * 1000, () => this.api.get('/admin/shopkeepers', params));
  }

  getShopkeeperById(id: string, force = false) {
    if (force) this.cache.invalidate(`shopkeepers:detail:${id}`);
    return this.cache.getOrSet(`shopkeepers:detail:${id}`, 10 * 60 * 1000, () => this.api.get(`/admin/shopkeepers/${id}`));
  }

  blockShopkeeper(id: string) {
    this.cache.invalidate('shopkeepers:');
    return this.api.put(`/admin/shopkeepers/${id}/block`, {});
  }

  unblockShopkeeper(id: string) {
    this.cache.invalidate('shopkeepers:');
    return this.api.put(`/admin/shopkeepers/${id}/unblock`, {});
  }

  resetCreditScore(id: string) {
    this.cache.invalidate('shopkeepers:');
    return this.api.put(`/admin/shopkeepers/${id}/reset-credit-score`, {});
  }

  getShopkeeperHistory(id: string, params: any = {}) {
    return this.api.get(`/admin/shopkeepers/${id}/history`, params);
  }

  getShopkeeperOrders(id: string, params: any = {}) {
    return this.api.get(`/admin/shopkeepers/${id}/orders`, params);
  }

  // ── Credit Settings ────────────────────────────────────────────────────────
  getCreditSettings(force = false) {
    if (force) this.cache.invalidate('credit:settings');
    return this.cache.getOrSet('credit:settings', 30 * 60 * 1000, () => this.api.get('/admin/credit/settings'));
  }

  updateCreditSettings(items: any[]) {
    this.cache.invalidate('credit:');
    return this.api.put('/admin/credit/settings', { items });
  }

  // ── Penalty Rules ─────────────────────────────────────────────────────────
  getPenaltyRules(force = false) {
    if (force) this.cache.invalidate('credit:penalty-rules');
    return this.cache.getOrSet('credit:penalty-rules', 15 * 60 * 1000, () => this.api.get('/admin/credit/penalty-rules'));
  }

  createPenaltyRule(body: any) {
    this.cache.invalidate('credit:penalty-rules');
    return this.api.post('/admin/credit/penalty-rules', body);
  }

  updatePenaltyRule(id: string, body: any) {
    this.cache.invalidate('credit:penalty-rules');
    return this.api.put(`/admin/credit/penalty-rules/${id}`, body);
  }

  deletePenaltyRule(id: string) {
    this.cache.invalidate('credit:penalty-rules');
    return this.api.delete(`/admin/credit/penalty-rules/${id}`);
  }

  // ── Bonus Rules ──────────────────────────────────────────────────────────
  getBonusRules(force = false) {
    if (force) this.cache.invalidate('credit:bonus-rules');
    return this.cache.getOrSet('credit:bonus-rules', 15 * 60 * 1000, () => this.api.get('/admin/credit/bonus-rules'));
  }

  createBonusRule(body: any) {
    this.cache.invalidate('credit:bonus-rules');
    return this.api.post('/admin/credit/bonus-rules', body);
  }

  updateBonusRule(id: string, body: any) {
    this.cache.invalidate('credit:bonus-rules');
    return this.api.put(`/admin/credit/bonus-rules/${id}`, body);
  }

  deleteBonusRule(id: string) {
    this.cache.invalidate('credit:bonus-rules');
    return this.api.delete(`/admin/credit/bonus-rules/${id}`);
  }

  // ── Manual Adjustment ────────────────────────────────────────────────────
  manualAdjustment(body: any) {
    this.cache.invalidate('credit:');
    this.cache.invalidate('shopkeepers:');
    return this.api.post('/admin/credit/manual-adjustment', body);
  }

  getCreditTransactions(params: any, force = false) {
    if (force) this.cache.invalidate('credit:txns');
    return this.cache.getOrSet(`credit:txns:${JSON.stringify(params)}`, 2 * 60 * 1000, () => this.api.get('/admin/credit/transactions', params));
  }

  // ── Delivery Boys ────────────────────────────────────────────────────────
  getDeliveryBoys(force = false) {
    if (force) this.cache.invalidate('lookup:delivery-boys');
    return this.cache.getOrSet('lookup:delivery-boys', 20 * 60 * 1000, () => this.api.get('/admin/delivery-boys', { page: 1, limit: 100 }));
  }

  createDeliveryBoy(body: any) {
    this.cache.invalidate('lookup:delivery-boys');
    return this.api.post('/admin/delivery-boys', body);
  }

  updateDeliveryBoy(id: string, body: any) {
    this.cache.invalidate('lookup:delivery-boys');
    return this.api.put(`/admin/delivery-boys/${id}`, body);
  }

  // ── Deliveries ──────────────────────────────────────────────────────────
  getDeliveries(params: any, force = false) {
    if (force) this.cache.invalidate('deliveries:list');
    return this.cache.getOrSet(`deliveries:list:${JSON.stringify(params)}`, 2 * 60 * 1000, () => this.api.get('/admin/deliveries', params));
  }

  assignDelivery(orderId: string, deliveryBoyId: string, notes?: string) {
    this.cache.invalidate('deliveries:');
    this.cache.invalidate('orders:');
    return this.api.put(`/admin/deliveries/${orderId}/assign`, { deliveryBoyId, notes: notes || null });
  }

  updateDeliveryStatus(deliveryId: string, body: any) {
    this.cache.invalidate('deliveries:');
    return this.api.put(`/admin/deliveries/${deliveryId}/status`, body);
  }

  // ── Repayments ───────────────────────────────────────────────────────────
  manualRepaymentConfirmation(body: any) {
    this.cache.invalidate('deliveries:');
    this.cache.invalidate('orders:');
    this.cache.invalidate('shopkeepers:');
    return this.api.post('/admin/repayments/manual-confirmation', body);
  }
}
