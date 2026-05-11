import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

import { EditCampaignComponent } from './edit-campaign.component';
import { CampaignStore } from '../../../application/campaign.store';
import { Campaign } from '../../../domain/model/campaign.entity';
import { CampaignOffer } from '../../../domain/model/offer.entity';

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function makeCampaign(overrides: Partial<Campaign> = {}): Campaign {
  return {
    id: 1,
    userId: 42,
    name: 'Campaña de Prueba',
    description: 'Descripción válida de la campaña de prueba',
    startDate: daysFromNow(-5).toISOString(),
    endDate: daysFromNow(10).toISOString(),
    status: 'ACTIVE',
    estimatedBudget: 1000,
    totalImpressions: 0,
    totalClicks: 0,
    CTR: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  };
}

describe('EditCampaignComponent', () => {
  let component: EditCampaignComponent;
  let fixture: ComponentFixture<EditCampaignComponent>;
  let routerSpy: jasmine.SpyObj<Router>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  const loadingSignal = signal(false);
  const errorSignal = signal<string | null>(null);
  const selectedCampaignSignal = signal<Campaign | null>(null);
  const campaignOffersSignal = signal<CampaignOffer[]>([]);

  let storeMock: Partial<CampaignStore>;

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    storeMock = {
      loading: loadingSignal.asReadonly(),
      error: errorSignal.asReadonly(),
      selectedCampaign: selectedCampaignSignal.asReadonly(),
      campaignOffers: campaignOffersSignal.asReadonly(),
      loadCampaignById: jasmine.createSpy('loadCampaignById'),
      loadOffersByCampaignId: jasmine.createSpy('loadOffersByCampaignId'),
      updateCampaign: jasmine.createSpy('updateCampaign'),
      createOffer: jasmine.createSpy('createOffer'),
      updateOffer: jasmine.createSpy('updateOffer'),
      deleteOffer: jasmine.createSpy('deleteOffer')
    };

    await TestBed.configureTestingModule({
      imports: [EditCampaignComponent, ReactiveFormsModule, TranslateModule.forRoot()],
      providers: [
        { provide: CampaignStore, useValue: storeMock },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: { params: of({ id: '1' }) } },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: MatDialog, useValue: dialogSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(EditCampaignComponent);
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
    expect(component.campaignForm.contains('status')).toBeTrue();
  });

  it('debe cargar la campaña y las ofertas al inicializar (ngOnInit)', () => {
    expect(storeMock.loadCampaignById).toHaveBeenCalledWith(1);
    expect(storeMock.loadOffersByCampaignId).toHaveBeenCalledWith(1);
  });

  describe('campo startDate (sin validación de pasado)', () => {
    it('debe ser inválido cuando está vacío', () => {
      component.campaignForm.get('startDate')!.setValue('');
      expect(component.campaignForm.get('startDate')!.hasError('required')).toBeTrue();
    });

    it('debe aceptar una fecha pasada (campaña ya iniciada)', () => {
      component.campaignForm.get('startDate')!.setValue(daysFromNow(-30));
      expect(component.campaignForm.get('startDate')!.hasError('startDatePast')).toBeFalse();
      expect(component.campaignForm.get('startDate')!.valid).toBeTrue();
    });
  });

  describe('campo name', () => {
    let ctrl: ReturnType<typeof component.campaignForm.get>;
    beforeEach(() => { ctrl = component.campaignForm.get('name'); });

    it('debe ser inválido cuando está vacío (required)', () => {
      ctrl!.setValue('');
      expect(ctrl!.hasError('required')).toBeTrue();
    });

    it('debe ser inválido con menos de 5 caracteres (minlength)', () => {
      ctrl!.setValue('Hi');
      expect(ctrl!.hasError('minlength')).toBeTrue();
    });

    it('debe ser inválido con espacios al inicio (whitespace)', () => {
      ctrl!.setValue(' Nombre');
      expect(ctrl!.hasError('whitespace')).toBeTrue();
    });

    it('debe ser inválido con más de 50 caracteres (maxlength)', () => {
      ctrl!.setValue('X'.repeat(51));
      expect(ctrl!.hasError('maxlength')).toBeTrue();
    });

    it('debe ser válido con un nombre correcto', () => {
      ctrl!.setValue('Campaña Válida');
      expect(ctrl!.valid).toBeTrue();
    });
  });

  describe('campo estimatedBudget', () => {
    let ctrl: ReturnType<typeof component.campaignForm.get>;
    beforeEach(() => { ctrl = component.campaignForm.get('estimatedBudget'); });

    it('debe ser inválido para cero (notPositive)', () => {
      ctrl!.setValue(0);
      expect(ctrl!.hasError('notPositive')).toBeTrue();
    });

    it('debe ser inválido para número negativo', () => {
      ctrl!.setValue(-50);
      expect(ctrl!.hasError('notPositive')).toBeTrue();
    });

    it('debe ser válido para número positivo', () => {
      ctrl!.setValue(250);
      expect(ctrl!.valid).toBeTrue();
    });
  });

  describe('campo endDate', () => {
    beforeEach(() => {
      component.campaignForm.get('startDate')!.setValue(daysFromNow(1));
    });

    it('debe ser inválido cuando endDate es igual a startDate', () => {
      component.campaignForm.get('endDate')!.setValue(daysFromNow(1));
      expect(component.campaignForm.get('endDate')!.hasError('endDateBeforeStart')).toBeTrue();
    });

    it('debe ser válido cuando endDate es posterior a startDate', () => {
      component.campaignForm.get('endDate')!.setValue(daysFromNow(7));
      expect(component.campaignForm.get('endDate')!.valid).toBeTrue();
    });
  });

  describe('get minEndDate', () => {
    it('debe retornar null cuando startDate está vacío', () => {
      component.campaignForm.get('startDate')!.setValue('');
      expect(component.minEndDate).toBeNull();
    });

    it('debe retornar startDate + 1 día', () => {
      const start = daysFromNow(3);
      component.campaignForm.get('startDate')!.setValue(start);
      const expected = new Date(start);
      expected.setDate(expected.getDate() + 1);
      expect(component.minEndDate?.toDateString()).toBe(expected.toDateString());
    });
  });

  describe('get isCampaignActive', () => {
    it('debe retornar true cuando status es ACTIVE', () => {
      component.campaignForm.get('status')!.setValue('ACTIVE');
      expect(component.isCampaignActive).toBeTrue();
    });

    it('debe retornar false cuando status es PAUSED', () => {
      component.campaignForm.get('status')!.setValue('PAUSED');
      expect(component.isCampaignActive).toBeFalse();
    });

    it('debe retornar false cuando status es FINALIZED', () => {
      component.campaignForm.get('status')!.setValue('FINALIZED');
      expect(component.isCampaignActive).toBeFalse();
    });
  });

  describe('get canDisplayOfferForm', () => {
    it('debe retornar false cuando showOfferForm es false', () => {
      component.showOfferForm = false;
      component.campaignForm.get('status')!.setValue('ACTIVE');
      expect(component.canDisplayOfferForm).toBeFalse();
    });

    it('debe retornar true cuando campaña ACTIVE y showOfferForm es true', () => {
      component.campaignForm.get('status')!.setValue('ACTIVE');
      component.showOfferForm = true;
      expect(component.canDisplayOfferForm).toBeTrue();
    });

    it('debe retornar false cuando campaña PAUSED y no hay oferta en edición', () => {
      component.campaignForm.get('status')!.setValue('PAUSED');
      component.showOfferForm = true;
      component.editingOffer = undefined;
      expect(component.canDisplayOfferForm).toBeFalse();
    });

    it('debe retornar true cuando campaña PAUSED pero hay oferta en edición', () => {
      component.campaignForm.get('status')!.setValue('PAUSED');
      component.showOfferForm = true;
      component.editingOffer = { id: 99 } as CampaignOffer;
      expect(component.canDisplayOfferForm).toBeTrue();
    });
  });

  describe('populateForm()', () => {
    it('debe rellenar el formulario con los datos de la campaña', () => {
      const campaign = makeCampaign({ name: 'Campaña Test', status: 'PAUSED', estimatedBudget: 750 });
      component.populateForm(campaign);

      expect(component.campaignForm.get('name')!.value).toBe('Campaña Test');
      expect(component.campaignForm.get('status')!.value).toBe('PAUSED');
      expect(component.campaignForm.get('estimatedBudget')!.value).toBe(750);
    });
  });

  describe('onSubmit()', () => {
    it('debe marcar todos los campos como tocados si el formulario es inválido', () => {
      component.onSubmit();
      const allTouched = Object.values(component.campaignForm.controls)
        .every(ctrl => ctrl.touched);
      expect(allTouched).toBeTrue();
    });

    it('no debe llamar a updateCampaign si el formulario es inválido', () => {
      component.onSubmit();
      expect(storeMock.updateCampaign).not.toHaveBeenCalled();
    });

    it('debe llamar a updateCampaign con formulario válido y campaña cargada', () => {
      selectedCampaignSignal.set(makeCampaign());
      fixture.detectChanges();

      component.campaignForm.patchValue({
        name: 'Nombre Válido',
        description: 'Descripción válida y larga de la campaña',
        startDate: daysFromNow(-5),
        endDate: daysFromNow(10),
        estimatedBudget: 500,
        status: 'ACTIVE'
      });

      component.onSubmit();
      expect(storeMock.updateCampaign).toHaveBeenCalledWith(
        component.campaignId,
        jasmine.objectContaining({ name: 'Nombre Válido', status: 'ACTIVE' })
      );
    });

    it('debe pasar el nombre con trim al store', () => {
      selectedCampaignSignal.set(makeCampaign());
      fixture.detectChanges();

      component.campaignForm.patchValue({
        name: 'Nombre válido',
        description: 'Descripción válida y larga de la campaña',
        startDate: daysFromNow(-5),
        endDate: daysFromNow(10),
        estimatedBudget: 100,
        status: 'ACTIVE'
      });

      component.onSubmit();
      const call = (storeMock.updateCampaign as jasmine.Spy).calls.mostRecent();
      expect(call.args[1].name).toBe('Nombre válido');
    });
  });

  describe('onCancel()', () => {
    it('debe navegar a /resumen', () => {
      component.onCancel();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/resumen']);
    });
  });

  describe('onShowOfferForm() / onHideOfferForm()', () => {
    it('debe mostrar el formulario solo si la campaña está ACTIVE', () => {
      component.campaignForm.get('status')!.setValue('ACTIVE');
      component.onShowOfferForm();
      expect(component.showOfferForm).toBeTrue();
    });

    it('no debe mostrar el formulario si la campaña está PAUSED', () => {
      component.campaignForm.get('status')!.setValue('PAUSED');
      component.onShowOfferForm();
      expect(component.showOfferForm).toBeFalse();
    });

    it('debe ocultar el formulario y limpiar editingOffer', () => {
      component.showOfferForm = true;
      component.editingOffer = { id: 1 } as CampaignOffer;
      component.onHideOfferForm();
      expect(component.showOfferForm).toBeFalse();
      expect(component.editingOffer).toBeUndefined();
    });
  });
});
