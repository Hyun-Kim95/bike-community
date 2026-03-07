import { Entity, Column, ManyToOne, JoinColumn, Unique, Index } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { User } from '../../users/entities/user.entity';
import { MarketplaceItem } from './marketplace-item.entity';

@Entity('wishes')
@Unique(['userId', 'itemId'])
@Index(['userId'])
@Index(['itemId'])
export class Wish extends BaseEntity {
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid' })
  itemId: string;

  @ManyToOne(() => MarketplaceItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'itemId' })
  item: MarketplaceItem;
}
