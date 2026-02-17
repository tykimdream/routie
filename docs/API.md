# Routie — API 설계

## 1. 개요

- **Base URL**: `https://api.routie.app/v1`
- **인증**: Bearer Token (Supabase JWT)
- **형식**: JSON (application/json)
- **에러 형식**: `{ statusCode, message, error }`

---

## 2. 인증 (Auth)

> Supabase Auth를 활용하되, NestJS에서 JWT 검증

### POST `/auth/signup`

이메일 회원가입

```json
// Request
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "김수진"
}

// Response 201
{
  "user": { "id": "uuid", "email": "user@example.com", "name": "김수진" },
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

### POST `/auth/login`

이메일 로그인

```json
// Request
{ "email": "user@example.com", "password": "securePassword123" }

// Response 200
{ "user": {...}, "accessToken": "...", "refreshToken": "..." }
```

### POST `/auth/google`

구글 OAuth 로그인

```json
// Request
{ "idToken": "google-id-token" }

// Response 200
{ "user": {...}, "accessToken": "...", "refreshToken": "..." }
```

### POST `/auth/refresh`

토큰 갱신

```json
// Request
{ "refreshToken": "..." }

// Response 200
{ "accessToken": "...", "refreshToken": "..." }
```

---

## 3. 여행 (Trips)

### GET `/trips`

내 여행 목록 조회

```json
// Response 200
{
  "trips": [
    {
      "id": "uuid",
      "title": "방콕 3일 여행",
      "city": "Bangkok",
      "country": "Thailand",
      "startDate": "2025-03-15",
      "endDate": "2025-03-17",
      "status": "PLANNING",
      "placeCount": 12,
      "createdAt": "2025-03-01T10:00:00Z"
    }
  ]
}
```

### POST `/trips`

새 여행 생성

```json
// Request
{
  "title": "방콕 3일 여행",
  "city": "Bangkok",
  "country": "Thailand",
  "startDate": "2025-03-15",
  "endDate": "2025-03-17",
  "dailyStart": "10:00",
  "dailyEnd": "21:00",
  "transport": "PUBLIC_TRANSIT"
}

// Response 201
{ "id": "uuid", "title": "방콕 3일 여행", ... }
```

### GET `/trips/:id`

여행 상세 조회 (장소 목록 포함)

```json
// Response 200
{
  "id": "uuid",
  "title": "방콕 3일 여행",
  "city": "Bangkok",
  "startDate": "2025-03-15",
  "endDate": "2025-03-17",
  "dailyStart": "10:00",
  "dailyEnd": "21:00",
  "transport": "PUBLIC_TRANSIT",
  "status": "PLANNING",
  "places": [
    {
      "tripPlaceId": "uuid",
      "place": {
        "id": "uuid",
        "name": "제이옥",
        "address": "...",
        "category": "RESTAURANT",
        "rating": 4.5,
        "userRatingCount": 2341,
        "priceLevel": 2,
        "photoUrls": ["..."],
        "summary": "미슐랭 가이드 선정 태국 전통 레스토랑",
        "detail": {
          "highlights": ["미슐랭 1스타", "전통 태국 레시피"],
          "signatureMenus": [
            { "name": "마사만 커리", "price": "350 THB", "description": "..." }
          ],
          "vibes": ["고급스러운", "전통적인"],
          "avgDuration": 90,
          "reviewHighlights": ["분위기가 너무 좋아요", "팟타이가 최고"]
        }
      },
      "priority": "MUST",
      "sortOrder": 0,
      "customDuration": null,
      "userNote": "저녁에 가기",
      "preferredTime": "dinner"
    }
  ],
  "routes": []
}
```

### PATCH `/trips/:id`

여행 정보 수정

```json
// Request
{ "title": "방콕 4일 여행", "endDate": "2025-03-18" }

