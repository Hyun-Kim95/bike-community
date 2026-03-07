import { Entity, Column, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { User } from '../../users/entities/user.entity';
import { MarketplaceItem } from './marketplace-item.entity';
import { TradeMessage } from './trade-message.entity';

@Entity('trade_chat_rooms')
@Index(['itemId', 'buyerId'])
@Index(['buyerId'])
@Index(['sellerId'])
export class TradeChatRoom extends BaseEntity {
  @Column({ type: 'uuid' })
  itemId: string;

  @ManyToOne(() => MarketplaceItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'itemId' })
  item: MarketplaceItem;

  @Column({ type: 'uuid' })
  buyerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'buyerId' })
  buyer: User;

  @Column({ type: 'uuid' })
  sellerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sellerId' })
  seller: User;

  @OneToMany(() => TradeMessage, (m) => m.room)
  messages: TradeMessage[];
}
