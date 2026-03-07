import {
  Entity,
  Column,
  OneToOne,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { UserProfile } from './user-profile.entity';

export enum UserStatus {
  NORMAL = 'normal',
  SUSPENDED = 'suspended',
  WITHDRAWN = 'withdrawn',
  DORMANT = 'dormant',
}

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  @Index()
  email: string;

  @Column()
  passwordHash: string;

  @Column({ length: 50 })
  nickname: string;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.NORMAL })
  status: UserStatus;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date | null;

  @OneToOne(() => UserProfile, (profile) => profile.user, { cascade: true })
  profile: UserProfile;
}
