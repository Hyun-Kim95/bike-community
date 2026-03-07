import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { Comment } from '../posts/entities/comment.entity';
import { MarketplaceItem } from '../marketplace/entities/marketplace-item.entity';
import { Report } from '../reports/entities/report.entity';
import { ReportStatus } from '../reports/entities/report.entity';
import { PointHistory } from '../points/entities/point-history.entity';

@Injectable()
export class AdminStatsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    @InjectRepository(MarketplaceItem)
    private readonly itemRepo: Repository<MarketplaceItem>,
    @InjectRepository(Report)
    private readonly reportRepo: Repository<Report>,
    @InjectRepository(PointHistory)
    private readonly pointRepo: Repository<PointHistory>,
  ) {}

  async getDashboard() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(todayStart);
    monthStart.setMonth(monthStart.getMonth() - 1);

    const [totalUsers, newUsersToday, postsTotal, commentsTotal, itemsTotal, reportsPending, pointSum] = await Promise.all([
      this.userRepo.count(),
      this.userRepo.createQueryBuilder('u').where('u.createdAt >= :start', { start: todayStart }).getCount(),
      this.postRepo.count(),
      this.commentRepo.count(),
      this.itemRepo.count(),
      this.reportRepo.count({ where: { status: ReportStatus.PENDING } }),
      this.pointRepo
        .createQueryBuilder('ph')
        .select('COALESCE(SUM(ph.amount), 0)', 'sum')
        .where('ph.amount > 0')
        .getRawOne()
        .then((r) => parseInt(r?.sum ?? '0', 10)),
    ]);

    return {
      totalUsers,
      newUsersToday,
      postsTotal,
      commentsTotal,
      itemsTotal,
      reportsPending,
      pointSum,
    };
  }
}
