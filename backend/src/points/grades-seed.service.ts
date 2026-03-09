import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Grade } from './entities/grade.entity';

const DEFAULT_GRADES: { minPoints: number; name: string }[] = [
  { minPoints: 0, name: '새싹 라이더' },
  { minPoints: 100, name: '브론즈 라이더' },
  { minPoints: 300, name: '실버 라이더' },
  { minPoints: 500, name: '골드 라이더' },
  { minPoints: 1000, name: '플래티넘 라이더' },
];

@Injectable()
export class GradesSeedService implements OnModuleInit {
  constructor(
    @InjectRepository(Grade)
    private readonly gradeRepo: Repository<Grade>,
  ) {}

  async onModuleInit() {
    const count = await this.gradeRepo.count();
    if (count > 0) return;
    for (const { minPoints, name } of DEFAULT_GRADES) {
      const grade = this.gradeRepo.create({ minPoints, name });
      await this.gradeRepo.save(grade);
    }
  }
}
