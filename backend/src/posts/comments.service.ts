import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { Post } from './entities/post.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { User } from '../users/entities/user.entity';
import { PointsService, POINTS } from '../points/points.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    private readonly pointsService: PointsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(
    postId: string,
    authorId: string,
    dto: CreateCommentDto,
  ): Promise<Comment> {
    const post = await this.postRepo.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다.');
    const comment = this.commentRepo.create({
      postId,
      authorId,
      content: dto.content,
    });
    const saved = await this.commentRepo.save(comment);
    post.commentCount += 1;
    await this.postRepo.save(post);
    try {
      await this.pointsService.addPoints(authorId, POINTS.COMMENT, '댓글 작성');
    } catch {
      // 포인트 적립 실패 시 댓글은 유지
    }
    if (post.authorId !== authorId) {
      try {
        const author = await this.commentRepo.manager
          .getRepository(User)
          .findOne({ where: { id: authorId }, select: ['nickname'] });
        const nickname = author?.nickname ?? '익명';
        await this.notificationsService.create({
          userId: post.authorId,
          type: 'comment',
          title: `${nickname}님이 댓글을 남겼습니다`,
          body: dto.content?.slice(0, 80) ?? null,
          payload: { postId, commentId: saved.id },
        });
      } catch {
        // 알림 생성 실패 시 무시
      }
    }
    return this.commentRepo.findOne({
      where: { id: saved.id },
      relations: ['author'],
    }) as Promise<Comment>;
  }

  async findByPostId(
    postId: string,
    page = 1,
    limit = 20,
  ): Promise<{ items: Comment[]; total: number }> {
    const [items, total] = await this.commentRepo.findAndCount({
      where: { postId },
      relations: ['author'],
      order: { createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total };
  }

  async update(
    commentId: string,
    userId: string,
    content: string,
  ): Promise<Comment> {
    const comment = await this.commentRepo.findOne({
      where: { id: commentId },
      relations: ['author'],
    });
    if (!comment) throw new NotFoundException('댓글을 찾을 수 없습니다.');
    if (comment.authorId !== userId) {
      throw new ForbiddenException('수정 권한이 없습니다.');
    }
    comment.content = content;
    return this.commentRepo.save(comment);
  }

  async remove(commentId: string, userId: string): Promise<void> {
    const comment = await this.commentRepo.findOne({
      where: { id: commentId },
    });
    if (!comment) throw new NotFoundException('댓글을 찾을 수 없습니다.');
    if (comment.authorId !== userId) {
      throw new ForbiddenException('삭제 권한이 없습니다.');
    }
    const postId = comment.postId;
    await this.commentRepo.remove(comment);
    const post = await this.postRepo.findOne({ where: { id: postId } });
    if (post && post.commentCount > 0) {
      post.commentCount -= 1;
      await this.postRepo.save(post);
    }
  }
}
