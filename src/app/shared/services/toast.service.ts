import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private readonly itemsSubject = new BehaviorSubject<ToastItem[]>([]);
  readonly items$ = this.itemsSubject.asObservable();
  private nextId = 1;

  show(message: string, type: ToastType = 'info', duration = 3200) {
    const item: ToastItem = {
      id: this.nextId++,
      message,
      type
    };

    this.itemsSubject.next([...this.itemsSubject.value, item]);

    window.setTimeout(() => this.dismiss(item.id), duration);
  }

  dismiss(id: number) {
    this.itemsSubject.next(this.itemsSubject.value.filter((item) => item.id !== id));
  }

  success(message: string, duration?: number) {
    this.show(message, 'success', duration);
  }

  error(message: string, duration?: number) {
    this.show(message, 'error', duration);
  }

  warning(message: string, duration?: number) {
    this.show(message, 'warning', duration);
  }

  info(message: string, duration?: number) {
    this.show(message, 'info', duration);
  }
}
