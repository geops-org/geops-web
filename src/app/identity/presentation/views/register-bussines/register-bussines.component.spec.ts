import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterBussinesComponent } from './register-bussines.component';
import { AuthService } from '../../../infrastructure/auth/auth.service';
import { Router } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

fdescribe('RegisterBussinesComponent', () => {
  let component: RegisterBussinesComponent;
  let fixture: ComponentFixture<RegisterBussinesComponent>;
  let router: Router;

  beforeEach(async () => {
    const mockOwnerData = { name: 'Vanessa', email: 'v@test.com', role: 'OWNER' };
    spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify(mockOwnerData));

    await TestBed.configureTestingModule({
        imports: [
        RegisterBussinesComponent,
        FormsModule,
        TranslateModule.forRoot()
        ],
        providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { register: () => {} } },
        provideRouter([]),
        provideNoopAnimations()
        ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterBussinesComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router); 
    fixture.detectChanges();
    });

  it('debe validar que el RUC empiece con 10 o 20', () => {
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    component.business.businessName = 'Mi Negocio';
    component.business.businessType = '1';
    component.business.taxId = '30123456789'; 

    const result = (component as any).validateBusinessData(); 

    expect(result).toBeFalse();
    expect(component.errorMessage).toBe('El RUC debe tener 11 dígitos y empezar con 10 o 20');
  });
});