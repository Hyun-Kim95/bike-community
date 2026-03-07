import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Like } from './entities/like.entity';
import { Post } from './entities/post.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class LikesService {
  constructor(
    @InjectRepository(Like)
    private readonly likeRepo: Repository<Like>,
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async toggle(postId: string, userId: string): Promise<{ liked: boolean }> {
    const post = await this.postRepo.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다.');

    const existing = await this.likeRepo.findOne({
      where: { postId, userId },
    });
    if (existing) {
      await this.likeRepo.remove(existing);
      post.likeCount = Math.max(0, post.likeCount - 1);
      await this.postRepo.save(post);
      return { liked: false };
    }
    const like = this.likeRepo.create({ postId, userId });
    await this.likeRepo.save(like);
    post.likeCount += 1;
    await this.postRepo.save(post);
    if (post.authorId !== userId) {
      try {
        const liker = await this.likeRepo.manager
          .getRepository(User)
          .findOne({ where: { id: userId }, select: ['nickname'] });
        const nickname = liker?.nickname ?? '익명';
        await this.notificationsService.create({
          userId: post.authorId,
          type: 'like',
          title: `${nickname}님이 게시글에 좋아요를 눌렀습니다`,
          body: post.title?.slice(0, 80) ?? null,
          payload: { postId },
        });
      } catch {
        // 알림 생성 실패 시 무시
      }
    }
    return { liked: true };
  }

  async isLiked(postId: string, userId: string): Promise<boolean> {
    const like = await this.likeRepo.findOne({
      where: { postId, userId },
    });
    return !!like;
  }
}
