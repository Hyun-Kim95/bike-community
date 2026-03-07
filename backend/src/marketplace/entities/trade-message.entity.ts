import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { User } from '../../users/entities/user.entity';
import { TradeChatRoom } from './trade-chat-room.entity';

@Entity('trade_messages')
@Index(['roomId', 'createdAt'])
export class TradeMessage extends BaseEntity {
  @Column({ type: 'uuid' })
  roomId: string;

  @ManyToOne(() => TradeChatRoom, (r) => r.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roomId' })
  room: TradeChatRoom;

  @Column({ type: 'uuid' })
  senderId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @Column({ type: 'text' })
  content: string;

  @Column({ nullable: true })
  imageUrl: string | null;

  @Column({ type: 'boolean', default: false })
  read: boolean;
}
