import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="cajero-dashboard">
      <header>
        <h1>Panel de Cajero</h1>
        <button (click)="logout()">Cerrar sesión</button>
      </header>
      <main>
        <h2>Caja y Pagos</h2>
        <p>Gestiona pagos y cierre de caja.</p>
      </main>
    </div>
  `,
  styles: [`
    .cajero-dashboard { height: 100vh; display: flex; flex-direction: column; }
    header { background: #17a2b8; color: white; padding: 1rem; display: flex; justify-content: space-between; }
    main { flex: 1; padding: 2rem; }
    button { background: #dc3545; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; }
  `]
})
export class CajeroDashboardComponent {
  private auth: AuthService = inject(AuthService);
  private router = inject(Router);

  logout() {
    this.auth.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: (_err: any) => this.router.navigate(['/login'])
    });
  }
}
