import type { Interval } from '../../../intervals';
import type { VerificationNotificationType } from './VerificationNotificationType';
import type { VerificationScheduleType } from './VerificationScheduleType';

export interface BackupVerificationConfig {
  databaseId: string;
  isScheduledVerificationEnabled: boolean;
  scheduleType: VerificationScheduleType;
  verificationInterval: Interval;
  sendNotificationsOn: VerificationNotificationType[];
  createdAt: string;
  updatedAt: string;
}
