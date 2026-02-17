# Routie — 시스템 아키텍처

## 1. 아키텍처 개요

```
┌─────────────────────────────────────────────────────┐
│                    Client (PWA)                      │
│              Next.js 14+ (App Router)                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ 장소관리  │ │ 경로뷰어 │ │ 지도컴포넌트│           │
│  └──────────┘ └──────────┘ └──────────┘            │
│  ┌──────────────────────────────────────┐           │
│  │  Service Worker + IndexedDB (캐싱)    │           │
│  └──────────────────────────────────────┘           │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS (REST API)
                       ▼
┌─────────────────────────────────────────────────────┐
│                  Backend (NestJS)                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐    │
│  │ Auth     │ │ Places   │ │ Route Optimizer  │    │
│  │ Module   │ │ Module   │ │ Module           │    │
│  └──────────┘ └──────────┘ └──────────────────┘    │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐    │
│  │ Trip     │ │ Google   │ │ Cache            │    │
│  │ Module   │ │ Maps Svc │ │ Module (Redis)   │    │
│  └──────────┘ └──────────┘ └──────────────────┘    │
└──────────┬─────────────┬────────────────────────────┘
           │             │
     ┌─────▼─────┐ ┌─────▼──────────────┐
     │ Supabase  │ │ Google Maps        │
     │ (Postgres)│ │ Platform APIs      │
     │ + Auth    │ │ - Directions       │
     │           │ │ - Places           │
     │ Prisma    │ │ - Distance Matrix  │
     │ ORM       │ │ - Geocoding        │
     └───────────┘ └────────────────────┘
```

## 2. Frontend 아키텍처

### 2.1 기술 선택

| 기술                   | 버전 | 용도                            |
| ---------------------- | ---- | ------------------------------- |
| Next.js                | 14+  | App Router, SSR/CSR, API Routes |
| React                  | 18+  | UI 라이브러리                   |
| Tailwind CSS           | 3.4+ | 유틸리티 기반 스타일링          |
| Zustand                | 4+   | 클라이언트 상태 관리            |
| TanStack Query         | 5+   | 서버 상태 관리, 캐싱            |
| @react-google-maps/api | -    | Google Maps React 래퍼          |
| next-pwa               | -    | PWA 설정                        |
| Framer Motion          | -    | 애니메이션, 제스처              |
| dnd-kit                | -    | 드래그 앤 드롭                  |

### 2.2 디렉토리 구조

```
apps/web/
├── public/
│   ├── manifest.json        # PWA 매니페스트
│   ├── sw.js                # Service Worker
│   └── icons/               # 앱 아이콘
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── layout.tsx       # 루트 레이아웃
│   │   ├── page.tsx         # 랜딩 페이지
│   │   ├── (auth)/          # 인증 관련 라우트
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── (main)/          # 인증 후 메인 라우트
│   │   │   ├── trips/       # 여행 목록
│   │   │   ├── trip/[id]/   # 여행 상세
│   │   │   ├── places/      # 장소 관리
│   │   │   └── route/[id]/  # 경로 결과
│   │   └── api/             # Next.js API Routes (BFF)
│   ├── components/
│   │   ├── ui/              # 기본 UI 컴포넌트 (Button, Card, Input...)
│   │   ├── map/             # 지도 관련 컴포넌트
│   │   ├── place/           # 장소 관련 컴포넌트
│   │   ├── route/           # 경로 관련 컴포넌트
│   │   └── layout/          # 레이아웃 컴포넌트 (Header, Nav, Sheet)
│   ├── hooks/               # 커스텀 훅
│   ├── lib/                 # 유틸리티, API 클라이언트
│   ├── stores/              # Zustand 스토어
│   ├── types/               # TypeScript 타입 정의
│   └── styles/              # 글로벌 스타일, Tailwind 확장
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
```

### 2.3 상태 관리 전략

```
┌─────────────────────────────────────────────┐
│              상태 관리 계층                    │
├─────────────────────────────────────────────┤
│                                             │
│  Server State (TanStack Query)              │
│  - 여행 목록, 장소 데이터, 경로 결과           │
│  - 자동 캐싱, 리페칭, 낙관적 업데이트          │
│                                             │
│  Client State (Zustand)                     │
│  - 현재 선택된 여행, UI 상태                  │
│  - 장소 선택/가중치 임시 상태                  │
│  - 지도 뷰포트 상태                           │
│                                             │
│  Local State (useState)                     │
│  - 폼 입력, 모달 열기/닫기                    │
│  - 컴포넌트 내부 상태                         │
│                                             │
│  Persistent State (IndexedDB)               │
│  - 오프라인 캐시 경로 데이터                   │
│  - 사용자 설정                               │
│                                             │
└─────────────────────────────────────────────┘
```

### 2.4 PWA 전략

**Service Worker 캐싱 전략:**

