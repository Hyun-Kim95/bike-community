# Bike Community & Marketplace

자전거 커뮤니티 및 중고 거래 플랫폼

## 구조

- `backend/` - NestJS API 서버
- `app/` - Flutter 모바일 앱 (Android / iOS)
- `admin/` - React 관리자 웹

## 사전 요구사항

- Node.js 18+
- PostgreSQL 14+
- Flutter 3.x (앱 빌드 시)
- pnpm 또는 npm

## 로컬 실행

### 백엔드

```bash
cd backend
cp .env.example .env   # DATABASE_URL 등 값 수정 (PostgreSQL 필요)
npm install
npm run start:dev
```

서버 기동 후 `http://localhost:3000/api/v1/health` 로 헬스 체크 가능.

### Admin

```bash
cd admin
pnpm install
pnpm run dev
```

### 앱

```bash
cd app
flutter pub get
flutter run
```

## 관리자(Admin)

1. 백엔드: 초기 관리자 생성
   ```bash
   cd backend
   ADMIN_INIT_EMAIL=admin@bike.local ADMIN_INIT_PASSWORD=admin1234! npm run seed:admin
   ```
2. Admin 웹 실행: `cd admin && npm run dev`
3. http://localhost:5174 접속 → 로그인 (admin@bike.local / admin1234!)

## 브랜치 전략

- `main` - 배포용
- `develop` - 개발 통합
- `feature/*` - 기능 개발
