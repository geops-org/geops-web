import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Review } from './review.entity';

@Injectable({ providedIn: 'root' })
export class ReviewsApiEndpoint {
  constructor(private readonly http: HttpClient) {}

  getByOfferId(offerId: number): Observable<Review[]> {
    return this.http.get<Review[]>(
      `${environment.platformProviderApiBaseUrl}/offers/${offerId}/reviews`
    );
  }

  create(offerId: number, userId: number, rating: number, comment: string): Observable<Review> {
    return this.http.post<Review>(
      `${environment.platformProviderApiBaseUrl}/offers/${offerId}/reviews`,
      { userId, rating, comment }
    );
  }
}
