import { ConfigService } from '@nestjs/config';

export interface FcmConfig {
  projectId: string;
  privateKey: string;
  clientEmail: string;
  enabled: boolean;
}

export const getFcmConfig = (config: ConfigService): FcmConfig => ({
  projectId: config.get<string>('FCM_PROJECT_ID', ''),
  privateKey: (config.get<string>('FCM_PRIVATE_KEY', '') || '').replace(/\\n/g, '\n'),
  clientEmail: config.get<string>('FCM_CLIENT_EMAIL', ''),
  enabled: !!(config.get<string>('FCM_PROJECT_ID') && config.get<string>('FCM_PRIVATE_KEY')),
});
