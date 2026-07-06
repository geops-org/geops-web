import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Favorite } from '../../domain/model/favorite.entity';
import { FavoriteResource, FavoritesResponse } from './favorites-response';
import { FavoritesAssembler } from './favorites-assembler';

@Injectable({ providedIn: 'root' })
export class FavoritesApiEndpoint {
  private readonly assembler = new FavoritesAssembler();

  /**
   * creates an instance of the favoritesApiEndpoint service
   * @param http - angular http client
   */
  constructor(private readonly http: HttpClient) {}

  /**
   * builds the endpoint url for a given user
   * @param userId - the user unique identifier
   */
  private endpointUrl(userId: number): string {
    return `${environment.platformProviderApiBaseUrl}/users/${userId}/favorites`;
  }

  /**
   * retrieves all favorites saved by a user
   * @param userId - the user unique identifier
   */
  getByUserId(userId: number): Observable<Favorite[]> {
    return this.http
      .get<FavoritesResponse>(this.endpointUrl(userId))
      .pipe(map((response) => this.assembler.toEntitiesFromResponse(response)));
  }

  /**
   * saves an offer as favorite for a user
   * @param userId - the user unique identifier
   * @param offerId - the offer unique identifier
   */
  create(userId: number, offerId: number): Observable<Favorite> {
    return this.http
      .post<FavoriteResource>(this.endpointUrl(userId), { offerId })
      .pipe(map((resource) => this.assembler.toEntityFromResource(resource)));
  }

  /**
   * removes an offer from a user's favorites
   * @param userId - the user unique identifier
   * @param offerId - the offer unique identifier
   */
  delete(userId: number, offerId: number): Observable<void> {
    return this.http.delete<void>(`${this.endpointUrl(userId)}/${offerId}`);
  }
}
