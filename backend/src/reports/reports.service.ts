import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './entities/report.entity';
import { ReportTargetType } from './entities/report.entity';
import { Post } from '../posts/entities/post.entity';
import { Comment } from '../posts/entities/comment.entity';
import { CreateReportDto } from './dto/create-report.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepo: Repository<Report>,
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
  ) {}

  async create(reporterId: string, dto: CreateReportDto): Promise<Report> {
    await this.validateTarget(dto.targetType, dto.targetId);
    const report = this.reportRepo.create({
      reporterId,
      targetType: dto.targetType,
      targetId: dto.targetId,
      reason: dto.reason ?? null,
      detail: dto.detail ?? null,
    });
    return this.reportRepo.save(report);
  }

  private async validateTarget(targetType: ReportTargetType, targetId: string): Promise<void> {
    if (targetType === ReportTargetType.POST) {
      const post = await this.postRepo.findOne({ where: { id: targetId } });
      if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다.');
      return;
    }
    if (targetType === ReportTargetType.COMMENT) {
      const comment = await this.commentRepo.findOne({ where: { id: targetId } });
      if (!comment) throw new NotFoundException('댓글을 찾을 수 없습니다.');
      return;
    }
    if (targetType === ReportTargetType.USER || targetType === ReportTargetType.CHAT) {
      return; // basic validation
    }
    throw new BadRequestException('잘못된 신고 대상입니다.');
  }
}
