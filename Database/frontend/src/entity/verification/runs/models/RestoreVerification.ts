import type { RestoreVerificationTableStat } from './RestoreVerificationTableStat';
import type { VerificationStatus } from './VerificationStatus';
import type { VerificationTrigger } from './VerificationTrigger';

export interface RestoreVerification {
  id: string;
  databaseId: string;
  backupId: string;
  agentId?: string;
  trigger: VerificationTrigger;
  status: VerificationStatus;
  attemptCount: number;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  restoreDurationMs?: number;
  verifyDurationMs?: number;
  pgRestoreExitCode?: number;
  dbSizeBytesAfterRestore?: number;
  tableCount?: number;
  schemaCount?: number;
  failMessage?: string;
  tableStats?: RestoreVerificationTableStat[];
}
