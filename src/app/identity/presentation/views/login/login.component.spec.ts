import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

import { LoginComponent } from './login.component';
import { AuthService } from '../../../infrastructure/auth/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj('AuthService', ['login']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent, FormsModule, TranslateModule.forRoot()],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
      .overrideComponent(LoginComponent, {
        // Elimina dependencias externas complejas del template (LanguageSwitcher, etc.)
        remove: { imports: [] },
        add: { imports: [FormsModule, TranslateModule] }
      })
      .compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe inicializar el modelo con email y password vacíos', () => {
    expect(component.model.email).toBe('');
    expect(component.model.password).toBe('');
  });

  it('debe iniciar con loading en false', () => {
    expect(component.loading).toBeFalse();
  });

  it('debe iniciar con errorMessage vacío', () => {
    expect(component.errorMessage).toBe('');
  });

  it('debe iniciar con showPassword en false', () => {
    expect(component.showPassword).toBeFalse();
  });

  describe('togglePassword()', () => {
    it('debe cambiar showPassword a true en la primera llamada', () => {
      component.togglePassword();
      expect(component.showPassword).toBeTrue();
    });

    it('debe volver a false en la segunda llamada', () => {
      component.togglePassword();
      component.togglePassword();
      expect(component.showPassword).toBeFalse();
    });
  });

  describe('onFieldChange()', () => {
    it('debe limpiar el error del campo email', () => {
      component.fieldErrors.email = 'Error previo';
      component.onFieldChange('email');
      expect(component.fieldErrors.email).toBe('');
    });

    it('debe limpiar el error del campo password', () => {
      component.fieldErrors.password = 'Error previo';
      component.onFieldChange('password');
      expect(component.fieldErrors.password).toBe('');
    });

    it('debe limpiar el errorMessage general', () => {
      component.errorMessage = 'Error del servidor';
      component.onFieldChange('email');
      expect(component.errorMessage).toBe('');
    });

    it('no debe afectar el error del otro campo', () => {
      component.fieldErrors.email = 'Error email';
      component.fieldErrors.password = 'Error password';
      component.onFieldChange('email');
      expect(component.fieldErrors.password).toBe('Error password');
    });
  });

  describe('onSubmit() — validaciones del formulario', () => {
    it('no debe llamar al servicio si el email está vacío', () => {
      component.model = { email: '', password: 'pass123' };
      component.onSubmit();
      expect(authSpy.login).not.toHaveBeenCalled();
    });

    it('debe setear fieldErrors.email cuando el email está vacío', () => {
      component.model = { email: '', password: 'pass123' };
      component.onSubmit();
      expect(component.fieldErrors.email).toBeTruthy();
    });

    it('debe setear error de email para formato inválido sin @', () => {
      component.model = { email: 'usuariosindominio', password: 'pass123' };
      component.onSubmit();
      expect(component.fieldErrors.email).toContain('inválido');
    });

    it('debe setear error de email para formato inválido sin dominio', () => {
      component.model = { email: 'user@', password: 'pass123' };
      component.onSubmit();
      expect(component.fieldErrors.email).toBeTruthy();
    });

    it('no debe llamar al servicio si la contraseña está vacía', () => {
      component.model = { email: 'user@test.com', password: '' };
      component.onSubmit();
      expect(authSpy.login).not.toHaveBeenCalled();
    });

    it('debe setear fieldErrors.password cuando la contraseña está vacía', () => {
      component.model = { email: 'user@test.com', password: '' };
      component.onSubmit();
      expect(component.fieldErrors.password).toBeTruthy();
    });

    it('debe setear ambos errores cuando ambos campos están vacíos', () => {
      component.model = { email: '', password: '' };
      component.onSubmit();
      expect(component.fieldErrors.email).toBeTruthy();
      expect(component.fieldErrors.password).toBeTruthy();
    });

    it('debe eliminar espacios del email antes de validar', () => {
      authSpy.login.and.returnValue(of(null));
      component.model = { email: '  user@test.com  ', password: 'pass123' };
      component.onSubmit();
      expect(component.model.email).toBe('user@test.com');
    });
  });

  describe('onSubmit() — integración con AuthService', () => {
    beforeEach(() => {
      component.model = { email: 'user@test.com', password: 'secret123' };
    });

    it('debe llamar a authService.login con las credenciales correctas', () => {
      authSpy.login.and.returnValue(of(null));
      component.onSubmit();
      expect(authSpy.login).toHaveBeenCalledWith('user@test.com', 'secret123');
    });

    it('debe navegar a /resumen cuando el rol es OWNER', () => {
      authSpy.login.and.returnValue(of({ role: 'OWNER' } as any));
      component.onSubmit();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/resumen']);
    });

    it('debe navegar a /home cuando el rol es CONSUMER', () => {
      authSpy.login.and.returnValue(of({ role: 'CONSUMER' } as any));
      component.onSubmit();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
    });

    it('debe setear errorMessage cuando la respuesta del login es null', () => {
      authSpy.login.and.returnValue(of(null));
      component.onSubmit();
      expect(component.errorMessage).toBeTruthy();
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });

    it('debe setear loading en false tras login exitoso', () => {
      authSpy.login.and.returnValue(of({ role: 'CONSUMER' } as any));
      component.onSubmit();
      expect(component.loading).toBeFalse();
    });

    it('debe setear loading en false tras error en el login', () => {
      authSpy.login.and.returnValue(throwError(() => ({ status: 500 })));
      component.onSubmit();
      expect(component.loading).toBeFalse();
    });
  });

  describe('onSubmit() — manejo de errores HTTP', () => {
    beforeEach(() => {
      component.model = { email: 'user@test.com', password: 'secret123' };
    });

    it('debe setear mensaje "incorrectos" en error 401', () => {
      authSpy.login.and.returnValue(throwError(() => ({ status: 401 })));
      component.onSubmit();
      expect(component.errorMessage).toContain('incorrectos');
    });

    it('debe setear mensaje "inválidos" en error 400', () => {
      authSpy.login.and.returnValue(throwError(() => ({ status: 400 })));
      component.onSubmit();
      expect(component.errorMessage).toContain('nválidos');
    });

    it('debe setear mensaje sobre el servidor en error 0 (sin conexión)', () => {
      authSpy.login.and.returnValue(throwError(() => ({ status: 0 })));
      component.onSubmit();
      expect(component.errorMessage).toContain('servidor');
    });

    it('debe setear un mensaje genérico para otros errores', () => {
      authSpy.login.and.returnValue(throwError(() => ({ status: 503 })));
      component.onSubmit();
      expect(component.errorMessage).toBeTruthy();
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });
  });
});
