import { BaseEntity } from '../../../shared/infrastructure/base-entity';

export type NotificationType =
  | 'PAYMENT'
  | 'PREMIUM_UPGRADE'
  | 'PROFILE_UPDATE'
  | 'COUPON_EXPIRATION';

export interface Notification extends BaseEntity {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  relatedEntityId?: string;
  relatedEntityType?: string;
  actionUrl?: string;
  createdAt: string;
}
