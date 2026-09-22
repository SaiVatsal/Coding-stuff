import { NotificationType } from '../../../entity/notifiers';

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  [NotificationType.ALL]: 'All',
  [NotificationType.BACKUP_SUCCESS]: 'Backup success',
  [NotificationType.BACKUP_FAILED]: 'Backup failed',
  [NotificationType.HEALTHCHECK_SUCCESS]: 'Healthcheck success',
  [NotificationType.HEALTHCHECK_FAILED]: 'Healthcheck failed',
  [NotificationType.VERIFICATION_SUCCESS]: 'Verification success',
  [NotificationType.VERIFICATION_FAILED]: 'Verification failed',
};

export const NOTIFICATION_TYPE_OPTIONS = Object.values(NotificationType).map((value) => ({
  label: NOTIFICATION_TYPE_LABELS[value],
  value,
}));

export const DEFAULT_ACCEPT_NOTIFICATION_TYPES = [NotificationType.ALL];