| 리소스                    | 전략          | 설명                            |
| ------------------------- | ------------- | ------------------------------- |
| App Shell (HTML, CSS, JS) | Cache First   | 빠른 로딩, 백그라운드 업데이트  |
| API 응답 (경로 결과)      | Network First | 최신 데이터 우선, 실패 시 캐시  |
| 정적 에셋 (이미지, 폰트)  | Cache First   | 변경 드묾, 캐시 우선            |
| Google Maps 타일          | Network Only  | 라이선스 제약, 캐싱 불가        |
| 저장된 경로 데이터        | IndexedDB     | 사용자가 명시적으로 저장한 경로 |

---

## 3. Backend 아키텍처

### 3.1 기술 선택

| 기술            | 버전 | 용도                         |
| --------------- | ---- | ---------------------------- |
| NestJS          | 10+  | 메인 백엔드 프레임워크       |
| Prisma          | 5+   | ORM, 마이그레이션            |
| Supabase        | -    | PostgreSQL, Auth, Realtime   |
| Redis           | 7+   | API 응답 캐싱, Rate Limiting |
| class-validator | -    | DTO 유효성 검증              |
| Passport        | -    | 인증 전략                    |

### 3.2 디렉토리 구조

```
apps/server/
├── src/
│   ├── main.ts                  # 앱 엔트리포인트
│   ├── app.module.ts            # 루트 모듈
│   ├── common/                  # 공통 유틸리티
│   │   ├── decorators/          # 커스텀 데코레이터
│   │   ├── filters/             # 예외 필터
│   │   ├── guards/              # 인증 가드
│   │   ├── interceptors/        # 로깅, 캐싱 인터셉터
│   │   └── pipes/               # 유효성 검증 파이프
│   ├── modules/
│   │   ├── auth/                # 인증 모듈
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/      # Passport 전략
│   │   │   └── dto/
│   │   ├── user/                # 사용자 모듈
│   │   ├── trip/                # 여행 모듈
│   │   │   ├── trip.module.ts
│   │   │   ├── trip.controller.ts
│   │   │   ├── trip.service.ts
│   │   │   └── dto/
│   │   ├── place/               # 장소 모듈
│   │   │   ├── place.module.ts
│   │   │   ├── place.controller.ts
│   │   │   ├── place.service.ts
│   │   │   └── dto/
│   │   ├── route/               # 경로 최적화 모듈
│   │   │   ├── route.module.ts
│   │   │   ├── route.controller.ts
│   │   │   ├── route.service.ts
│   │   │   ├── optimizer/       # 경로 최적화 알고리즘
│   │   │   │   ├── optimizer.service.ts
│   │   │   │   ├── tsp-solver.ts
│   │   │   │   └── constraints.ts
│   │   │   └── dto/
│   │   └── google-maps/         # Google Maps 연동
│   │       ├── google-maps.module.ts
│   │       ├── google-maps.service.ts
│   │       ├── directions.service.ts
│   │       ├── places.service.ts
│   │       └── distance-matrix.service.ts
│   └── prisma/                  # Prisma 서비스
│       ├── prisma.module.ts
│       └── prisma.service.ts
├── test/
├── nest-cli.json
└── tsconfig.json
```

### 3.3 모듈 의존성

```
AppModule
├── AuthModule
│   └── UserModule
├── TripModule
│   ├── PlaceModule
│   └── RouteModule
│       ├── GoogleMapsModule
│       └── CacheModule
├── PrismaModule (global)
└── ConfigModule (global)
```

### 3.4 경로 최적화 알고리즘

경로 최적화는 **시간 제약이 있는 TSP(Travelling Salesman Problem)** 의 변형이다.

**알고리즘 파이프라인:**

```
[입력: 장소 리스트 + 제약 조건]
         ↓
[1단계] Distance Matrix 구성
  - Google Distance Matrix API로 모든 장소 쌍의 이동 시간 조회
  - 결과를 Redis에 캐싱 (TTL: 24시간)
         ↓
[2단계] 제약 조건 필터링
  - 영업시간 밖의 장소 제외
  - 필수 장소는 반드시 포함
  - 시간 범위 내 불가능한 조합 제거
         ↓
[3단계] 경로 생성 (Nearest Neighbor + 2-opt)
  - 초기 해: Nearest Neighbor 휴리스틱
  - 개선: 2-opt Local Search
  - 가중치 반영: 선호 장소 포함 시 보너스 점수
         ↓
[4단계] 다중 경로 변형 생성
  - 효율 경로: 이동 시간 최소화 목적함수
  - 여유 경로: 체류 시간 확대 + 장소 수 축소
  - 맞춤 경로: 가중치 기반 목적함수
         ↓
[5단계] 각 경로에 상세 정보 추가
  - Google Directions API로 실제 경로 (폴리라인)
  - 각 구간 이동 시간, 거리
  - 도착/출발 예정 시간 계산
         ↓
[출력: 2~3개 추천 경로]
```

