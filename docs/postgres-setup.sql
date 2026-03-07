-- ============================================================
-- 실행 방법
-- ============================================================
-- (1) postgres 슈퍼유저로 접속 후 "1. 데이터베이스 & 유저" 블록만 실행
-- (2) \c bike_community 로 DB 접속 후 "2. 테이블 생성" 블록 실행
-- (3) 같은 DB에서 "3. 앱 유저 권한" 블록 실행
--
-- 또는 psql에서:
--   psql -U postgres -f postgres-setup.sql  (전체 한 번에 하려면 DB 생성 후 수동으로 \c 필요)
-- ============================================================

-- ============================================================
-- 1. 데이터베이스 & 유저 생성 (postgres 슈퍼유저로 실행)
-- ============================================================

-- 데이터베이스 생성
-- (로케일 오류 나면 아래 3줄만 사용: CREATE DATABASE bike_community WITH ENCODING = 'UTF8';)
CREATE DATABASE bike_community
  WITH ENCODING = 'UTF8'
       TEMPLATE = template0;

-- 접속: \c bike_community

-- 앱 전용 유저 생성 (비밀번호는 본인 값으로 변경)
CREATE USER bike_app WITH PASSWORD 'your_password_here';

-- 스키마 권한 (public 스키마 사용)
GRANT CONNECT ON DATABASE bike_community TO bike_app;
GRANT USAGE ON SCHEMA public TO bike_app;
GRANT CREATE ON SCHEMA public TO bike_app;

-- uuid 생성 함수 사용을 위한 확장 (이미 있으면 무시)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================
-- 2. 테이블 생성 (bike_community DB에 연결한 뒤 실행)
-- ============================================================

-- UUID 자동 생성용 (일부 구버전 PG용, 13+ 는 gen_random_uuid() 기본 제공)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum 타입 정의
CREATE TYPE user_status_enum AS ENUM ('normal', 'suspended', 'withdrawn', 'dormant');
CREATE TYPE sale_status_enum AS ENUM ('on_sale', 'reserved', 'sold', 'hidden');
CREATE TYPE report_target_type_enum AS ENUM ('post', 'comment', 'chat', 'user');
CREATE TYPE report_status_enum AS ENUM ('pending', 'under_review', 'resolved', 'rejected');

-- ----------------------------------------
-- users
-- ----------------------------------------
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  email VARCHAR NOT NULL UNIQUE,
  "passwordHash" VARCHAR NOT NULL,
  nickname VARCHAR(50) NOT NULL,
  status user_status_enum NOT NULL DEFAULT 'normal',
  "lastLoginAt" TIMESTAMP NULL
);
CREATE INDEX idx_users_email ON users(email);

-- ----------------------------------------
-- user_profiles
-- ----------------------------------------
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  "userId" UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  "avatarUrl" VARCHAR NULL,
  bio TEXT NULL,
  "interestCategories" TEXT NULL,
  region VARCHAR(100) NULL,
  "gradeName" VARCHAR(50) NOT NULL DEFAULT '새싹 라이더',
  "totalPoints" INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_user_profiles_userId ON user_profiles("userId");

-- ----------------------------------------
-- posts
-- ----------------------------------------
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  "authorId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  "imageUrls" TEXT NULL,
  "videoUrl" VARCHAR NULL,
  "viewCount" INTEGER NOT NULL DEFAULT 0,
  "likeCount" INTEGER NOT NULL DEFAULT 0,
  "commentCount" INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_posts_createdAt ON posts("createdAt");
CREATE INDEX idx_posts_category_createdAt ON posts(category, "createdAt");

-- ----------------------------------------
-- comments
-- ----------------------------------------
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  "postId" UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  "authorId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL
);
CREATE INDEX idx_comments_postId_createdAt ON comments("postId", "createdAt");

-- ----------------------------------------
-- likes
-- ----------------------------------------
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  "postId" UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE ("postId", "userId")
);
CREATE INDEX idx_likes_postId ON likes("postId");
CREATE INDEX idx_likes_userId ON likes("userId");

-- ----------------------------------------
-- marketplace_items
-- ----------------------------------------
CREATE TABLE marketplace_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  "sellerId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  category VARCHAR(50) NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  description TEXT NOT NULL,
  "imageUrls" TEXT NOT NULL,
  region VARCHAR(100) NOT NULL,
  "saleStatus" sale_status_enum NOT NULL DEFAULT 'on_sale',
  "viewCount" INTEGER NOT NULL DEFAULT 0,
  "wishCount" INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_marketplace_items_category_createdAt ON marketplace_items(category, "createdAt");
