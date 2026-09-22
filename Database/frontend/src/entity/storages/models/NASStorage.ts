export interface NASStorage {
  host: string;
  port: number;
  share: string;
  username: string;
  password: string;
  useSsl: boolean;
  domain?: string;
  path?: string;
}
