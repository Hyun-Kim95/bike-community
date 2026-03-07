import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attendance } from './entities/attendance.entity';
import { PointsService, POINTS } from './points.service';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepo: Repository<Attendance>,
    private readonly pointsService: PointsService,
  ) {}

  private getTodayDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getYesterdayDateString(): string {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async checkIn(userId: string): Promise<{
    alreadyCheckedIn: boolean;
    points?: number;
    consecutiveDays?: number;
    totalPoints?: number;
  }> {
    const today = this.getTodayDateString();
    const existing = await this.attendanceRepo.findOne({
      where: { userId, date: today },
    });
    if (existing) {
      return { alreadyCheckedIn: true };
    }

    const yesterday = this.getYesterdayDateString();
    const yesterdayAttendance = await this.attendanceRepo.findOne({
      where: { userId, date: yesterday },
    });
    const consecutiveDays = yesterdayAttendance
      ? yesterdayAttendance.consecutiveDays + 1
      : 1;

    const attendance = this.attendanceRepo.create({
      userId,
      date: today,
      consecutiveDays,
    });
    await this.attendanceRepo.save(attendance);

    const { balanceAfter } = await this.pointsService.addPoints(
      userId,
      POINTS.ATTENDANCE,
      '출석 체크',
    );

    return {
      alreadyCheckedIn: false,
      points: POINTS.ATTENDANCE,
      consecutiveDays,
      totalPoints: balanceAfter,
    };
  }

  async getTodayStatus(userId: string): Promise<{ checkedIn: boolean; consecutiveDays?: number }> {
    const today = this.getTodayDateString();
    const record = await this.attendanceRepo.findOne({
      where: { userId, date: today },
    });
    if (!record) return { checkedIn: false };
    return { checkedIn: true, consecutiveDays: record.consecutiveDays };
  }

  async getConsecutiveDays(userId: string): Promise<number> {
    const today = this.getTodayDateString();
    const record = await this.attendanceRepo.findOne({
      where: { userId, date: today },
    });
    return record?.consecutiveDays ?? 0;
  }
}
