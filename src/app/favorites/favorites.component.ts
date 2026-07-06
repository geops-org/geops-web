import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of, switchMap } from 'rxjs';
import { AuthService } from '../identity/infrastructure/auth/auth.service';
import { Offer } from '../loyalty/domain/model/offer.entity';
import { OffersApiEndpoint } from '../loyalty/infrastructure/offers/offers-api-endpoint';
import { FavoritesApiEndpoint } from './favorites-api-endpoint';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.css'],
})
export class FavoritesComponent implements OnInit {
  offers: Offer[] = [];
  loading = true;
  error = false;
  private userId: number | null = null;

  constructor(
    private readonly authService: AuthService,
    private readonly favoritesApi: FavoritesApiEndpoint,
    private readonly offersApi: OffersApiEndpoint
  ) {}

  ngOnInit(): void {
    this.userId = this.authService.getCurrentUserId();
    if (!this.userId) {
      this.loading = false;
      return;
    }

    this.favoritesApi.getByUserId(this.userId).pipe(
      switchMap(favorites => {
        const ids = favorites.map(favorite => favorite.offerId);
        return ids.length ? this.offersApi.getByIds(ids) : of([]);
      })
    ).subscribe({
      next: offers => {
        this.offers = offers;
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      },
    });
  }

  remove(offerId: number): void {
    if (!this.userId) return;
    this.favoritesApi.delete(this.userId, offerId).subscribe({
      next: () => this.offers = this.offers.filter(offer => offer.id !== offerId),
      error: () => this.error = true,
    });
  }

  imgFor(offer: Offer): string {
    return offer.imageUrl ?? `assets/offers/${offer.id}.jpg`;
  }
}
