import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { Comment } from './entities/comment.entity';
import { Like } from './entities/like.entity';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { LikesService } from './likes.service';
import { LikesController } from './likes.controller';
import { PointsModule } from '../points/points.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, Comment, Like]),
    PointsModule,
    NotificationsModule,
  ],
  controllers: [PostsController, CommentsController, LikesController],
  providers: [PostsService, CommentsService, LikesService],
  exports: [TypeOrmModule, PostsService, CommentsService, LikesService],
})
export class PostsModule {}
