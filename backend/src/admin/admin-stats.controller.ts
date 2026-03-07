import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminStatsService } from './admin-stats.service';
import { AdminAuthGuard } from './guards/admin-auth.guard';

@Controller('admin/stats')
@UseGuards(AdminAuthGuard)
export class AdminStatsController {
  constructor(private readonly statsService: AdminStatsService) {}

  @Get()
  async dashboard() {
    return this.statsService.getDashboard();
  }
}
