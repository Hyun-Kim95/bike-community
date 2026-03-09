import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Grade } from './entities/grade.entity';

export interface GradePolicyItem {
  id: string;
  minPoints: number;
  name: string;
}

@Injectable()
export class GradesService {
  constructor(
    @InjectRepository(Grade)
    private readonly gradeRepo: Repository<Grade>,
  ) {}

  async getPolicy(): Promise<GradePolicyItem[]> {
    const list = await this.gradeRepo.find({
      order: { minPoints: 'ASC' },
    });
    return list.map((g) => ({ id: g.id, minPoints: g.minPoints, name: g.name }));
  }

  async create(minPoints: number, name: string): Promise<GradePolicyItem> {
    const grade = this.gradeRepo.create({ minPoints, name });
    await this.gradeRepo.save(grade);
    return { id: grade.id, minPoints: grade.minPoints, name: grade.name };
  }

  async update(id: string, body: { minPoints?: number; name?: string }): Promise<GradePolicyItem> {
    const grade = await this.gradeRepo.findOne({ where: { id } });
    if (!grade) throw new NotFoundException('등급을 찾을 수 없습니다.');
    if (body.minPoints !== undefined) grade.minPoints = body.minPoints;
    if (body.name !== undefined) grade.name = body.name;
    await this.gradeRepo.save(grade);
    return { id: grade.id, minPoints: grade.minPoints, name: grade.name };
  }

  async delete(id: string): Promise<void> {
    const result = await this.gradeRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException('등급을 찾을 수 없습니다.');
  }
}
