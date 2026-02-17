# Routie — 데이터베이스 스키마

## 1. 개요

- **DB**: Supabase (PostgreSQL 15+)
- **ORM**: Prisma 5+
- **보안**: Row Level Security (RLS) 적용
- **확장**: PostGIS (위치 기반 쿼리 최적화, 추후)

---

## 2. ERD (Entity Relationship Diagram)

```
┌──────────┐     ┌──────────┐     ┌──────────────┐
│  User    │────<│  Trip    │────<│  TripPlace   │
└──────────┘     └──────────┘     └──────┬───────┘
                                         │
                                   ┌─────▼──────┐
                                   │   Place     │
                                   │ (장소 마스터) │
                                   └─────┬───────┘
                                         │
                                   ┌─────▼──────┐
                                   │ PlaceDetail │
                                   │ (상세 정보)  │
                                   └─────────────┘

┌──────────┐     ┌──────────────┐
│  Route   │────<│  RouteStop   │
│ (경로)   │     │ (경로 정차지)  │
└──────────┘     └──────────────┘
```

---

## 3. Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// 사용자
// ============================================

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  avatarUrl String?  @map("avatar_url")
  provider  String   @default("email") // email, google

  trips     Trip[]

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("users")
}

// ============================================
// 여행
// ============================================

model Trip {
  id          String   @id @default(uuid())
  userId      String   @map("user_id")
  title       String   // "방콕 3일 여행"
  city        String   // "Bangkok"
  country     String?  // "Thailand"
  startDate   DateTime @map("start_date")
  endDate     DateTime @map("end_date")
  dailyStart  String   @default("10:00") @map("daily_start") // HH:mm
  dailyEnd    String   @default("21:00") @map("daily_end")   // HH:mm
  transport   Transport @default(PUBLIC_TRANSIT)
  status      TripStatus @default(PLANNING)

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  tripPlaces  TripPlace[]
  routes      Route[]

  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@index([userId])
  @@map("trips")
}

enum Transport {
  WALKING
  PUBLIC_TRANSIT
  DRIVING
  TAXI
}

enum TripStatus {
  PLANNING
  OPTIMIZED
  CONFIRMED
  COMPLETED
}

// ============================================
// 장소 (마스터 데이터)
// ============================================

model Place {
  id              String   @id @default(uuid())
  googlePlaceId   String?  @unique @map("google_place_id")
  name            String
  address         String
  latitude        Float
  longitude       Float
  category        PlaceCategory @default(OTHER)

  // 의사결정 지원 정보
  rating          Float?   // Google 평점 (1~5)
  userRatingCount Int?     @map("user_rating_count") // 리뷰 수
  priceLevel      Int?     @map("price_level") // 0~4 (Google 기준)
  photoUrls       String[] @map("photo_urls") // 대표 사진 URL 목록
  summary         String?  // AI 요약 또는 한줄 설명

  // 영업 정보
  openingHours    Json?    @map("opening_hours") // 요일별 영업시간 JSON

  // 상세 정보 (의사결정 지원용)
  placeDetail     PlaceDetail?

  tripPlaces      TripPlace[]
  routeStops      RouteStop[]

  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  @@index([googlePlaceId])
  @@index([latitude, longitude])
  @@map("places")
}

// ============================================
// 장소 상세 정보 (의사결정 지원)
// ============================================

model PlaceDetail {
  id              String   @id @default(uuid())
  placeId         String   @unique @map("place_id")

  // 핵심 매력 포인트
  highlights      String[] // ["루프탑 뷰", "라이브 재즈", "수제 칵테일"]

  // 음식점/카페 전용
  signatureMenus  Json?    @map("signature_menus")
  // [{ name: "팟타이", price: "120 THB", description: "..." }]

  // 분위기/특징 태그
  vibes           String[] // ["로맨틱", "인스타그래머블", "조용한"]

  // 추천 방문 시간대
  bestTimeToVisit String?  @map("best_time_to_visit") // "sunset", "morning"

  // 예상 체류 시간 (분)
  avgDuration     Int?     @map("avg_duration") // 분 단위

  // 접근성 정보
  nearestStation  String?  @map("nearest_station") // 가장 가까운 역/정류장
  walkFromStation Int?     @map("walk_from_station") // 역에서 도보 소요시간 (분)

  // Google Reviews 하이라이트
  reviewHighlights String[] @map("review_highlights")
  // ["뷰가 정말 아름다워요", "직원이 친절합니다"]

  place           Place    @relation(fields: [placeId], references: [id], onDelete: Cascade)

  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  @@map("place_details")
}

