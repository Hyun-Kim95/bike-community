# ERD 개요 (Bike Community & Marketplace)

## 핵심 엔터티

| 테이블 | 설명 |
|--------|------|
| users | 회원 (이메일, 비밀번호, 닉네임, 상태) |
| user_profiles | 프로필 (아바타, 소개, 관심카테고리, 지역, 등급명, 포인트) |
| posts | 커뮤니티 게시글 |
| comments | 댓글 |
| likes | 좋아요 (post + user) |
| marketplace_items | 중고 거래 상품 |
| trade_chat_rooms | 거래 1:1 채팅방 (item + buyer + seller) |
| trade_messages | 채팅 메시지 |
| reviews | 거래 후기/평점 |
| wishes | 찜 (user + item) |
| point_histories | 포인트 적립/차감 내역 |
| attendances | 출석 체크 |
| notifications | 알림 |
| reports | 신고 (대상: post/comment/chat/user) |
| notices | 공지사항 |
| admin_users | 관리자 계정 |

## 관계 요약

- User 1:1 UserProfile
- User 1:N Post, Comment, Like, MarketplaceItem, Review, PointHistory, Attendance, Notification
- Post 1:N Comment, Like
- MarketplaceItem 1:N TradeChatRoom, Review, Wish
- TradeChatRoom 1:N TradeMessage
- Report → targetType + targetId (다형적)
