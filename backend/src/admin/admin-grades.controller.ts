import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { GradesService } from '../points/grades.service';
import { POINTS } from '../points/points.service';

@Controller('admin/grades')
export class AdminGradesController {
  constructor(private readonly gradesService: GradesService) {}

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
  async create(@Body() body: { minPoints: number; name: string }) {
    const { minPoints, name } = body;
    if (name == null || String(name).trim() === '') throw new BadRequestException('등급명을 입력하세요.');
    return this.gradesService.create(Number(minPoints) ?? 0, name.trim());
  }

  @Patch(':id')
  @UseGuards(AdminAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() body: { minPoints?: number; name?: string },
  ) {
    const updates: { minPoints?: number; name?: string } = {};
    if (body.minPoints !== undefined) updates.minPoints = Number(body.minPoints);
    if (body.name !== undefined) updates.name = body.name.trim();
    return this.gradesService.update(id, updates);
  }

  @Delete(':id')
  @UseGuards(AdminAuthGuard)
  async delete(@Param('id') id: string) {
    await this.gradesService.delete(id);
    return { ok: true };
  }
}
