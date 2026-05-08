import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CampaignOffer } from '../../../domain/model/offer.entity';

/**
 * AddOfferFormComponent
 *
 * Form component for adding or editing campaign offers.
 * Can be used in dialog or inline in edit campaign view.
 */
@Component({
  selector: 'app-add-offer-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    TranslateModule
  ],
  templateUrl: './add-offer-form.component.html',
  styleUrls: ['./add-offer-form.component.css']
})
export class AddOfferFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly translate = inject(TranslateService);

  readonly minValidUntil = this.startOfDay(new Date());
  readonly maxValidUntil = this.addMonths(this.minValidUntil, 1);
  readonly validUntilFilter = (date: Date | null): boolean => {
    if (!date) return false;
    const day = this.startOfDay(date);
    return day >= this.minValidUntil && day <= this.maxValidUntil;
  };

  readonly districtOptions: { name: string; lat: number; lng: number }[] = [
    { name: 'San Borja',    lat: -12.0976, lng: -76.9952 },
    { name: 'Lince',        lat: -12.0858, lng: -77.0357 },
    { name: 'Barrio Chino', lat: -12.0509, lng: -77.0257 },
  ];

  readonly categoryOptions: string[] = [
    'Entretenimiento',
    'Belleza',
    'Comida China',
    'Comida Coreana',
    'Comida Japonesa',
    'Mangas',
    'Tecnología',
    'Moda',
    'Hogar',
    'Servicios',
    'Otros'
  ];

  @Input() campaignId!: number;
  @Input() offer?: CampaignOffer; // If editing existing offer
  @Input() showActions: boolean = true;

  @Output() saveOffer = new EventEmitter<Partial<CampaignOffer>>();
  @Output() cancel = new EventEmitter<void>();

  offerForm: FormGroup;
  isEditMode: boolean = false;

  constructor() {
    this.offerForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(40)]],
      partner: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(40)]],
      price: [0, [Validators.required, Validators.min(0), Validators.max(500)]],
      originalPrice: [0, Validators.min(0)],
      description: [''],
      category: ['', Validators.required],
      location: ['', Validators.required],
      latitude: [null],
      longitude: [null],
      imageUrl: [''],
      validUntil: [null, [Validators.required, this.dateWithinRangeValidator(this.minValidUntil, this.maxValidUntil)]]
    });
  }

  ngOnInit(): void {
    this.isEditMode = !!this.offer;

    if (this.offer) {
      this.populateForm(this.offer);
    }
  }

  populateForm(offer: CampaignOffer): void {
    this.offerForm.patchValue({
      title: offer.title,
      partner: offer.partner,
      price: offer.price,
      originalPrice: offer.originalPrice,
      description: offer.description,
      category: offer.category,
      location: offer.location,
      latitude: offer.latitude,
      longitude: offer.longitude,
      imageUrl: offer.imageUrl,
      validUntil: offer.validUntil ? new Date(offer.validUntil) : null
    });
  }

  onSubmit(): void {
    if (this.offerForm.valid) {
      const formValue = this.offerForm.value;
      const normalizedValidUntil = this.normalizeDateInput(formValue.validUntil);
      const offerData: Partial<CampaignOffer> = {
        ...formValue,
        category: formValue.category?.trim(),
        location: formValue.location?.trim(),
        validUntil: normalizedValidUntil || undefined,
        campaignId: this.campaignId
      };

      if (this.isEditMode && this.offer) {
        offerData.id = this.offer.id;
      }

      this.saveOffer.emit(offerData);

      if (!this.isEditMode) {
        this.resetForm();
      }
    }
  }

  onLocationChange(districtName: string): void {
    const district = this.districtOptions.find((d) => d.name === districtName);
    if (district) {
      this.offerForm.patchValue({ latitude: district.lat, longitude: district.lng });
    }
  }

  onCancel(): void {
    this.cancel.emit();
    this.resetForm();
  }

  private normalizeDateInput(value: Date | string | null | undefined): string | null {
    if (!value) return null;
    if (value instanceof Date) {
      const normalized = this.startOfDay(value);
      return normalized.toISOString().split('T')[0];
    }
    return value;
  }

  private resetForm(): void {
    this.offerForm.reset({
      title: '',
      partner: '',
      price: 0,
      originalPrice: 0,
      description: '',
      category: '',
      location: '',
      latitude: null,
      longitude: null,
      imageUrl: '',
      validUntil: null
    });
  }

  private dateWithinRangeValidator(minDate: Date, maxDate: Date) {
    return (control: { value: Date | string | null }): { dateOutOfRange: true } | null => {
      const value = control.value;
      if (!value) return null;
      const dateValue = value instanceof Date ? this.startOfDay(value) : this.startOfDay(new Date(value));
      if (Number.isNaN(dateValue.getTime())) return { dateOutOfRange: true };
      if (dateValue < minDate || dateValue > maxDate) return { dateOutOfRange: true };
      return null;
    };
  }

  private startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private addMonths(date: Date, months: number): Date {
    const next = new Date(date.getFullYear(), date.getMonth() + months, date.getDate());
    if (next.getMonth() !== (date.getMonth() + months) % 12) {
      return new Date(date.getFullYear(), date.getMonth() + months + 1, 0);
    }
    return next;
  }

  getErrorMessage(fieldName: string): string {
    const control = this.offerForm.get(fieldName);
    if (!control) return '';

    if (control.hasError('required')) {
      return this.translate.instant('campaign.addOfferForm.errors.required');
    }
    if (control.hasError('minlength')) {
      const minLength = control.errors?.['minlength'].requiredLength;
      return this.translate.instant('campaign.addOfferForm.errors.minLength', { value: minLength });
    }
    if (control.hasError('maxlength')) {
      const maxLength = control.errors?.['maxlength'].requiredLength;
      return this.translate.instant('campaign.addOfferForm.errors.maxLength', { value: maxLength });
    }
    if (control.hasError('min')) {
      return this.translate.instant('campaign.addOfferForm.errors.minValue');
    }
    if (control.hasError('max')) {
      const maxValue = control.errors?.['max'].max;
      return this.translate.instant('campaign.addOfferForm.errors.maxValue', { value: maxValue });
    }
    if (control.hasError('dateOutOfRange')) {
      return this.translate.instant('campaign.addOfferForm.errors.dateOutOfRange');
    }

    return '';
  }
}
