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
import { AdminAuthGuard } from './guards/admin-auth.guard';

@Controller('admin/notices')
@UseGuards(AdminAuthGuard)
export class AdminNoticesController {
  constructor(
    @InjectRepository(Notice)
    private readonly noticeRepo: Repository<Notice>,
  ) {}

  @Get()
  async list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const l = Math.min(limit ? parseInt(limit, 10) : 20, 50);
    const [items, total] = await this.noticeRepo.findAndCount({
      order: { pinned: 'DESC', createdAt: 'DESC' },
      skip: (p - 1) * l,
      take: l,
    });
    return { items, total, page: p, limit: l, totalPages: Math.ceil(total / l) };
  }

  @Post()
  async create(@Body() body: { title: string; content: string; pinned?: boolean }) {
    const notice = this.noticeRepo.create({
      title: body.title,
      content: body.content,
      pinned: body.pinned ?? false,
    });
    return this.noticeRepo.save(notice);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: { title?: string; content?: string; pinned?: boolean },
  ) {
    const notice = await this.noticeRepo.findOne({ where: { id } });
    if (!notice) return { error: 'NOT_FOUND' };
    if (body.title !== undefined) notice.title = body.title;
    if (body.content !== undefined) notice.content = body.content;
    if (body.pinned !== undefined) notice.pinned = body.pinned;
    return this.noticeRepo.save(notice);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    const notice = await this.noticeRepo.findOne({ where: { id } });
    if (!notice) return { error: 'NOT_FOUND' };
    await this.noticeRepo.remove(notice);
    return { ok: true };
  }
}
