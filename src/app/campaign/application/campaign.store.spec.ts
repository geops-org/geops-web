import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CampaignStore } from './campaign.store';
import { CampaignApi } from '../infrastructure/campaign-api';
import { Campaign } from '../domain/model/campaign.entity';
import { CampaignOffer } from '../domain/model/offer.entity';
import { of, throwError } from 'rxjs';

describe('CampaignStore', () => {
  let store: CampaignStore;
  let apiSpy: jasmine.SpyObj<CampaignApi>;

  const mockCampaign: Campaign = {
    id: 1,
    userId: 100,
    name: 'Test Campaign',
    description: 'Test Description',
    startDate: '2026-06-01',
    endDate: '2026-08-31',
    status: 'ACTIVE',
    estimatedBudget: 5000,
    totalImpressions: 3000,
    totalClicks: 40,
    CTR: 1.3,
    createdAt: '2026-05-01T10:00:00Z',
    updatedAt: '2026-05-11T14:30:00Z',
  };

  const mockCampaign2: Campaign = {
    ...mockCampaign,
    id: 2,
    name: 'Test Campaign 2',
    status: 'FINALIZED',
  };

  const mockOffer: CampaignOffer = {
    id: 101,
    campaignId: 1,
    title: 'Test Offer',
    partner: 'Partner Inc',
    price: 9.99,
    originalPrice: 15.99,
    description: '50% off',
    category: 'Food',
    location: 'Downtown',
    latitude: -12.0464,
    longitude: -77.0428,
    imageUrl: 'https://example.com/image.jpg',
    validUntil: '2026-06-30',
    codePrefix: 'TEST',
    createdAt: '2026-05-01T10:00:00Z',
    updatedAt: '2026-05-11T14:30:00Z',
    rating: 4.5,
  };

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('CampaignApi', [
      'getCampaignsByUserId',
      'getCampaignById',
      'createCampaign',
      'updateCampaign',
      'deleteCampaign',
      'getOffersByCampaignId',
      'getOfferById',
      'createOffer',
      'updateOffer',
      'deleteOffer',
      'selectCampaign',
      'clearCampaigns',
      'clearOffers',
      'getCurrentCampaigns',
      'getCurrentSelectedCampaign',
      'getCurrentOffers'
    ]);

    TestBed.configureTestingModule({
      providers: [
        CampaignStore,
        { provide: CampaignApi, useValue: apiSpy }
      ]
    });

    store = TestBed.inject(CampaignStore);
  });

  describe('INITIALIZATION', () => {
    it('debe inicializar con signals vacíos', () => {
      expect(store.campaigns()).toEqual([]);
      expect(store.selectedCampaign()).toBeNull();
      expect(store.campaignOffers()).toEqual([]);
      expect(store.loading()).toBe(false);
      expect(store.error()).toBeNull();
    });

    it('debe inicializar con computed signals correctos', () => {
      expect(store.campaignCount()).toBe(0);
      expect(store.offerCount()).toBe(0);
      expect(store.activeCampaigns()).toEqual([]);
      expect(store.finalizedCampaigns()).toEqual([]);
    });
  });

  describe('SIGNALS - READONLY', () => {
    it('debe retornar readonly signals para campaigns', () => {
      const campaigns = store.campaigns;
      expect(campaigns).toBeDefined();
      expect(typeof campaigns).toBe('function');
      expect(campaigns()).toEqual([]);
    });

    it('debe retornar readonly signals para selectedCampaign', () => {
      const selected = store.selectedCampaign;
      expect(selected).toBeDefined();
      expect(typeof selected).toBe('function');
      expect(selected()).toBeNull();
    });

    it('debe retornar readonly signals para loading', () => {
      const loading = store.loading;
      expect(loading).toBeDefined();
      expect(typeof loading).toBe('function');
      expect(loading()).toBe(false);
    });

    it('debe retornar readonly signals para error', () => {
      const error = store.error;
      expect(error).toBeDefined();
      expect(typeof error).toBe('function');
      expect(error()).toBeNull();
    });
  });

  describe('COMPUTED SIGNALS', () => {
    it('debe calcular campaignCount correctamente', () => {
      (store as any).campaignsSignal.set([mockCampaign, mockCampaign2]);
      expect(store.campaignCount()).toBe(2);
    });

    it('debe calcular offerCount correctamente', () => {
      (store as any).campaignOffersSignal.set([mockOffer]);
      expect(store.offerCount()).toBe(1);
    });

    it('debe filtrar activeCampaigns correctamente', () => {
      (store as any).campaignsSignal.set([mockCampaign, mockCampaign2]);
      const active = store.activeCampaigns();
      expect(active.length).toBe(1);
      expect(active[0].status).toBe('ACTIVE');
    });

    it('debe filtrar finalizedCampaigns correctamente', () => {
      (store as any).campaignsSignal.set([mockCampaign, mockCampaign2]);
      const finalized = store.finalizedCampaigns();
      expect(finalized.length).toBe(1);
      expect(finalized[0].status).toBe('FINALIZED');
    });

    it('debe evaluar isSelectedCampaignActive correctamente', () => {
      (store as any).selectedCampaignSignal.set(mockCampaign);
      expect(store.isSelectedCampaignActive()).toBe(true);

      (store as any).selectedCampaignSignal.set(mockCampaign2);
      expect(store.isSelectedCampaignActive()).toBe(false);
    });

    it('debe evaluar isSelectedCampaignExpired correctamente', () => {
      (store as any).selectedCampaignSignal.set(mockCampaign);
      expect(store.isSelectedCampaignExpired()).toBe(false);

      (store as any).selectedCampaignSignal.set(mockCampaign2);
      expect(store.isSelectedCampaignExpired()).toBe(true);
    });
  });

  describe('CAMPAIGN METHODS', () => {

    describe('getCampaignById', () => {
      it('debe retornar una signal con la campaña encontrada', () => {
        (store as any).campaignsSignal.set([mockCampaign]);
        const signal = store.getCampaignById(1);
        expect(signal()).toEqual(mockCampaign);
      });

      it('debe retornar undefined si no existe la campaña', () => {
        (store as any).campaignsSignal.set([mockCampaign]);
        const signal = store.getCampaignById(999);
        expect(signal()).toBeUndefined();
      });

      it('debe retornar undefined si id es 0 o falsy', () => {
        (store as any).campaignsSignal.set([mockCampaign]);
        const signal = store.getCampaignById(0);
        expect(signal()).toBeUndefined();
      });
    });

    describe('loadCampaignsByUserId', () => {
      it('debe cargar campañas por userId', fakeAsync(() => {
        apiSpy.getCampaignsByUserId.and.returnValue(of([mockCampaign, mockCampaign2]));

        store.loadCampaignsByUserId(100);
        tick();

        expect(store.campaigns().length).toBe(2);
        expect(store.loading()).toBe(false);
        expect(store.error()).toBeNull();
      }));

      it('debe normalizar campañas al cargar', fakeAsync(() => {
        const campaignWithoutCtr: Campaign = { ...mockCampaign, CTR: 0 };
        apiSpy.getCampaignsByUserId.and.returnValue(of([campaignWithoutCtr]));

        store.loadCampaignsByUserId(100);
        tick();

        const loaded = store.campaigns()[0];
        expect(loaded.CTR).toBe(1.3); // Debe recalcular con 40/3000
      }));

      it('debe setear loading true durante la carga', fakeAsync(() => {
        apiSpy.getCampaignsByUserId.and.returnValue(of([mockCampaign]));

        store.loadCampaignsByUserId(100);
        
        tick();
        
        // Después de completar, loading debe ser false
        expect(store.loading()).toBe(false);
        // Campaigns should be loaded
        expect(store.campaigns().length).toBe(1);
      }));

      it('debe manejar errores correctamente', fakeAsync(() => {
        const error = new Error('Network error');
        apiSpy.getCampaignsByUserId.and.returnValue(throwError(() => error));

        store.loadCampaignsByUserId(100);
        tick();

        expect(store.error()).toBeTruthy();
        expect(store.loading()).toBe(false);
      }));
    });

    describe('loadCampaignById', () => {
      it('debe cargar una campaña por ID', fakeAsync(() => {
        apiSpy.getCampaignById.and.returnValue(of(mockCampaign));

        store.loadCampaignById(1);
        tick();

        expect(store.selectedCampaign()).toEqual(jasmine.objectContaining({
          id: 1,
          name: 'Test Campaign'
        }));
        expect(store.loading()).toBe(false);
      }));

      it('debe normalizar la campaña cargada', fakeAsync(() => {
        const campaignWithoutCtr: Campaign = { ...mockCampaign, CTR: 0 };
        apiSpy.getCampaignById.and.returnValue(of(campaignWithoutCtr));

        store.loadCampaignById(1);
        tick();

        expect(store.selectedCampaign()?.CTR).toBe(1.3);
      }));

      it('debe manejar errores al cargar campaña', fakeAsync(() => {
        const error = new Error('Not found');
        apiSpy.getCampaignById.and.returnValue(throwError(() => error));

        store.loadCampaignById(999);
        tick();

        expect(store.error()).toBeTruthy();
        expect(store.selectedCampaign()).toBeNull();
      }));
    });

    describe('createCampaign', () => {
      it('debe crear una nueva campaña', fakeAsync(() => {
        apiSpy.createCampaign.and.returnValue(of(mockCampaign));

        store.createCampaign({ name: 'New Campaign' });
        tick();

        expect(store.campaigns().length).toBe(1);
        expect(store.campaigns()[0].id).toBe(1);
        expect(store.loading()).toBe(false);
      }));

      it('debe normalizar la campaña creada', fakeAsync(() => {
        const campaignWithoutCtr: Campaign = { ...mockCampaign, CTR: 0 };
        apiSpy.createCampaign.and.returnValue(of(campaignWithoutCtr));

        store.createCampaign({} as Partial<Campaign>);
        tick();

        expect(store.campaigns()[0].CTR).toBe(1.3);
      }));

      it('debe agregar a campañas existentes', fakeAsync(() => {
        (store as any).campaignsSignal.set([mockCampaign]);
        apiSpy.createCampaign.and.returnValue(of(mockCampaign2));

        store.createCampaign({} as Partial<Campaign>);
        tick();

        expect(store.campaigns().length).toBe(2);
      }));

      it('debe manejar errores de creación', fakeAsync(() => {
        const error = new Error('Creation failed');
        apiSpy.createCampaign.and.returnValue(throwError(() => error));

        store.createCampaign({} as Partial<Campaign>);
        tick();

        expect(store.error()).toBeTruthy();
        expect(store.campaigns().length).toBe(0);
      }));
    });

    describe('updateCampaign', () => {
      it('debe actualizar una campaña existente', fakeAsync(() => {
        (store as any).campaignsSignal.set([mockCampaign]);
        const updated = { ...mockCampaign, name: 'Updated' };
        apiSpy.updateCampaign.and.returnValue(of(updated));

        store.updateCampaign(1, updated);
        tick();

        expect(store.campaigns()[0].name).toBe('Updated');
        expect(store.loading()).toBe(false);
      }));

      it('debe actualizar selectedCampaign si está seleccionada', fakeAsync(() => {
        (store as any).selectedCampaignSignal.set(mockCampaign);
        const updated = { ...mockCampaign, name: 'Updated' };
        apiSpy.updateCampaign.and.returnValue(of(updated));

        store.updateCampaign(1, updated);
        tick();

        expect(store.selectedCampaign()?.name).toBe('Updated');
      }));

      it('debe manejar errores de actualización', fakeAsync(() => {
        const error = new Error('Update failed');
        apiSpy.updateCampaign.and.returnValue(throwError(() => error));

        store.updateCampaign(1, {});
        tick();

        expect(store.error()).toBeTruthy();
      }));
    });

    describe('deleteCampaign', () => {
      it('debe eliminar una campaña', fakeAsync(() => {
        (store as any).campaignsSignal.set([mockCampaign, mockCampaign2]);
        apiSpy.deleteCampaign.and.returnValue(of(void 0));

        store.deleteCampaign(1);
        tick();

        expect(store.campaigns().length).toBe(1);
        expect(store.campaigns()[0].id).toBe(2);
      }));

      it('debe limpiar selectedCampaign si se elimina la seleccionada', fakeAsync(() => {
        (store as any).selectedCampaignSignal.set(mockCampaign);
        apiSpy.deleteCampaign.and.returnValue(of(void 0));

        store.deleteCampaign(1);
        tick();

        expect(store.selectedCampaign()).toBeNull();
      }));

      it('debe manejar errores de eliminación', fakeAsync(() => {
        const error = new Error('Delete failed');
        apiSpy.deleteCampaign.and.returnValue(throwError(() => error));

        store.deleteCampaign(1);
        tick();

        expect(store.error()).toBeTruthy();
      }));
    });

    describe('selectCampaign', () => {
      it('debe seleccionar una campaña y cargar sus ofertas', fakeAsync(() => {
        apiSpy.getOffersByCampaignId.and.returnValue(of([mockOffer]));

        store.selectCampaign(mockCampaign);
        tick();

        expect(store.selectedCampaign()).toEqual(jasmine.objectContaining({
          id: mockCampaign.id,
          name: mockCampaign.name
        }));
        expect(apiSpy.getOffersByCampaignId).toHaveBeenCalledWith(1);
      }));

      it('debe limpiar offers al seleccionar null', () => {
        (store as any).campaignOffersSignal.set([mockOffer]);

        store.selectCampaign(null);

        expect(store.selectedCampaign()).toBeNull();
        expect(store.campaignOffers()).toEqual([]);
      });

      it('debe normalizar la campaña seleccionada', () => {
        apiSpy.getOffersByCampaignId.and.returnValue(of([]));
        const campaignWithoutCtr: Campaign = { ...mockCampaign, CTR: 0 };

        store.selectCampaign(campaignWithoutCtr);

        expect(store.selectedCampaign()?.CTR).toBe(1.3);
      });
    });

    describe('clearSelection', () => {
      it('debe limpiar selectedCampaign y offers', () => {
        (store as any).selectedCampaignSignal.set(mockCampaign);
        (store as any).campaignOffersSignal.set([mockOffer]);

        store.clearSelection();

        expect(store.selectedCampaign()).toBeNull();
        expect(store.campaignOffers()).toEqual([]);
      });
    });
  });

  describe('OFFER METHODS', () => {

    describe('getOfferById', () => {
      it('debe retornar una signal con la oferta encontrada', () => {
        (store as any).campaignOffersSignal.set([mockOffer]);
        const signal = store.getOfferById(101);
        expect(signal()).toEqual(mockOffer);
      });

      it('debe retornar undefined si no existe la oferta', () => {
        (store as any).campaignOffersSignal.set([mockOffer]);
        const signal = store.getOfferById(999);
        expect(signal()).toBeUndefined();
      });
    });

    describe('loadOffersByCampaignId', () => {
      it('debe cargar ofertas por campaignId', fakeAsync(() => {
        apiSpy.getOffersByCampaignId.and.returnValue(of([mockOffer]));

        store.loadOffersByCampaignId(1);
        tick();

        expect(store.campaignOffers().length).toBe(1);
        expect(store.loading()).toBe(false);
      }));

      it('debe retornar sin hacer nada si campaignId es inválido', () => {
        store.loadOffersByCampaignId(0);
        expect(apiSpy.getOffersByCampaignId).not.toHaveBeenCalled();
      });

      it('debe retornar sin hacer nada si campaignId no es finito', () => {
        store.loadOffersByCampaignId(Infinity);
        expect(apiSpy.getOffersByCampaignId).not.toHaveBeenCalled();
      });

      it('debe manejar errores al cargar ofertas', fakeAsync(() => {
        const error = new Error('Error');
        apiSpy.getOffersByCampaignId.and.returnValue(throwError(() => error));

        store.loadOffersByCampaignId(1);
        tick();

        expect(store.error()).toBeTruthy();
      }));
    });

    describe('createOffer', () => {
      it('debe crear una nueva oferta', fakeAsync(() => {
        apiSpy.createOffer.and.returnValue(of(mockOffer));

        store.createOffer({ title: 'New Offer' });
        tick();

        expect(store.campaignOffers().length).toBe(1);
        expect(store.loading()).toBe(false);
      }));

      it('debe agregar a ofertas existentes', fakeAsync(() => {
        (store as any).campaignOffersSignal.set([mockOffer]);
        const offer2 = { ...mockOffer, id: 102 };
        apiSpy.createOffer.and.returnValue(of(offer2));

        store.createOffer({} as Partial<CampaignOffer>);
        tick();

        expect(store.campaignOffers().length).toBe(2);
      }));
    });

    describe('updateOffer', () => {
      it('debe actualizar una oferta existente', fakeAsync(() => {
        (store as any).campaignOffersSignal.set([mockOffer]);
        const updated = { ...mockOffer, title: 'Updated' };
        apiSpy.updateOffer.and.returnValue(of(updated));

        store.updateOffer(101, updated);
        tick();

        expect(store.campaignOffers()[0].title).toBe('Updated');
      }));
    });

    describe('deleteOffer', () => {
      it('debe eliminar una oferta', fakeAsync(() => {
        const offer2 = { ...mockOffer, id: 102 };
        (store as any).campaignOffersSignal.set([mockOffer, offer2]);
        apiSpy.deleteOffer.and.returnValue(of(void 0));

        store.deleteOffer(101);
        tick();

        expect(store.campaignOffers().length).toBe(1);
        expect(store.campaignOffers()[0].id).toBe(102);
      }));
    });
  });

  describe('UTILITY METHODS', () => {

    describe('calculateCampaignMetrics', () => {
      it('debe retornar métricas correctas', () => {
        const metrics = store.calculateCampaignMetrics(mockCampaign);

        expect(metrics.impressions).toBe(3000);
        expect(metrics.clicks).toBe(40);
        expect(metrics.ctr).toBe(1.3);
      });

      it('debe retornar CTR 0 cuando no hay impresiones', () => {
        const campaign: Campaign = { ...mockCampaign, totalImpressions: 0 };
        const metrics = store.calculateCampaignMetrics(campaign);

        expect(metrics.ctr).toBe(0);
      });
    });

    describe('isActive', () => {
      it('debe retornar true para campañas ACTIVE', () => {
        expect(store.isActive(mockCampaign)).toBe(true);
      });

      it('debe retornar false para campañas FINALIZED', () => {
        expect(store.isActive(mockCampaign2)).toBe(false);
      });
    });

    describe('isExpired', () => {
      it('debe retornar false para campañas con fecha futura', () => {
        const futureCampaign: Campaign = {
          ...mockCampaign,
          endDate: new Date(Date.now() + 1000000).toISOString(),
        };

        expect(store.isExpired(futureCampaign)).toBe(false);
      });

      it('debe retornar true para campañas con fecha pasada', () => {
        const pastCampaign: Campaign = {
          ...mockCampaign,
          endDate: new Date(Date.now() - 1000000).toISOString(),
        };

        expect(store.isExpired(pastCampaign)).toBe(true);
      });

      it('debe retornar true para campañas FINALIZED', () => {
        expect(store.isExpired(mockCampaign2)).toBe(true);
      });
    });
  });

  describe('ERROR FORMATTING', () => {
    it('debe formatear errores de Resource not found', (done) => {
      const error = new Error('Resource not found');
      apiSpy.getCampaignsByUserId.and.returnValue(throwError(() => error));

      store.loadCampaignsByUserId(100);

      setTimeout(() => {
        expect(store.error()).toContain('Not found');
        done();
      }, 100);
    });

    it('debe usar mensaje de fallback para errores genéricos', (done) => {
      const error = new Error('Generic error');
      apiSpy.getCampaignsByUserId.and.returnValue(throwError(() => error));

      store.loadCampaignsByUserId(100);

      setTimeout(() => {
        expect(store.error()).toBeTruthy();
        done();
      }, 100);
    });

    it('debe manejar errores no Error', (done) => {
      apiSpy.getCampaignsByUserId.and.returnValue(throwError(() => 'String error'));

      store.loadCampaignsByUserId(100);

      setTimeout(() => {
        expect(store.error()).toBe('Failed to load campaigns');
        done();
      }, 100);
    });
  });
});
