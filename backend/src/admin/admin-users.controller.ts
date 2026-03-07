import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UserProfile } from '../users/entities/user-profile.entity';
import { UserStatus } from '../users/entities/user.entity';
import { AdminAuthGuard } from './guards/admin-auth.guard';

@Controller('admin/users')
@UseGuards(AdminAuthGuard)
export class AdminUsersController {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly profileRepo: Repository<UserProfile>,
  ) {}

  @Get()
  async list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const l = Math.min(limit ? parseInt(limit, 10) : 20, 50);
    const qb = this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .orderBy('user.createdAt', 'DESC')
      .skip((p - 1) * l)
      .take(l);

    if (search && search.trim()) {
      qb.andWhere(
        '(user.email ILIKE :search OR user.nickname ILIKE :search)',
        { search: `%${search.trim()}%` },
      );
    }
    if (status && Object.values(UserStatus).includes(status as UserStatus)) {
      qb.andWhere('user.status = :status', { status });
    }

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page: p, limit: l, totalPages: Math.ceil(total / l) };
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['profile'],
    });
    if (!user) return { error: 'NOT_FOUND' };
    return user;
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: { status?: string; gradeName?: string; totalPoints?: number },
  ) {
    const user = await this.userRepo.findOne({ where: { id }, relations: ['profile'] });
    if (!user) return { error: 'NOT_FOUND' };
    if (body.status !== undefined) {
      if (Object.values(UserStatus).includes(body.status as UserStatus)) {
        user.status = body.status as UserStatus;
      }
    }
    await this.userRepo.save(user);
    const profile = user.profile;
    if (profile) {
      if (body.gradeName !== undefined) profile.gradeName = body.gradeName;
      if (body.totalPoints !== undefined) profile.totalPoints = body.totalPoints;
      await this.profileRepo.save(profile);
    }
    return this.getOne(id);
  }
}
