import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PointHistory } from './entities/point-history.entity';
import { Grade } from './entities/grade.entity';
import { Attendance } from './entities/attendance.entity';
import { UserProfile } from '../users/entities/user-profile.entity';
import { PointsService } from './points.service';
import { GradesService } from './grades.service';
import { AttendanceService } from './attendance.service';
import { GradesSeedService } from './grades-seed.service';
import { PointsController } from './points.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([PointHistory, Grade, Attendance, UserProfile]),
  ],
  controllers: [PointsController],
  providers: [PointsService, GradesService, AttendanceService, GradesSeedService],
  exports: [TypeOrmModule, PointsService, GradesService, AttendanceService],
})
export class PointsModule {}
