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
- npm

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
npm install
npm run dev
```

### 앱

```bash
cd app
flutter pub get
flutter run
```

**에뮬레이터/실기기에서 Connection refused 나올 때**  
앱이 돌아가는 기기에서 `localhost`는 PC가 아니라 기기 자신이라, 백엔드(PC의 3000 포트)에 연결되지 않습니다. 아래처럼 API 주소를 지정해서 실행하세요.

- **Android 에뮬레이터**: PC 쪽 주소는 `10.0.2.2`
  ```bash
  flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000/api/v1
  ```
- **실기기**: PC의 IP로 변경 (예: `192.168.0.10`)
  ```bash
  flutter run --dart-define=API_BASE_URL=http://192.168.0.10:3000/api/v1
  ```

(같은 PC에서 Chrome/Windows로 실행할 때는 `localhost:3000` 그대로 써도 됩니다.)

## 관리자(Admin)

1. 백엔드: 초기 관리자 생성  
   `backend/.env`에 `ADMIN_INIT_EMAIL`, `ADMIN_INIT_PASSWORD`를 넣은 뒤:
   ```bash
   cd backend
   npm run seed:admin
   ```
2. Admin 웹 실행: `cd admin && npm run dev`
3. http://localhost:5174 접속 → 로그인 (`.env`에 넣은 이메일/비밀번호)

## 브랜치 전략

- `main` - 배포용
- `develop` - 개발 통합
- `feature/*` - 기능 개발
