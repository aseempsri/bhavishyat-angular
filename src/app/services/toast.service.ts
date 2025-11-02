import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  type?: 'success' | 'error' | 'info' | 'warning';
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toasts$ = new BehaviorSubject<Toast[]>([]);

  getToasts(): Observable<Toast[]> {
    return this.toasts$.asObservable();
  }

  show(toast: Omit<Toast, 'id'>): void {
    const id = Date.now().toString();
    const newToast: Toast = { ...toast, id };
    const currentToasts = this.toasts$.getValue();
    this.toasts$.next([newToast, ...currentToasts].slice(0, 1));

    // Auto dismiss after 3 seconds
    setTimeout(() => {
      this.dismiss(id);
    }, 3000);
  }

  dismiss(id: string): void {
    const currentToasts = this.toasts$.getValue();
    this.toasts$.next(currentToasts.filter(t => t.id !== id));
  }

  toast(toast: Omit<Toast, 'id'>): void {
    this.show(toast);
  }
}
