import { ConfigService } from '@nestjs/config';

export interface AwsS3Config {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicBaseUrl?: string;
}

export const getAwsS3Config = (config: ConfigService): AwsS3Config => ({
  region: config.get<string>('AWS_REGION', 'ap-northeast-2'),
  accessKeyId: config.get<string>('AWS_ACCESS_KEY_ID', ''),
  secretAccessKey: config.get<string>('AWS_SECRET_ACCESS_KEY', ''),
  bucket: config.get<string>('S3_BUCKET_NAME', 'bike-community-uploads'),
  publicBaseUrl: config.get<string>('S3_PUBLIC_BASE_URL'),
});