// Response 200
{ "id": "uuid", "title": "방콕 4일 여행", ... }
```

### DELETE `/trips/:id`

여행 삭제

```
// Response 204 No Content
```

---

## 4. 장소 (Places)

### GET `/places/search`

Google Places API를 통한 장소 검색

```
// Query Parameters
?query=제이옥 방콕&language=ko

// Response 200
{
  "places": [
    {
      "googlePlaceId": "ChIJ...",
      "name": "제이옥",
      "address": "Charoenkrung Rd, Bangkok",
      "latitude": 13.7244,
      "longitude": 100.5137,
      "category": "RESTAURANT",
      "rating": 4.5,
      "userRatingCount": 2341,
      "priceLevel": 2,
      "photoUrls": ["..."],
      "openingHours": { "monday": "11:00-22:00", ... }
    }
  ]
}
```

### GET `/places/:id`

장소 상세 정보 조회 (의사결정 지원 정보 포함)

```json
// Response 200
{
  "id": "uuid",
  "name": "제이옥",
  "address": "...",
  "category": "RESTAURANT",
  "rating": 4.5,
  "userRatingCount": 2341,
  "priceLevel": 2,
  "photoUrls": ["url1", "url2", "url3"],
  "summary": "미슐랭 가이드 선정 태국 전통 레스토랑",
  "openingHours": { "monday": "11:00-22:00", ... },
  "detail": {
    "highlights": ["미슐랭 1스타", "전통 태국 레시피", "차오프라야 강변 뷰"],
    "signatureMenus": [
      {
        "name": "마사만 커리",
        "price": "350 THB",
        "description": "코코넛 밀크 기반의 진한 커리, 감자와 땅콩"
      },
      {
        "name": "팟타이 쿵",
        "price": "280 THB",
        "description": "왕새우 팟타이, 전통 레시피"
      }
    ],
    "vibes": ["고급스러운", "전통적인", "강변 뷰"],
    "bestTimeToVisit": "sunset",
    "avgDuration": 90,
    "nearestStation": "Saphan Taksin BTS",
    "walkFromStation": 8,
    "reviewHighlights": [
      "분위기가 정말 아름다워요",
      "마사만 커리는 꼭 드세요",
      "예약 필수입니다"
    ]
  }
}
```

### GET `/places/:id/comparison`

같은 카테고리 장소들과 비교 정보 (의사결정 지원)

```json
// Query: ?tripId=uuid
// 해당 여행에 포함된 같은 카테고리 장소들과 비교

// Response 200
{
  "place": { "id": "...", "name": "제이옥", "rating": 4.5 },
  "category": "RESTAURANT",
  "comparedWith": [
    {
      "id": "...",
      "name": "솜분 씨푸드",
      "rating": 4.2,
      "comparisonNote": "해산물 전문, 가성비 우수. 제이옥보다 평점은 낮지만 가격이 40% 저렴"
    }
  ],
  "recommendation": "제이옥은 분위기와 맛 모두 최고 수준이지만 가격대가 높습니다. 특별한 저녁 식사로 추천합니다."
}
```

---

## 5. 여행-장소 (Trip Places)

### POST `/trips/:tripId/places`

여행에 장소 추가

```json
// Request
{
  "googlePlaceId": "ChIJ...",   // 검색 결과에서 가져오거나
  "placeId": "uuid",             // 기존 장소 ID
  "priority": "MUST",
  "customDuration": 90,
  "userNote": "저녁에 가기",
  "preferredTime": "dinner"
}

// Response 201
{
  "tripPlaceId": "uuid",
  "place": { ... },
  "priority": "MUST",
  ...
}
```

### PATCH `/trips/:tripId/places/:tripPlaceId`

여행 장소 설정 수정 (가중치, 메모, 시간 등)

```json
// Request
{
  "priority": "WANT",
  "customDuration": 60,
  "userNote": "시간 되면 점심에",
  "preferredTime": "lunch"
}

