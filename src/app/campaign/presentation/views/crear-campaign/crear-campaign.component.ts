import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { CampaignStore } from '../../../application/campaign.store';
import { Campaign } from '../../../domain/model/campaign.entity';
import { AuthService } from '../../../../identity/infrastructure/auth/auth.service';
import {
  startDateNotInPast,
  endDateAfterStart,
  noWhitespace,
  positiveNumber
} from '../../../domain/utils/campaign-validators.util';

/**
 * CreateCampaignComponent
 *
 * Form for creating new campaigns.
 * Includes validation and API integration.
 */
@Component({
  selector: 'app-crear-campaign',
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
    MatNativeDateModule
  ],
  templateUrl: './crear-campaign.component.html',
  styleUrls: ['./crear-campaign.component.css']
})
export class CrearCampaignComponent {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(CampaignStore);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly defaultStatus: Campaign['status'] = 'ACTIVE';

  campaignForm: FormGroup;
  loading = this.store.loading;
  error = this.store.error;


  readonly minStartDate = new Date();

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
      startDate: ['', [Validators.required, startDateNotInPast()]],
      endDate: ['', [Validators.required, endDateAfterStart()]],
      estimatedBudget: [null, [Validators.required, positiveNumber()]]
    });

    this.campaignForm.get('startDate')!.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.campaignForm.get('endDate')?.updateValueAndValidity());
  }

  onSubmit(): void {
    if (this.loading()) {
      return;
    }

    if (this.campaignForm.invalid) {
      this.campaignForm.markAllAsTouched();
      return;
    }

    const formValue = this.campaignForm.value;
    const campaign: Partial<Campaign> = {
      ...formValue,
      name: (formValue.name as string).trim(),
      status: this.defaultStatus,
      userId: this.getUserId(),
      totalImpressions: 0,
      totalClicks: 0,
      ctr: 0
    };

    this.store.createCampaign(campaign);
    // Navigate after a short delay to allow store to update
    setTimeout(() => this.router.navigate(['/campañas']), 500);
  }

  onCancel(): void {
    this.router.navigate(['/campañas']);
  }

  private getUserId(): number {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      throw new Error('No authenticated user found');
    }
    return userId;
  }
}
