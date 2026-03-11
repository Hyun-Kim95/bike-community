/**
 * 샘플용 도메인 데이터 초기화 스크립트.
 * DATABASE_URL 환경변수 설정 후 `npm run reset:sample`
 *
 * - users / user_profiles
 * - posts / comments / likes
 * - notices
 * - marketplace_items / trade_chat_rooms / trade_messages / reviews / wishes
 * - reports / point_histories
 * 을 모두 비우고 ID 시퀀스를 리셋합니다.
 */
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from '../users/entities/user.entity';
import { UserProfile } from '../users/entities/user-profile.entity';
import { Post } from '../posts/entities/post.entity';
import { Comment } from '../posts/entities/comment.entity';
import { Like } from '../posts/entities/like.entity';
import { Notice } from '../notices/entities/notice.entity';
import { MarketplaceItem } from '../marketplace/entities/marketplace-item.entity';
import { TradeChatRoom } from '../marketplace/entities/trade-chat-room.entity';
import { TradeMessage } from '../marketplace/entities/trade-message.entity';

dotenv.config();

async function reset() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL required');
    process.exit(1);
  }

  const ds = new DataSource({
    type: 'postgres',
    url,
    entities: [User, UserProfile, Post, Comment, Like, Notice, MarketplaceItem, TradeChatRoom, TradeMessage],
    synchronize: false,
  });

  await ds.initialize();

  try {
    console.log('Truncating sample tables (including activity logs)...');
    await ds.query(
      'TRUNCATE TABLE "activity_logs", "point_histories", "reports", "trade_messages", "trade_chat_rooms", "reviews", "wishes", "marketplace_items", "likes", "comments", "posts", "notices", "user_profiles", "users" RESTART IDENTITY CASCADE',
    );
    console.log('Sample tables truncated.');
  } finally {
    await ds.destroy();
  }
}

reset().catch((e) => {
  console.error(e);
  process.exit(1);
});

