import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { TradeChatRoom } from './entities/trade-chat-room.entity';
import { TradeMessage } from './entities/trade-message.entity';
import { MarketplaceItem } from './entities/marketplace-item.entity';
import { SendMessageDto } from './dto/send-message.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(TradeChatRoom)
    private readonly roomRepo: Repository<TradeChatRoom>,
    @InjectRepository(TradeMessage)
    private readonly messageRepo: Repository<TradeMessage>,
    @InjectRepository(MarketplaceItem)
    private readonly itemRepo: Repository<MarketplaceItem>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getOrCreateRoom(itemId: string, userId: string): Promise<TradeChatRoom> {
    const item = await this.itemRepo.findOne({
      where: { id: itemId },
      relations: ['seller'],
    });
    if (!item) throw new NotFoundException('상품을 찾을 수 없습니다.');
    if (item.saleStatus === 'sold') {
      throw new ForbiddenException('이미 거래가 완료된 상품입니다.');
    }
    if (item.sellerId === userId) {
      throw new ForbiddenException('본인 상품에는 채팅할 수 없습니다. 채팅 목록에서 대화를 이어가세요.');
    }
    let room = await this.roomRepo.findOne({
      where: { itemId, buyerId: userId },
      relations: ['item', 'buyer', 'seller'],
    });
    if (room) return room;
    room = this.roomRepo.create({
      itemId,
      buyerId: userId,
      sellerId: item.sellerId,
    });
    return this.roomRepo.save(room);
  }

  async getMyRooms(userId: string): Promise<any[]> {
    const rooms = await this.roomRepo.find({
      where: [{ buyerId: userId }, { sellerId: userId }],
      relations: ['item', 'buyer', 'seller'],
      order: { updatedAt: 'DESC' },
      take: 50,
    });
    const enriched = await Promise.all(
      rooms.map(async (room) => {
        const unreadCount = await this.messageRepo.count({
          where: { roomId: room.id, senderId: Not(userId), read: false },
        });
        return { ...room, unreadCount };
      }),
    );
    return enriched;
  }

  async getRoom(roomId: string, userId: string): Promise<TradeChatRoom> {
    const room = await this.roomRepo.findOne({
      where: { id: roomId },
      relations: ['item', 'buyer', 'seller'],
    });
    if (!room) throw new NotFoundException('채팅방을 찾을 수 없습니다.');
    if (room.buyerId !== userId && room.sellerId !== userId) {
      throw new ForbiddenException('접근 권한이 없습니다.');
    }
    return room;
  }

  async getMessages(roomId: string, userId: string, page = 1, limit = 50) {
    await this.getRoom(roomId, userId);
    const [items, total] = await this.messageRepo.findAndCount({
      where: { roomId },
      relations: ['sender'],
      order: { createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    // 내가 아닌 사람이 보낸 읽지 않은 메시지를 모두 읽음 처리
    await this.messageRepo.update(
      { roomId, senderId: Not(userId), read: false },
      { read: true },
    );
    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async sendMessage(roomId: string, userId: string, dto: SendMessageDto): Promise<TradeMessage> {
    const room = await this.getRoom(roomId, userId);
    if (room.buyerId !== userId && room.sellerId !== userId) {
      throw new ForbiddenException('접근 권한이 없습니다.');
    }
    const message = this.messageRepo.create({
      roomId,
      senderId: userId,
      content: dto.content,
      imageUrl: dto.imageUrl ?? null,
    });
    const saved = await this.messageRepo.save(message);
    // 내가 보낸 시점에, 상대방이 보낸 읽지 않은 메시지는 모두 읽은 것으로 처리
    await this.messageRepo.update(
      { roomId, senderId: Not(userId), read: false },
      { read: true },
    );

    room.updatedAt = new Date();
    await this.roomRepo.save(room);
    const recipientId = room.buyerId === userId ? room.sellerId : room.buyerId;
    try {
      const sender = await this.messageRepo.manager
        .getRepository(User)
        .findOne({ where: { id: userId }, select: ['nickname'] });
      const nickname = sender?.nickname ?? '익명';
      const itemTitle = room.item?.title ?? '상품';
      await this.notificationsService.create({
        userId: recipientId,
        type: 'chat',
        title: `${nickname}님의 메시지`,
        body: dto.content?.slice(0, 80) ?? itemTitle,
        payload: { roomId, itemId: room.itemId },
      });
    } catch {
      // 알림 생성 실패 시 무시
    }
    return this.messageRepo.findOne({
      where: { id: saved.id },
      relations: ['sender'],
    }) as Promise<TradeMessage>;
  }
}
