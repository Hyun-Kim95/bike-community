import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UserProfile } from '../users/entities/user-profile.entity';
import { UserStatus } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

export interface TokenPayload {
  sub: string;
  email: string;
  type: 'access' | 'refresh';
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    nickname: string;
    status: string;
    profile: {
      avatarUrl: string | null;
      gradeName: string;
      totalPoints: number;
    };
  };
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly profileRepo: Repository<UserProfile>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('이미 사용 중인 이메일입니다.');
    }

    const nicknameExists = await this.userRepo.findOne({ where: { nickname: dto.nickname } });
    if (nicknameExists) {
      throw new ConflictException('이미 사용 중인 닉네임입니다.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = this.userRepo.create({
      email: dto.email,
      passwordHash,
      nickname: dto.nickname,
      status: UserStatus.NORMAL,
    });
    await this.userRepo.save(user);

    const profile = this.profileRepo.create({
      userId: user.id,
      avatarUrl: dto.avatarUrl ?? null,
      interestCategories: dto.interestCategories ?? null,
      region: dto.region ?? null,
    });
    await this.profileRepo.save(profile);

    return this.issueTokens(user, profile);
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
      relations: ['profile'],
    });
    if (!user) {
      throw new UnauthorizedException('이메일 또는 비밀번호를 확인하세요.');
    }

    if (user.status !== UserStatus.NORMAL) {
      throw new ForbiddenException('로그인할 수 없는 계정 상태입니다.');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('이메일 또는 비밀번호를 확인하세요.');
    }

    user.lastLoginAt = new Date();
    await this.userRepo.save(user);

    const profile = user.profile ?? (await this.profileRepo.findOne({ where: { userId: user.id } }));
    if (!profile) {
      throw new UnauthorizedException('프로필이 없습니다.');
    }

    return this.issueTokens(user, profile);
  }

  async validateUser(payload: TokenPayload): Promise<User | null> {
    if (payload.type !== 'access') return null;
    const user = await this.userRepo.findOne({
      where: { id: payload.sub },
      relations: ['profile'],
    });
    return user ?? null;
  }

  private issueTokens(user: User, profile: UserProfile): AuthResult {
    const accessExpires = this.config.get<string>('JWT_ACCESS_EXPIRES', '15m');
    const refreshExpires = this.config.get<string>('JWT_REFRESH_EXPIRES', '7d');
    const accessSecret = this.config.get<string>('JWT_ACCESS_SECRET');
    const refreshSecret = this.config.get<string>('JWT_REFRESH_SECRET');

    if (!accessSecret || !refreshSecret) {
      throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set');
    }

    const accessPayload: TokenPayload = {
      sub: user.id,
      email: user.email,
      type: 'access',
    };
    const refreshPayload: TokenPayload = {
      sub: user.id,
      email: user.email,
      type: 'refresh',
    };

    const accessToken = this.jwtService.sign(accessPayload, {
      secret: accessSecret,
      expiresIn: accessExpires,
    });
    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: refreshSecret,
      expiresIn: refreshExpires,
    });

    const expiresInSec = this.parseExpiresToSeconds(accessExpires);

    return {
      accessToken,
      refreshToken,
      expiresIn: expiresInSec,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        status: user.status,
        profile: {
          avatarUrl: profile.avatarUrl,
          gradeName: profile.gradeName,
          totalPoints: profile.totalPoints,
        },
      },
    };
  }

  private parseExpiresToSeconds(expires: string): number {
    const match = expires.match(/^(\d+)([smh])$/);
    if (!match) return 900;
    const n = parseInt(match[1], 10);
    const u = match[2];
    if (u === 's') return n;
    if (u === 'm') return n * 60;
    if (u === 'h') return n * 3600;
    return 900;
  }
}
