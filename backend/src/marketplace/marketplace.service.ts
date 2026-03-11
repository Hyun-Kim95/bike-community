import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketplaceItem, SaleStatus } from './entities/marketplace-item.entity';
import { Wish } from './entities/wish.entity';
import { CreateMarketplaceItemDto } from './dto/create-marketplace-item.dto';
import { UpdateMarketplaceItemDto } from './dto/update-marketplace-item.dto';
import { QueryMarketplaceDto } from './dto/query-marketplace.dto';

@Injectable()
export class MarketplaceService {
  constructor(
    @InjectRepository(MarketplaceItem)
    private readonly itemRepo: Repository<MarketplaceItem>,
    @InjectRepository(Wish)
    private readonly wishRepo: Repository<Wish>,
  ) {}

  async create(sellerId: string, dto: CreateMarketplaceItemDto): Promise<MarketplaceItem> {
    const item = this.itemRepo.create({
      sellerId,
      title: dto.title,
      category: dto.category,
      price: dto.price,
      description: dto.description,
      imageUrls: dto.imageUrls,
      region: dto.region,
      saleStatus: SaleStatus.ON_SALE,
    });
    return this.itemRepo.save(item);
  }

  async findAll(query: QueryMarketplaceDto) {
    const { page = 1, limit = 20, sort = 'latest', category, minPrice, maxPrice, region, saleStatus } = query;
    const qb = this.itemRepo
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.seller', 'seller')
      .leftJoinAndSelect('seller.profile', 'profile')
      .select([
        'item.id',
        'item.title',
        'item.category',
        'item.price',
        'item.imageUrls',
        'item.region',
        'item.saleStatus',
        'item.viewCount',
        'item.wishCount',
        'item.createdAt',
        'seller.id',
        'seller.nickname',
        'profile.avatarUrl',
      ])
      .where('item.saleStatus != :hidden', { hidden: SaleStatus.HIDDEN });

    if (category) qb.andWhere('item.category = :category', { category });
    if (minPrice != null) qb.andWhere('item.price >= :minPrice', { minPrice });
    if (maxPrice != null) qb.andWhere('item.price <= :maxPrice', { maxPrice });
    if (region) qb.andWhere('item.region = :region', { region });
    if (saleStatus) qb.andWhere('item.saleStatus = :saleStatus', { saleStatus });

    if (sort === 'popular') {
      qb.orderBy('item.wishCount', 'DESC').addOrderBy('item.createdAt', 'DESC');
    } else {
      qb.orderBy('item.createdAt', 'DESC');
    }

    const [items, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, incrementView = true): Promise<MarketplaceItem> {
    const item = await this.itemRepo.findOne({
      where: { id },
      relations: ['seller', 'seller.profile'],
    });
    if (!item) throw new NotFoundException('상품을 찾을 수 없습니다.');
    if (incrementView) {
      item.viewCount += 1;
      await this.itemRepo.save(item);
    }
    return item;
  }

  async update(id: string, userId: string, dto: UpdateMarketplaceItemDto): Promise<MarketplaceItem> {
    const item = await this.findOne(id, false);
    if (item.sellerId !== userId) {
      throw new ForbiddenException('수정 권한이 없습니다.');
    }
    if (dto.title !== undefined) item.title = dto.title;
    if (dto.category !== undefined) item.category = dto.category;
    if (dto.price !== undefined) item.price = dto.price;
    if (dto.description !== undefined) item.description = dto.description;
    if (dto.imageUrls !== undefined) item.imageUrls = dto.imageUrls;
    if (dto.region !== undefined) item.region = dto.region;
    if (dto.saleStatus !== undefined) item.saleStatus = dto.saleStatus;
    return this.itemRepo.save(item);
  }

  async remove(id: string, userId: string): Promise<void> {
    const item = await this.findOne(id, false);
    if (item.sellerId !== userId) {
      throw new ForbiddenException('삭제 권한이 없습니다.');
    }
    await this.itemRepo.remove(item);
  }

  async toggleWish(itemId: string, userId: string): Promise<{ wished: boolean }> {
    const item = await this.itemRepo.findOne({ where: { id: itemId } });
    if (!item) throw new NotFoundException('상품을 찾을 수 없습니다.');

    const existing = await this.wishRepo.findOne({
      where: { itemId, userId },
    });
    if (existing) {
      await this.wishRepo.remove(existing);
      item.wishCount = Math.max(0, item.wishCount - 1);
      await this.itemRepo.save(item);
      return { wished: false };
    }
    const wish = this.wishRepo.create({ itemId, userId });
    await this.wishRepo.save(wish);
    item.wishCount += 1;
    await this.itemRepo.save(item);
    return { wished: true };
  }

  async isWished(itemId: string, userId: string): Promise<boolean> {
    const wish = await this.wishRepo.findOne({
      where: { itemId, userId },
    });
    return !!wish;
  }

  async findMyWishes(userId: string, page = 1, limit = 20) {
    const [items, total] = await this.wishRepo.findAndCount({
      where: { userId },
      relations: ['item', 'item.seller'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      items: items.map((w) => w.item),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findMyItems(userId: string, page = 1, limit = 20) {
    const qb = this.itemRepo
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.seller', 'seller')
      .leftJoinAndSelect('seller.profile', 'profile')
      .select([
        'item.id',
        'item.title',
        'item.category',
        'item.price',
        'item.imageUrls',
        'item.region',
        'item.saleStatus',
        'item.viewCount',
        'item.wishCount',
        'item.createdAt',
        'seller.id',
        'seller.nickname',
        'profile.avatarUrl',
      ])
      .where('item.sellerId = :userId', { userId })
      .orderBy('item.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();
    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 판매자가 거래 완료로 상태를 변경할 때 사용.
   * 이미 거래완료인 경우에는 그대로 반환.
   */
  async markAsSold(itemId: string, sellerId: string): Promise<MarketplaceItem> {
    const item = await this.findOne(itemId, false);
    if (item.sellerId !== sellerId) {
      throw new ForbiddenException('판매자만 거래 완료로 변경할 수 있습니다.');
    }
    if (item.saleStatus === SaleStatus.SOLD) return item;
    item.saleStatus = SaleStatus.SOLD;
    return this.itemRepo.save(item);
  }
}
