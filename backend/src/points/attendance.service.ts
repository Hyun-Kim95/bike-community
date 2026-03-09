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

  /** 한국 시간(Asia/Seoul) 기준 오늘 날짜 YYYY-MM-DD */
  private getTodayDateString(): string {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
  }

  /** 한국 시간 기준 어제 날짜 YYYY-MM-DD */
  private getYesterdayDateString(): string {
    const todayStr = this.getTodayDateString();
    const todayMidnightKST = new Date(`${todayStr}T00:00:00+09:00`);
    const yesterday = new Date(todayMidnightKST.getTime() - 24 * 60 * 60 * 1000);
    return yesterday.toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
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
