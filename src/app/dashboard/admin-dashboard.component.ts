import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ApiService } from '../services/api.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent {
  private auth: AuthService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private api: ApiService = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);

  currentUser: any = null;
  activeSection = 'inicio';

  // Products state
  products: Array<any> = [];

  // UI controls
  searchQuery = '';
  selectedCategory = 'Todas las Categorías';
  showAddProduct = false;

  productForm = this.fb.group({
    name: ['', Validators.required],
    description: ['', Validators.required],
    price: [null, [Validators.required, Validators.min(0)]],
    quantity: [1, [Validators.required, Validators.min(1)]],
    category: ['Entradas', Validators.required],
    imageFile: [null]
  });

  // Price display string for formatted currency (e.g. "12.345 COP")
  priceDisplay: string = '0 COP';

  // Toast
  showToast = false;
  toastMessage = '';

  imagePreview: string | null = null;
  imageDragOver = false;
  saving = false;

  stats = {
    ingresosDia: 0,
    numOrdenes: 0,
    mesasActivas: { actual: 0, total: 0 },
    inventarioBajo: 0
  };

  ventasSemana = {
    total: 0,
    cambio: 0,
    datos: [] as Array<any>
  };

  actividadReciente: Array<any> = [];

  constructor() {
    (this.auth.currentUser$ as any).subscribe((user: any) => {
      this.currentUser = user;
    });
    // Load dynamic data from backend (no mocks)
    this.loadProducts();
    this.loadDashboard();
  }

  openAddProduct() {
    this.showAddProduct = true;
    this.productForm.reset({ name: '', description: '', price: null, category: 'Entradas', imageFile: null });
    this.priceDisplay = '0 COP';
    this.imagePreview = null;
  }

  closeAddProduct() {
    this.showAddProduct = false;
  }

  onFileChange(event: any) {
    const file = event.target?.files?.[0];
    if (!file) return;
    (this.productForm as any).patchValue({ imageFile: file });
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
      // Ensure view updates immediately
      try { this.cdr.detectChanges(); } catch { }
    };
    reader.readAsDataURL(file);
    this.imageDragOver = false;
  }

  onPriceFocus() {
    // show raw numeric value for editing
    const v = this.productForm.get('price')?.value;
    const num = Number(v) || 0;
    this.priceDisplay = num === 0 ? '' : String(num);
  }

  onPriceBlur() {
    // ensure control has a numeric value and format display
    const cleaned = this.priceDisplay.replace(/[^0-9\.]/g, '');
    if (cleaned === '') {
      // leave control invalid (required) if user erased value
      (this.productForm as any).patchValue({ price: null });
      this.priceDisplay = '0 COP';
      return;
    }
    const num = Number(cleaned);
    (this.productForm as any).patchValue({ price: isNaN(num) ? null : num });
    this.priceDisplay = this.formatCOP(num);
  }

  onPriceInput(event: Event) {
    // Prevent non-numeric characters and keep the form control updated immediately.
    const input = event.target as HTMLInputElement;
    let raw = input.value || '';
    // Allow digits and at most one decimal point
    raw = raw.replace(/[^0-9\.]/g, '');
    // remove extra dots
    const parts = raw.split('.');
    if (parts.length > 2) {
      raw = parts[0] + '.' + parts.slice(1).join('');
    }
    // normalize leading zeros and empty
    const num = raw === '' ? null : Number(raw);
    // update the visible input and internal display
    this.priceDisplay = raw === '' ? '' : raw;
    input.value = this.priceDisplay;
    // update form control so validators and disabled state react immediately
    (this.productForm as any).patchValue({ price: num === null ? null : (isNaN(num) ? null : num) }, { emitEvent: false });
  }

  formatCOP(n: number) {
    try {
      const fmt = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);
      return `${fmt} COP`;
    } catch {
      return `${n} COP`;
    }
  }

  

  onImageDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.imageDragOver = true;
  }

  onImageDragLeave(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.imageDragOver = false;
  }

  onImageDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.imageDragOver = false;
    const dt = (e.dataTransfer as DataTransfer | null);
    if (!dt) return;
    const file = dt.files && dt.files.length ? dt.files[0] : null;
    if (!file) return;
    // reuse file handling
    (this.productForm as any).patchValue({ imageFile: file });
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
      try { this.cdr.detectChanges(); } catch { }
    };
    reader.readAsDataURL(file);
  }

  addProduct() {
    // Front-end safety check: prevent submission when form invalid and highlight fields
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      this.showToastMessage('Completa todos los campos para crear un producto');
      return;
    }
    const v = this.productForm.value as any;
    const form = new FormData();
    form.append('name', v.name || '');
    form.append('description', v.description || '');
    form.append('price', String(v.price ?? 0));
    form.append('quantity', String(v.quantity ?? 1));
    form.append('category', v.category || 'General');
    const file = v.imageFile;
    if (file) form.append('image', file);

    this.saving = true;
    this.api.post<any>('api/products', form).subscribe({
      next: (res: any) => {
        this.saving = false;
        const created = res?.data ?? res;
        const added = {
          id: created?.id ?? `#P${(this.products.length + 1).toString().padStart(3,'0')}`,
          name: created?.name ?? v.name ?? 'Sin nombre',
          category: created?.category ?? v.category ?? 'General',
          price: created?.price ?? Number(v.price) ?? 0,
          quantity: created?.quantity ?? Number(v.quantity) ?? 1,
          estado: created?.estado ?? 'Activo',
          image: created?.image_url ?? created?.image ?? this.imagePreview ?? 'assets/sample/placeholder.jpg'
        };
        this.products = [added, ...this.products];
        this.closeAddProduct();
        this.showToastMessage('Producto creado correctamente');
      },
      error: (err) => {
        this.saving = false;
        // Show a toast with the backend error message (if available) or a generic message
        const msg = err?.error?.message || err?.message || `Conexión con el backend fallida (status ${err?.status ?? 'unknown'})`;
        this.showToastMessage(msg);
        console.debug('Product create failed:', err);
      }
    });
  }

  showToastMessage(msg: string) {
    this.toastMessage = msg;
    this.showToast = true;
    try { this.cdr.detectChanges(); } catch { }
    setTimeout(() => { this.showToast = false; try { this.cdr.detectChanges(); } catch { } }, 3000);
  }

  loadProducts() {
    this.api.get<any>('api/products').subscribe({
      next: (res: any) => {
        const data = res?.data ?? res ?? [];
        this.products = Array.isArray(data) ? data : [];
      },
      error: (err: any) => {
        this.products = [];
        console.debug('Failed to load products from API:', err);
      }
    });
  }

  loadDashboard() {
    // Try a single dashboard endpoint that may contain aggregated stats, ventasSemana and actividad
    this.api.get<any>('api/dashboard').subscribe({
      next: (res: any) => {
        const d = res?.data ?? res ?? {};
        if (d.stats) this.stats = { ...this.stats, ...d.stats };
        if (d.ventasSemana) this.ventasSemana = { ...this.ventasSemana, ...d.ventasSemana };
        if (d.actividadReciente) this.actividadReciente = Array.isArray(d.actividadReciente) ? d.actividadReciente : this.actividadReciente;
      },
      error: (err: any) => {
        // If dashboard endpoint not available, leave defaults and log the issue.
        console.debug('Dashboard data not available from API:', err);
      }
    });
  }

  setActiveSection(section: string) {
    this.activeSection = section;
  }

  logout() {
    (this.auth.logout() as any).subscribe((_: any) => {
      this.router.navigate(['/login']);
    });
  }
}
