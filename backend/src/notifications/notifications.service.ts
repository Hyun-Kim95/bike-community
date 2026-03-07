import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  async create(params: {
    userId: string;
    type: string;
    title: string;
    body?: string | null;
    payload?: Record<string, unknown> | null;
  }): Promise<Notification> {
    const n = this.notificationRepo.create(params);
    return this.notificationRepo.save(n);
  }

  async findByUser(userId: string, page = 1, limit = 20) {
    const [items, total] = await this.notificationRepo.findAndCount({
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

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const n = await this.notificationRepo.findOne({ where: { id } });
    if (!n) throw new NotFoundException('알림을 찾을 수 없습니다.');
    if (n.userId !== userId) throw new ForbiddenException('권한이 없습니다.');
    n.read = true;
    return this.notificationRepo.save(n);
  }

  async markAllAsRead(userId: string): Promise<{ count: number }> {
    const result = await this.notificationRepo.update(
      { userId, read: false },
      { read: true },
    );
    return { count: result.affected ?? 0 };
  }
}
