import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="cocina-dashboard">
      <header>
        <h1>Panel de Cocina</h1>
        <button (click)="logout()">Cerrar sesión</button>
      </header>
      <main>
        <h2>Órdenes Pendientes</h2>
        <p>Visualiza y gestiona las órdenes de cocina.</p>
      </main>
    </div>
  `,
  styles: [`
    .cocina-dashboard { height: 100vh; display: flex; flex-direction: column; }
    header { background: #ffc107; color: #333; padding: 1rem; display: flex; justify-content: space-between; }
    main { flex: 1; padding: 2rem; }
    button { background: #dc3545; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; }
  `]
})
export class CocinaDashboardComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  logout() {
    this.auth.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }
}
