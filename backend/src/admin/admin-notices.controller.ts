import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notice } from '../notices/entities/notice.entity';
import { ActivityLog } from './entities/activity-log.entity';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { CurrentAdmin } from './decorators/current-admin.decorator';
import { AdminUser } from './entities/admin-user.entity';

@Controller('admin/notices')
@UseGuards(AdminAuthGuard)
export class AdminNoticesController {
  constructor(
    @InjectRepository(Notice)
    private readonly noticeRepo: Repository<Notice>,
    @InjectRepository(ActivityLog)
    private readonly logRepo: Repository<ActivityLog>,
  ) {}

  @Get()
  async list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const l = Math.min(limit ? parseInt(limit, 10) : 20, 50);
    const [items, total] = await this.noticeRepo.findAndCount({
      where: { isDeleted: false },
      order: { pinned: 'DESC', createdAt: 'DESC' },
      skip: (p - 1) * l,
      take: l,
    });
    return { items, total, page: p, limit: l, totalPages: Math.ceil(total / l) };
  }

  @Post()
  async create(
    @Body() body: { title: string; content: string; pinned?: boolean },
    @CurrentAdmin() admin: AdminUser,
  ) {
    const notice = this.noticeRepo.create({
      title: body.title,
      content: body.content,
      pinned: body.pinned ?? false,
    });
    const saved = await this.noticeRepo.save(notice);
    await this.logRepo.save(
      this.logRepo.create({
        adminId: admin.id,
        action: 'notice.create',
        targetType: 'notice',
        targetId: saved.id,
        meta: { title: saved.title, pinned: saved.pinned },
      }),
    );
    return saved;
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: { title?: string; content?: string; pinned?: boolean },
    @CurrentAdmin() admin: AdminUser,
  ) {
    const notice = await this.noticeRepo.findOne({ where: { id, isDeleted: false } });
    if (!notice) return { error: 'NOT_FOUND' };
    if (body.title !== undefined) notice.title = body.title;
    if (body.content !== undefined) notice.content = body.content;
    if (body.pinned !== undefined) notice.pinned = body.pinned;
    const saved = await this.noticeRepo.save(notice);
    await this.logRepo.save(
      this.logRepo.create({
        adminId: admin.id,
        action: 'notice.update',
        targetType: 'notice',
        targetId: saved.id,
        meta: { title: saved.title, pinned: saved.pinned },
      }),
    );
    return saved;
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @CurrentAdmin() admin: AdminUser) {
    const notice = await this.noticeRepo.findOne({ where: { id, isDeleted: false } });
    if (!notice) return { error: 'NOT_FOUND' };
    notice.isDeleted = true;
    await this.noticeRepo.save(notice);
    await this.logRepo.save(
      this.logRepo.create({
        adminId: admin.id,
        action: 'notice.delete',
        targetType: 'notice',
        targetId: id,
        meta: { title: notice.title },
      }),
    );
    return { ok: true };
  }
}
