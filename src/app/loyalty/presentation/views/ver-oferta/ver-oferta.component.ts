import { Component, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { OffersApiEndpoint } from '../../../infrastructure/offers/offers-api-endpoint';
import { FavoritesApiEndpoint } from '../../../infrastructure/favorites/favorites-api-endpoint';
import { ConsumptionsApiEndpoint } from '../../../infrastructure/consumptions/consumptions-api-endpoint';
import { AuthService } from '../../../../identity/infrastructure/auth/auth.service';
import { Offer } from '../../../domain/model/offer.entity';

@Component({
  selector: 'app-ver-oferta',
  standalone: true,
  imports: [DecimalPipe, TranslateModule],
  templateUrl: './ver-oferta.component.html',
  styleUrls: ['./ver-oferta.component.css'],
})
export class VerOfertaComponent implements OnInit {
  offer?: Offer;
  loading = false;
  isFav = false;
  visitRegistered = false;

  private userId: number | null = null;

  from: 'offers' | 'favorites' | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private offersApi: OffersApiEndpoint,
    private favsApi: FavoritesApiEndpoint,
    private consumptionsApi: ConsumptionsApiEndpoint,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    window.scrollTo({ top: 0 });

    const user = this.auth.getCurrentUser();
    this.userId = user ? user.id : null;

    const raw = this.route.snapshot.queryParamMap.get('from') ?? history.state?.from ?? null;
    this.from = raw === 'offers' || raw === 'favorites' ? raw : null;

    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loading = true;

    this.offersApi.getByIds([id]).subscribe({
      next: (offers) => {
        this.offer = offers[0];
        this.loading = false;
        if (!this.offer) return;

        if (this.userId) {
          this.favsApi
            .findRow(this.userId, this.offer.id)
            .subscribe((rows) => (this.isFav = rows.length > 0));

          this.consumptionsApi.getByUserId(this.userId).subscribe({
            next: (consumptions) => {
              this.visitRegistered = consumptions.some((c) => c.offerId === this.offer!.id);
            },
          });
        }
      },
      error: () => (this.loading = false),
    });
  }

  // checks if a location is a district and should not be translated
  isDistrict(location: string): boolean {
    const districts = [
      'Surco',
      'San Miguel',
      'San Borja',
      'Chorrillos',
      'Santa Marina',
      'Trujillo',
      'Arequipa',
      'Ica',
      'Ate',
      'Breña',
      'Comas',
      'Barranco',
      'Los Olivos',
      'Magdalena',
      'Miraflores',
      'Pueblo Libre',
      'San Isidro',
      'Tiendas seleccionadas',
    ];
    const locationParts = location.split(',').map((part) => part.trim());
    return locationParts.some((part) => districts.includes(part));
  }

  // navigates back — uses browser history if available, otherwise falls back to source route
  goBack() {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }
    const url = this.from === 'favorites' ? '/favoritos' : '/ofertas';
    this.router.navigate([url]);
  }

  imgFor(): string {
    return this.offer?.imageUrl ?? `assets/offers/${this.offer?.id}.jpg`;
  }

  toggleFav(): void {
    if (!this.userId || !this.offer) return;

    if (this.isFav) {
      this.favsApi.findRow(this.userId, this.offer.id).subscribe((rows) => {
        if (!rows.length) return;
        this.favsApi.removeRow(rows[0].id!).subscribe(() => (this.isFav = false));
      });
    } else {
      this.favsApi.add(this.userId, this.offer.id).subscribe(() => (this.isFav = true));
    }
  }

  registerVisit(): void {
    if (!this.userId || !this.offer || this.visitRegistered) return;

    this.consumptionsApi.registerVisit(this.userId, this.offer.id).subscribe({
      next: () => (this.visitRegistered = true),
      error: (err) => console.error('[VerOferta] Error registering visit:', err),
    });
  }

  protected readonly String = String;
}
