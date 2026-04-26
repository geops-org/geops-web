export interface ReviewResource {

  /**
   * data types for the Reviews API
   */
  id: number;
  offerId: number;
  userId: number;
  rating: number;
  text: string;
  createdAt: string;
}

export interface ReviewsResponse {}
