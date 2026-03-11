import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { GradesService } from '../points/grades.service';
import { POINTS } from '../points/points.service';
import { ActivityLog } from './entities/activity-log.entity';
import { CurrentAdmin } from './decorators/current-admin.decorator';
import { AdminUser } from './entities/admin-user.entity';

@Controller('admin/grades')
export class AdminGradesController {
  constructor(
    private readonly gradesService: GradesService,
    @InjectRepository(ActivityLog)
    private readonly logRepo: Repository<ActivityLog>,
  ) {}

  @Get()
  @UseGuards(AdminAuthGuard)
  async getGrades() {
    const gradePolicy = await this.gradesService.getPolicy();
    return {
      gradePolicy,
      points: POINTS,
    };
  }

  @Post()
  @UseGuards(AdminAuthGuard)
  async create(
    @Body() body: { minPoints: number; name: string },
    @CurrentAdmin() admin: AdminUser,
  ) {
    const { minPoints, name } = body;
    if (name == null || String(name).trim() === '') throw new BadRequestException('등급명을 입력하세요.');
    const created = await this.gradesService.create(Number(minPoints) ?? 0, name.trim());
    await this.logRepo.save(
      this.logRepo.create({
        adminId: admin.id,
        action: 'grade.create',
        targetType: 'grade',
        targetId: created.id,
        meta: { minPoints: created.minPoints, name: created.name },
      }),
    );
    return created;
  }

  @Patch(':id')
  @UseGuards(AdminAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() body: { minPoints?: number; name?: string },
    @CurrentAdmin() admin: AdminUser,
  ) {
    const updates: { minPoints?: number; name?: string } = {};
    if (body.minPoints !== undefined) updates.minPoints = Number(body.minPoints);
    if (body.name !== undefined) updates.name = body.name.trim();
    const updated = await this.gradesService.update(id, updates);
    await this.logRepo.save(
      this.logRepo.create({
        adminId: admin.id,
        action: 'grade.update',
        targetType: 'grade',
        targetId: updated.id,
        meta: { minPoints: updated.minPoints, name: updated.name },
      }),
    );
    return updated;
  }

  @Delete(':id')
  @UseGuards(AdminAuthGuard)
  async delete(@Param('id') id: string, @CurrentAdmin() admin: AdminUser) {
    await this.gradesService.delete(id);
    await this.logRepo.save(
      this.logRepo.create({
        adminId: admin.id,
        action: 'grade.delete',
        targetType: 'grade',
        targetId: id,
        meta: {},
      }),
    );
    return { ok: true };
  }
}
