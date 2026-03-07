import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PointHistory } from './entities/point-history.entity';
import { Attendance } from './entities/attendance.entity';
import { UserProfile } from '../users/entities/user-profile.entity';
import { PointsService } from './points.service';
import { AttendanceService } from './attendance.service';
import { PointsController } from './points.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([PointHistory, Attendance, UserProfile]),
  ],
  controllers: [PointsController],
  providers: [PointsService, AttendanceService],
  exports: [TypeOrmModule, PointsService, AttendanceService],
})
export class PointsModule {}