// Response 200
{ "tripPlaceId": "uuid", "priority": "WANT", ... }
```

### PATCH `/trips/:tripId/places/reorder`

장소 순서 일괄 변경

```json
// Request
{
  "items": [
    { "tripPlaceId": "uuid1", "sortOrder": 0 },
    { "tripPlaceId": "uuid2", "sortOrder": 1 },
    { "tripPlaceId": "uuid3", "sortOrder": 2 }
  ]
}

// Response 200
{ "updated": 3 }
```

### DELETE `/trips/:tripId/places/:tripPlaceId`

여행에서 장소 제거

```
// Response 204 No Content
```

---

## 6. 경로 최적화 (Routes)

### POST `/trips/:tripId/routes/optimize`

경로 최적화 요청 (핵심 API)

```json
// Request
{
  "date": "2025-03-15",
  "transport": "PUBLIC_TRANSIT",
  "options": {
    "routeTypes": ["EFFICIENT", "RELAXED", "CUSTOM"],
    "startLocation": {
      "latitude": 13.7563,
      "longitude": 100.5018,
      "name": "호텔 (숙소)"
    },
    "endLocation": null,  // null이면 startLocation으로 복귀
    "mealPreferences": {
      "lunch": { "timeRange": ["11:30", "13:30"], "category": "RESTAURANT" },
      "dinner": { "timeRange": ["18:00", "20:00"], "category": "RESTAURANT" }
    }
  }
}

// Response 200
{
  "routes": [
    {
      "id": "uuid",
      "routeType": "EFFICIENT",
      "score": 87.5,
      "totalDuration": 540,      // 분 (9시간)
      "totalDistance": 18500,     // 미터
      "totalTravelTime": 95,     // 이동시간 (분)
      "placeCount": 7,
      "reasoning": "필수 장소 3곳 포함, 총 이동시간 1시간 35분으로 최소화. 점심은 제이옥(평점 4.5), 저녁은 솜분 씨푸드(가성비 최고)로 배치.",
      "stops": [
        {
          "stopOrder": 0,
          "place": {
            "id": "uuid",
            "name": "호텔 출발",
            "category": "ACCOMMODATION"
          },
          "arrivalTime": "2025-03-15T10:00:00+07:00",
          "departureTime": "2025-03-15T10:00:00+07:00",
          "duration": 0
        },
        {
          "stopOrder": 1,
          "place": {
            "id": "uuid",
            "name": "왓포",
            "category": "ATTRACTION",
            "rating": 4.6,
            "detail": {
              "highlights": ["와불상", "태국 전통 마사지 발상지"],
              "avgDuration": 90
            }
          },
          "arrivalTime": "2025-03-15T10:25:00+07:00",
          "departureTime": "2025-03-15T12:00:00+07:00",
          "duration": 95,
          "travelTimeFromPrev": 25,
          "travelDistFromPrev": 3200,
          "travelMode": "transit",
          "selectionReason": "필수 장소. 오전 방문이 덜 붐비며, 점심 전 관광에 적합."
        },
        {
          "stopOrder": 2,
          "place": {
            "id": "uuid",
            "name": "제이옥",
            "category": "RESTAURANT",
            "rating": 4.5,
            "detail": {
              "signatureMenus": [
                { "name": "마사만 커리", "price": "350 THB" }
              ]
            }
          },
          "arrivalTime": "2025-03-15T12:10:00+07:00",
          "departureTime": "2025-03-15T13:40:00+07:00",
          "duration": 90,
          "travelTimeFromPrev": 10,
          "travelDistFromPrev": 800,
          "travelMode": "walking",
          "selectionReason": "필수 장소. 점심시간에 배치. 왓포에서 도보 10분. 같은 카테고리 솜분 씨푸드(평점 4.2) 대비 평점이 높고, 왓포에서 더 가까움."
        }
        // ... 나머지 stops
      ],
      // 경로에 포함되지 못한 장소와 이유
      "excludedPlaces": [
        {
          "place": { "id": "uuid", "name": "아이콘시암", "category": "SHOPPING" },
          "priority": "OPTIONAL",
          "reason": "시간 부족. 예상 체류 120분이지만 남은 시간이 45분. 2일차 경로에 포함 추천."
        }
      ]
    },
    // ... RELAXED, CUSTOM 경로
  ]
}
```

### GET `/trips/:tripId/routes`

여행의 모든 경로 조회

```json
// Query: ?date=2025-03-15  (선택)

