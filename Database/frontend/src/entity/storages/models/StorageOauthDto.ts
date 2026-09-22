import type { Storage } from './Storage';

export interface StorageOauthDto {
  storage: Storage;
  authCode: string;
}
