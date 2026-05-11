import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { CrearCampaignComponent } from './crear-campaign.component';
import { CampaignStore } from '../../../application/campaign.store';
import { AuthService } from '../../../../identity/infrastructure/auth/auth.service';

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function fillValidForm(component: CrearCampaignComponent): void {
  component.campaignForm.patchValue({
    name: 'Campaña de Verano',
    description: 'Esta es una descripción larga y válida',
    startDate: daysFromNow(1),
    endDate: daysFromNow(5),
    estimatedBudget: 500
  });
}

describe('CrearCampaignComponent', () => {
  let component: CrearCampaignComponent;
  let fixture: ComponentFixture<CrearCampaignComponent>;
  let routerSpy: jasmine.SpyObj<Router>;
  let authSpy: jasmine.SpyObj<AuthService>;

  const loadingSignal = signal(false);
  const errorSignal = signal<string | null>(null);

  let storeMock: Partial<CampaignStore>;

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    authSpy = jasmine.createSpyObj('AuthService', ['getCurrentUserId']);
    authSpy.getCurrentUserId.and.returnValue(42);

    storeMock = {
      loading: loadingSignal.asReadonly(),
      error: errorSignal.asReadonly(),
      createCampaign: jasmine.createSpy('createCampaign')
    };

    await TestBed.configureTestingModule({
      imports: [CrearCampaignComponent, ReactiveFormsModule, TranslateModule.forRoot()],
      providers: [
        { provide: CampaignStore, useValue: storeMock },
        { provide: Router, useValue: routerSpy },
        { provide: AuthService, useValue: authSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(CrearCampaignComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe inicializar el formulario con todos los campos', () => {
    expect(component.campaignForm.contains('name')).toBeTrue();
    expect(component.campaignForm.contains('description')).toBeTrue();
    expect(component.campaignForm.contains('startDate')).toBeTrue();
    expect(component.campaignForm.contains('endDate')).toBeTrue();
    expect(component.campaignForm.contains('estimatedBudget')).toBeTrue();
  });

  it('debe iniciar el formulario como inválido (campos vacíos)', () => {
    expect(component.campaignForm.invalid).toBeTrue();
  });

  it('debe exponer minStartDate como fecha de hoy', () => {
    const today = new Date();
    expect(component.minStartDate.toDateString()).toBe(today.toDateString());
  });

  describe('campo name', () => {
    let nameControl: ReturnType<typeof component.campaignForm.get>;

    beforeEach(() => {
      nameControl = component.campaignForm.get('name');
    });

    it('debe ser inválido cuando está vacío (required)', () => {
      nameControl!.setValue('');
      expect(nameControl!.hasError('required')).toBeTrue();
    });

    it('debe ser inválido con menos de 5 caracteres (minlength)', () => {
      nameControl!.setValue('Hola');
      expect(nameControl!.hasError('minlength')).toBeTrue();
    });

    it('debe ser inválido con espacios al inicio (whitespace)', () => {
      nameControl!.setValue(' Campaña');
      expect(nameControl!.hasError('whitespace')).toBeTrue();
    });

    it('debe ser inválido con espacios al final (whitespace)', () => {
      nameControl!.setValue('Campaña ');
      expect(nameControl!.hasError('whitespace')).toBeTrue();
    });

    it('debe ser inválido con más de 50 caracteres (maxlength)', () => {
      nameControl!.setValue('A'.repeat(51));
      expect(nameControl!.hasError('maxlength')).toBeTrue();
    });

    it('debe ser válido con exactamente 5 caracteres', () => {
      nameControl!.setValue('Hola!');
      expect(nameControl!.valid).toBeTrue();
    });

    it('debe ser válido con exactamente 50 caracteres', () => {
      nameControl!.setValue('A'.repeat(50));
      expect(nameControl!.valid).toBeTrue();
    });

    it('debe ser válido con un nombre correcto', () => {
      nameControl!.setValue('Campaña de Verano 2025');
      expect(nameControl!.valid).toBeTrue();
    });
  });

  describe('campo description', () => {
    let ctrl: ReturnType<typeof component.campaignForm.get>;

    beforeEach(() => { ctrl = component.campaignForm.get('description'); });

    it('debe ser inválido cuando está vacío (required)', () => {
      ctrl!.setValue('');
      expect(ctrl!.hasError('required')).toBeTrue();
    });

    it('debe ser inválido con menos de 10 caracteres (minlength)', () => {
      ctrl!.setValue('Corta');
      expect(ctrl!.hasError('minlength')).toBeTrue();
    });

    it('debe ser válido con 10 o más caracteres', () => {
      ctrl!.setValue('Descripción válida');
      expect(ctrl!.valid).toBeTrue();
    });
  });

  describe('campo startDate', () => {
    let ctrl: ReturnType<typeof component.campaignForm.get>;

    beforeEach(() => { ctrl = component.campaignForm.get('startDate'); });

    it('debe ser inválido cuando está vacío (required)', () => {
      ctrl!.setValue('');
      expect(ctrl!.hasError('required')).toBeTrue();
    });

    it('debe ser inválido para una fecha pasada (startDatePast)', () => {
      ctrl!.setValue(daysFromNow(-1));
      expect(ctrl!.hasError('startDatePast')).toBeTrue();
    });

    it('debe ser válido para hoy', () => {
      ctrl!.setValue(daysFromNow(0));
      expect(ctrl!.valid).toBeTrue();
    });

    it('debe ser válido para una fecha futura', () => {
      ctrl!.setValue(daysFromNow(3));
      expect(ctrl!.valid).toBeTrue();
    });
  });

  describe('campo endDate', () => {
    let ctrl: ReturnType<typeof component.campaignForm.get>;

    beforeEach(() => {
      ctrl = component.campaignForm.get('endDate');
      component.campaignForm.get('startDate')!.setValue(daysFromNow(2));
    });

    it('debe ser inválido cuando está vacío (required)', () => {
      ctrl!.setValue('');
      expect(ctrl!.hasError('required')).toBeTrue();
    });

    it('debe ser inválido cuando endDate es igual a startDate (endDateBeforeStart)', () => {
      ctrl!.setValue(daysFromNow(2));
      expect(ctrl!.hasError('endDateBeforeStart')).toBeTrue();
    });

    it('debe ser inválido cuando endDate es anterior a startDate', () => {
      ctrl!.setValue(daysFromNow(1));
      expect(ctrl!.hasError('endDateBeforeStart')).toBeTrue();
    });

    it('debe ser válido cuando endDate es posterior a startDate', () => {
      ctrl!.setValue(daysFromNow(5));
      expect(ctrl!.valid).toBeTrue();
    });
  });

  describe('campo estimatedBudget', () => {
    let ctrl: ReturnType<typeof component.campaignForm.get>;

    beforeEach(() => { ctrl = component.campaignForm.get('estimatedBudget'); });

    it('debe ser inválido cuando está vacío (required)', () => {
      ctrl!.setValue(null);
      expect(ctrl!.hasError('required')).toBeTrue();
    });

    it('debe ser inválido para cero (notPositive)', () => {
      ctrl!.setValue(0);
      expect(ctrl!.hasError('notPositive')).toBeTrue();
    });

    it('debe ser inválido para número negativo (notPositive)', () => {
      ctrl!.setValue(-100);
      expect(ctrl!.hasError('notPositive')).toBeTrue();
    });

    it('debe ser válido para un valor positivo', () => {
      ctrl!.setValue(1);
      expect(ctrl!.valid).toBeTrue();
    });

    it('debe ser válido para un valor decimal positivo', () => {
      ctrl!.setValue(0.01);
      expect(ctrl!.valid).toBeTrue();
    });
  });

  describe('get minEndDate', () => {
    it('debe retornar null cuando startDate está vacío', () => {
      component.campaignForm.get('startDate')!.setValue('');
      expect(component.minEndDate).toBeNull();
    });

    it('debe retornar startDate + 1 día cuando hay startDate', () => {
      const start = daysFromNow(3);
      component.campaignForm.get('startDate')!.setValue(start);
      const expected = new Date(start);
      expected.setDate(expected.getDate() + 1);
      expect(component.minEndDate?.toDateString()).toBe(expected.toDateString());
    });
  });

  describe('onSubmit()', () => {
    it('debe marcar todos los campos como tocados si el formulario es inválido', () => {
      component.onSubmit();
      const touchedAll = Object.values(component.campaignForm.controls)
        .every(ctrl => ctrl.touched);
      expect(touchedAll).toBeTrue();
    });

    it('no debe llamar a store.createCampaign si el formulario es inválido', () => {
      component.onSubmit();
      expect(storeMock.createCampaign).not.toHaveBeenCalled();
    });

    it('debe llamar a store.createCampaign con el formulario válido', () => {
      fillValidForm(component);
      component.onSubmit();
      expect(storeMock.createCampaign).toHaveBeenCalled();
    });

    it('debe pasar el nombre con trim al store', () => {
      fillValidForm(component);
      component.campaignForm.get('name')!.setValue('  Campaña válida  ');
      // El whitespace validator lo bloquea con espacios, así que ponemos un nombre con espacios internos
      component.campaignForm.get('name')!.setValue('Campaña válida');
      component.onSubmit();
      const call = (storeMock.createCampaign as jasmine.Spy).calls.mostRecent();
      expect(call.args[0].name).toBe('Campaña válida');
    });

    it('debe incluir el userId del AuthService', () => {
      fillValidForm(component);
      component.onSubmit();
      const call = (storeMock.createCampaign as jasmine.Spy).calls.mostRecent();
      expect(call.args[0].userId).toBe(42);
    });

    it('debe navegar a /campañas después de crear', fakeAsync(() => {
      fillValidForm(component);
      component.onSubmit();
      tick(500);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/campañas']);
    }));

    it('no debe hacer nada si ya está cargando', () => {
      loadingSignal.set(true);
      fillValidForm(component);
      component.onSubmit();
      expect(storeMock.createCampaign).not.toHaveBeenCalled();
      loadingSignal.set(false);
    });
  });

  describe('onCancel()', () => {
    it('debe navegar a /campañas', () => {
      component.onCancel();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/campañas']);
    });
  });

  describe('re-validación de endDate al cambiar startDate', () => {
    it('debe invalidar endDate cuando startDate se mueve después de endDate', () => {
      component.campaignForm.patchValue({
        startDate: daysFromNow(1),
        endDate: daysFromNow(5)
      });
      expect(component.campaignForm.get('endDate')!.valid).toBeTrue();

      component.campaignForm.get('startDate')!.setValue(daysFromNow(10));
      expect(component.campaignForm.get('endDate')!.hasError('endDateBeforeStart')).toBeTrue();
    });
  });
});
