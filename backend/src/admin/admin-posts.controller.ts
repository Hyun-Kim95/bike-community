import { Controller, Get, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../posts/entities/post.entity';
import { Comment } from '../posts/entities/comment.entity';
import { ActivityLog } from './entities/activity-log.entity';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { CurrentAdmin } from './decorators/current-admin.decorator';
import { AdminUser } from './entities/admin-user.entity';

@Controller('admin/posts')
@UseGuards(AdminAuthGuard)
export class AdminPostsController {
  constructor(
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    @InjectRepository(ActivityLog)
    private readonly logRepo: Repository<ActivityLog>,
  ) {}

  @Get()
  async list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
    @Query('authorId') authorId?: string,
    @Query('search') search?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const l = Math.min(limit ? parseInt(limit, 10) : 20, 50);
    const qb = this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .select(['post', 'author.id', 'author.nickname'])
      .where('post.isDeleted = false')
      .orderBy('post.createdAt', 'DESC')
      .skip((p - 1) * l)
      .take(l);
    if (category?.trim()) {
      qb.andWhere('post.category = :category', { category: category.trim() });
    }
    if (authorId?.trim()) {
      qb.andWhere('post.authorId = :authorId', { authorId: authorId.trim() });
    }
    if (search?.trim()) {
      qb.andWhere('(post.title ILIKE :search OR post.content ILIKE :search)', {
        search: `%${search.trim()}%`,
      });
    }
    const [items, total] = await qb.getManyAndCount();
    return { items, total, page: p, limit: l, totalPages: Math.ceil(total / l) };
  }

  @Get(':postId/comments')
  async listComments(@Param('postId') postId: string) {
    const comments = await this.commentRepo
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.author', 'author')
      .where('comment.postId = :postId', { postId })
      .andWhere('comment.isDeleted = false')
      .orderBy('comment.createdAt', 'ASC')
      .select(['comment.id', 'comment.postId', 'comment.authorId', 'comment.content', 'comment.createdAt', 'author.id', 'author.nickname'])
      .getMany();
    return { items: comments };
  }

  @Delete(':postId/comments/:commentId')
  async deleteComment(
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @CurrentAdmin() admin: AdminUser,
  ) {
    const comment = await this.commentRepo.findOne({ where: { id: commentId, isDeleted: false } });
    if (!comment) return { error: 'NOT_FOUND' };
    comment.isDeleted = true;
    await this.commentRepo.save(comment);
    await this.logRepo.save(
      this.logRepo.create({
        adminId: admin.id,
        action: 'comment.delete',
        targetType: 'comment',
        targetId: commentId,
        meta: { postId },
      }),
    );
    return { ok: true };
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @CurrentAdmin() admin: AdminUser) {
    const post = await this.postRepo.findOne({ where: { id, isDeleted: false } });
    if (!post) return { error: 'NOT_FOUND' };
    post.isDeleted = true;
    await this.postRepo.save(post);
    await this.logRepo.save(
      this.logRepo.create({
        adminId: admin.id,
        action: 'post.delete',
        targetType: 'post',
        targetId: id,
        meta: { title: post.title },
      }),
    );
    return { ok: true };
  }
}
