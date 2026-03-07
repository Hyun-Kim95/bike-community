import { Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { LikesService } from './likes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('posts')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  async toggle(@Param('id') postId: string, @CurrentUser() user: User) {
    return this.likesService.toggle(postId, user.id);
  }

  @Get(':id/like')
  @UseGuards(JwtAuthGuard)
  async isLiked(@Param('id') postId: string, @CurrentUser() user: User) {
    const liked = await this.likesService.isLiked(postId, user.id);
    return { liked };
  }
}
