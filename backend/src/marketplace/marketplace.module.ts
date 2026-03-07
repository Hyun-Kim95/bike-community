import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketplaceItem } from './entities/marketplace-item.entity';
import { TradeChatRoom } from './entities/trade-chat-room.entity';
import { TradeMessage } from './entities/trade-message.entity';
import { Review } from './entities/review.entity';
import { Wish } from './entities/wish.entity';
import { MarketplaceService } from './marketplace.service';
import { MarketplaceController } from './marketplace.controller';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    NotificationsModule,
    TypeOrmModule.forFeature([
      MarketplaceItem,
      TradeChatRoom,
      TradeMessage,
      Review,
      Wish,
    ]),
  ],
  controllers: [MarketplaceController, ChatController, ReviewsController],
  providers: [MarketplaceService, ChatService, ReviewsService],
  exports: [TypeOrmModule, MarketplaceService, ChatService],
})
export class MarketplaceModule {}
