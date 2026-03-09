import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  async create(@CurrentUser() user: User, @Body() dto: CreateReportDto) {
    return this.reportsService.create(user.id, dto);
  }

  @Get('mine')
  async findMine(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? Math.min(parseInt(limit, 10), 50) : 20;
    return this.reportsService.findMyReports(user.id, p, l);
  }
}
