import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-product-dialog',
  template: `
    <div *ngIf="open" class="custom-modal" (click)="close(false)">
      <div class="custom-modal__panel custom-modal__panel--wide" (click)="$event.stopPropagation()">

        <div class="modal-header">
          <h2 class="modal-title">{{ data ? 'Edit Product' : 'Add Product' }}</h2>
          <button type="button" class="btn btn-secondary btn-icon" (click)="close(false)">
            <app-icon name="close" [size]="14"></app-icon>
          </button>
        </div>

        <form [formGroup]="productForm" (ngSubmit)="onSubmit()">
          <div class="modal-body">

            <p class="section-label">Basic Details</p>
            <div class="form-grid form-grid-2 mb-4">
              <div class="form-group full-col">
                <label class="form-label required">Product Name</label>
                <input class="form-control"
                  [class.is-invalid]="productForm.get('name')?.invalid && productForm.get('name')?.touched"
                  formControlName="name" placeholder="Enter product name">
                <p *ngIf="productForm.get('name')?.invalid && productForm.get('name')?.touched" class="form-error">Name is required</p>
              </div>
              <div class="form-group">
                <label class="form-label">Category</label>
                <select class="form-select" formControlName="category">
                  <option value="Grocery">Grocery</option>
                  <option value="Beverages">Beverages</option>
                  <option value="Dairy">Dairy</option>
                  <option value="Snacks">Snacks</option>
                  <option value="Household">Household</option>
                  <option value="Personal Care">Personal Care</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Fast Delivery</label>
                <select class="form-select" formControlName="fastDeliveryEligible">
                  <option [value]="true">Yes</option>
                  <option [value]="false">No</option>
                </select>
              </div>
              <div class="form-group full-col">
                <label class="form-label">Description</label>
                <textarea class="form-control" formControlName="description" placeholder="Optional description" rows="2"></textarea>
              </div>
            </div>

            <p class="section-label">Pricing &amp; Stock</p>
            <div class="form-grid form-grid-3 mb-4">
              <div class="form-group">
                <label class="form-label required">Retail Price (₹)</label>
                <input class="form-control"
                  [class.is-invalid]="productForm.get('price')?.invalid && productForm.get('price')?.touched"
                  type="number" min="0" formControlName="price" placeholder="0">
                <p *ngIf="productForm.get('price')?.invalid && productForm.get('price')?.touched" class="form-error">Valid price required</p>
              </div>
              <div class="form-group">
                <label class="form-label">Credit Price (₹)</label>
                <input class="form-control" type="number" min="0" formControlName="bulkPrice" placeholder="0">
              </div>
              <div class="form-group">
                <label class="form-label required">Stock Qty</label>
                <input class="form-control"
                  [class.is-invalid]="productForm.get('stock')?.invalid && productForm.get('stock')?.touched"
                  type="number" min="0" formControlName="stock" placeholder="0">
                <p *ngIf="productForm.get('stock')?.invalid && productForm.get('stock')?.touched" class="form-error">Stock required</p>
              </div>
            </div>

            <div *ngIf="!data">
              <p class="section-label">Product Images</p>
              <div class="upload-zone" (click)="imageInput.click()">
                <app-icon name="upload" [size]="22"></app-icon>
                <span class="upload-zone__text">Click to upload images</span>
                <span class="upload-zone__hint">JPG, PNG, WEBP · Max 10 files</span>
                <input #imageInput type="file" accept="image/*" multiple style="display:none" (change)="onImagesSelected($event)">
              </div>
              <div *ngIf="imagePreviews.length > 0" class="img-preview-list">
                <div *ngFor="let preview of imagePreviews; let i = index" class="img-preview">
                  <img [src]="preview" alt="preview">
                  <button type="button" (click)="removeImage(i)">×</button>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="close(false)">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="productForm.invalid || loading">
              <span *ngIf="loading" class="btn-spinner"></span>
              {{ data ? 'Update' : 'Add' }} Product
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .section-label {
      font-size: 11px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.08em; color: #878787; margin: 0 0 10px;
      padding-bottom: 6px; border-bottom: 1px solid #f0f0f0;
    }
    .mb-4 { margin-bottom: 16px; }
    .full-col { grid-column: 1 / -1; }
    .upload-zone {
      border: 2px dashed #c2c2c2; border-radius: 6px; padding: 24px;
      text-align: center; cursor: pointer; background: #fafafa; color: #878787;
      transition: border-color 0.16s, color 0.16s;
      display: flex; flex-direction: column; align-items: center; gap: 4px;
    }
    .upload-zone:hover { border-color: #2874f0; color: #2874f0; }
    .upload-zone__text { font-size: 13px; font-weight: 600; }
    .upload-zone__hint { font-size: 11px; }
    .img-preview-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
    .img-preview { position: relative; }
    .img-preview img { width: 70px; height: 70px; object-fit: cover; border-radius: 6px; border: 1px solid #e0e0e0; display: block; }
    .img-preview button {
      position: absolute; top: -6px; right: -6px; width: 18px; height: 18px;
      border-radius: 50%; background: #d32f2f; color: #fff; border: none;
      font-size: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center;
    }
    .btn-spinner {
      width: 13px; height: 13px; border-radius: 50%;
      border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
      animation: spin 0.8s linear infinite; display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class ProductDialogComponent implements OnChanges {
  @Input() open = false;
  @Input() data: any = null;
  @Output() closed = new EventEmitter<boolean>();
  productForm: FormGroup;
  loading = false;
  selectedImages: File[] = [];
  imagePreviews: string[] = [];

  constructor(private fb: FormBuilder, private adminApi: AdminApiService, private toast: ToastService) {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      category: ['Grocery', Validators.required],
      description: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      bulkPrice: [0, [Validators.required, Validators.min(0)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      fastDeliveryEligible: [false],
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data'] || changes['open']) {
      this.loading = false;
      this.selectedImages = [];
      this.imagePreviews = [];
      this.productForm.reset({
        name: this.data?.name || '',
        category: this.data?.category || 'Grocery',
        description: this.data?.description || '',
        price: this.data?.price ?? 0,
        bulkPrice: this.data?.bulkPrice ?? 0,
        stock: this.data?.stock ?? 0,
        fastDeliveryEligible: this.data?.fastDeliveryEligible ?? false,
      });
    }
  }

  onImagesSelected(event: Event) {
    const files = Array.from((event.target as HTMLInputElement).files || []);
    this.selectedImages = [...this.selectedImages, ...files].slice(0, 10);
    this.imagePreviews = [];
    this.selectedImages.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e: any) => this.imagePreviews.push(e.target.result);
      reader.readAsDataURL(file);
    });
  }

  removeImage(index: number) {
    this.selectedImages.splice(index, 1);
    this.imagePreviews.splice(index, 1);
  }

  onSubmit() {
    if (this.productForm.invalid) { this.productForm.markAllAsTouched(); return; }
    this.loading = true;

    if (this.data) {
      this.adminApi.updateProduct(this.data.id, this.productForm.value).subscribe({
        next: () => { this.toast.success('Product updated!'); this.close(true); },
        error: (e: any) => { this.loading = false; this.toast.error(e?.error?.message || 'Update failed'); }
      });
    } else {
      const formData = new FormData();
      Object.entries(this.productForm.value).forEach(([k, v]) => formData.append(k, String(v)));
      this.selectedImages.forEach(img => formData.append('images', img));
      this.adminApi.createProduct(formData).subscribe({
        next: () => { this.toast.success('Product added!'); this.close(true); },
        error: (e: any) => { this.loading = false; this.toast.error(e?.error?.message || 'Create failed'); }
      });
    }
  }

  close(saved: boolean) { this.closed.emit(saved); }
}
