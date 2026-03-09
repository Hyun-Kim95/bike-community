import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';

@Entity('grades')
export class Grade extends BaseEntity {
  @Column({ type: 'int', default: 0 })
  minPoints: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;
}
