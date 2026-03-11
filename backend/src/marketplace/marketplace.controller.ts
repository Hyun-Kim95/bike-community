import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { CreateMarketplaceItemDto } from './dto/create-marketplace-item.dto';
import { UpdateMarketplaceItemDto } from './dto/update-marketplace-item.dto';
import { QueryMarketplaceDto } from './dto/query-marketplace.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

export const MARKETPLACE_CATEGORIES = [
  '로드',
  'MTB',
  'BMX',
  '완성차',
  '프레임',
  '휠셋',
  '부품',
  '의류',
  '기타 용품',
];

@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Get('items/categories')
  getCategories() {
    return { categories: MARKETPLACE_CATEGORIES };
  }

  @Get('items')
  async findAll(@Query() query: QueryMarketplaceDto) {
    return this.marketplaceService.findAll(query);
  }

  @Get('my-items')
  @UseGuards(JwtAuthGuard)
  async findMyItems(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? Math.min(parseInt(limit, 10), 50) : 20;
    return this.marketplaceService.findMyItems(user.id, p, l);
  }

  @Get('items/:id')
  async findOne(@Param('id') id: string) {
    return this.marketplaceService.findOne(id);
  }

  @Post('items')
  @UseGuards(JwtAuthGuard)
  async create(@CurrentUser() user: User, @Body() dto: CreateMarketplaceItemDto) {
    return this.marketplaceService.create(user.id, dto);
  }

  @Patch('items/:id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateMarketplaceItemDto,
  ) {
    return this.marketplaceService.update(id, user.id, dto);
  }

  @Delete('items/:id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    await this.marketplaceService.remove(id, user.id);
  }

  /**
   * 판매자가 거래 완료를 확정하는 엔드포인트.
   * 실제 거래 여부는 채팅/후기 등을 통해 판매자가 직접 확인한 뒤 호출한다.
   */
  @Post('items/:id/mark-sold')
  @UseGuards(JwtAuthGuard)
  async markAsSold(@Param('id') id: string, @CurrentUser() user: User) {
    return this.marketplaceService.markAsSold(id, user.id);
  }

  @Post('items/:id/wish')
  @UseGuards(JwtAuthGuard)
  async toggleWish(@Param('id') id: string, @CurrentUser() user: User) {
    return this.marketplaceService.toggleWish(id, user.id);
  }

  @Get('items/:id/wish')
  @UseGuards(JwtAuthGuard)
  async isWished(@Param('id') id: string, @CurrentUser() user: User) {
    const wished = await this.marketplaceService.isWished(id, user.id);
    return { wished };
  }

  @Get('wishes')
  @UseGuards(JwtAuthGuard)
  async getMyWishes(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 20;
    return this.marketplaceService.findMyWishes(user.id, p, l);
  }
}
