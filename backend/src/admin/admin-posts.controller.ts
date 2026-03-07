import { Controller, Get, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../posts/entities/post.entity';
import { AdminAuthGuard } from './guards/admin-auth.guard';

@Controller('admin/posts')
@UseGuards(AdminAuthGuard)
export class AdminPostsController {
  constructor(
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
  ) {}

  @Get()
  async list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const l = Math.min(limit ? parseInt(limit, 10) : 20, 50);
    const qb = this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .select(['post', 'author.id', 'author.nickname'])
      .orderBy('post.createdAt', 'DESC')
      .skip((p - 1) * l)
      .take(l);
    if (category?.trim()) {
      qb.andWhere('post.category = :category', { category: category.trim() });
    }
    const [items, total] = await qb.getManyAndCount();
    return { items, total, page: p, limit: l, totalPages: Math.ceil(total / l) };
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    const post = await this.postRepo.findOne({ where: { id } });
    if (!post) return { error: 'NOT_FOUND' };
    await this.postRepo.remove(post);
    return { ok: true };
  }
}
