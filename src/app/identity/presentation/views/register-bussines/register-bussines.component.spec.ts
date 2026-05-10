import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterBussinesComponent } from './register-bussines.component';
import { AuthService } from '../../../infrastructure/auth/auth.service';
import { Router } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

fdescribe('RegisterBussinesComponent', () => {
  let component: RegisterBussinesComponent;
  let fixture: ComponentFixture<RegisterBussinesComponent>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    // Simulamos datos en localStorage para que el ngOnInit no falle
    const mockOwnerData = { name: 'Vanessa', email: 'v@test.com', role: 'OWNER' };
    spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify(mockOwnerData));

    await TestBed.configureTestingModule({
      imports: [
        RegisterBussinesComponent,
        FormsModule,
        HttpClientTestingModule,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: AuthService, useValue: { register: () => {} } },
        provideRouter([]),
        provideNoopAnimations()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterBussinesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe validar que el RUC empiece con 10 o 20', () => {
    component.business.businessName = 'Mi Negocio';
    component.business.businessType = '1';
    component.business.taxId = '30123456789'; // Empieza con 30 (inválido)

    const result = (component as any).validateBusinessData(); // Acceso a método privado para test

    expect(result).toBeFalse();
    expect(component.errorMessage).toBe('El RUC debe tener 11 dígitos y empezar con 10 o 20');
  });
});