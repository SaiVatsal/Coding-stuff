export interface HealthcheckConfig {
  databaseId: string;

  isHealthcheckEnabled: boolean;
  isSentNotificationWhenUnavailable: boolean;

  intervalMinutes: number;
  attemptsBeforeConcideredAsDown: number;
  storeAttemptsDays: number;
}
