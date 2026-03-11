/**
 * 샘플 데이터 생성 스크립트.
 * DATABASE_URL 환경변수 설정 후 `npm run seed:sample`
 *
 * - 회원 5명 생성
 * - 2026-02-01부터 며칠 간 커뮤니티 게시글, 댓글
 * - 중고거래 상품, 거래 채팅/메시지
 */
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { User, UserStatus } from '../users/entities/user.entity';
import { UserProfile } from '../users/entities/user-profile.entity';
import { Post } from '../posts/entities/post.entity';
import { Comment } from '../posts/entities/comment.entity';
import { Like } from '../posts/entities/like.entity';
import { Notice } from '../notices/entities/notice.entity';
import { MarketplaceItem, SaleStatus } from '../marketplace/entities/marketplace-item.entity';
import { TradeChatRoom } from '../marketplace/entities/trade-chat-room.entity';
import { TradeMessage } from '../marketplace/entities/trade-message.entity';
import { Review } from '../marketplace/entities/review.entity';
import { Report, ReportStatus, ReportTargetType } from '../reports/entities/report.entity';
import { PointHistory } from '../points/entities/point-history.entity';

dotenv.config();

async function seed() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL required');
    process.exit(1);
  }

  const ds = new DataSource({
    type: 'postgres',
    url,
    entities: [User, UserProfile, Post, Comment, Like, Notice, MarketplaceItem, TradeChatRoom, TradeMessage, Review, Report, PointHistory],
    synchronize: false,
  });

  await ds.initialize();

  try {
    const userRepo = ds.getRepository(User);
    const profileRepo = ds.getRepository(UserProfile);
    const postRepo = ds.getRepository(Post);
    const commentRepo = ds.getRepository(Comment);
    const noticeRepo = ds.getRepository(Notice);
    const itemRepo = ds.getRepository(MarketplaceItem);
    const roomRepo = ds.getRepository(TradeChatRoom);
    const msgRepo = ds.getRepository(TradeMessage);
    const reviewRepo = ds.getRepository(Review);
    const reportRepo = ds.getRepository(Report);
    const pointRepo = ds.getRepository(PointHistory);

    // 1) 회원 5명 확보 (없으면 생성)
    const baseEmail = 'sample';
    const existing = await userRepo.find({
      where: {},
      take: 5,
    });

    const users: User[] = [];
    if (existing.length >= 5) {
      users.push(...existing.slice(0, 5));
      console.log('Reusing existing users for sample:', users.map((u) => u.email));
    } else {
      const passwordHash = await bcrypt.hash('Sample1234!', 10);
      const regions = ['서울 강남구', '서울 마포구', '경기 성남시', '부산 수영구', '대전 유성구'];
      const nicknames = ['라이더1', '라이더2', '라이더3', '라이더4', '라이더5'];

      for (let i = 0; i < 5; i += 1) {
        const u = userRepo.create({
          email: `${baseEmail}${i + 1}@bike.local`,
          passwordHash,
          nickname: nicknames[i],
          status: UserStatus.NORMAL,
        });
        await userRepo.save(u);
        const profile = profileRepo.create({
          userId: u.id,
          avatarUrl: null,
          bio: `${nicknames[i]}의 샘플 프로필`,
          interestCategories: ['로드', '라이딩 후기'],
          region: regions[i],
          gradeName: '새싹 라이더',
          totalPoints: 0,
        });
        await profileRepo.save(profile);
        users.push(u);
      }
      console.log('Sample users created:', users.map((u) => u.email));
    }

    if (users.length < 2) {
      console.warn('샘플 데이터를 생성할 최소 2명의 사용자가 필요합니다.');
      return;
    }

    const startDate = new Date('2026-02-01T09:00:00+09:00');

    // 2) 커뮤니티 게시글 및 댓글 샘플
    const postTitles = [
      '2월 첫 라이딩 다녀왔어요',
      '자전거 체인 청소 팁 공유',
      '주말 한강 라이딩 모임 모집',
      '업힐 연습 루트 추천해주세요',
      '동네 자전거 카페 후기',
    ];

    const posts: Post[] = [];
    for (let i = 0; i < postTitles.length; i += 1) {
      const author = users[i % users.length];
      const createdAt = new Date(startDate);
      createdAt.setDate(startDate.getDate() + i);

      const post = postRepo.create({
        authorId: author.id,
        title: postTitles[i],
        content: `${postTitles[i]}\n\n샘플 본문 내용입니다. ${i + 1}번째 게시글.`,
        category: i % 2 === 0 ? '라이딩 후기' : '자유게시판',
        imageUrls: null,
        videoUrl: null,
        viewCount: 10 + i * 3,
        likeCount: 2 + i,
        commentCount: 0,
      });
      const saved = await postRepo.save(post);
      await postRepo.update(saved.id, { createdAt });
      posts.push(await postRepo.findOneOrFail({ where: { id: saved.id } }));
    }

    // 댓글 1~2개씩 생성
    for (let i = 0; i < posts.length; i += 1) {
      const post = posts[i];
      const commentCount = (i % 2) + 1;
      for (let j = 0; j < commentCount; j += 1) {
        const author = users[(i + j + 1) % users.length];
        const createdAt = new Date(startDate);
        createdAt.setDate(startDate.getDate() + i);
        createdAt.setHours(10 + j);

        const comment = commentRepo.create({
          postId: post.id,
          authorId: author.id,
          content: `${author.nickname}의 샘플 댓글 ${j + 1}`,
        });
        const saved = await commentRepo.save(comment);
        await commentRepo.update(saved.id, { createdAt });
        post.commentCount += 1;
      }
      await postRepo.save(post);
    }

    console.log('Sample posts & comments created.');

    // 3) 공지사항 샘플
    const notices = [
      {
        title: '2월 라이딩 이벤트 안내',
        content: '2월 한 달 동안 라이딩 인증 이벤트를 진행합니다.\n상세 내용은 커뮤니티 공지를 참고해주세요.',
        pinned: true,
        offsetDay: -1,
      },
      {
        title: '중고 거래 이용 수칙',
        content: '사기 예방을 위해 직거래 시 신분증 확인, 안전결제 사용을 권장합니다.',
        pinned: true,
        offsetDay: 0,
      },
      {
        title: '앱 업데이트 안내',
        content: '통계 화면과 활동 로그 기능이 추가되었습니다.',
        pinned: false,
        offsetDay: 1,
      },
    ] as const;

    for (const n of notices) {
      const createdAt = new Date(startDate);
      createdAt.setDate(startDate.getDate() + n.offsetDay);
      const notice = noticeRepo.create({
        title: n.title,
        content: n.content,
        pinned: n.pinned,
      });
      const saved = await noticeRepo.save(notice);
      await noticeRepo.update(saved.id, { createdAt });
    }

    console.log('Sample notices created.');

    // 4) 중고거래 상품 샘플
    const items: MarketplaceItem[] = [];
    const itemData = [
      {
        title: '로드 자전거 프레임 판매',
        category: '로드',
        price: 800000,
        region: '서울 강남구',
        status: SaleStatus.ON_SALE,
      },
      {
        title: '헬멧 + 고글 세트',
        category: '부품/용품',
        price: 120000,
        region: '서울 마포구',
        status: SaleStatus.SOLD,
      },
      {
        title: '미니벨로 출퇴근용 자전거',
        category: '미니벨로',
        price: 350000,
        region: '경기 성남시',
        status: SaleStatus.RESERVED,
      },
    ] as const;

    for (let i = 0; i < itemData.length; i += 1) {
      const seller = users[i % users.length];
      const createdAt = new Date(startDate);
      createdAt.setDate(startDate.getDate() + i);
      createdAt.setHours(14);

      const d = itemData[i];
      const item = itemRepo.create({
        sellerId: seller.id,
        title: d.title,
        category: d.category,
        price: d.price,
        description: `${d.title} 샘플 설명입니다.`,
        imageUrls: [],
        region: d.region,
        saleStatus: d.status,
        viewCount: 20 + i * 5,
        wishCount: i,
      });
      const saved = await itemRepo.save(item);
      await itemRepo.update(saved.id, { createdAt });
      items.push(await itemRepo.findOneOrFail({ where: { id: saved.id } }));
    }

    console.log('Sample marketplace items created.');

    // 6) 신고 샘플
    const reporter = users[0];
    const targetPost = posts[0];
    const targetItem = items[1];
    const sampleReports: Partial<Report>[] = [
      {
        reporterId: reporter.id,
        targetType: ReportTargetType.POST,
        targetId: targetPost.id,
        reason: '욕설/비방',
        detail: '댓글에서 과도한 욕설이 포함되어 있습니다.',
        status: ReportStatus.PENDING,
      },
      {
        reporterId: reporter.id,
        targetType: ReportTargetType.USER,
        targetId: targetItem.sellerId,
        reason: '사기 의심',
        detail: '시세보다 너무 저렴하고, 외부 링크 결제를 요구합니다.',
        status: ReportStatus.UNDER_REVIEW,
      },
    ];

    for (let i = 0; i < sampleReports.length; i += 1) {
      const r = reportRepo.create(sampleReports[i]);
      const saved = await reportRepo.save(r);
      const createdAt = new Date(startDate);
      createdAt.setDate(startDate.getDate() + 1 + i);
      await reportRepo.update(saved.id, { createdAt });
    }

    console.log('Sample reports created.');

    // 7) 포인트 이력 샘플 (첫 번째 사용자 기준)
    const pointUser = users[0];
    const pointEvents = [
      { amount: 100, reason: '출석 보너스' },
      { amount: 200, reason: '이벤트 참여 보상' },
      { amount: -50, reason: '포인트 사용' },
    ];
    let balance = 0;
    for (let i = 0; i < pointEvents.length; i += 1) {
      const ev = pointEvents[i];
      balance += ev.amount;
      const ph = pointRepo.create({
        userId: pointUser.id,
        amount: ev.amount,
        reason: ev.reason,
        balanceAfter: balance,
      });
      const saved = await pointRepo.save(ph);
      const createdAt = new Date(startDate);
      createdAt.setDate(startDate.getDate() + 1 + i);
      createdAt.setHours(8 + i, 0, 0, 0);
      await pointRepo.update(saved.id, { createdAt });
    }
    // 프로필 총 포인트도 맞춰준다
    const profile = await profileRepo.findOne({ where: { userId: pointUser.id } });
    if (profile) {
      profile.totalPoints = balance;
      await profileRepo.save(profile);
    }

    console.log('Sample point histories created.');

    // 5) 거래 채팅방 + 메시지 + 후기 (예약/판매완료 상대 지정)
    if (items.length > 0) {
      // 첫 번째 상품: 판매중 + 채팅 기록만
      const item1 = items[0];
      const seller1 = users.find((u) => u.id === item1.sellerId) ?? users[0];
      const buyer1 = users.find((u) => u.id !== seller1.id) ?? users[1];

      const room1 = roomRepo.create({
        itemId: item1.id,
        buyerId: buyer1.id,
        sellerId: seller1.id,
      });
      const savedRoom1 = await roomRepo.save(room1);

      const msg1Time = new Date(startDate);
      msg1Time.setDate(startDate.getDate() + 1);
      msg1Time.setHours(19, 30, 0, 0);

      const msg2Time = new Date(msg1Time);
      msg2Time.setMinutes(msg1Time.getMinutes() + 5);

      const msg1 = msgRepo.create({
        roomId: savedRoom1.id,
        senderId: buyer1.id,
        content: '안녕하세요, 아직 판매 중인가요?',
        imageUrl: null,
        read: false,
      });
      const savedMsg1 = await msgRepo.save(msg1);
      await msgRepo.update(savedMsg1.id, { createdAt: msg1Time });

      const msg2 = msgRepo.create({
        roomId: savedRoom1.id,
        senderId: seller1.id,
        content: '네, 아직 판매 중입니다. 직거래 가능해요.',
        imageUrl: null,
        read: false,
      });
      const savedMsg2 = await msgRepo.save(msg2);
      await msgRepo.update(savedMsg2.id, { createdAt: msg2Time });

      console.log('Sample trade chat room & messages created for first item.');
    }

    // 판매완료/예약중 상품에 대해서는 후기를 통해 거래 상대를 명시
    if (items.length > 1) {
      const soldItem = items[1]; // status: SOLD
      const reservedItem = items[2]; // status: RESERVED

      const sellerSold = users.find((u) => u.id === soldItem.sellerId) ?? users[0];
      const buyerSold = users.find((u) => u.id !== sellerSold.id) ?? users[1];

      const soldReview = reviewRepo.create({
        itemId: soldItem.id,
        reviewerId: buyerSold.id,
        revieweeId: sellerSold.id,
        rating: 5,
        content: '거래가 매우 만족스러웠습니다.',
      });
      const savedSoldReview = await reviewRepo.save(soldReview);
      const soldReviewTime = new Date(startDate);
      soldReviewTime.setDate(startDate.getDate() + 3);
      soldReviewTime.setHours(20, 0, 0, 0);
      await reviewRepo.update(savedSoldReview.id, { createdAt: soldReviewTime });

      const sellerReserved = users.find((u) => u.id === reservedItem.sellerId) ?? users[0];
      const buyerReserved = users.find((u) => u.id !== sellerReserved.id) ?? users[2] ?? users[1];

      const reservedReview = reviewRepo.create({
        itemId: reservedItem.id,
        reviewerId: buyerReserved.id,
        revieweeId: sellerReserved.id,
        rating: 4,
        content: '예약 후 거래 예정입니다.',
      });
      const savedReservedReview = await reviewRepo.save(reservedReview);
      const reservedReviewTime = new Date(startDate);
      reservedReviewTime.setDate(startDate.getDate() + 4);
      reservedReviewTime.setHours(18, 30, 0, 0);
      await reviewRepo.update(savedReservedReview.id, { createdAt: reservedReviewTime });

      console.log('Sample reviews created for sold and reserved items.');
    }

    console.log('샘플 데이터 생성 완료.');
  } finally {
    await ds.destroy();
  }
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});

