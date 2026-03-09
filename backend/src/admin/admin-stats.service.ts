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
    // 최근 7일 (오늘 포함)
    weekStart.setDate(weekStart.getDate() - 6);

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

    // 일별 통계 (최근 7일)
    const dayKeys: string[] = [];
    for (let i = 0; i < 7; i += 1) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
      dayKeys.push(key);
    }

    const [usersByRaw, postsByRaw, pointsByRaw] = await Promise.all([
      this.userRepo
        .createQueryBuilder('u')
        .select("to_char(u.createdAt, 'YYYY-MM-DD')", 'date')
        .addSelect('COUNT(*)', 'value')
        .where('u.createdAt >= :start', { start: weekStart })
        .groupBy('date')
        .getRawMany<{ date: string; value: string }>(),
      this.postRepo
        .createQueryBuilder('p')
        .select("to_char(p.createdAt, 'YYYY-MM-DD')", 'date')
        .addSelect('COUNT(*)', 'value')
        .where('p.createdAt >= :start', { start: weekStart })
        .groupBy('date')
        .getRawMany<{ date: string; value: string }>(),
      this.pointRepo
        .createQueryBuilder('ph')
        .select("to_char(ph.createdAt, 'YYYY-MM-DD')", 'date')
        .addSelect("COALESCE(SUM(CASE WHEN ph.amount > 0 THEN ph.amount ELSE 0 END), 0)", 'value')
        .where('ph.createdAt >= :start', { start: weekStart })
        .groupBy('date')
        .getRawMany<{ date: string; value: string }>(),
    ]);

    const toMap = (rows: { date: string; value: string }[]) => {
      const map: Record<string, number> = {};
      for (const r of rows) {
        map[r.date] = Number.parseInt(r.value, 10) || 0;
      }
      return map;
    };

    const usersMap = toMap(usersByRaw);
    const postsMap = toMap(postsByRaw);
    const pointsMap = toMap(pointsByRaw);

    const usersByDay = dayKeys.map((date) => ({
      date,
      count: usersMap[date] ?? 0,
    }));
    const postsByDay = dayKeys.map((date) => ({
      date,
      count: postsMap[date] ?? 0,
    }));
    const pointsByDay = dayKeys.map((date) => ({
      date,
      amount: pointsMap[date] ?? 0,
    }));

    return {
      totalUsers,
      newUsersToday,
      postsTotal,
      commentsTotal,
      itemsTotal,
      reportsPending,
      pointSum,
      usersByDay,
      postsByDay,
      pointsByDay,
    };
  }
}
