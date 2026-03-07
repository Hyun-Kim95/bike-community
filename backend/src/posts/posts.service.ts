import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { User } from '../users/entities/user.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { QueryPostsDto } from './dto/query-posts.dto';
import { PointsService, POINTS } from '../points/points.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    private readonly pointsService: PointsService,
  ) {}

  async create(authorId: string, dto: CreatePostDto): Promise<Post> {
    const post = this.postRepo.create({
      authorId,
      title: dto.title,
      content: dto.content,
      category: dto.category,
      imageUrls: dto.imageUrls ?? null,
      videoUrl: dto.videoUrl ?? null,
    });
    const saved = await this.postRepo.save(post);
    try {
      await this.pointsService.addPoints(authorId, POINTS.POST, '게시글 작성');
    } catch {
      // 포인트 적립 실패 시 글 작성은 유지
    }
    return saved;
  }

  async findAll(query: QueryPostsDto) {
    const { page = 1, limit = 20, sort = 'latest', category } = query;
    const qb = this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .select([
        'post.id',
        'post.title',
        'post.content',
        'post.category',
        'post.imageUrls',
        'post.videoUrl',
        'post.viewCount',
        'post.likeCount',
        'post.commentCount',
        'post.createdAt',
        'author.id',
        'author.nickname',
      ]);

    if (category) {
      qb.andWhere('post.category = :category', { category });
    }

    if (sort === 'popular') {
      qb.orderBy('post.likeCount', 'DESC').addOrderBy('post.createdAt', 'DESC');
    } else {
      qb.orderBy('post.createdAt', 'DESC');
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

  async findOne(id: string, incrementView = true): Promise<Post> {
    const post = await this.postRepo.findOne({
      where: { id },
      relations: ['author'],
    });
    if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다.');
    if (incrementView) {
      post.viewCount += 1;
      await this.postRepo.save(post);
    }
    return post;
  }

  async update(id: string, userId: string, dto: UpdatePostDto): Promise<Post> {
    const post = await this.findOne(id, false);
    if (post.authorId !== userId) {
      throw new ForbiddenException('수정 권한이 없습니다.');
    }
    if (dto.title !== undefined) post.title = dto.title;
    if (dto.content !== undefined) post.content = dto.content;
    if (dto.category !== undefined) post.category = dto.category;
    if (dto.imageUrls !== undefined) post.imageUrls = dto.imageUrls;
    if (dto.videoUrl !== undefined) post.videoUrl = dto.videoUrl;
    return this.postRepo.save(post);
  }

  async remove(id: string, userId: string): Promise<void> {
    const post = await this.findOne(id, false);
    if (post.authorId !== userId) {
      throw new ForbiddenException('삭제 권한이 없습니다.');
    }
    await this.postRepo.remove(post);
  }
}
