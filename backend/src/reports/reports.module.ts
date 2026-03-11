import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Report } from './entities/report.entity';
import { Post } from '../posts/entities/post.entity';
import { Comment } from '../posts/entities/comment.entity';
import { Review } from '../marketplace/entities/review.entity';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Report, Post, Comment, Review]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [TypeOrmModule, ReportsService],
})
export class ReportsModule {}
