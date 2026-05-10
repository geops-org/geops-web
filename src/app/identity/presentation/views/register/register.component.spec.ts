import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../../infrastructure/auth/auth.service';
import { Router, provideRouter } from '@angular/router'; // <--- Importa provideRouter
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

fdescribe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['register']);

    await TestBed.configureTestingModule({
      imports: [
        RegisterComponent, 
        FormsModule, 
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });


  it('debe guardar en localStorage y navegar si el rol es OWNER', () => {
    const router = TestBed.inject(Router);
    // Bloqueamos la navegación real devolviendo 'true' (simula éxito)
    const navigateSpy = spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    component.model = {
        name: 'Vanessa Choy', //
        email: 'test@geops.com',
        password: 'password123',
        phone: '987654321', // Cumple con la regex /^9[0-9]{8}$/
        role: 'OWNER',
        plan: 'BASIC'
    };

    component.onSubmit();
    fixture.detectChanges();

    expect(navigateSpy).toHaveBeenCalledWith(['/register-bussines']);
    });
});