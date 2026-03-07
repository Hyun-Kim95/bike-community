import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getFcmConfig } from '../config/fcm.config';

/**
 * FCM 푸시 발송.
 * FCM Admin SDK 연동은 추후 구현 (firebase-admin).
 * 현재는 설정 로드만 준비.
 */
@Injectable()
export class FcmService {
  private readonly config: ReturnType<typeof getFcmConfig>;

  constructor(private readonly configService: ConfigService) {
    this.config = getFcmConfig(this.configService);
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  async sendPush(
    _deviceToken: string,
    _title: string,
    _body?: string,
    _data?: Record<string, string>,
  ): Promise<boolean> {
    if (!this.config.enabled) return false;
    // TODO: firebase-admin 사용해 FCM 발송
    return false;
  }
}
