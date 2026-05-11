import { TestBed, ComponentFixture } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { CampaignsComponent } from './campaigns.component';
import { CampaignStore } from '../../../application/campaign.store';
import { AuthService } from '../../../../identity/infrastructure/auth/auth.service';
import { Campaign } from '../../../domain/model/campaign.entity';

const activeCampaign: Campaign = {
  id: 1,
  userId: 100,
  name: 'Active Campaign',
  description: 'Active campaign description',
  startDate: '2026-07-01',
  endDate: '2026-07-31',
  status: 'ACTIVE',
  estimatedBudget: 1000,
  totalImpressions: 500,
  totalClicks: 50,
  CTR: 10,
  createdAt: '2026-05-01T10:00:00Z',
  updatedAt: '2026-05-02T10:00:00Z'
};

const finishedCampaign: Campaign = {
  ...activeCampaign,
  id: 2,
  status: 'FINALIZED',
  name: 'Finished Campaign'
};

describe('CampaignsComponent', () => {
  let fixture: ComponentFixture<CampaignsComponent>;
  let component: CampaignsComponent;
  let mockStore: any;
  let mockRouter: any;
  let mockAuth: any;

  beforeEach(async () => {
    mockStore = {
      campaigns: signal([activeCampaign, finishedCampaign]),
      loading: signal(false),
      error: signal(null),
      loadCampaignsByUserId: jasmine.createSpy('loadCampaignsByUserId')
    };

    mockRouter = {
      navigate: jasmine.createSpy('navigate')
    };

    mockAuth = {
      getCurrentUserId: jasmine.createSpy('getCurrentUserId').and.returnValue(100)
    };

    await TestBed.configureTestingModule({
      imports: [
        CampaignsComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot({})
      ],
      providers: [
        { provide: CampaignStore, useValue: mockStore },
        { provide: Router, useValue: mockRouter },
        { provide: AuthService, useValue: mockAuth }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CampaignsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load campaigns', () => {
    expect(mockStore.loadCampaignsByUserId).toHaveBeenCalledWith(100);
  });

  it('should display campaign title', () => {
    const content = fixture.nativeElement.textContent;
    // Check at least the active campaign is visible
    expect(content).toContain('Active Campaign');
  });

  it('should filter campaigns by active status', () => {
    component.selectedTabIndex = 0;
    fixture.detectChanges();

    expect(component.activeCampaigns.length).toBe(1);
    expect(component.activeCampaigns[0].status).toBe('ACTIVE');
  });

  it('should filter campaigns by inactive status', () => {
    component.selectedTabIndex = 1;
    fixture.detectChanges();

    expect(component.finishedCampaigns.length).toBe(1);
    expect(component.finishedCampaigns[0].status).toBe('FINALIZED');
  });

  it('should show edit action for each campaign', () => {
    component.onEdit(activeCampaign.id);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/editar-campaña', activeCampaign.id]);
  });

  it('should display status color for active campaigns', () => {
    const color = component.getStatusColor('ACTIVE');
    expect(color).toBe('#4CAF50');
  });

  it('should display status color for finalized campaigns', () => {
    const color = component.getStatusColor('FINALIZED');
    expect(color).toBe('#9E9E9E');
  });

  it('should get selected campaigns based on active tab index', () => {
    component.selectedTabIndex = 0;
    let selected = component.getSelectedCampaigns();
    expect(selected.length).toBe(1);
    expect(selected[0].status).toBe('ACTIVE');

    component.selectedTabIndex = 1;
    selected = component.getSelectedCampaigns();
    expect(selected.length).toBe(1);
    expect(selected[0].status).toBe('FINALIZED');
  });

  it('should count active campaigns correctly', () => {
    expect(component.activeCampaigns.length).toBe(1);
  });

  it('should count finalized campaigns correctly', () => {
    expect(component.finishedCampaigns.length).toBe(1);
  });

  it('should initialize with first tab selected', () => {
    expect(component.selectedTabIndex).toBe(0);
  });

  it('should display visual indicator for active campaigns', () => {
    const activeCampaignElement = fixture.nativeElement.textContent;
    expect(activeCampaignElement).toContain('Active Campaign');
  });
});