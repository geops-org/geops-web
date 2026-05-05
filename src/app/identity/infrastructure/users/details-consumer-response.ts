/**
 * DetailsConsumer resource returned by API.
 * Matches the backend DetailsConsumerResource structure.
 */
export interface DetailsConsumerResource {
  id: number;
  userId: number;
  categoriasFavoritas?: string;
  permisoUbicacion: boolean;
  direccionCasa?: string;
  direccionTrabajo?: string;
  direccionUniversidad?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Request resource for creating consumer details.
 */
export interface CreateDetailsConsumerResource {
  categoriasFavoritas?: string;
  permisoUbicacion?: boolean;
  direccionCasa?: string;
  direccionTrabajo?: string;
  direccionUniversidad?: string;
}

/**
 * API response for consumer details.
 */
export interface DetailsConsumerResponse {}