enum PlaceCategory {
  RESTAURANT
  CAFE
  BAR
  ATTRACTION
  SHOPPING
  SPA_MASSAGE
  ENTERTAINMENT
  ACCOMMODATION
  TRANSPORT_HUB
  OTHER
}

// ============================================
// 여행-장소 연결 (가중치 포함)
// ============================================

model TripPlace {
  id            String    @id @default(uuid())
  tripId        String    @map("trip_id")
  placeId       String    @map("place_id")

  // 사용자 설정
  priority      Priority  @default(WANT) // 가중치
  sortOrder     Int       @default(0) @map("sort_order") // 같은 등급 내 순서
  customDuration Int?     @map("custom_duration") // 사용자 지정 체류시간 (분)
  userNote      String?   @map("user_note") // 사용자 메모 ("여기서 팟타이 먹기")
  preferredTime String?   @map("preferred_time") // "lunch", "dinner", "morning"

  trip          Trip      @relation(fields: [tripId], references: [id], onDelete: Cascade)
  place         Place     @relation(fields: [placeId], references: [id], onDelete: Cascade)

  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  @@unique([tripId, placeId])
  @@index([tripId])
  @@map("trip_places")
}

enum Priority {
  MUST     // 필수 방문
  WANT     // 가고 싶음
  OPTIONAL // 시간 되면
}

// ============================================
// 경로
// ============================================

model Route {
  id            String     @id @default(uuid())
  tripId        String     @map("trip_id")
  date          DateTime   // 해당 경로의 날짜
  routeType     RouteType  @map("route_type")

  // 경로 요약
  totalDuration Int        @map("total_duration") // 총 소요시간 (분)
  totalDistance  Int        @map("total_distance") // 총 거리 (미터)
  totalTravelTime Int      @map("total_travel_time") // 총 이동시간 (분)
  placeCount    Int        @map("place_count") // 방문 장소 수
  score         Float      // 경로 점수 (최적화 결과)

  // 경로 선택 사유 (의사결정 지원)
  reasoning     String?    // "이 경로는 필수 장소 3곳을 모두 포함하며..."

  // 상태
  isSelected    Boolean    @default(false) @map("is_selected")

  trip          Trip       @relation(fields: [tripId], references: [id], onDelete: Cascade)
  stops         RouteStop[]

  createdAt     DateTime   @default(now()) @map("created_at")

  @@index([tripId])
  @@map("routes")
}

enum RouteType {
  EFFICIENT   // 효율 중심
  RELAXED     // 여유 중심
  CUSTOM      // 맞춤 (가중치 기반)
}

// ============================================
// 경로 정차지
// ============================================

model RouteStop {
  id              String   @id @default(uuid())
  routeId         String   @map("route_id")
  placeId         String   @map("place_id")

  stopOrder       Int      @map("stop_order") // 방문 순서 (0부터)
  arrivalTime     DateTime @map("arrival_time") // 도착 예정 시간
  departureTime   DateTime @map("departure_time") // 출발 예정 시간
  duration        Int      // 체류 시간 (분)

  // 이전 정차지에서의 이동 정보
  travelTimeFromPrev  Int?     @map("travel_time_from_prev") // 이전 장소에서 이동시간 (분)
  travelDistFromPrev  Int?     @map("travel_dist_from_prev") // 이전 장소에서 거리 (미터)
  travelMode          String?  @map("travel_mode") // "walking", "transit", "driving"
  polylineFromPrev    String?  @map("polyline_from_prev") // 인코딩된 폴리라인
  directionsJson      Json?    @map("directions_json") // 상세 경로 JSON (턴바이턴)

  // 장소 선택 사유 (의사결정 지원)
  selectionReason String?   @map("selection_reason")
  // "동일 카테고리(카페) 중 평점 4.7로 가장 높고, 이전 장소에서 도보 5분"

  route           Route    @relation(fields: [routeId], references: [id], onDelete: Cascade)
  place           Place    @relation(fields: [placeId], references: [id], onDelete: Cascade)

  @@index([routeId])
  @@map("route_stops")
}

