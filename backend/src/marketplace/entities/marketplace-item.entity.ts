import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { User } from '../../users/entities/user.entity';

export enum SaleStatus {
  ON_SALE = 'on_sale',
  RESERVED = 'reserved',
  SOLD = 'sold',
  HIDDEN = 'hidden',
}

@Entity('marketplace_items')
@Index(['category', 'createdAt'])
@Index(['sellerId', 'saleStatus'])
@Index(['region'])
export class MarketplaceItem extends BaseEntity {
  @Column({ type: 'uuid' })
  sellerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sellerId' })
  seller: User;

  @Column({ length: 200 })
  title: string;

  @Column({ length: 50 })
  category: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: number;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'simple-array' })
  imageUrls: string[];

  @Column({ length: 100 })
  region: string;

  @Column({ type: 'enum', enum: SaleStatus, default: SaleStatus.ON_SALE })
  saleStatus: SaleStatus;

  @Column({ type: 'int', default: 0 })
  viewCount: number;

  @Column({ type: 'int', default: 0 })
  wishCount: number;

  @Column({ type: 'uuid', nullable: true })
  reservedPartnerId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'reservedPartnerId' })
  reservedPartner?: User | null;
}
