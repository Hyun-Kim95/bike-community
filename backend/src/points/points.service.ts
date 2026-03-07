import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PointHistory } from './entities/point-history.entity';
import { UserProfile } from '../users/entities/user-profile.entity';

export const GRADE_POLICY = [
  { minPoints: 0, name: '새싹 라이더' },
  { minPoints: 100, name: '일반 라이더' },
  { minPoints: 500, name: '열정 라이더' },
  { minPoints: 2000, name: '베테랑 라이더' },
  { minPoints: 5000, name: '마스터 라이더' },
];

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
  ) {}

  async addPoints(userId: string, amount: number, reason: string): Promise<{ balanceAfter: number }> {
    const profile = await this.profileRepo.findOne({ where: { userId } });
    if (!profile) throw new Error('Profile not found');
    const balanceAfter = profile.totalPoints + amount;
    const history = this.historyRepo.create({
      userId,
      amount,
      reason,
      balanceAfter,
    });
    await this.historyRepo.save(history);
    profile.totalPoints = balanceAfter;
    profile.gradeName = this.getGradeName(balanceAfter);
    await this.profileRepo.save(profile);
    return { balanceAfter };
  }

  getGradeName(totalPoints: number): string {
    let name = GRADE_POLICY[0].name;
    for (const g of GRADE_POLICY) {
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
}
