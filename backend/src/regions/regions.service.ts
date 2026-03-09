import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Region } from './entities/region.entity';

@Injectable()
export class RegionsService {
  constructor(
    @InjectRepository(Region)
    private readonly regionRepo: Repository<Region>,
  ) {}

  async findParents() {
    return this.regionRepo.find({
      where: { depth: 1 },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async findChildren(parentCode: string) {
    return this.regionRepo.find({
      where: { depth: 2, parentCode },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }
}

