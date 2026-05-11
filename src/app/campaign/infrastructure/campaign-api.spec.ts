import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CampaignApi } from './campaign-api';
import { Campaign } from '../domain/model/campaign.entity';
import { CampaignOffer } from '../domain/model/offer.entity';
import { of, throwError } from 'rxjs';
import { CampaignApiEndpoint } from './campaign-api-endpoint';

describe('CampaignApi', () => {
  let service: CampaignApi;
  let httpMock: HttpTestingController;
  let endpointSpy: jasmine.SpyObj<CampaignApiEndpoint>;

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
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CampaignApi]
    });

    service = TestBed.inject(CampaignApi);
    httpMock = TestBed.inject(HttpTestingController);

    // Espiar el endpoint privado
    endpointSpy = jasmine.createSpyObj('CampaignApiEndpoint', [
      'getByUserId',
      'getById',
      'createCampaign',
      'updateCampaign',
      'deleteCampaign',
      'getOffersByCampaignId',
      'getOfferById',
      'createOffer',
      'updateOffer',
      'deleteOffer'
    ]);

    // Inyectar el spy en el servicio
    (service as any).endpoint = endpointSpy;
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('CAMPAIGN OPERATIONS', () => {

    describe('getCampaignsByUserId', () => {
      it('debe obtener campañas por userId', (done) => {
        const userId = 100;
        const campaigns = [mockCampaign, mockCampaign2];

        endpointSpy.getByUserId.and.returnValue(of(campaigns));

        service.getCampaignsByUserId(userId).subscribe(result => {
          expect(result).toEqual(campaigns);
          expect(result.length).toBe(2);
          done();
        });
      });

      it('debe actualizar campaignsSubject cuando obtiene campañas', (done) => {
        const userId = 100;
        const campaigns = [mockCampaign];

        endpointSpy.getByUserId.and.returnValue(of(campaigns));

        service.getCampaignsByUserId(userId).subscribe(() => {
          service.campaigns$.subscribe(result => {
            expect(result).toEqual(campaigns);
            done();
          });
        });
      });

      it('debe retornar array vacío en caso de error', (done) => {
        const userId = 100;
        endpointSpy.getByUserId.and.returnValue(throwError(() => new Error('Network error')));

        service.getCampaignsByUserId(userId).subscribe(result => {
          expect(result).toEqual([]);
          done();
        });
      });
    });

    describe('getCampaignById', () => {
      it('debe obtener una campaña por ID', (done) => {
        endpointSpy.getById.and.returnValue(of(mockCampaign));

        service.getCampaignById(1).subscribe(result => {
          expect(result).toEqual(mockCampaign);
          expect(result.id).toBe(1);
          done();
        });
      });

      it('debe actualizar selectedCampaignSubject cuando obtiene una campaña', (done) => {
        endpointSpy.getById.and.returnValue(of(mockCampaign));

        service.getCampaignById(1).subscribe(() => {
          service.selectedCampaign$.subscribe(result => {
            expect(result).toEqual(mockCampaign);
            done();
          });
        });
      });

      it('debe lanzar error si la campaña no existe', (done) => {
        const error = new Error('Campaign not found');
        endpointSpy.getById.and.returnValue(throwError(() => error));

        service.getCampaignById(999).subscribe({
          error: (err) => {
            expect(err).toEqual(error);
            done();
          }
        });
      });
    });

    describe('createCampaign', () => {
      it('debe crear una nueva campaña', (done) => {
        const newCampaign: Partial<Campaign> = {
          userId: 100,
          name: 'New Campaign',
          description: 'New Description',
          startDate: '2026-06-01',
          endDate: '2026-08-31',
          status: 'ACTIVE',
          estimatedBudget: 5000,
        };

        endpointSpy.createCampaign.and.returnValue(of(mockCampaign));

        service.createCampaign(newCampaign).subscribe(result => {
          expect(result).toEqual(mockCampaign);
          expect(result.id).toBeDefined();
          done();
        });
      });

      it('debe agregar la nueva campaña a campaignsSubject', (done) => {
        // Primero setear una campaña existente
        (service as any).campaignsSubject.next([mockCampaign]);

        endpointSpy.createCampaign.and.returnValue(of(mockCampaign2));

        service.createCampaign({} as Partial<Campaign>).subscribe(() => {
          service.campaigns$.subscribe(result => {
            expect(result.length).toBe(2);
            expect(result[1]).toEqual(mockCampaign2);
            done();
          });
        });
      });

      it('debe lanzar error si falla la creación', (done) => {
        const error = new Error('Creation failed');
        endpointSpy.createCampaign.and.returnValue(throwError(() => error));

        service.createCampaign({} as Partial<Campaign>).subscribe({
          error: (err) => {
            expect(err).toEqual(error);
            done();
          }
        });
      });
    });

    describe('updateCampaign', () => {
      it('debe actualizar una campaña', (done) => {
        const updatedCampaign: Campaign = {
          ...mockCampaign,
          name: 'Updated Campaign',
        };

        endpointSpy.updateCampaign.and.returnValue(of(updatedCampaign));

        service.updateCampaign(1, updatedCampaign).subscribe(result => {
          expect(result.name).toBe('Updated Campaign');
          done();
        });
      });

      it('debe actualizar la campaña en campaignsSubject', (done) => {
        (service as any).campaignsSubject.next([mockCampaign]);

        const updatedCampaign: Campaign = {
          ...mockCampaign,
          name: 'Updated Campaign',
        };

        endpointSpy.updateCampaign.and.returnValue(of(updatedCampaign));

        service.updateCampaign(1, updatedCampaign).subscribe(() => {
          service.campaigns$.subscribe(result => {
            expect(result[0].name).toBe('Updated Campaign');
            done();
          });
        });
      });

      it('debe actualizar selectedCampaignSubject si la campaña está seleccionada', (done) => {
        (service as any).selectedCampaignSubject.next(mockCampaign);

        const updatedCampaign: Campaign = {
          ...mockCampaign,
          name: 'Updated Campaign',
        };

        endpointSpy.updateCampaign.and.returnValue(of(updatedCampaign));

        service.updateCampaign(1, updatedCampaign).subscribe(() => {
          service.selectedCampaign$.subscribe(result => {
            expect(result?.name).toBe('Updated Campaign');
            done();
          });
        });
      });

      it('debe lanzar error si falla la actualización', (done) => {
        const error = new Error('Update failed');
        endpointSpy.updateCampaign.and.returnValue(throwError(() => error));

        service.updateCampaign(1, {} as Partial<Campaign>).subscribe({
          error: (err) => {
            expect(err).toEqual(error);
            done();
          }
        });
      });
    });

    describe('deleteCampaign', () => {
      it('debe eliminar una campaña', (done) => {
        endpointSpy.deleteCampaign.and.returnValue(of(void 0));

        service.deleteCampaign(1).subscribe(() => {
          expect(endpointSpy.deleteCampaign).toHaveBeenCalledWith(1);
          done();
        });
      });

      it('debe remover la campaña de campaignsSubject', (done) => {
        (service as any).campaignsSubject.next([mockCampaign, mockCampaign2]);

        endpointSpy.deleteCampaign.and.returnValue(of(void 0));

        service.deleteCampaign(1).subscribe(() => {
          service.campaigns$.subscribe(result => {
            expect(result.length).toBe(1);
            expect(result[0].id).toBe(2);
            done();
          });
        });
      });

      it('debe limpiar selectedCampaignSubject si se elimina la campaña seleccionada', (done) => {
        (service as any).selectedCampaignSubject.next(mockCampaign);

        endpointSpy.deleteCampaign.and.returnValue(of(void 0));

        service.deleteCampaign(1).subscribe(() => {
          service.selectedCampaign$.subscribe(result => {
            expect(result).toBeNull();
            done();
          });
        });
      });

      it('debe lanzar error si falla la eliminación', (done) => {
        const error = new Error('Delete failed');
        endpointSpy.deleteCampaign.and.returnValue(throwError(() => error));

        service.deleteCampaign(1).subscribe({
          error: (err) => {
            expect(err).toEqual(error);
            done();
          }
        });
      });
    });
  });

  describe('OFFER OPERATIONS', () => {

    describe('getOffersByCampaignId', () => {
      it('debe obtener ofertas por campaignId', (done) => {
        endpointSpy.getOffersByCampaignId.and.returnValue(of([mockOffer]));

        service.getOffersByCampaignId(1).subscribe(result => {
          expect(result).toEqual([mockOffer]);
          expect(result.length).toBe(1);
          done();
        });
      });

      it('debe actualizar campaignOffersSubject', (done) => {
        endpointSpy.getOffersByCampaignId.and.returnValue(of([mockOffer]));

        service.getOffersByCampaignId(1).subscribe(() => {
          service.campaignOffers$.subscribe(result => {
            expect(result).toEqual([mockOffer]);
            done();
          });
        });
      });

      it('debe retornar array vacío en caso de error', (done) => {
        endpointSpy.getOffersByCampaignId.and.returnValue(throwError(() => new Error('Error')));

        service.getOffersByCampaignId(1).subscribe(result => {
          expect(result).toEqual([]);
          done();
        });
      });
    });

    describe('getOfferById', () => {
      it('debe obtener una oferta por ID', (done) => {
        endpointSpy.getOfferById.and.returnValue(of(mockOffer));

        service.getOfferById(101).subscribe(result => {
          expect(result).toEqual(mockOffer);
          done();
        });
      });

      it('debe lanzar error si la oferta no existe', (done) => {
        const error = new Error('Offer not found');
        endpointSpy.getOfferById.and.returnValue(throwError(() => error));

        service.getOfferById(999).subscribe({
          error: (err) => {
            expect(err).toEqual(error);
            done();
          }
        });
      });
    });

    describe('createOffer', () => {
      it('debe crear una nueva oferta', (done) => {
        endpointSpy.createOffer.and.returnValue(of(mockOffer));

        service.createOffer({} as Partial<CampaignOffer>).subscribe(result => {
          expect(result).toEqual(mockOffer);
          done();
        });
      });

      it('debe agregar la oferta a campaignOffersSubject', (done) => {
        (service as any).campaignOffersSubject.next([mockOffer]);

        const newOffer: CampaignOffer = { ...mockOffer, id: 102 };
        endpointSpy.createOffer.and.returnValue(of(newOffer));

        service.createOffer({} as Partial<CampaignOffer>).subscribe(() => {
          service.campaignOffers$.subscribe(result => {
            expect(result.length).toBe(2);
            expect(result[1].id).toBe(102);
            done();
          });
        });
      });
    });

    describe('updateOffer', () => {
      it('debe actualizar una oferta', (done) => {
        const updatedOffer: CampaignOffer = { ...mockOffer, title: 'Updated' };
        endpointSpy.updateOffer.and.returnValue(of(updatedOffer));

        service.updateOffer(101, updatedOffer).subscribe(result => {
          expect(result.title).toBe('Updated');
          done();
        });
      });

      it('debe actualizar la oferta en campaignOffersSubject', (done) => {
        (service as any).campaignOffersSubject.next([mockOffer]);

        const updatedOffer: CampaignOffer = { ...mockOffer, title: 'Updated' };
        endpointSpy.updateOffer.and.returnValue(of(updatedOffer));

        service.updateOffer(101, updatedOffer).subscribe(() => {
          service.campaignOffers$.subscribe(result => {
            expect(result[0].title).toBe('Updated');
            done();
          });
        });
      });
    });

    describe('deleteOffer', () => {
      it('debe eliminar una oferta', (done) => {
        endpointSpy.deleteOffer.and.returnValue(of(void 0));

        service.deleteOffer(101).subscribe(() => {
          expect(endpointSpy.deleteOffer).toHaveBeenCalledWith(101);
          done();
        });
      });

      it('debe remover la oferta de campaignOffersSubject', (done) => {
        const offer2: CampaignOffer = { ...mockOffer, id: 102 };
        (service as any).campaignOffersSubject.next([mockOffer, offer2]);

        endpointSpy.deleteOffer.and.returnValue(of(void 0));

        service.deleteOffer(101).subscribe(() => {
          service.campaignOffers$.subscribe(result => {
            expect(result.length).toBe(1);
            expect(result[0].id).toBe(102);
            done();
          });
        });
      });
    });
  });

  describe('STATE MANAGEMENT', () => {

    describe('selectCampaign', () => {
      it('debe establecer la campaña seleccionada', (done) => {
        service.selectCampaign(mockCampaign);

        service.selectedCampaign$.subscribe(result => {
          expect(result).toEqual(mockCampaign);
          done();
        });
      });

      it('debe permitir establecer null como campaña seleccionada', (done) => {
        service.selectCampaign(mockCampaign);
        service.selectCampaign(null);

        service.selectedCampaign$.subscribe(result => {
          expect(result).toBeNull();
          done();
        });
      });
    });

    describe('clearCampaigns', () => {
      it('debe limpiar todas las campañas', (done) => {
        (service as any).campaignsSubject.next([mockCampaign, mockCampaign2]);
        service.clearCampaigns();

        service.campaigns$.subscribe(result => {
          expect(result).toEqual([]);
          done();
        });
      });
    });

    describe('clearOffers', () => {
      it('debe limpiar todas las ofertas', (done) => {
        (service as any).campaignOffersSubject.next([mockOffer]);
        service.clearOffers();

        service.campaignOffers$.subscribe(result => {
          expect(result).toEqual([]);
          done();
        });
      });
    });

    describe('getCurrentCampaigns', () => {
      it('debe retornar campañas actuales sincronamente', () => {
        const campaigns = [mockCampaign, mockCampaign2];
        (service as any).campaignsSubject.next(campaigns);

        const result = service.getCurrentCampaigns();

        expect(result).toEqual(campaigns);
        expect(result.length).toBe(2);
      });

      it('debe retornar array vacío si no hay campañas', () => {
        const result = service.getCurrentCampaigns();
        expect(result).toEqual([]);
      });
    });

    describe('getCurrentSelectedCampaign', () => {
      it('debe retornar la campaña seleccionada sincronamente', () => {
        (service as any).selectedCampaignSubject.next(mockCampaign);

        const result = service.getCurrentSelectedCampaign();

        expect(result).toEqual(mockCampaign);
      });

      it('debe retornar null si no hay campaña seleccionada', () => {
        const result = service.getCurrentSelectedCampaign();
        expect(result).toBeNull();
      });
    });

    describe('getCurrentOffers', () => {
      it('debe retornar ofertas actuales sincronamente', () => {
        const offers = [mockOffer];
        (service as any).campaignOffersSubject.next(offers);

        const result = service.getCurrentOffers();

        expect(result).toEqual(offers);
      });

      it('debe retornar array vacío si no hay ofertas', () => {
        const result = service.getCurrentOffers();
        expect(result).toEqual([]);
      });
    });
  });
});
