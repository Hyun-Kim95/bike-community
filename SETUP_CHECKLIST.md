# 추가해야 할 정보 체크리스트

프로젝트 실행 전에 아래 항목을 본인 환경에 맞게 설정하세요.

---

## 1. Backend (`backend/`)

`backend/.env.example`을 복사해 `backend/.env`를 만들고 아래 값을 채우세요.

### JWT 시크릿 값 만드는 법 (32자 이상 랜덤 문자열)

**방법 1 – 터미널 (OpenSSL)**  
```bash
# 한 줄씩 실행해서 각각 ACCESS / REFRESH / ADMIN 용으로 사용
openssl rand -base64 32
openssl rand -base64 32
openssl rand -base64 32
```

**방법 2 – Node.js**  
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```
위 명령을 3번 실행해서 나온 값을 각각 `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ADMIN_JWT_SECRET`에 넣으면 됩니다.

**방법 3 – PowerShell**  
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
```
마찬가지로 3번 실행해서 각 시크릿에 사용하세요.

---

### 필수

| 변수명 | 설명 | 예시 |
|--------|------|------|
| **DATABASE_URL** | PostgreSQL 연결 문자열 | `postgresql://사용자:비밀번호@localhost:5432/bike_community` |
| **JWT_ACCESS_SECRET** | 액세스 토큰 서명용 비밀키 (32자 이상) | 위 방법으로 생성한 값 |
| **JWT_REFRESH_SECRET** | 리프레시 토큰 서명용 비밀키 (32자 이상) | 위 방법으로 생성한 값 (ACCESS와 다르게) |
| **ADMIN_JWT_SECRET** | 관리자 로그인 JWT 비밀키 (Admin 웹용) | 위 방법으로 생성한 값 (위 둘과 다르게) |

### 선택 (기본값 있음)

| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| NODE_ENV | development / production | development |
| PORT | 서버 포트 | 3000 |
| API_PREFIX | API 경로 접두사 | api/v1 |
| JWT_ACCESS_EXPIRES | 액세스 토큰 유효 시간 | 15m |
| JWT_REFRESH_EXPIRES | 리프레시 토큰 유효 시간 | 7d |

### 관리자 계정 생성 시 (npm run seed:admin 할 때)

| 변수명 | 설명 | 예시 |
|--------|------|------|
| ADMIN_INIT_EMAIL | 최초 관리자 이메일 | admin@bike.local |
| ADMIN_INIT_PASSWORD | 최초 관리자 비밀번호 | admin1234! |

### 선택 (이미지 업로드 S3 사용 시)

| 변수명 | 설명 |
|--------|------|
| AWS_REGION | 리전 (예: ap-northeast-2) |
| AWS_ACCESS_KEY_ID | AWS 액세스 키 |
| AWS_SECRET_ACCESS_KEY | AWS 시크릿 키 |
| S3_BUCKET_NAME | 버킷 이름 (예: bike-community-uploads) |

### 선택 (FCM 푸시 알림 사용 시)

| 변수명 | 설명 |
|--------|------|
| FCM_PROJECT_ID | Firebase 프로젝트 ID |
| FCM_PRIVATE_KEY | 서비스 계정 private key |
| FCM_CLIENT_EMAIL | 서비스 계정 client email |

---

## 2. Admin 웹 (`admin/`)

`admin/.env.example`을 복사해 `admin/.env`를 만들고 아래 값을 채우세요.

### 필수

| 변수명 | 설명 | 예시 |
|--------|------|------|
| **VITE_API_BASE_URL** | 백엔드 API 주소 (Admin이 요청 보낼 주소) | `http://localhost:3000/api/v1` |

- 로컬: `http://localhost:3000/api/v1`
- 다른 PC/서버: `http://실제IP또는도메인:3000/api/v1`

---

## 3. Flutter 앱 (`app/`)

앱이 백엔드에 요청할 **API 주소**만 맞추면 됩니다.

### 방법 A: 로컬 PC에서만 실행 (에뮬레이터/같은 PC)

- **별도 설정 없음**  
  기본값 `http://localhost:3000/api/v1` 사용.

### 방법 B: 실제 기기 또는 다른 PC의 백엔드로 연결

빌드/실행 시 API 주소를 넘깁니다.

```bash
# 실행 시
flutter run --dart-define=API_BASE_URL=http://192.168.0.10:3000/api/v1

# 빌드 시 (예: APK)
flutter build apk --dart-define=API_BASE_URL=https://your-server.com/api/v1
```

- `http://192.168.0.10:3000/api/v1` → 본인 백엔드 서버 IP/포트로 변경
- 실제 서비스 시에는 `https://도메인/api/v1` 형태로 사용하는 것을 권장

---

## 4. 한 번에 정리

1. **PostgreSQL**  
   - DB 생성 (예: `bike_community`)  
   - `backend/.env`의 `DATABASE_URL`에 연결 정보 입력  

2. **Backend**  
   - `backend/.env` 생성 후  
     - `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ADMIN_JWT_SECRET` **반드시** 입력  

3. **관리자 계정**  
   - `ADMIN_INIT_EMAIL`, `ADMIN_INIT_PASSWORD` 설정 후  
   - `cd backend` → `npm run seed:admin`  

4. **Admin 웹**  
   - `admin/.env`에 `VITE_API_BASE_URL` 설정  

5. **앱**  
   - 같은 PC/에뮬레이터만 쓰면 기본값 그대로  
   - 실기기·다른 서버 쓰면 `--dart-define=API_BASE_URL=...` 로 주소 지정  

위만 채우면 **필수로 추가해야 할 정보**는 모두 반영된 상태입니다.
