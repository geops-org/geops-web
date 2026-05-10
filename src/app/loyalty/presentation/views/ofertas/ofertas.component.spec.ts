import { of } from 'rxjs';
import { OfertasComponent } from '../ofertas/ofertas.component';

describe('pruebaunitariaUS05', () => {
  it('filtra la lista usando la categoría seleccionada', () => {
    const mockRoute = { queryParams: of({}) } as any;
    const mockRouter = { navigate: jasmine.createSpy('navigate') } as any;
    const mockOffersApi = {
      recordCampaignClick: jasmine.createSpy('recordCampaignClick'),
    } as any;
    const mockAuthService = {
      getCurrentUser: jasmine.createSpy('getCurrentUser').and.returnValue({ id: 1 }),
      getCurrentUserId: jasmine.createSpy('getCurrentUserId').and.returnValue(1),
    } as any;

    const component = new OfertasComponent(mockRoute, mockRouter, mockOffersApi, mockAuthService);

    component.all = [
      {
        id: 1,
        title: 'Oferta A',
        partner: 'Partner A',
        category: 'Comida China',
        location: 'San Borja',
        price: 10,
        rating: 4,
        campaignId: 1,
      } as any,
      {
        id: 2,
        title: 'Oferta B',
        partner: 'Partner B',
        category: 'Belleza',
        location: 'Lince',
        price: 20,
        rating: 3,
        campaignId: 2,
      } as any,
      {
        id: 3,
        title: 'Oferta C',
        partner: 'Partner C',
        category: 'Comida China',
        location: 'Miraflores',
        price: 15,
        rating: 5,
        campaignId: 3,
      } as any,
    ];

    component.selectCategory('Comida China');

    expect(component.filtered.length).toBe(2);
    expect(component.filtered.every(o => o.category === 'Comida China')).toBeTrue();
    expect(component.filtered.find(o => o.category === 'Belleza')).toBeUndefined();
  });
});

describe('PrubaUnitariaUS06', () => {
  it('registra el click de la oferta con el campaignId', () => {
    const mockRoute = { queryParams: of({}) } as any;
    const mockRouter = { navigate: jasmine.createSpy('navigate') } as any;
    const mockOffersApi = {
      recordCampaignClick: jasmine.createSpy('recordCampaignClick'),
    } as any;
    const mockAuthService = {
      getCurrentUser: jasmine.createSpy('getCurrentUser').and.returnValue({ id: 1 }),
      getCurrentUserId: jasmine.createSpy('getCurrentUserId').and.returnValue(1),
    } as any;

    const component = new OfertasComponent(mockRoute, mockRouter, mockOffersApi, mockAuthService);

    const offer = { campaignId: 123 } as any;
    component.onViewOffer(offer);

    expect(mockOffersApi.recordCampaignClick).toHaveBeenCalledWith(123);
  });
});


