import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminUser } from './entities/admin-user.entity';
import { User } from '../users/entities/user.entity';
import { UserProfile } from '../users/entities/user-profile.entity';
import { Post } from '../posts/entities/post.entity';
import { Comment } from '../posts/entities/comment.entity';
import { MarketplaceItem } from '../marketplace/entities/marketplace-item.entity';
import { Report } from '../reports/entities/report.entity';
import { Notice } from '../notices/entities/notice.entity';
import { PointHistory } from '../points/entities/point-history.entity';
import { AdminAuthService } from './admin-auth.service';
import { AdminAuthController } from './admin-auth.controller';
import { AdminUsersController } from './admin-users.controller';
import { AdminPostsController } from './admin-posts.controller';
import { AdminStatsService } from './admin-stats.service';
import { AdminStatsController } from './admin-stats.controller';
import { AdminReportsController } from './admin-reports.controller';
import { AdminNoticesController } from './admin-notices.controller';
import { AdminJwtStrategy } from './strategies/admin-jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AdminUser,
      User,
      UserProfile,
      Post,
      Comment,
      MarketplaceItem,
      Report,
      Notice,
      PointHistory,
    ]),
    PassportModule.register({ defaultStrategy: 'admin-jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('ADMIN_JWT_SECRET') || config.get<string>('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: '8h' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [
    AdminAuthController,
    AdminUsersController,
    AdminPostsController,
    AdminStatsController,
    AdminReportsController,
    AdminNoticesController,
  ],
  providers: [AdminAuthService, AdminJwtStrategy, AdminStatsService],
  exports: [AdminAuthService],
})
export class AdminModule {}
