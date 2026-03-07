import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notice } from './entities/notice.entity';

@Controller('notices')
export class NoticesController {
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
      where: {},
      order: { pinned: 'DESC', createdAt: 'DESC' },
      skip: (p - 1) * l,
      take: l,
    });
    return { items, total, page: p, limit: l, totalPages: Math.ceil(total / l) };
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    const notice = await this.noticeRepo.findOne({ where: { id } });
    if (!notice) throw new NotFoundException('공지를 찾을 수 없습니다.');
    return notice;
  }
}
