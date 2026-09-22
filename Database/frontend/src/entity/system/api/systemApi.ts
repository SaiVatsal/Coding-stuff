import { getApplicationServer } from '../../../constants';
import type { VersionResponse } from '../model/VersionResponse';

export const systemApi = {
  async getVersion(): Promise<VersionResponse> {
    const response = await fetch(`${getApplicationServer()}/api/v1/system/version`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch version: ${response.status}`);
    }

    return response.json();
  },
};
