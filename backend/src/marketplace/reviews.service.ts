import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { MarketplaceItem } from './entities/marketplace-item.entity';
import { TradeChatRoom } from './entities/trade-chat-room.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(MarketplaceItem)
    private readonly itemRepo: Repository<MarketplaceItem>,
    @InjectRepository(TradeChatRoom)
    private readonly roomRepo: Repository<TradeChatRoom>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(
    itemId: string,
    reviewerId: string,
    revieweeId: string,
    rating: number,
    content?: string | null,
  ): Promise<Review> {
    const item = await this.itemRepo.findOne({ where: { id: itemId } });
    if (!item) throw new NotFoundException('상품을 찾을 수 없습니다.');
    if (item.sellerId !== reviewerId && item.sellerId !== revieweeId) {
      throw new ForbiddenException('해당 거래에 참여한 회원만 후기를 작성할 수 있습니다.');
    }
    const isRevieweeSeller = revieweeId === item.sellerId;
    const isReviewerSeller = reviewerId === item.sellerId;
    if (!isRevieweeSeller && !isReviewerSeller) {
      throw new BadRequestException('리뷰 대상이 올바르지 않습니다.');
    }
    if (reviewerId === revieweeId) throw new BadRequestException('본인에게 후기를 남길 수 없습니다.');
    if (rating < 1 || rating > 5) throw new BadRequestException('평점은 1~5 사이여야 합니다.');

    // 실제 거래(채팅) 이력이 있는 회원만 후기 작성 허용
    const sellerId = item.sellerId;
    const buyerId = reviewerId === sellerId ? revieweeId : reviewerId;
    const room = await this.roomRepo.findOne({
      where: { itemId, buyerId, sellerId },
    });
    if (!room) {
      throw new ForbiddenException(
        '해당 상품에 대해 거래 채팅 이력이 있는 회원만 후기를 작성할 수 있습니다.',
      );
    }

    const existing = await this.reviewRepo.findOne({
      where: { itemId, reviewerId, revieweeId },
    });
    if (existing) throw new BadRequestException('이미 해당 거래에 대한 후기를 작성했습니다.');

    const entity = this.reviewRepo.create({
      itemId,
      reviewerId,
      revieweeId,
      rating,
      content: content ?? null,
    });
    const saved = await this.reviewRepo.save(entity);

    // 판매자에게 거래 후기 알림 전송
    const recipientId = sellerId;
    if (recipientId) {
      await this.notificationsService.create({
        userId: recipientId,
        type: 'review',
        title: '거래 후기가 도착했습니다',
        body: item.title,
        payload: {
          itemId,
          reviewerId,
          reviewId: saved.id,
        },
      });
    }

    return saved;
  }

  async findByItem(itemId: string, page = 1, limit = 20) {
    const [items, total] = await this.reviewRepo.findAndCount({
      where: { itemId },
      relations: ['reviewer', 'reviewee'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    const avg = await this.reviewRepo
      .createQueryBuilder('r')
      .select('AVG(r.rating)', 'avg')
      .where('r.itemId = :itemId', { itemId })
      .getRawOne();
    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      averageRating: avg?.avg ? parseFloat(avg.avg).toFixed(1) : null,
    };
  }

  async findByReviewee(revieweeId: string, page = 1, limit = 20) {
    const [items, total] = await this.reviewRepo.findAndCount({
      where: { revieweeId },
      relations: ['reviewer', 'item'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
