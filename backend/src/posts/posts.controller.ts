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
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { QueryPostsDto } from './dto/query-posts.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

export const POST_CATEGORIES = [
  '로드',
  'MTB',
  'BMX',
  '미니벨로',
  '부품/용품',
  '정비/튜닝',
  '라이딩 후기',
  '자유게시판',
];

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get('categories')
  getCategories() {
    return { categories: POST_CATEGORIES };
  }

  @Get()
  async findAll(@Query() query: QueryPostsDto) {
    return this.postsService.findAll(query);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async findMyPosts(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? Math.min(parseInt(limit, 10), 50) : 20;
    return this.postsService.findByAuthor(user.id, p, l);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@CurrentUser() user: User, @Body() dto: CreatePostDto) {
    return this.postsService.create(user.id, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdatePostDto,
  ) {
    return this.postsService.update(id, user.id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    await this.postsService.remove(id, user.id);
  }
}
