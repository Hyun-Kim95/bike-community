import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PointHistory } from './entities/point-history.entity';
import { UserProfile } from '../users/entities/user-profile.entity';
import { GradesService } from './grades.service';

export const POINTS = {
  ATTENDANCE: 10,
  POST: 5,
  COMMENT: 2,
  REVIEW: 10,
};

@Injectable()
export class PointsService {
  constructor(
    @InjectRepository(PointHistory)
    private readonly historyRepo: Repository<PointHistory>,
    @InjectRepository(UserProfile)
    private readonly profileRepo: Repository<UserProfile>,
    private readonly gradesService: GradesService,
  ) {}

  async addPoints(userId: string, amount: number, reason: string): Promise<{ balanceAfter: number }> {
    const profile = await this.profileRepo.findOne({ where: { userId } });
    if (!profile) throw new Error('Profile not found');
    const balanceAfter = Math.max(0, profile.totalPoints + amount);
    const actualAmount = balanceAfter - profile.totalPoints;
    const history = this.historyRepo.create({
      userId,
      amount: actualAmount,
      reason: reason.slice(0, 50),
      balanceAfter,
    });
    await this.historyRepo.save(history);
    profile.totalPoints = balanceAfter;
    profile.gradeName = await this.getGradeName(balanceAfter);
    await this.profileRepo.save(profile);
    return { balanceAfter };
  }

  async getGradeName(totalPoints: number): Promise<string> {
    const policy = await this.gradesService.getPolicy();
    if (policy.length === 0) return '새싹 라이더';
    let name = policy[0].name;
    for (const g of policy) {
      if (totalPoints >= g.minPoints) name = g.name;
    }
    return name;
  }

  async getHistory(userId: string, page = 1, limit = 20) {
    const [items, total] = await this.historyRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getHistoryForAdmin(options: {
    userId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = options.page ?? 1;
    const limit = Math.min(options.limit ?? 20, 50);
    const qb = this.historyRepo
      .createQueryBuilder('h')
      .leftJoinAndSelect('h.user', 'user')
      .orderBy('h.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    if (options.userId) {
      qb.andWhere('h.userId = :userId', { userId: options.userId });
    }
    const [items, total] = await qb.getManyAndCount();
    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
