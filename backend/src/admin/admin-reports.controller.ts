import { Controller, Get, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from '../reports/entities/report.entity';
import { ReportStatus } from '../reports/entities/report.entity';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { CurrentAdmin } from './decorators/current-admin.decorator';
import { AdminUser } from './entities/admin-user.entity';

@Controller('admin/reports')
@UseGuards(AdminAuthGuard)
export class AdminReportsController {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepo: Repository<Report>,
  ) {}

  @Get()
  async list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const l = Math.min(limit ? parseInt(limit, 10) : 20, 50);
    const qb = this.reportRepo
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.reporter', 'reporter')
      .select(['report', 'reporter.id', 'reporter.nickname'])
      .orderBy('report.createdAt', 'DESC')
      .skip((p - 1) * l)
      .take(l);
    if (status && Object.values(ReportStatus).includes(status as ReportStatus)) {
      qb.andWhere('report.status = :status', { status });
    }
    const [items, total] = await qb.getManyAndCount();
    return { items, total, page: p, limit: l, totalPages: Math.ceil(total / l) };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentAdmin() admin: AdminUser,
    @Body() body: { status?: string; adminNote?: string },
  ) {
    const report = await this.reportRepo.findOne({ where: { id } });
    if (!report) return { error: 'NOT_FOUND' };
    if (body.status !== undefined) {
      if (Object.values(ReportStatus).includes(body.status as ReportStatus)) {
        report.status = body.status as ReportStatus;
      }
    }
    if (body.adminNote !== undefined) report.adminNote = body.adminNote;
    report.processedBy = admin.id;
    await this.reportRepo.save(report);
    return report;
  }
}
