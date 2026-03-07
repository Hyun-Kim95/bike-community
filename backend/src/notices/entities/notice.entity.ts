import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';

@Entity('notices')
@Index(['pinned', 'createdAt'])
export class Notice extends BaseEntity {
  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'boolean', default: false })
  pinned: boolean;
}
