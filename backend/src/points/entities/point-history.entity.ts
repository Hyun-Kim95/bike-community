import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { User } from '../../users/entities/user.entity';

@Entity('point_histories')
@Index(['userId', 'createdAt'])
export class PointHistory extends BaseEntity {
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'int' })
  amount: number;

  @Column({ length: 50 })
  reason: string;

  @Column({ type: 'int' })
  balanceAfter: number;
}
