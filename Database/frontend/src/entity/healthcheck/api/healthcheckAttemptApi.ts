import { getApplicationServer } from '../../../constants';
import { apiHelper } from '../../../shared/api/apiHelper';
import type { HealthcheckAttempt } from '../model/HealthckeckAttempts';

export const healthcheckAttemptApi = {
  async getAttemptsByDatabase(databaseId: string, afterDate: Date) {
    const params = new URLSearchParams();
    params.append('afterDate', afterDate.toISOString());

    const queryString = params.toString();
    const url = `${getApplicationServer()}/api/v1/healthcheck-attempts/${databaseId}${queryString ? `?${queryString}` : ''}`;

    return apiHelper.fetchGetJson<HealthcheckAttempt[]>(url, undefined, true);
  },
};
