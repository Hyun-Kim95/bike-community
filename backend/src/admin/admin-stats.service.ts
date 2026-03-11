import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserStatus } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { Comment } from '../posts/entities/comment.entity';
import { MarketplaceItem, SaleStatus } from '../marketplace/entities/marketplace-item.entity';
import { Report, ReportStatus } from '../reports/entities/report.entity';
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

    // 거래/게시글 확장 통계를 위한 기간 기준
    const day30Start = new Date(todayStart);
    day30Start.setDate(day30Start.getDate() - 29); // 최근 30일

    const week12Start = new Date(todayStart);
    week12Start.setDate(week12Start.getDate() - 7 * 11); // 최근 12주

    const month12Start = new Date(todayStart);
    month12Start.setMonth(month12Start.getMonth() - 11); // 최근 12개월

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

    // 탈퇴/휴면 전환 수 (최근 7일, 일별)
    const churnRaw = await this.userRepo
      .createQueryBuilder('u')
      .select("to_char(u.updatedAt, 'YYYY-MM-DD')", 'date')
      .addSelect("SUM(CASE WHEN u.status = 'withdrawn' THEN 1 ELSE 0 END)", 'withdrawn')
      .addSelect("SUM(CASE WHEN u.status = 'dormant' THEN 1 ELSE 0 END)", 'dormant')
      .where('u.updatedAt >= :start', { start: weekStart })
      .andWhere('u.status IN (:...statuses)', {
        statuses: [UserStatus.WITHDRAWN, UserStatus.DORMANT],
      })
      .groupBy('date')
      .getRawMany<{ date: string; withdrawn: string; dormant: string }>();

    const churnMap: Record<string, { withdrawn: number; dormant: number }> = {};
    for (const r of churnRaw) {
      churnMap[r.date] = {
        withdrawn: Number.parseInt(r.withdrawn, 10) || 0,
        dormant: Number.parseInt(r.dormant, 10) || 0,
      };
    }

    const usersChurnByDay = dayKeys.map((date) => ({
      date,
      withdrawn: churnMap[date]?.withdrawn ?? 0,
      dormant: churnMap[date]?.dormant ?? 0,
    }));

    // 지역별 활성 사용자 수 (NORMAL 상태만)
    const regionActiveRaw = await this.userRepo
      .createQueryBuilder('u')
      .leftJoin('u.profile', 'p')
      .select("COALESCE(p.region, '미지정')", 'region')
      .addSelect('COUNT(*)', 'count')
      .where('u.status = :status', { status: UserStatus.NORMAL })
      .groupBy('region')
      .getRawMany<{ region: string; count: string }>();

    const regionActiveUsers = regionActiveRaw.map((r) => ({
      region: r.region,
      count: Number.parseInt(r.count, 10) || 0,
    }));

    // 거래 통계 (판매 완료 기준)
    const txDayRaw = await this.itemRepo
      .createQueryBuilder('i')
      .select("to_char(i.updatedAt, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(i.price)', 'amount')
      .where('i.saleStatus = :status', { status: SaleStatus.SOLD })
      .andWhere('i.updatedAt >= :start', { start: day30Start })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany<{ date: string; count: string; amount: string }>();

    const transactionsByDay = txDayRaw.map((r) => {
      const count = Number.parseInt(r.count, 10) || 0;
      const amount = Number.parseFloat(r.amount ?? '0') || 0;
      return {
        date: r.date,
        count,
        totalAmount: amount,
        averageAmount: count > 0 ? Math.round(amount / count) : 0,
      };
    });

    const txWeekRaw = await this.itemRepo
      .createQueryBuilder('i')
      .select("to_char(i.updatedAt, 'IYYY-IW')", 'week')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(i.price)', 'amount')
      .where('i.saleStatus = :status', { status: SaleStatus.SOLD })
      .andWhere('i.updatedAt >= :start', { start: week12Start })
      .groupBy('week')
      .orderBy('week', 'ASC')
      .getRawMany<{ week: string; count: string; amount: string }>();

    const transactionsByWeek = txWeekRaw.map((r) => {
      const count = Number.parseInt(r.count, 10) || 0;
      const amount = Number.parseFloat(r.amount ?? '0') || 0;
      return {
        week: r.week,
        count,
        totalAmount: amount,
        averageAmount: count > 0 ? Math.round(amount / count) : 0,
      };
    });

    const txMonthRaw = await this.itemRepo
      .createQueryBuilder('i')
      .select("to_char(i.updatedAt, 'YYYY-MM')", 'month')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(i.price)', 'amount')
      .where('i.saleStatus = :status', { status: SaleStatus.SOLD })
      .andWhere('i.updatedAt >= :start', { start: month12Start })
      .groupBy('month')
      .orderBy('month', 'ASC')
      .getRawMany<{ month: string; count: string; amount: string }>();

    const transactionsByMonth = txMonthRaw.map((r) => {
      const count = Number.parseInt(r.count, 10) || 0;
      const amount = Number.parseFloat(r.amount ?? '0') || 0;
      return {
        month: r.month,
        count,
        totalAmount: amount,
        averageAmount: count > 0 ? Math.round(amount / count) : 0,
      };
    });

    // 카테고리별 거래 건수
    const txByCategoryRaw = await this.itemRepo
      .createQueryBuilder('i')
      .select('i.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .where('i.saleStatus = :status', { status: SaleStatus.SOLD })
      .groupBy('category')
      .getRawMany<{ category: string; count: string }>();

    const transactionsByCategory = txByCategoryRaw.map((r) => ({
      category: r.category,
      count: Number.parseInt(r.count, 10) || 0,
    }));

    // 평균 판매까지 걸린 일수 (전체 및 카테고리별)
    const soldItems = await this.itemRepo.find({
      where: { saleStatus: SaleStatus.SOLD },
      select: ['createdAt', 'updatedAt', 'category'],
    });

    let totalDays = 0;
    let totalCount = 0;
    const categoryStats: Record<string, { days: number; count: number }> = {};

    for (const item of soldItems) {
      const diffMs = item.updatedAt.getTime() - item.createdAt.getTime();
      const days = diffMs / (1000 * 60 * 60 * 24);
      if (days < 0) continue;

      totalDays += days;
      totalCount += 1;

      const cat = item.category;
      if (!categoryStats[cat]) {
        categoryStats[cat] = { days: 0, count: 0 };
      }
      categoryStats[cat].days += days;
      categoryStats[cat].count += 1;
    }

    const avgDaysToSell = totalCount > 0 ? Number((totalDays / totalCount).toFixed(1)) : 0;
    const avgDaysToSellByCategory = Object.entries(categoryStats).map(([category, s]) => ({
      category,
      days: s.count > 0 ? Number((s.days / s.count).toFixed(1)) : 0,
    }));

    // 게시글 수 (주별/월별)
    const postsByWeekRaw = await this.postRepo
      .createQueryBuilder('p')
      .select("to_char(p.createdAt, 'IYYY-IW')", 'week')
      .addSelect('COUNT(*)', 'count')
      .where('p.createdAt >= :start', { start: week12Start })
      .groupBy('week')
      .orderBy('week', 'ASC')
      .getRawMany<{ week: string; count: string }>();

    const postsByWeek = postsByWeekRaw.map((r) => ({
      week: r.week,
      count: Number.parseInt(r.count, 10) || 0,
    }));

    const postsByMonthRaw = await this.postRepo
      .createQueryBuilder('p')
      .select("to_char(p.createdAt, 'YYYY-MM')", 'month')
      .addSelect('COUNT(*)', 'count')
      .where('p.createdAt >= :start', { start: month12Start })
      .groupBy('month')
      .orderBy('month', 'ASC')
      .getRawMany<{ month: string; count: string }>();

    const postsByMonth = postsByMonthRaw.map((r) => ({
      month: r.month,
      count: Number.parseInt(r.count, 10) || 0,
    }));

    // 신고 비율 (대상 타입/원인별)
    const reportsTotal = await this.reportRepo
      .createQueryBuilder('r')
      .select('COUNT(*)', 'count')
      .getRawOne<{ count: string }>()
      .then((r) => Number.parseInt(r?.count ?? '0', 10));

    const reportsByTypeRaw = await this.reportRepo
      .createQueryBuilder('r')
      .select('r.targetType', 'targetType')
      .addSelect('COUNT(*)', 'count')
      .groupBy('r.targetType')
      .getRawMany<{ targetType: string; count: string }>();

    const reportsByTargetType = reportsByTypeRaw.map((r) => {
      const count = Number.parseInt(r.count, 10) || 0;
      const ratio = reportsTotal > 0 ? Number(((count / reportsTotal) * 100).toFixed(1)) : 0;
      return { targetType: r.targetType, count, ratio };
    });

    const reportsByReasonRaw = await this.reportRepo
      .createQueryBuilder('r')
      .select("COALESCE(r.reason, '기타')", 'reason')
      .addSelect('COUNT(*)', 'count')
      .groupBy('reason')
      .getRawMany<{ reason: string; count: string }>();

    const reportsByReason = reportsByReasonRaw.map((r) => {
      const count = Number.parseInt(r.count, 10) || 0;
      const ratio = reportsTotal > 0 ? Number(((count / reportsTotal) * 100).toFixed(1)) : 0;
      return { reason: r.reason, count, ratio };
    });

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
      usersChurnByDay,
      regionActiveUsers,
      transactionsByDay,
      transactionsByWeek,
      transactionsByMonth,
      transactionsByCategory,
      avgDaysToSell,
      avgDaysToSellByCategory,
      postsByWeek,
      postsByMonth,
      reportsByTargetType,
      reportsByReason,
    };
  }
}
