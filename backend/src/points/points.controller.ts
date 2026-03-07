import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { PointsService } from './points.service';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('points')
@UseGuards(JwtAuthGuard)
export class PointsController {
  constructor(
    private readonly pointsService: PointsService,
    private readonly attendanceService: AttendanceService,
  ) {}

  @Post('attendance')
  async checkIn(@CurrentUser() user: User) {
    return this.attendanceService.checkIn(user.id);
  }

  @Get('attendance/today')
  async getTodayStatus(@CurrentUser() user: User) {
    return this.attendanceService.getTodayStatus(user.id);
  }

  @Get('history')
  async getHistory(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 20;
    return this.pointsService.getHistory(user.id, p, l);
  }
}
