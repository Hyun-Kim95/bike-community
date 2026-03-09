import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { PointsService } from '../points/points.service';

@Controller('admin/points')
@UseGuards(AdminAuthGuard)
export class AdminPointsController {
  constructor(private readonly pointsService: PointsService) {}

  @Post()
  async grantOrDeduct(
    @Body() body: { userId: string; amount: number; reason: string },
  ) {
    const { userId, amount, reason } = body;
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      throw new BadRequestException('회원 ID를 입력하세요.');
    }
    const numAmount = Number(amount);
    if (Number.isNaN(numAmount) || numAmount === 0) {
      throw new BadRequestException('0이 아닌 변동량을 입력하세요.');
    }
    const trimmedReason = reason == null ? '' : String(reason).trim();
    if (!trimmedReason) {
      throw new BadRequestException('사유를 입력하세요.');
    }
    const balanceAfter = await this.pointsService.addPoints(
      userId.trim(),
      numAmount,
      trimmedReason.slice(0, 50),
    );
    return { balanceAfter: balanceAfter.balanceAfter };
  }

  @Get('history')
  async getHistory(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('userId') userId?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 20;
    const result = await this.pointsService.getHistoryForAdmin({
      userId: userId?.trim() || undefined,
      page: p,
      limit: Math.min(l, 50),
    });
    const items = result.items.map((h) => ({
      id: h.id,
      userId: h.userId,
      amount: h.amount,
      reason: h.reason,
      balanceAfter: h.balanceAfter,
      createdAt: h.createdAt,
      user: h.user
        ? { id: h.user.id, email: h.user.email, nickname: h.user.nickname }
        : undefined,
    }));
    return { ...result, items };
  }
}
