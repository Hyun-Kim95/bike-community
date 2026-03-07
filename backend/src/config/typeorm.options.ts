import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const typeOrmModuleOptions = {
  useFactory: (config: ConfigService): TypeOrmModuleOptions => ({
    type: 'postgres',
    url: config.get<string>('DATABASE_URL'),
    autoLoadEntities: true,
    // 개발: true 시 엔티티 기준으로 스키마 자동 반영. 테이블 소유자가 bike_app 이어야 함 (docs/postgres-setup.sql 4번 실행).
    synchronize: config.get<string>('NODE_ENV') === 'development',
    logging: config.get<string>('NODE_ENV') === 'development',
  }),
  inject: [ConfigService],
};
