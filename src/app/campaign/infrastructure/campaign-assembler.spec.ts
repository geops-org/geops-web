import { CampaignAssembler, OfferAssembler } from './campaign-assembler';
import { Campaign } from '../domain/model/campaign.entity';
import { CampaignOffer } from '../domain/model/offer.entity';
import {
  CampaignResource,
  CampaignResponse,
  OfferResource,
  OfferResponse
} from './campaign-response';

describe('CampaignAssembler', () => {
  let assembler: CampaignAssembler;

  const mockCampaignResource: CampaignResource = {
    id: 1,
    userId: 100,
    name: 'Summer Campaign 2026',
    description: 'Hot summer deals',
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

  const mockCampaignEntity: Campaign = {
    id: 1,
    userId: 100,
    name: 'Summer Campaign 2026',
    description: 'Hot summer deals',
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

  beforeEach(() => {
    assembler = new CampaignAssembler();
  });

  describe('toEntityFromResource', () => {
    it('debe convertir CampaignResource a Campaign entity', () => {
      const result = assembler.toEntityFromResource(mockCampaignResource);

      expect(result.id).toBe(1);
      expect(result.userId).toBe(100);
      expect(result.name).toBe('Summer Campaign 2026');
      expect(result.status).toBe('ACTIVE');
      expect(result.totalImpressions).toBe(3000);
      expect(result.totalClicks).toBe(40);
    });

    it('debe calcular CTR correctamente durante la conversión', () => {
      const result = assembler.toEntityFromResource(mockCampaignResource);
      expect(result.CTR).toBe(1.3);
    });

    it('debe manejar valores null en totalImpressions y totalClicks', () => {
      const resource: CampaignResource = {
        ...mockCampaignResource,
        totalImpressions: null as any,
        totalClicks: null as any,
      };

      const result = assembler.toEntityFromResource(resource);

      expect(result.totalImpressions).toBe(0);
      expect(result.totalClicks).toBe(0);
      expect(result.CTR).toBe(0);
    });

    it('debe convertir status como string a union type', () => {
      const result = assembler.toEntityFromResource(mockCampaignResource);
      expect(['ACTIVE', 'FINALIZED']).toContain(result.status);
    });
  });

  describe('toResourceFromEntity', () => {
    it('debe convertir Campaign entity a CampaignResource', () => {
      const result = assembler.toResourceFromEntity(mockCampaignEntity);

      expect(result.id).toBe(1);
      expect(result.name).toBe('Summer Campaign 2026');
      expect(result.userId).toBe(100);
      expect(result.status).toBe('ACTIVE');
    });

    it('debe calcular CTR nuevamente en la conversión', () => {
      const result = assembler.toResourceFromEntity(mockCampaignEntity);
      expect(result.CTR).toBe(1.3);
    });

    it('debe preservar todos los datos principales', () => {
      const result = assembler.toResourceFromEntity(mockCampaignEntity);

      expect(result.description).toBe('Hot summer deals');
      expect(result.startDate).toBe('2026-06-01');
      expect(result.endDate).toBe('2026-08-31');
      expect(result.estimatedBudget).toBe(5000);
    });
  });

  describe('toEntitiesFromResponse', () => {
    it('debe convertir respuesta con un único objeto', () => {
      const response: CampaignResponse = {
        data: mockCampaignResource,
        message: 'Success',
      };

      const result = assembler.toEntitiesFromResponse(response);

      expect(result).toEqual(jasmine.any(Array));
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Summer Campaign 2026');
    });

    it('debe convertir respuesta con array de objetos', () => {
      const resource2: CampaignResource = {
        ...mockCampaignResource,
        id: 2,
        name: 'Winter Campaign 2026',
      };

      const response: CampaignResponse = {
        data: [mockCampaignResource, resource2],
      };

      const result = assembler.toEntitiesFromResponse(response);

      expect(result.length).toBe(2);
      expect(result[0].name).toBe('Summer Campaign 2026');
      expect(result[1].name).toBe('Winter Campaign 2026');
    });
  });

  describe('toCreateResource', () => {
    it('debe preparar datos para POST (CREATE)', () => {
      const partial: Partial<Campaign> = {
        userId: 100,
        name: 'New Campaign',
        description: 'Test campaign',
        startDate: '2026-06-01',
        endDate: '2026-08-31',
        status: 'ACTIVE',
        estimatedBudget: 3000,
      };

      const result = assembler.toCreateResource(partial);

      expect(result.userId).toBe(100);
      expect(result.name).toBe('New Campaign');
      expect(result.description).toBe('Test campaign');
      expect(result.startDate).toBe('2026-06-01');
      expect(result.endDate).toBe('2026-08-31');
      expect(result.status).toBe('ACTIVE');
      expect(result.estimatedBudget).toBe(3000);
    });

    it('debe usar "ACTIVE" como status por defecto', () => {
      const partial: Partial<Campaign> = {
        userId: 100,
        name: 'New Campaign',
        description: 'Test',
        startDate: '2026-06-01',
        endDate: '2026-08-31',
      };

      const result = assembler.toCreateResource(partial);

      expect(result.status).toBe('ACTIVE');
    });

    it('debe usar 0 como estimatedBudget por defecto', () => {
      const partial: Partial<Campaign> = {
        userId: 100,
        name: 'New Campaign',
        description: 'Test',
        startDate: '2026-06-01',
        endDate: '2026-08-31',
        status: 'ACTIVE',
      };

      const result = assembler.toCreateResource(partial);

      expect(result.estimatedBudget).toBe(0);
    });
  });

  describe('toUpdateResource', () => {
    it('debe preparar datos para PATCH (UPDATE)', () => {
      const partial: Partial<Campaign> = {
        name: 'Updated Campaign',
        description: 'Updated description',
        startDate: '2026-06-01',
        endDate: '2026-08-31',
        status: 'FINALIZED',
        estimatedBudget: 4000,
      };

      const result = assembler.toUpdateResource(partial);

      expect(result.name).toBe('Updated Campaign');
      expect(result.description).toBe('Updated description');
      expect(result.status).toBe('FINALIZED');
      expect(result.estimatedBudget).toBe(4000);
    });

    it('debe incluir campos opcionales si están presentes', () => {
      const partial: Partial<Campaign> = {
        name: 'Campaign',
        description: 'Description',
        startDate: '2026-06-01',
        endDate: '2026-08-31',
        status: 'ACTIVE',
        estimatedBudget: 5000,
        totalImpressions: 5000,
        totalClicks: 100,
      };

      const result = assembler.toUpdateResource(partial);

      expect(result.totalImpressions).toBe(5000);
      expect(result.totalClicks).toBe(100);
    });

    it('no debe incluir campos opcionales si están undefined', () => {
      const partial: Partial<Campaign> = {
        name: 'Campaign',
        description: 'Description',
        startDate: '2026-06-01',
        endDate: '2026-08-31',
        status: 'ACTIVE',
        estimatedBudget: 5000,
      };

      const result = assembler.toUpdateResource(partial);

      expect(result.totalImpressions).toBeUndefined();
      expect(result.totalClicks).toBeUndefined();
    });
  });
});

describe('OfferAssembler', () => {
  let assembler: OfferAssembler;

  const mockOfferResource: OfferResource = {
    id: 101,
    campaignId: 1,
    title: 'Pizza Discount',
    partner: 'Dominos',
    price: 9.99,
    originalPrice: 15.99,
    description: '30% off',
    category: 'Food',
    location: 'Downtown',
    latitude: -12.0464,
    longitude: -77.0428,
    imageUrl: 'https://example.com/pizza.jpg',
    validTo: '2026-06-30',
    codePrefix: 'PIZZA',
    createdAt: '2026-05-01T10:00:00Z',
    updatedAt: '2026-05-11T14:30:00Z',
    rating: 4.5,
  };

  const mockOfferEntity: CampaignOffer = {
    id: 101,
    campaignId: 1,
    title: 'Pizza Discount',
    partner: 'Dominos',
    price: 9.99,
    originalPrice: 15.99,
    description: '30% off',
    category: 'Food',
    location: 'Downtown',
    latitude: -12.0464,
    longitude: -77.0428,
    imageUrl: 'https://example.com/pizza.jpg',
    validUntil: '2026-06-30',
    codePrefix: 'PIZZA',
    createdAt: '2026-05-01T10:00:00Z',
    updatedAt: '2026-05-11T14:30:00Z',
    rating: 4.5,
  };

  beforeEach(() => {
    assembler = new OfferAssembler();
  });

  describe('toEntityFromResource', () => {
    it('debe convertir OfferResource a CampaignOffer entity', () => {
      const result = assembler.toEntityFromResource(mockOfferResource);

      expect(result.id).toBe(101);
      expect(result.title).toBe('Pizza Discount');
      expect(result.partner).toBe('Dominos');
      expect(result.price).toBe(9.99);
      expect(result.rating).toBe(4.5);
    });

    it('debe mapear validTo a validUntil', () => {
      const result = assembler.toEntityFromResource(mockOfferResource);
      expect(result.validUntil).toBe('2026-06-30');
    });

    it('debe manejar campos opcionales', () => {
      const resource: OfferResource = {
        ...mockOfferResource,
        description: undefined,
        imageUrl: undefined,
      };

      const result = assembler.toEntityFromResource(resource);

      expect(result.description).toBeUndefined();
      expect(result.imageUrl).toBeUndefined();
    });
  });

  describe('toResourceFromEntity', () => {
    it('debe convertir CampaignOffer entity a OfferResource', () => {
      const result = assembler.toResourceFromEntity(mockOfferEntity);

      expect(result.id).toBe(101);
      expect(result.title).toBe('Pizza Discount');
      expect(result.partner).toBe('Dominos');
    });

    it('debe mapear validUntil a validTo', () => {
      const result = assembler.toResourceFromEntity(mockOfferEntity);
      expect(result.validTo).toBe('2026-06-30');
    });

    it('debe manejar validUntil como Date', () => {
      const entity: CampaignOffer = {
        ...mockOfferEntity,
        validUntil: '2026-06-30',
      };

      const result = assembler.toResourceFromEntity(entity);

      expect(result.validTo).toBe('2026-06-30');
    });

    it('debe retornar undefined si validUntil es null', () => {
      const entity: CampaignOffer = {
        ...mockOfferEntity,
        validUntil: null as any,
      };

      const result = assembler.toResourceFromEntity(entity);

      expect(result.validTo).toBeUndefined();
    });
  });

  describe('toEntitiesFromResponse', () => {
    it('debe convertir respuesta con un único objeto', () => {
      const response: OfferResponse = {
        data: mockOfferResource,
      };

      const result = assembler.toEntitiesFromResponse(response);

      expect(result.length).toBe(1);
      expect(result[0].title).toBe('Pizza Discount');
    });

    it('debe convertir respuesta con array de objetos', () => {
      const resource2: OfferResource = {
        ...mockOfferResource,
        id: 102,
        title: 'Burger Discount',
      };

      const response: OfferResponse = {
        data: [mockOfferResource, resource2],
      };

      const result = assembler.toEntitiesFromResponse(response);

      expect(result.length).toBe(2);
      expect(result[0].title).toBe('Pizza Discount');
      expect(result[1].title).toBe('Burger Discount');
    });
  });
});
