import { of } from 'rxjs';
import { OfertasComponent } from '../src/app/loyalty/presentation/views/ofertas/ofertas.component';

describe('pruebaunitariaUS06', () => {
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
    ];

    component.filters.category = 'Comida China';
    (component as any).applyFiltersWithoutUpdatingUrl();

    expect(component.filtered.length).toBe(1);
    expect(component.filtered[0].category).toBe('Comida China');
  });
});

