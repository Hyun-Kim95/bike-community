import { Controller, Get, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from '../reports/entities/report.entity';
import { ReportStatus, ReportTargetType } from '../reports/entities/report.entity';
import { Post } from '../posts/entities/post.entity';
import { Comment } from '../posts/entities/comment.entity';
import { MarketplaceItem } from '../marketplace/entities/marketplace-item.entity';
import { ActivityLog } from './entities/activity-log.entity';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { CurrentAdmin } from './decorators/current-admin.decorator';
import { AdminUser } from './entities/admin-user.entity';

@Controller('admin/reports')
@UseGuards(AdminAuthGuard)
export class AdminReportsController {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepo: Repository<Report>,
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    @InjectRepository(MarketplaceItem)
    private readonly marketplaceRepo: Repository<MarketplaceItem>,
    @InjectRepository(ActivityLog)
    private readonly logRepo: Repository<ActivityLog>,
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
    const PREVIEW_LEN = 80;
    const typeStr = (r: Report) => String((r as Report & { targetType?: string }).targetType ?? '').toLowerCase();
    const enriched = await Promise.all(
      items.map(async (report) => {
        let targetTitle: string | null = null;
        let targetContentPreview: string | null = null;
        const t = typeStr(report);
        if (t === 'post') {
          const post = await this.postRepo.findOne({ where: { id: report.targetId } });
          if (post) {
            targetTitle = post.title ?? null;
            const content = typeof post.content === 'string' ? post.content : '';
            targetContentPreview = content.length > PREVIEW_LEN ? content.slice(0, PREVIEW_LEN) + '…' : content || null;
          }
        } else if (t === 'comment') {
          const comment = await this.commentRepo.findOne({ where: { id: report.targetId } });
          if (comment) {
            const content = typeof comment.content === 'string' ? comment.content : '';
            targetContentPreview = content.length > PREVIEW_LEN ? content.slice(0, PREVIEW_LEN) + '…' : content || null;
          }
        } else if (t === 'marketplace_item') {
          const item = await this.marketplaceRepo.findOne({ where: { id: report.targetId } });
          if (item) {
            targetTitle = item.title ?? null;
            const desc = typeof item.description === 'string' ? item.description : '';
            targetContentPreview = desc.length > PREVIEW_LEN ? desc.slice(0, PREVIEW_LEN) + '…' : desc || null;
          }
        }
        const plain: Record<string, unknown> = JSON.parse(JSON.stringify(report));
        plain.targetTitle = targetTitle ?? null;
        plain.targetContentPreview = targetContentPreview ?? null;
        return plain;
      }),
    );
    return { items: enriched, total, page: p, limit: l, totalPages: Math.ceil(total / l) };
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    const report = await this.reportRepo.findOne({
      where: { id },
      relations: ['reporter'],
    });
    if (!report) return { error: 'NOT_FOUND' };
    let targetTitle: string | null = null;
    let targetContent: string | null = null;
    if (report.targetType === ReportTargetType.POST) {
      const post = await this.postRepo.findOne({
        where: { id: report.targetId },
        select: ['id', 'title', 'content'],
      });
      if (post) {
        targetTitle = post.title;
        targetContent = post.content;
      }
    } else if (report.targetType === ReportTargetType.COMMENT) {
      const comment = await this.commentRepo.findOne({
        where: { id: report.targetId },
        select: ['id', 'content'],
      });
      if (comment) targetContent = comment.content;
    } else if (String(report.targetType) === 'marketplace_item') {
      const item = await this.marketplaceRepo.findOne({
        where: { id: report.targetId },
        select: ['id', 'title', 'description'],
      });
      if (item) {
        targetTitle = item.title;
        targetContent = item.description;
      }
    }
    return {
      ...report,
      targetTitle: targetTitle ?? undefined,
      targetContent: targetContent ?? undefined,
    };
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

    await this.logRepo.save(
      this.logRepo.create({
        adminId: admin.id,
        action: 'report.update',
        targetType: 'report',
        targetId: report.id,
        meta: {
          status: report.status,
          adminNote: report.adminNote,
        },
      }),
    );

    return report;
  }
}
