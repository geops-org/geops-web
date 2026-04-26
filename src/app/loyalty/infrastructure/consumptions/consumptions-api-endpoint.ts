import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';

import { BaseApiEndpoint } from '../../../shared/infrastructure/base-api-endpoint';
import { Consumption, ConsumptionAssembler } from './consumption-assembler';
import { ConsumptionResource, ConsumptionsResponse } from './consumption-response';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ConsumptionsApiEndpoint extends BaseApiEndpoint<
  Consumption,
  ConsumptionResource,
  ConsumptionsResponse,
  ConsumptionAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}/consumptions`,
      new ConsumptionAssembler()
    );
  }

  /**
   * gets all consumptions for a user
   * @param userId - id of the consumer
   */
  getByUserId(userId: number): Observable<Consumption[]> {
    const url = `${this.endpointUrl}?userId=${userId}`;
    return this.http
      .get<ConsumptionResource[]>(url)
      .pipe(
        map(list => {
          const arr = Array.isArray(list) ? list : [];
          return arr.map(r => this.assembler.toEntityFromResource(r));
        }),
        catchError(error => {
          console.error('[ConsumptionsAPI] Error getting consumptions:', error.status, error.message);
          return of([]);
        })
      );
  }

  /**
   * registers a visit (consumption) for a user on an offer
   * @param userId - id of the consumer
   * @param offerId - id of the offer visited
   */
  registerVisit(userId: number, offerId: number): Observable<Consumption> {
    const body = { userId, offerId };

    return this.http
      .post<ConsumptionResource>(this.endpointUrl, body)
      .pipe(
        map(r => this.assembler.toEntityFromResource(r)),
        catchError(error => {
          console.error('[ConsumptionsAPI] Error registering visit:', error.status, error.message);
          throw error;
        })
      );
  }
}
