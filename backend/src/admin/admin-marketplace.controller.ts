import { Controller, Get, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketplaceItem, SaleStatus } from '../marketplace/entities/marketplace-item.entity';
import { User } from '../users/entities/user.entity';
import { Review } from '../marketplace/entities/review.entity';
import { ActivityLog } from './entities/activity-log.entity';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { CurrentAdmin } from './decorators/current-admin.decorator';
import { AdminUser } from './entities/admin-user.entity';

@Controller('admin/marketplace-items')
@UseGuards(AdminAuthGuard)
export class AdminMarketplaceController {
  constructor(
    @InjectRepository(MarketplaceItem)
    private readonly itemRepo: Repository<MarketplaceItem>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(ActivityLog)
    private readonly logRepo: Repository<ActivityLog>,
  ) {}

  @Get()
  async list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('seller') seller?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const l = Math.min(limit ? parseInt(limit, 10) : 20, 50);

    const qb = this.itemRepo
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.seller', 'seller')
      .select([
        'item.id',
        'item.title',
        'item.category',
        'item.price',
        'item.region',
        'item.saleStatus',
        'item.viewCount',
        'item.wishCount',
        'item.createdAt',
        'item.updatedAt',
        'seller.id',
        'seller.email',
        'seller.nickname',
      ])
      .orderBy('item.createdAt', 'DESC')
      .skip((p - 1) * l)
      .take(l);

    if (status && Object.values(SaleStatus).includes(status as SaleStatus)) {
      qb.andWhere('item.saleStatus = :status', { status });
    }
    if (category && category.trim()) {
      qb.andWhere('item.category = :category', { category: category.trim() });
    }
    if (seller && seller.trim()) {
      qb.andWhere(
        '(seller.email ILIKE :kw OR seller.nickname ILIKE :kw)',
        { kw: `%${seller.trim()}%` },
      );
    }

    const [items, total] = await qb.getManyAndCount();

    // 예약/판매완료인 경우, 거래 상대와 상태 변경 시각을 유추
    const enriched = await Promise.all(
      items.map(async (item) => {
        let tradePartner: { id: string; email: string; nickname: string } | null = null;
        let statusChangedAt: Date | null = null;

        if (item.saleStatus === SaleStatus.RESERVED || item.saleStatus === SaleStatus.SOLD) {
          const review = await this.reviewRepo.findOne({
            where: { itemId: item.id },
            relations: ['reviewer', 'reviewee'],
            order: { createdAt: 'DESC' },
          });
          if (review) {
            const isReviewerSeller = review.reviewerId === item.sellerId;
            const otherUser = isReviewerSeller ? review.reviewee : review.reviewer;
            if (otherUser) {
              tradePartner = {
                id: otherUser.id,
                email: otherUser.email,
                nickname: otherUser.nickname,
              };
            }
            statusChangedAt = review.createdAt;
          } else {
            statusChangedAt = item.updatedAt;
          }
        }

        return {
          ...item,
          tradePartner,
          statusChangedAt,
        };
      }),
    );

    return {
      items: enriched,
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l),
    };
  }

  @Patch(':id')
  async updateStatus(
    @Param('id') id: string,
    @CurrentAdmin() admin: AdminUser,
    @Body() body: { saleStatus?: string },
  ) {
    const item = await this.itemRepo.findOne({
      where: { id },
      relations: ['seller'],
    });
    if (!item) {
      return { error: 'NOT_FOUND' };
    }

    if (body.saleStatus && Object.values(SaleStatus).includes(body.saleStatus as SaleStatus)) {
      item.saleStatus = body.saleStatus as SaleStatus;
      await this.itemRepo.save(item);

      await this.logRepo.save(
        this.logRepo.create({
          adminId: admin.id,
          action: 'marketplace.update_status',
          targetType: 'marketplace_item',
          targetId: item.id,
          meta: { saleStatus: item.saleStatus, title: item.title },
        }),
      );
    }

    return item;
  }
}

