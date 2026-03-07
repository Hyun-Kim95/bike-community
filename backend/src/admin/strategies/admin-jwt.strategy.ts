import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AdminAuthService } from '../admin-auth.service';
import { AdminUser } from '../entities/admin-user.entity';

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor(
    private readonly config: ConfigService,
    private readonly authService: AdminAuthService,
  ) {
    const secret = config.get<string>('ADMIN_JWT_SECRET') || config.get<string>('JWT_ACCESS_SECRET');
    if (!secret) throw new Error('ADMIN_JWT_SECRET is required');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: { sub: string; type?: string }): Promise<AdminUser> {
    const admin = await this.authService.validateAdmin(payload);
    if (!admin) throw new UnauthorizedException();
    return admin;
  }
}
