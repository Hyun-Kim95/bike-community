import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog } from './entities/activity-log.entity';
import { AdminUser } from './entities/admin-user.entity';
import { AdminAuthGuard } from './guards/admin-auth.guard';

@Controller('admin/activity-logs')
@UseGuards(AdminAuthGuard)
export class AdminActivityLogsController {
  constructor(
    @InjectRepository(ActivityLog)
    private readonly logRepo: Repository<ActivityLog>,
    @InjectRepository(AdminUser)
    private readonly adminRepo: Repository<AdminUser>,
  ) {}

  @Get()
  async list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('adminId') adminId?: string,
    @Query('action') action?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('search') search?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const l = Math.min(limit ? parseInt(limit, 10) : 20, 100);

    const qb = this.logRepo
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.admin', 'admin')
      .orderBy('log.createdAt', 'DESC')
      .skip((p - 1) * l)
      .take(l);

    if (adminId && adminId.trim()) {
      qb.andWhere('log.adminId = :adminId', { adminId: adminId.trim() });
    }
    if (action && action.trim()) {
      qb.andWhere('log.action ILIKE :action', { action: `%${action.trim()}%` });
    }
    if (from && from.trim()) {
      qb.andWhere('log.createdAt >= :from', { from });
    }
    if (to && to.trim()) {
      qb.andWhere('log.createdAt <= :to', {
        to: `${to.trim()} 23:59:59`,
      });
    }
    if (search && search.trim()) {
      qb.andWhere(
        '(log.targetType ILIKE :kw OR CAST(log.targetId AS TEXT) ILIKE :kw OR CAST(log.meta AS TEXT) ILIKE :kw)',
        { kw: `%${search.trim()}%` },
      );
    }

    const [items, total] = await qb.getManyAndCount();
    return {
      items,
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l),
    };
  }
}

