export enum S3StorageClass {
  DEFAULT = '',
  STANDARD = 'STANDARD',
  STANDARD_IA = 'STANDARD_IA',
  ONEZONE_IA = 'ONEZONE_IA',
  INTELLIGENT_TIERING = 'INTELLIGENT_TIERING',
  REDUCED_REDUNDANCY = 'REDUCED_REDUNDANCY',
  GLACIER_IR = 'GLACIER_IR',
}

export const S3StorageClassLabels: Record<S3StorageClass, string> = {
  [S3StorageClass.DEFAULT]: 'Default (Standard)',
  [S3StorageClass.STANDARD]: 'Standard',
  [S3StorageClass.STANDARD_IA]: 'Standard - Infrequent Access',
  [S3StorageClass.ONEZONE_IA]: 'One Zone - Infrequent Access',
  [S3StorageClass.INTELLIGENT_TIERING]: 'Intelligent Tiering',
  [S3StorageClass.REDUCED_REDUNDANCY]: 'Reduced Redundancy',
  [S3StorageClass.GLACIER_IR]: 'Glacier Instant Retrieval',
};
