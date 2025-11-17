import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  public loading = signal<boolean>(false);
  public error = signal<string | null>(null);
  public showToast = signal<boolean>(false);
  public toastMessage = signal<string>('');
  public form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      remember: [false]
    });
  }

  public submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    const v = this.form.value as { email: string; password: string; remember: boolean };

    this.auth.login({ email: v.email, password: v.password }).subscribe({
      next: () => {
        // on successful login, fetch user data
        this.auth.me().subscribe({
          next: (userRes: any) => {
            this.loading.set(false);
            // Decide destination based on role priority
            const rolePriority = ['admin', 'cajero', 'mesero', 'cocina'];
            let redirected = false;
            for (const role of rolePriority) {
              if (this.auth.hasRole(role)) {
                this.router.navigate([`/${role}`]).catch(() => {});
                redirected = true;
                break;
              }
            }
            if (!redirected) {
              // If user has no known role, show unauthorized message
              const msg = 'No autorizado: tu cuenta no tiene un rol válido.';
              this.error.set(msg);
              this.auth.logout().subscribe(() => {});
              this.showToast.set(true);
              this.toastMessage.set(msg);
              setTimeout(() => this.showToast.set(false), 3500);
            }
          },
          error: (meErr: any) => {
            this.loading.set(false);
            this.error.set('Error al obtener datos del usuario.');
            this.showToast.set(true);
            this.toastMessage.set('Error al obtener datos del usuario.');
            setTimeout(() => this.showToast.set(false), 3500);
          }
        });
      },
      error: (err: any) => {
        this.loading.set(false);
      
        let errorMessage = 'Credenciales incorrectas. Por favor, intenta nuevamente.';
        if (err?.error?.message) {
          errorMessage = err.error.message;
        } else if (err?.error?.errors) {
          const errors = err.error.errors;
          const firstError = Object.values(errors)[0];
          if (Array.isArray(firstError) && firstError.length > 0) {
            errorMessage = firstError[0] as string;
          }
        } else if (err?.message) {
          errorMessage = err.message;
        } else if (err?.status === 401) {
          errorMessage = 'Usuario o contraseña incorrectos.';
        } else if (err?.status === 422) {
          errorMessage = 'Datos inválidos. Verifica tu correo y contraseña.';
        } else if (err?.status === 0) {
          errorMessage = 'No se pudo conectar al servidor. Verifica tu conexión.';
        }

        this.error.set(errorMessage);
        this.toastMessage.set(errorMessage);
        this.showToast.set(true);
        setTimeout(() => this.showToast.set(false), 3500);
      }
    });
  }
}


