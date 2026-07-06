/**
 * REST resource shape returned by the GeoPS API for a favorite
 */
export interface FavoriteResource {
  id: number;
  userId: number;
  offerId: number;
}

/**
 * REST response shape for a collection of favorites
 */
export type FavoritesResponse = FavoriteResource[];