CREATE INDEX idx_marketplace_items_sellerId_saleStatus ON marketplace_items("sellerId", "saleStatus");
CREATE INDEX idx_marketplace_items_region ON marketplace_items(region);

-- ----------------------------------------
-- wishes
-- ----------------------------------------
CREATE TABLE wishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "itemId" UUID NOT NULL REFERENCES marketplace_items(id) ON DELETE CASCADE,
  UNIQUE ("userId", "itemId")
);
CREATE INDEX idx_wishes_userId ON wishes("userId");
CREATE INDEX idx_wishes_itemId ON wishes("itemId");

-- ----------------------------------------
-- trade_chat_rooms
-- ----------------------------------------
CREATE TABLE trade_chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  "itemId" UUID NOT NULL REFERENCES marketplace_items(id) ON DELETE CASCADE,
  "buyerId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "sellerId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX idx_trade_chat_rooms_itemId_buyerId ON trade_chat_rooms("itemId", "buyerId");
CREATE INDEX idx_trade_chat_rooms_buyerId ON trade_chat_rooms("buyerId");
CREATE INDEX idx_trade_chat_rooms_sellerId ON trade_chat_rooms("sellerId");

-- ----------------------------------------
-- trade_messages
-- ----------------------------------------
CREATE TABLE trade_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  "roomId" UUID NOT NULL REFERENCES trade_chat_rooms(id) ON DELETE CASCADE,
  "senderId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  "imageUrl" VARCHAR NULL,
  read BOOLEAN NOT NULL DEFAULT false
);
CREATE INDEX idx_trade_messages_roomId_createdAt ON trade_messages("roomId", "createdAt");

-- ----------------------------------------
-- reviews
-- ----------------------------------------
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  "itemId" UUID NOT NULL REFERENCES marketplace_items(id) ON DELETE CASCADE,
  "reviewerId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "revieweeId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL,
  content TEXT NULL
);
CREATE INDEX idx_reviews_itemId ON reviews("itemId");
CREATE INDEX idx_reviews_reviewerId_revieweeId ON reviews("reviewerId", "revieweeId");

-- ----------------------------------------
-- point_histories
-- ----------------------------------------
CREATE TABLE point_histories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason VARCHAR(50) NOT NULL,
  "balanceAfter" INTEGER NOT NULL
);
CREATE INDEX idx_point_histories_userId_createdAt ON point_histories("userId", "createdAt");

-- ----------------------------------------
-- attendances
-- ----------------------------------------
CREATE TABLE attendances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  "consecutiveDays" INTEGER NOT NULL DEFAULT 1,
  UNIQUE ("userId", date)
);
CREATE INDEX idx_attendances_userId ON attendances("userId");

-- ----------------------------------------
-- reports (reporterId는 회원 탈퇴 시 NULL 허용)
-- ----------------------------------------
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  "reporterId" UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  "targetType" report_target_type_enum NOT NULL,
  "targetId" UUID NOT NULL,
  reason VARCHAR(100) NULL,
  detail TEXT NULL,
  status report_status_enum NOT NULL DEFAULT 'pending',
  "processedBy" UUID NULL,
  "adminNote" TEXT NULL
);
CREATE INDEX idx_reports_status_createdAt ON reports(status, "createdAt");
CREATE INDEX idx_reports_targetType_targetId ON reports("targetType", "targetId");

-- ----------------------------------------
-- notices
-- ----------------------------------------
CREATE TABLE notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  pinned BOOLEAN NOT NULL DEFAULT false
);
CREATE INDEX idx_notices_pinned_createdAt ON notices(pinned, "createdAt");

-- ----------------------------------------
-- notifications
-- ----------------------------------------
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL,
  title VARCHAR(200) NOT NULL,
  body TEXT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  payload JSONB NULL
);
CREATE INDEX idx_notifications_userId_createdAt ON notifications("userId", "createdAt");
CREATE INDEX idx_notifications_userId_read ON notifications("userId", read);

-- ----------------------------------------
-- admin_users
-- ----------------------------------------
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  email VARCHAR NOT NULL UNIQUE,
  "passwordHash" VARCHAR NOT NULL,
  name VARCHAR(50) NOT NULL
);
CREATE INDEX idx_admin_users_email ON admin_users(email);


-- ============================================================
-- 3. 앱 유저에게 테이블 권한 부여 (bike_community 연결 후)
-- ============================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO bike_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO bike_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO bike_app;
