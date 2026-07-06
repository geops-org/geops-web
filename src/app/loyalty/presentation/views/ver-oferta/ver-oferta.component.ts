import { Component, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';

import { OffersApiEndpoint } from '../../../infrastructure/offers/offers-api-endpoint';
import { Offer } from '../../../domain/model/offer.entity';
import { AuthService } from '../../../../identity/infrastructure/auth/auth.service';
import { FavoritesApiEndpoint } from '../../../../favorites/favorites-api-endpoint';
import { Review } from '../../../../reviews/review.entity';
import { ReviewsApiEndpoint } from '../../../../reviews/reviews-api-endpoint';
import { UsersApiEndpoint } from '../../../../identity/infrastructure/users/users-api-endpoint';
import { catchError, forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-ver-oferta',
  standalone: true,
  imports: [DatePipe, DecimalPipe, FormsModule, TranslateModule],
  templateUrl: './ver-oferta.component.html',
  styleUrls: ['./ver-oferta.component.css'],
})
export class VerOfertaComponent implements OnInit {
  offer?: Offer;
  loading = false;
  isConsumer = false;
  isFavorite = false;
  reviews: Review[] = [];
  reviewAuthorNames = new Map<number, string>();
  reviewRating = 0;
  reviewComment = '';
  reviewSubmitting = false;
  reviewErrorKey = '';
  readonly stars = [1, 2, 3, 4, 5];

  from: 'offers' | 'favorites' | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private offersApi: OffersApiEndpoint,
    private authService: AuthService,
    private favoritesApi: FavoritesApiEndpoint,
    private reviewsApi: ReviewsApiEndpoint,
    private usersApi: UsersApiEndpoint
  ) {}

  ngOnInit(): void {
    window.scrollTo({ top: 0 });
    this.isConsumer = this.authService.getCurrentUser()?.role === 'CONSUMER';

    const raw = this.route.snapshot.queryParamMap.get('from') ?? history.state?.from ?? null;
    this.from = raw === 'offers' || raw === 'favorites' ? raw : null;

    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loading = true;

    this.offersApi.getByIds([id]).subscribe({
      next: (offers) => {
        this.offer = offers[0];
        this.loading = false;
        this.loadReviews(id);
        this.loadFavorite(id);
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
      'Lince',
      'Barrio Chino',
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

  toggleFavorite(): void {
    const userId = this.authService.getCurrentUserId();
    const offerId = this.offer?.id;
    if (!userId || !offerId || !this.isConsumer) return;

    if (this.isFavorite) {
      this.favoritesApi.delete(userId, offerId).subscribe({
        next: () => this.isFavorite = false,
      });
      return;
    }

    this.favoritesApi.create(userId, offerId).subscribe({
      next: () => this.isFavorite = true,
    });
  }

  submitReview(): void {
    const userId = this.authService.getCurrentUserId();
    const offerId = this.offer?.id;
    if (!userId || !offerId || this.reviewRating < 1 || this.reviewSubmitting) return;

    this.reviewSubmitting = true;
    this.reviewErrorKey = '';
    this.reviewsApi.create(offerId, userId, this.reviewRating, this.reviewComment.trim()).subscribe({
      next: review => {
        this.reviews = [...this.reviews, review];
        const currentUser = this.authService.getCurrentUser();
        if (currentUser) {
          this.reviewAuthorNames.set(currentUser.id, currentUser.name);
          this.reviewAuthorNames = new Map(this.reviewAuthorNames);
        }
        this.reviewRating = 0;
        this.reviewComment = '';
        this.reviewSubmitting = false;
      },
      error: () => {
        this.reviewErrorKey = 'offerDetail.reviews.duplicate';
        this.reviewSubmitting = false;
      },
    });
  }

  private loadFavorite(offerId: number): void {
    const userId = this.authService.getCurrentUserId();
    if (!userId || !this.isConsumer) return;
    this.favoritesApi.getByUserId(userId).subscribe({
      next: favorites => this.isFavorite = favorites.some(favorite => favorite.offerId === offerId),
    });
  }

  private loadReviews(offerId: number): void {
    this.reviewsApi.getByOfferId(offerId).subscribe({
      next: reviews => {
        this.reviews = reviews;
        this.loadReviewAuthors(reviews);
      },
      error: () => this.reviewErrorKey = 'offerDetail.reviews.loadError',
    });
  }

  private loadReviewAuthors(reviews: Review[]): void {
    const userIds = [...new Set(reviews.map(review => review.userId))];
    if (!userIds.length) return;

    const requests = userIds.map(userId =>
      this.usersApi.getById(userId).pipe(
        catchError(() => of(null))
      )
    );

    forkJoin(requests).subscribe(users => {
      users.forEach(user => {
        if (user) this.reviewAuthorNames.set(user.id, user.name);
      });
      this.reviewAuthorNames = new Map(this.reviewAuthorNames);
    });
  }

  protected readonly String = String;
}
