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
import { PointsService } from '../points/points.service';

@Controller('admin/users')
@UseGuards(AdminAuthGuard)
export class AdminUsersController {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly profileRepo: Repository<UserProfile>,
    private readonly pointsService: PointsService,
  ) {}

  @Get()
  async list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('gradeName') gradeName?: string,
    @Query('joinedFrom') joinedFrom?: string,
    @Query('joinedTo') joinedTo?: string,
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
    if (gradeName && gradeName.trim()) {
      qb.andWhere('profile.gradeName ILIKE :grade', {
        grade: `%${gradeName.trim()}%`,
      });
    }
    if (joinedFrom && joinedFrom.trim()) {
      qb.andWhere('user.createdAt >= :joinedFrom', { joinedFrom });
    }
    if (joinedTo && joinedTo.trim()) {
      qb.andWhere('user.createdAt <= :joinedTo', {
        joinedTo: `${joinedTo.trim()} 23:59:59`,
      });
    }

    const [items, total] = await qb.getManyAndCount();
    for (const user of items) {
      if (user.profile) {
        user.profile.gradeName = await this.pointsService.getGradeName(
          user.profile.totalPoints ?? 0,
        );
      }
    }
    return { items, total, page: p, limit: l, totalPages: Math.ceil(total / l) };
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['profile'],
    });
    if (!user) return { error: 'NOT_FOUND' };
    if (user.profile) {
      user.profile.gradeName = await this.pointsService.getGradeName(
        user.profile.totalPoints ?? 0,
      );
    }
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
