import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../infrastructure/auth/auth.service';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageSwitcher } from '../../../../shared/presentation/components/language-switcher/language-switcher';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterModule, CommonModule, TranslateModule, LanguageSwitcher, MatButtonToggleModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  model: any = { email: '', password: '' };
  loading = false;
  errorMessage = '';

  // errores por campo individual
  fieldErrors = { email: '', password: '' };
  showPassword = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  private isValidEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  // limpiar error de campo al escribir
  onFieldChange(field: 'email' | 'password') {
    this.fieldErrors[field] = '';
    this.errorMessage = '';
  }

  private validateForm(): boolean {
    let isValid = true;
    this.fieldErrors = { email: '', password: '' };

    const email = this.model.email?.trim() ?? '';
    const password = this.model.password ?? '';

    if (!email) {
      this.fieldErrors.email = 'El email es obligatorio';
      isValid = false;
    } else if (!this.isValidEmail(email)) {
      this.fieldErrors.email = 'Formato de email inválido (ej: usuario@dominio.com)';
      isValid = false;
    }

    if (!password) {
      this.fieldErrors.password = 'La contraseña es obligatoria';
      isValid = false;
    }

    return isValid;
  }

  onSubmit() {
    this.model.email = this.model.email?.trim();

    if (!this.validateForm()) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.login(this.model.email, this.model.password).subscribe({
      next: (user) => {
        this.loading = false;
        if (user) {
          if (user.role === 'OWNER') {
            this.router.navigate(['/resumen']);
          } else {
            this.router.navigate(['/home']);
          }
        } else {
          this.errorMessage = 'Email o contraseña incorrectos';
        }
      },
      error: (err: any) => {
        console.error('[Login] ❌ Error:', err);
        this.loading = false;

        if (err?.status === 401) {
          this.errorMessage = 'Email o contraseña incorrectos';
        } else if (err?.status === 400) {
          this.errorMessage = 'Datos inválidos. Verifica tu email y contraseña';
        } else if (err?.status === 0) {
          this.errorMessage = 'No se puede conectar al servidor. ¿Está ejecutándose el backend?';
        } else {
          this.errorMessage = 'Error al iniciar sesión. Intenta nuevamente';
        }
      }
    });
  }
}