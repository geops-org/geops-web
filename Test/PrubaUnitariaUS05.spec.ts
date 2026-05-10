import { of } from 'rxjs';
import { OfertasComponent } from '../src/app/loyalty/presentation/views/ofertas/ofertas.component';

describe('PrubaUnitariaUS05', () => {
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

