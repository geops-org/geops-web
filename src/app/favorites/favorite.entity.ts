import { BaseEntity } from '../shared/infrastructure/base-entity';

/**
 * domain entity for a favorite offer saved by a consumer
 */
export interface Favorite extends BaseEntity {
  id: number;
  userId: number;
  offerId: number;
}
