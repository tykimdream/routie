# Routie 🗺️

> 여행자의 고민을 해결하는 스마트 여행 경로 최적화 서비스

## 한 줄 소개

"가고 싶은 곳은 많은데, 어떤 순서로 가야 할지 모르겠어" — Routie가 해결합니다.

## 핵심 가치

여행자가 구글 지도에 저장해둔 장소들(음식점, 카페, 관광지 등)을 기반으로, **날짜·시간·교통편·소요시간**을 고려하여 최적의 여행 경로를 제안합니다.

## 문제 정의

여행 계획 시 가장 큰 고민:

- 음식점 3곳, 카페 4곳, 마사지 2곳… **어디를 가야 할지 선택 장애**
- 장소 간 이동 시간을 일일이 검색하는 **비효율적인 계획 과정**
- 영업시간, 교통편을 고려하지 못한 **비현실적인 일정**

## 핵심 기능

1. **구글 지도 연동** — 저장 목록에서 장소를 가져옴
2. **스마트 경로 추천** — 교통, 거리, 영업시간 기반 최적 경로 생성
3. **장소 가중치** — 꼭 가고 싶은 곳에 우선순위 부여
4. **다중 경로 제안** — 효율 중심 / 여유 중심 등 다양한 옵션
5. **오프라인 지원** — PWA 기반, 네트워크 불안정 시에도 일정 확인 가능

## 기술 스택

| 영역         | 기술                                                       |
| ------------ | ---------------------------------------------------------- |
| Frontend     | Next.js 14+, Tailwind CSS, PWA                             |
| Backend      | NestJS                                                     |
| Database     | Supabase (PostgreSQL)                                      |
| ORM          | Prisma                                                     |
| External API | Google Maps Platform (Directions, Places, Distance Matrix) |
| Deploy       | Vercel (Frontend), Railway/Fly.io (Backend)                |

## 문서

- [PRD (제품 요구사항)](/docs/PRD.md)
- [시스템 아키텍처](/docs/ARCHITECTURE.md)
- [데이터베이스 스키마](/docs/DATABASE.md)
- [API 설계](/docs/API.md)
- [UI/UX 디자인 가이드](/docs/UI-UX.md)
- [개발 로드맵](/docs/ROADMAP.md)

## 프로젝트 구조

```
routie/
├── apps/
│   ├── web/          # Next.js Frontend (PWA)
│   └── server/       # NestJS Backend
├── packages/
│   ├── shared/       # 공유 타입, 유틸리티
│   └── config/       # ESLint, TS 공유 설정
├── prisma/
│   └── schema.prisma # DB 스키마
├── docs/             # 프로젝트 문서
└── README.md
```

## 라이선스

Private — All rights reserved
