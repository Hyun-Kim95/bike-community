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
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('posts')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get(':postId/comments')
  async findByPost(
    @Param('postId') postId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 20;
    return this.commentsService.findByPostId(postId, p, l);
  }

  @Post(':postId/comments')
  @UseGuards(JwtAuthGuard)
  async create(
    @Param('postId') postId: string,
    @CurrentUser() user: User,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(postId, user.id, dto);
  }

  @Patch('comments/:commentId')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('commentId') commentId: string,
    @CurrentUser() user: User,
    @Body('content') content: string,
  ) {
    return this.commentsService.update(commentId, user.id, content);
  }

  @Delete('comments/:commentId')
  @UseGuards(JwtAuthGuard)
  async remove(
    @Param('commentId') commentId: string,
    @CurrentUser() user: User,
  ) {
    await this.commentsService.remove(commentId, user.id);
  }
}
