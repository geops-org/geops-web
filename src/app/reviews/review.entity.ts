export interface Review {
  id: number;
  userId: number;
  offerId: number;
  rating: number;
  comment: string;
  createdAt?: string;
  updatedAt?: string;
}
