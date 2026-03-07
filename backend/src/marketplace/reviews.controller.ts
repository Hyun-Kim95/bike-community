import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('marketplace')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('items/:itemId/reviews')
  async findByItem(
    @Param('itemId') itemId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 20;
    return this.reviewsService.findByItem(itemId, p, l);
  }

  @Post('items/:itemId/reviews')
  @UseGuards(JwtAuthGuard)
  async create(
    @Param('itemId') itemId: string,
    @CurrentUser() user: User,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(
      itemId,
      user.id,
      dto.revieweeId,
      dto.rating,
      dto.content,
    );
  }
}
