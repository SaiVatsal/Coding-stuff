import type { HealthStatus } from '../../databases/model/HealthStatus';

export interface HealthcheckAttempt {
  id: string;
  databaseId: string;
  status: HealthStatus;
  createdAt: Date;
}
