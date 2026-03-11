import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { AdminUser } from './admin-user.entity';

@Entity('activity_logs')
@Index(['createdAt'])
export class ActivityLog extends BaseEntity {
  @Column({ type: 'uuid', nullable: true })
  adminId: string | null;

  @ManyToOne(() => AdminUser, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'adminId' })
  admin: AdminUser | null;

  @Column({ type: 'varchar', length: 100 })
  action: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  targetType: string | null;

  @Column({ type: 'uuid', nullable: true })
  targetId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  meta: Record<string, unknown> | null;
}

