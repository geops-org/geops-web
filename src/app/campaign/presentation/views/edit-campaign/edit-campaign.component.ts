import { Component, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CampaignStore } from '../../../application/campaign.store';
import { Campaign } from '../../../domain/model/campaign.entity';
import { CampaignOffer } from '../../../domain/model/offer.entity';
import { CampaignOffersListComponent } from '../../components/campaign-offers-list/campaign-offers-list.component';
import { AddOfferFormComponent } from '../../components/add-offer-form/add-offer-form.component';
import { ConfirmDialogComponent } from '../../../../shared/presentation/components/confirm-dialog/confirm-dialog.component';
import {
  endDateAfterStart,
  noWhitespace,
  positiveNumber
} from '../../../domain/utils/campaign-validators.util';

/**
 * EditCampaignComponent
 *
 * Form for editing existing campaigns.
 * Loads campaign data and allows updates.
 */
@Component({
  selector: 'app-edit-campaign',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTabsModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    CampaignOffersListComponent,
    AddOfferFormComponent
  ],
  templateUrl: './edit-campaign.component.html',
  styleUrls: ['./edit-campaign.component.css']
})
export class EditCampaignComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(CampaignStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  campaignForm: FormGroup;
  loading = this.store.loading;
  error = this.store.error;
  campaignId: number = 0;
  campaign = this.store.selectedCampaign;
  offers = this.store.campaignOffers;
  showOfferForm: boolean = false;
  editingOffer: CampaignOffer | undefined = undefined;

  get isCampaignActive(): boolean {
    return this.campaignForm.get('status')?.value === 'ACTIVE';
  }

  get canDisplayOfferForm(): boolean {
    return this.showOfferForm && (this.isCampaignActive || !!this.editingOffer);
  }

  get minEndDate(): Date | null {
    const start = this.campaignForm?.get('startDate')?.value as Date | string | null;
    if (!start) return null;
    const d = start instanceof Date ? new Date(start) : new Date(start);
    d.setDate(d.getDate() + 1);
    return d;
  }

  constructor() {
    this.campaignForm = this.fb.group({
      name: ['', [Validators.required, noWhitespace(), Validators.minLength(5), Validators.maxLength(50)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      startDate: ['', Validators.required],
      endDate: ['', [Validators.required, endDateAfterStart()]],
      estimatedBudget: [null, [Validators.required, positiveNumber()]],
      status: ['PAUSED', Validators.required]
    });

    this.campaignForm.get('startDate')!.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.campaignForm.get('endDate')?.updateValueAndValidity());

    // Effect to populate form when campaign loads
    effect(() => {
      const campaign = this.campaign();
      if (campaign && campaign.id === this.campaignId) {
        this.populateForm(campaign);
      }
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.campaignId = +params['id'];
      this.loadCampaign();
      this.loadOffers();
    });
  }

  loadCampaign(): void {
    this.store.loadCampaignById(this.campaignId);
  }

  loadOffers(): void {
    this.store.loadOffersByCampaignId(this.campaignId);
  }

  populateForm(campaign: Campaign): void {
    this.campaignForm.patchValue({
      name: campaign.name,
      description: campaign.description,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      estimatedBudget: campaign.estimatedBudget,
      status: campaign.status
    });
  }

  onSubmit(): void {
    const campaign = this.campaign();

    if (this.campaignForm.invalid) {
      this.campaignForm.markAllAsTouched();
      return;
    }

    if (this.campaignForm.valid && campaign) {
      // Ensure all required fields are present for PATCH request
      const updates: Partial<Campaign> = {
        name: (this.campaignForm.value.name as string).trim(),
        description: this.campaignForm.value.description,
        startDate: this.campaignForm.value.startDate,
        endDate: this.campaignForm.value.endDate,
        status: this.campaignForm.value.status,
        estimatedBudget: this.campaignForm.value.estimatedBudget,
        // Include existing metrics if available
        totalImpressions: campaign.totalImpressions,
        totalClicks: campaign.totalClicks,
        CTR: campaign.CTR
      };

      // Store's updateCampaign automatically handles cart cleanup when status changes
      this.store.updateCampaign(this.campaignId, updates);

      // Wait for store update then navigate
      setTimeout(() => {
        this.snackBar.open('Campaña actualizada exitosamente', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/campañas']);
      }, 500);
    }
  }

  onCancel(): void {
    this.router.navigate(['/resumen']);
  }

  // ==================== OFFER MANAGEMENT ====================

  onShowOfferForm(): void {
    if (!this.isCampaignActive) {
      return;
    }
    this.showOfferForm = true;
    this.editingOffer = undefined;
  }

  onHideOfferForm(): void {
    this.showOfferForm = false;
    this.editingOffer = undefined;
  }

  onSaveOffer(offerData: Partial<CampaignOffer>): void {
    if (this.editingOffer && this.editingOffer.id) {
      // Update existing offer
      this.store.updateOffer(this.editingOffer.id, offerData);
      setTimeout(() => {
        this.snackBar.open('Oferta actualizada exitosamente', 'Cerrar', { duration: 3000 });
        this.onHideOfferForm();
      }, 300);
    } else {
      // Create new offer
      this.store.createOffer(offerData);
      setTimeout(() => {
        this.snackBar.open('Oferta agregada exitosamente', 'Cerrar', { duration: 3000 });
        this.onHideOfferForm();
      }, 300);
    }
  }

  onEditOffer(offer: CampaignOffer): void {
    this.editingOffer = offer;
    this.showOfferForm = true;
  }

  onDeleteOffer(offerId: number): void {
    const offer = this.offers().find(o => o.id === offerId);
    if (!offer) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: '¿Eliminar oferta?',
        message: `¿Estás seguro de que deseas eliminar la oferta "${offer.title}"? Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        isDanger: true
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.store.deleteOffer(offerId);
        setTimeout(() => {
          this.snackBar.open('Oferta eliminada exitosamente', 'Cerrar', { duration: 3000 });
        }, 300);
      }
    });
  }
}
