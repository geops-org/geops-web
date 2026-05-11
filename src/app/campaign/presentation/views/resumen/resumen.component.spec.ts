import { TestBed, ComponentFixture } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { ResumenComponent } from './resumen.component';
import { CampaignStore } from '../../../application/campaign.store';
import { AuthService } from '../../../../identity/infrastructure/auth/auth.service';
import { Campaign } from '../../../domain/model/campaign.entity';

const mockCampaigns: Campaign[] = [
  {
    id: 1,
    userId: 100,
    name: 'Campaign One',
    description: 'Description One',
    startDate: '2026-07-01',
    endDate: '2026-07-31',
    status: 'ACTIVE',
    estimatedBudget: 1000,
    totalImpressions: 1000,
    totalClicks: 100,
    CTR: 10,
    createdAt: '2026-05-01T10:00:00Z',
    updatedAt: '2026-05-02T10:00:00Z'
  },
  {
    id: 2,
    userId: 100,
    name: 'Campaign Two',
    description: 'Description Two',
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    status: 'FINALIZED',
    estimatedBudget: 2000,
    totalImpressions: 2000,
    totalClicks: 200,
    CTR: 10,
    createdAt: '2026-05-01T10:00:00Z',
    updatedAt: '2026-05-02T10:00:00Z'
  }
];

describe('ResumenComponent', () => {
  let fixture: ComponentFixture<ResumenComponent>;
  let component: ResumenComponent;
  let mockStore: any;
  let mockAuth: any;
  let mockRouter: any;

  beforeEach(async () => {
    mockStore = {
      campaigns: signal(mockCampaigns),
      loading: signal(false),
      error: signal(null),
      loadCampaignsByUserId: jasmine.createSpy('loadCampaignsByUserId')
    };

    mockAuth = {
      getCurrentUserId: jasmine.createSpy('getCurrentUserId').and.returnValue(100)
    };

    mockRouter = {
      navigate: jasmine.createSpy('navigate')
    };

    await TestBed.configureTestingModule({
      imports: [
        ResumenComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot({})
      ],
      providers: [
        { provide: CampaignStore, useValue: mockStore },
        { provide: AuthService, useValue: mockAuth },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ResumenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should display campaign metrics summary', () => {
    expect(component.totalImpressions()).toBe(3000);
    expect(component.totalClicks()).toBe(300);
    expect(component.averageCTR()).toBe(10);
  });

  it('should display total campaigns', () => {
    expect(component.campaigns().length).toBe(2);
  });

  it('should display active campaigns count', () => {
    expect(component.campaigns().filter(c => c.status === 'ACTIVE').length).toBe(1);
  });

  it('should calculate campaign metrics correctly', () => {
    const summary = component.campaigns();
    expect(summary[0].CTR).toBe(10);
    expect(summary[1].CTR).toBe(10);
  });

  it('should display inactive campaigns count', () => {
    expect(component.campaigns().filter(c => c.status === 'FINALIZED').length).toBe(1);
  });

  it('should load data on init', () => {
    expect(mockStore.loadCampaignsByUserId).toHaveBeenCalledWith(100);
  });

  it('should display 0 total campaigns when no campaigns exist', () => {
    mockStore.campaigns.set([]);
    fixture.detectChanges();

    expect(component.campaigns().length).toBe(0);
  });

  it('should calculate total impressions from all campaigns', () => {
    expect(component.totalImpressions()).toBe(3000);
  });

  it('should calculate total clicks from all campaigns', () => {
    expect(component.totalClicks()).toBe(300);
  });

  it('should calculate average CTR correctly', () => {
    expect(component.averageCTR()).toBeCloseTo(10, 0);
  });

  it('should handle empty campaigns array for average CTR', () => {
    mockStore.campaigns.set([]);
    fixture.detectChanges();

    expect(component.averageCTR()).toBe(0);
  });

  it('should get status color for active campaigns', () => {
    const color = component.getStatusColor('ACTIVE');
    expect(color).toBe('#4CAF50');
  });

  it('should get status color for finalized campaigns', () => {
    const color = component.getStatusColor('FINALIZED');
    expect(color).toBe('#9E9E9E');
  });
});