**목적함수:**

```
Score = w1 × (가중치 점수)
      + w2 × (1 / 총 이동시간)
      + w3 × (방문 장소 수 / 전체 장소 수)
      + w4 × (시간 여유도)
```

- 효율 경로: w2 가중, w3 가중
- 여유 경로: w4 가중
- 맞춤 경로: w1 가중

---

## 4. 데이터 흐름

### 4.1 경로 생성 플로우

```
Client                    Backend                 External
  │                         │                       │
  │  POST /routes/optimize  │                       │
  │ ──────────────────────> │                       │
  │                         │  Distance Matrix API  │
  │                         │ ────────────────────> │
  │                         │ <──────────────────── │
  │                         │                       │
  │                         │  [캐시 저장]            │
  │                         │  [경로 최적화 실행]      │
  │                         │                       │
  │                         │  Directions API       │
  │                         │ ────────────────────> │
  │                         │ <──────────────────── │
  │                         │                       │
  │  { routes: [...] }      │                       │
  │ <────────────────────── │                       │
  │                         │                       │
  │  [결과 IndexedDB 저장]   │                       │
```

### 4.2 오프라인 동기화

```
[온라인 상태]
  ↓ 경로 생성/수정
  ↓ → Server 저장 (Supabase)
  ↓ → IndexedDB 캐싱 (로컬)

[오프라인 전환]
  ↓ IndexedDB에서 데이터 로드
  ↓ 읽기 전용 모드
  ↓ 수정 사항 → Pending Queue에 저장

[온라인 복귀]
  ↓ Pending Queue → Server 동기화
  ↓ 충돌 시 서버 데이터 우선 (Last Write Wins)
```

---

## 5. 외부 API 연동

### 5.1 Google Maps Platform

| API                 | 용도                           | 호출 시점      |
| ------------------- | ------------------------------ | -------------- |
| Places API (New)    | 장소 검색, 상세 정보, 영업시간 | 장소 추가 시   |
| Distance Matrix API | 장소 쌍 이동 시간/거리         | 경로 최적화 시 |
| Directions API      | 실제 경로, 폴리라인            | 경로 결과 표시 |
| Geocoding API       | 주소 ↔ 좌표 변환               | 필요 시        |
| Maps JavaScript API | 프론트엔드 지도 렌더링         | 지도 뷰        |

### 5.2 API 비용 최적화

1. **Distance Matrix 캐싱**: 같은 장소 쌍 결과를 Redis에 24시간 캐싱
2. **배치 요청**: Distance Matrix는 최대 25 origins × 25 destinations
3. **Places 캐싱**: 장소 상세 정보를 DB에 저장, 주기적 갱신
4. **요청 최소화**: 사용자가 장소 목록 확정 후 한 번에 요청
5. **무료 티어 모니터링**: 월 $200 무료 크레딧 활용

---

## 6. 배포 아키텍처

```
┌──────────────────────────────────────────────────┐
│                Production                         │
│                                                  │
│  ┌─────────────┐     ┌──────────────────────┐   │
│  │   Vercel    │     │  Railway / Fly.io    │   │
│  │  (Frontend) │     │  (Backend + Redis)   │   │
│  │  Next.js    │────>│  NestJS              │   │
│  │  CDN + Edge │     │                      │   │
│  └─────────────┘     └──────────┬───────────┘   │
│                                 │               │
│                      ┌──────────▼───────────┐   │
│                      │     Supabase         │   │
│                      │  PostgreSQL + Auth   │   │
│                      └──────────────────────┘   │
└──────────────────────────────────────────────────┘
```

### 6.1 환경 구성

| 환경        | 용도       | URL                             |
| ----------- | ---------- | ------------------------------- |
| Development | 로컬 개발  | localhost:3000 / localhost:4000 |
| Staging     | QA, 테스트 | staging.routie.app              |
| Production  | 실서비스   | routie.app                      |

### 6.2 CI/CD

```
[Push to main]
     ↓
[GitHub Actions]
  ├── Lint + Type Check
  ├── Unit Tests
  └── Build
     ↓
[자동 배포]
  ├── Frontend → Vercel (자동)
  └── Backend → Railway (자동)
```

---

## 7. 보안 아키텍처

| 레이어     | 보안 조치                                                 |
| ---------- | --------------------------------------------------------- |
| 네트워크   | HTTPS 강제, CORS 설정                                     |
| 인증       | Supabase Auth (JWT), Refresh Token Rotation               |
| API        | Rate Limiting (Redis), Input Validation (class-validator) |
| 데이터     | Row Level Security (Supabase RLS), 사용자 데이터 격리     |
| API 키     | 환경변수, 서버사이드 전용 (Google Maps API Key)           |
| 프론트엔드 | CSP 헤더, XSS 방지                                        |
