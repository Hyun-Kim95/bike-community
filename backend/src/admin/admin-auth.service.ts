import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminUser } from './entities/admin-user.entity';
import { AdminLoginDto } from './dto/admin-login.dto';

export interface AdminAuthResult {
  accessToken: string;
  admin: { id: string; email: string; name: string };
}

@Injectable()
export class AdminAuthService {
  constructor(
    @InjectRepository(AdminUser)
    private readonly adminRepo: Repository<AdminUser>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: AdminLoginDto): Promise<AdminAuthResult> {
    const admin = await this.adminRepo.findOne({ where: { email: dto.email } });
    if (!admin) {
      throw new UnauthorizedException('이메일 또는 비밀번호를 확인하세요.');
    }
    const valid = await bcrypt.compare(dto.password, admin.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('이메일 또는 비밀번호를 확인하세요.');
    }
    const secret = this.config.get<string>('ADMIN_JWT_SECRET') || this.config.get<string>('JWT_ACCESS_SECRET');
    if (!secret) throw new Error('ADMIN_JWT_SECRET must be set');
    const token = this.jwtService.sign(
      { sub: admin.id, email: admin.email, type: 'admin' },
      { secret, expiresIn: '8h' },
    );
    return {
      accessToken: token,
      admin: { id: admin.id, email: admin.email, name: admin.name },
    };
  }

  async validateAdmin(payload: { sub: string; type?: string }): Promise<AdminUser | null> {
    if (payload.type !== 'admin') return null;
    return this.adminRepo.findOne({ where: { id: payload.sub } });
  }
}
