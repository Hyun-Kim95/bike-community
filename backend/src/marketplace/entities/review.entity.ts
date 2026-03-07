import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { User } from '../../users/entities/user.entity';
import { MarketplaceItem } from './marketplace-item.entity';

@Entity('reviews')
@Index(['itemId'])
@Index(['reviewerId', 'revieweeId'])
export class Review extends BaseEntity {
  @Column({ type: 'uuid' })
  itemId: string;

  @ManyToOne(() => MarketplaceItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'itemId' })
  item: MarketplaceItem;

  @Column({ type: 'uuid' })
  reviewerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reviewerId' })
  reviewer: User;

  @Column({ type: 'uuid' })
  revieweeId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'revieweeId' })
  reviewee: User;

  @Column({ type: 'smallint' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  content: string | null;
}
