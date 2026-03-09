import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';

@Entity('regions')
@Index(['depth', 'parentCode'])
export class Region extends BaseEntity {
  @Column({ type: 'varchar', length: 20, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column({ type: 'int' })
  depth: number; // 1: 시/도, 2: 구/군

  @Column({ type: 'varchar', length: 20, nullable: true })
  parentCode: string | null;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;
}