// Response 200
{
  "routes": [
    {
      "id": "uuid",
      "date": "2025-03-15",
      "routeType": "EFFICIENT",
      "score": 87.5,
      "totalDuration": 540,
      "placeCount": 7,
      "isSelected": true,
      "reasoning": "..."
    }
  ]
}
```

### GET `/trips/:tripId/routes/:routeId`

경로 상세 조회 (stops + 지도 데이터)

```json
// Response 200
{
  "id": "uuid",
  "routeType": "EFFICIENT",
  "stops": [ ... ],    // 위 optimize 응답과 동일 구조
  "excludedPlaces": [ ... ],
  "mapData": {
    "bounds": { "ne": { "lat": ..., "lng": ... }, "sw": { ... } },
    "polylines": ["encoded_polyline_1", "encoded_polyline_2"]
  }
}
```

### PATCH `/trips/:tripId/routes/:routeId`

경로 선택 / 수정

```json
// 경로 선택
{ "isSelected": true }

// 장소 순서 변경 시 재최적화 트리거
// Request
{
  "reorder": [
    { "stopId": "uuid", "stopOrder": 0 },
    { "stopId": "uuid", "stopOrder": 1 }
  ]
}

// Response 200 — 재계산된 시간 정보
{ "id": "uuid", "stops": [...], "totalDuration": 550 }
```

### DELETE `/trips/:tripId/routes/:routeId/stops/:stopId`

경로에서 특정 정차지 제거 (실시간 재계산)

```json
// Response 200 — 재계산된 경로
{
  "route": { ... },
  "removedPlace": { "name": "아이콘시암" },
  "suggestion": "이 장소 제거로 여유 시간 45분이 생겼습니다. '렛츠릴랙스 마사지(선호)'를 추가할 수 있습니다."
}
```

---

## 7. 에러 코드

| HTTP | 코드                | 설명                        |
| ---- | ------------------- | --------------------------- |
| 400  | INVALID_INPUT       | 입력 값 유효성 오류         |
| 400  | TOO_FEW_PLACES      | 경로 생성에 장소가 2개 미만 |
| 400  | INVALID_TIME_RANGE  | 시작 시간이 종료 시간 이후  |
| 401  | UNAUTHORIZED        | 인증 필요                   |
| 403  | FORBIDDEN           | 접근 권한 없음              |
| 404  | TRIP_NOT_FOUND      | 여행을 찾을 수 없음         |
| 404  | PLACE_NOT_FOUND     | 장소를 찾을 수 없음         |
| 404  | ROUTE_NOT_FOUND     | 경로를 찾을 수 없음         |
| 429  | RATE_LIMITED        | 요청 제한 초과              |
| 500  | OPTIMIZATION_FAILED | 경로 최적화 실패            |
| 502  | GOOGLE_API_ERROR    | Google API 호출 실패        |

---

## 8. Rate Limiting

| 엔드포인트         | 제한        | 설명                  |
| ------------------ | ----------- | --------------------- |
| 전체 API           | 100 req/min | 사용자당              |
| `/routes/optimize` | 5 req/min   | 무거운 연산, 사용자당 |
| `/places/search`   | 30 req/min  | Google API 비용 관리  |

---

## 9. API 버전 관리

- URL 기반 버전: `/v1/trips`, `/v2/trips`
- MVP는 v1으로 시작
- Breaking change 시 새 버전 추가, 이전 버전 6개월 유지
