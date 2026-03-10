import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report, ReportTargetType } from './entities/report.entity';
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

  async findMyReports(reporterId: string, page = 1, limit = 20) {
    const [items, total] = await this.reportRepo.findAndCount({
      where: { reporterId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // 신고 대상 타입에 따라, 앱에서 이동에 필요한 추가 정보를 붙인다.
    const enrichedItems = await Promise.all(
      items.map(async (r) => {
        let targetPostId: string | null = null;
        let targetChatRoomId: string | null = null;
        let targetUserId: string | null = null;

        if (r.targetType === ReportTargetType.POST) {
          targetPostId = r.targetId;
        } else if (r.targetType === ReportTargetType.COMMENT) {
          const comment = await this.commentRepo.findOne({
            where: { id: r.targetId },
          });
          targetPostId = comment?.postId ?? null;
        } else if (r.targetType === ReportTargetType.CHAT) {
          // 채팅 신고의 경우 targetId를 채팅방 ID로 간주
          targetChatRoomId = r.targetId;
        } else if (r.targetType === ReportTargetType.USER) {
          // 사용자 신고의 경우 targetId를 사용자 ID로 간주
          targetUserId = r.targetId;
        }

        return {
          ...r,
          targetPostId,
          targetChatRoomId,
          targetUserId,
        };
      }),
    );

    return {
      items: enrichedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
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