// ============================================
// Distance Matrix 캐시 (DB 레벨)
// ============================================

model DistanceCache {
  id            String   @id @default(uuid())
  originPlaceId String   @map("origin_place_id")
  destPlaceId   String   @map("dest_place_id")
  travelMode    String   @map("travel_mode") // "driving", "walking", "transit"

  duration      Int      // 소요시간 (초)
  distance      Int      // 거리 (미터)

  cachedAt      DateTime @default(now()) @map("cached_at")
  expiresAt     DateTime @map("expires_at") // 만료 시각

  @@unique([originPlaceId, destPlaceId, travelMode])
  @@index([expiresAt])
  @@map("distance_cache")
}
```

---

## 4. Row Level Security (RLS) 정책

Supabase에서 RLS를 활성화하여 사용자 데이터를 격리한다.

```sql
-- users: 자기 자신만 조회/수정
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid()::text = id);
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid()::text = id);

-- trips: 자기 여행만 접근
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own trips" ON trips
  FOR ALL USING (auth.uid()::text = user_id);

-- trip_places: 자기 여행의 장소만 접근
ALTER TABLE trip_places ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own trip places" ON trip_places
  FOR ALL USING (
    trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid()::text)
  );

-- routes: 자기 여행의 경로만 접근
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own routes" ON routes
  FOR ALL USING (
    trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid()::text)
  );

-- places: 모든 인증 사용자가 읽기 가능 (공유 데이터)
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read places" ON places
  FOR SELECT USING (auth.role() = 'authenticated');

-- place_details: 모든 인증 사용자가 읽기 가능
ALTER TABLE place_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read place details" ON place_details
  FOR SELECT USING (auth.role() = 'authenticated');
```

---

## 5. 인덱스 전략

| 테이블         | 인덱스                      | 용도                     |
| -------------- | --------------------------- | ------------------------ |
| trips          | user_id                     | 사용자별 여행 조회       |
| trip_places    | trip_id                     | 여행별 장소 조회         |
| trip_places    | (trip_id, place_id) UNIQUE  | 중복 방지                |
| places         | google_place_id             | Google 연동 시 중복 체크 |
| places         | (latitude, longitude)       | 위치 기반 조회           |
| routes         | trip_id                     | 여행별 경로 조회         |
| route_stops    | route_id                    | 경로별 정차지 조회       |
| distance_cache | (origin, dest, mode) UNIQUE | 캐시 조회                |
| distance_cache | expires_at                  | 만료 캐시 정리           |

---

## 6. 데이터 흐름 예시

### 장소 추가 시

```
1. 사용자가 "제이옥 방콕" 검색
2. Google Places API → 장소 정보 반환
3. places 테이블에 upsert (google_place_id 기준)
4. place_details 테이블에 상세 정보 저장
   - 시그니처 메뉴, 하이라이트, 분위기 태그
5. trip_places 테이블에 연결 (priority: MUST)
```

### 경로 생성 시

```
1. trip_places에서 해당 여행의 장소 목록 조회 (priority 포함)
2. places에서 각 장소의 좌표, 영업시간 조회
3. distance_cache에서 캐시된 이동 시간 조회
4. 캐시 미스 → Google Distance Matrix API 호출 → 캐시 저장
5. 경로 최적화 알고리즘 실행
6. routes 테이블에 2~3개 경로 저장
7. route_stops 테이블에 각 경로의 정차지 저장
   - 각 정차지에 selection_reason 포함
```
