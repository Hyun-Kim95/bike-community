import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const typeOrmModuleOptions = {
  useFactory: (config: ConfigService): TypeOrmModuleOptions => ({
    type: 'postgres',
    url: config.get<string>('DATABASE_URL'),
    autoLoadEntities: true,
    synchronize: config.get<string>('NODE_ENV') === 'development', // 개발에서만 true, 운영 시 false
    logging: config.get<string>('NODE_ENV') === 'development',
  }),
  inject: [ConfigService],
};
