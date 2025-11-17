import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mesero-dashboard">
      <header>
        <h1>Panel de Mesero</h1>
        <button (click)="logout()">Cerrar sesión</button>
      </header>
      <main>
        <h2>Mesas Asignadas</h2>
        <p>Gestiona tus órdenes y mesas aquí.</p>
      </main>
    </div>
  `,
  styles: [`
    .mesero-dashboard { height: 100vh; display: flex; flex-direction: column; }
    header { background: #28a745; color: white; padding: 1rem; display: flex; justify-content: space-between; }
    main { flex: 1; padding: 2rem; }
    button { background: #dc3545; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; }
  `]
})
export class MeseroDashboardComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  logout() {
    this.auth.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }
}
