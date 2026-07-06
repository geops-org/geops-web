import { Favorite } from './favorite.entity';
import { FavoriteResource, FavoritesResponse } from './favorites-response';

/**
 * assembler that maps favorite REST resources to domain entities
 */
export class FavoritesAssembler {
  /**
   * maps a single resource to a domain entity
   * @param resource - the REST resource
   */
  toEntityFromResource(resource: FavoriteResource): Favorite {
    return {
      id: resource.id,
      userId: resource.userId,
      offerId: resource.offerId,
    };
  }

  /**
   * maps a REST response to a list of domain entities
   * @param response - the REST response
   */
  toEntitiesFromResponse(response: FavoritesResponse): Favorite[] {
    return response.map((resource) => this.toEntityFromResource(resource));
  }
}
