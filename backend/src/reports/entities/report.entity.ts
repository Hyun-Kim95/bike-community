import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { User } from '../../users/entities/user.entity';

export enum ReportTargetType {
  POST = 'post',
  COMMENT = 'comment',
  CHAT = 'chat',
  USER = 'user',
}

export enum ReportStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  RESOLVED = 'resolved',
  REJECTED = 'rejected',
}

@Entity('reports')
@Index(['status', 'createdAt'])
@Index(['targetType', 'targetId'])
export class Report extends BaseEntity {
  @Column({ type: 'uuid' })
  reporterId: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reporterId' })
  reporter: User;

  @Column({ type: 'enum', enum: ReportTargetType })
  targetType: ReportTargetType;

  @Column({ type: 'uuid' })
  targetId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  reason: string | null;

  @Column({ type: 'text', nullable: true })
  detail: string | null;

  @Column({ type: 'enum', enum: ReportStatus, default: ReportStatus.PENDING })
  status: ReportStatus;

  @Column({ type: 'uuid', nullable: true })
  processedBy: string | null;

  @Column({ type: 'text', nullable: true })
  adminNote: string | null;
}
