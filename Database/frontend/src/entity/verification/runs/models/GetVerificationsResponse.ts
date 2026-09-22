import type { RestoreVerification } from './RestoreVerification';

export interface GetVerificationsResponse {
  verifications: RestoreVerification[];
  total: number;
  limit: number;
  offset: number;
}
